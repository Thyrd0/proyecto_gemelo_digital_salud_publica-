"""
LangChain Cognitive Public Health Agent Service.
Orchestrates tool calling, scientific literature RAG, and live ML simulations.
"""
import os
import json
import re
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from backend.app.services.agent.tools import (
    AGENT_TOOLS,
    query_tract_indicators,
    simulate_policy_intervention,
    rank_top_vulnerable_tracts,
    search_scientific_evidence
)
from backend.app.services.agent.knowledge_base import knowledge_retriever


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

SYSTEM_INSTRUCTION_ES = """
Eres el Agente Copiloto de Inteligencia Artificial del Gemelo Digital de Entornos Alimentarios Urbanos (Philadelphia County, PA - FIPS 42101).
Tu objetivo es asistir a epidemiólogos, tomadores de decisiones y científicos de datos analizando la salud urbana territorial.

Capacidades y herramientas disponibles:
1. `query_tract_indicators`: Para consultar métricas socioeconómicas, de desiertos alimentarios y prevalencia de diabetes de cualquier tracto censal (GEOID de 11 dígitos).
2. `simulate_policy_intervention`: Para ejecutar en tiempo real el modelo de Machine Learning y simular políticas (impuesto a bebidas azucaradas, subsidios a frutas/verduras, zonificación de comida rápida).
3. `rank_top_vulnerable_tracts`: Para identificar los tractos más críticos por prevalencia de diabetes, pobreza o desiertos alimentarios.
4. `search_scientific_evidence`: Para fundamentar tus explicaciones con la literatura científica indexada (Powell et al., Currie et al., Afshin et al., CDC PLACES).

Reglas de respuesta:
- Sé riguroso, cuantitativo y cita las fuentes científicas cuando hables de elasticidades o políticas.
- Siempre recuerda que las simulaciones son contrafactuales exploratorias y no implican causalidad clínica individual.
- Formatea tus respuestas con Markdown claro, tablas o viñetas cuando presentes cifras numéricas.
"""

SYSTEM_INSTRUCTION_EN = """
You are the AI Copilot Agent for the Urban Food Environment Digital Twin (Philadelphia County, PA - FIPS 42101).
Your purpose is to assist epidemiologists, policymakers, and data scientists analyzing urban public health.

You have access to specialized tools for querying tract indicators, running ML simulations, ranking vulnerable areas, and retrieving scientific evidence.
Always maintain scientific rigor, state explicit parameters, and emphasize that results represent exploratory what-if associations.
"""

class LangChainDigitalTwinAgent:
    def __init__(self):
        self.llm = None
        self.agent_executor = None
        self.init_llm()

    def init_llm(self):
        """Initializes LangChain LLM with Google GenAI or OpenAI if keys are present."""
        if GEMINI_API_KEY:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=GEMINI_API_KEY,
                    temperature=0.2
                ).bind_tools(AGENT_TOOLS)
                return
            except Exception as e:
                print(f"[Agent] Google GenAI init error: {e}")

        if OPENAI_API_KEY:
            try:
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=OPENAI_API_KEY,
                    temperature=0.2
                ).bind_tools(AGENT_TOOLS)
                return
            except Exception as e:
                print(f"[Agent] OpenAI init error: {e}")

    def run(self, user_message: str, language: str = "es", chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Processes a user query by deciding whether to invoke LangChain LLM Tool Calling or deterministic Agent heuristics.
        """
        is_es = (language == "es")
        sys_prompt = SYSTEM_INSTRUCTION_ES if is_es else SYSTEM_INSTRUCTION_EN
        steps_executed = []

        # If LLM with tool calling is configured
        if self.llm:
            try:
                messages = [SystemMessage(content=sys_prompt)]
                if chat_history:
                    for h in chat_history[-6:]:
                        if h.get("role") == "user":
                            messages.append(HumanMessage(content=h.get("content", "")))
                        elif h.get("role") == "assistant":
                            messages.append(AIMessage(content=h.get("content", "")))
                
                messages.append(HumanMessage(content=user_message))
                
                # First step LLM call
                ai_msg = self.llm.invoke(messages)
                
                if hasattr(ai_msg, "tool_calls") and ai_msg.tool_calls:
                    for tc in ai_msg.tool_calls:
                        tool_name = tc.get("name")
                        tool_args = tc.get("args", {})
                        steps_executed.append({"tool": tool_name, "args": tool_args})
                        
                        # Execute tool
                        tool_fn = next((t for t in AGENT_TOOLS if t.name == tool_name), None)
                        tool_res = tool_fn.invoke(tool_args) if tool_fn else "Tool not found"
                        
                        messages.append(ai_msg)
                        messages.append(HumanMessage(content=f"[Tool Result for {tool_name}]: {tool_res}"))
                    
                    # Final synthesis call
                    final_msg = self.llm.invoke(messages)
                    return {
                        "reply": final_msg.content,
                        "steps": steps_executed,
                        "source": "langchain_agent_llm"
                    }
                else:
                    return {
                        "reply": ai_msg.content,
                        "steps": [],
                        "source": "langchain_agent_direct"
                    }
            except Exception as e:
                print(f"[Agent LLM Error]: {e}. Falling back to Smart Agent Orchestrator.")

        # Smart Deterministic Agent Fallback (Executes LangChain Tools automatically based on Intent)
        return self._smart_deterministic_agent(user_message, is_es)

    def _smart_deterministic_agent(self, query: str, is_es: bool) -> Dict[str, Any]:
        """
        Guarantees that the agent executes tools and performs RAG even in offline / local environments.
        """
        q_lower = query.lower()
        steps = []
        
        # 1. Intent: Tract Query (Search for 11-digit or 6-digit GEOID)
        geoid_match = re.search(r'\b(42101\d{6}|\d{11})\b', query)
        
        if geoid_match and ("simul" not in q_lower and "impuesto" not in q_lower and "subsidio" not in q_lower and "tax" not in q_lower):
            geoid = geoid_match.group(1)
            steps.append({"tool": "query_tract_indicators", "args": {"geoid": geoid}})
            data_str = query_tract_indicators.invoke({"geoid": geoid})
            data = json.loads(data_str) if "{" in data_str else {}
            
            if "geoid" in data:
                reply = (
                    f"### 📍 Indicadores Territoriales del Tracto Censal `{geoid}` (Philadelphia)\n\n"
                    f"- **Población Total:** {data.get('poblacion_total'):,} hab.\n"
                    f"- **Prevalencia Base de Diabetes:** **{data.get('prevalencia_diabetes_base_pct')}%**\n"
                    f"- **Tasa de Pobreza:** {data.get('tasa_pobreza_pct')}%\n"
                    f"- **Ingreso Familiar Mediano:** ${data.get('ingreso_familiar_mediano_usd'):,} USD\n"
                    f"- **Condición de Desierto Alimentario (USDA LILA):** {'⚠️ Sí (Bajo Ingreso y Bajo Acceso)' if data.get('es_desierto_alimentario_lila') else '✅ No'}\n"
                    f"- **Hogares sin Vehículo Propio:** {data.get('hogares_sin_vehiculo_pct')}%\n"
                    f"- **Hogares con Asistencia SNAP:** {data.get('hogares_con_snap_pct')}%\n\n"
                    f"*💡 Puedes pedirme: 'Simula un impuesto del 20% a bebidas azucaradas en este tracto' o 'Compara con los más vulnerables'.*"
                    if is_es else
                    f"### 📍 Territorial Indicators for Census Tract `{geoid}` (Philadelphia)\n\n"
                    f"- **Total Population:** {data.get('poblacion_total'):,}\n"
                    f"- **Baseline Diabetes Prevalence:** **{data.get('prevalencia_diabetes_base_pct')}%**\n"
                    f"- **Poverty Rate:** {data.get('tasa_pobreza_pct')}%\n"
                    f"- **Median Family Income:** ${data.get('ingreso_familiar_mediano_usd'):,} USD\n"
                    f"- **Food Desert Status (USDA LILA):** {'⚠️ Yes (Low-Income Low-Access)' if data.get('es_desierto_alimentario_lila') else '✅ No'}\n"
                    f"- **Households without Vehicle:** {data.get('hogares_sin_vehiculo_pct')}%\n"
                    f"- **SNAP Recipient Households:** {data.get('hogares_con_snap_pct')}%"
                )
            else:
                reply = f"No se encontró información para el GEOID {geoid}."
            return {"reply": reply, "steps": steps, "source": "agent_tool_executor"}

        # 2. Intent: Simulation
        if any(w in q_lower for w in ["simul", "impuesto", "subsidio", "tax", "subsidy", "impacto"]):
            geoid = geoid_match.group(1) if geoid_match else "42101000100"
            tax_rate = 20.0 if ("20" in query or "impuesto" in q_lower or "tax" in q_lower) else 0.0
            subsidy_rate = 30.0 if ("30" in query or "subsidio" in q_lower or "subsidy" in q_lower) else 0.0
            restriction = bool("restric" in q_lower or "comida rapida" in q_lower or "fast food" in q_lower)
            if tax_rate == 0.0 and subsidy_rate == 0.0 and not restriction:
                tax_rate = 20.0
                subsidy_rate = 30.0

            steps.append({
                "tool": "simulate_policy_intervention",
                "args": {"geoid": geoid, "tax_rate": tax_rate, "subsidy_rate": subsidy_rate, "restriction_enabled": restriction}
            })
            sim_str = simulate_policy_intervention.invoke({
                "geoid": geoid,
                "tax_rate": tax_rate,
                "subsidy_rate": subsidy_rate,
                "restriction_enabled": restriction
            })
            sim_data = json.loads(sim_str) if "{" in sim_str else {}
            
            # Retrieve RAG context
            steps.append({"tool": "search_scientific_evidence", "args": {"query": "tax subsidy elasticity"}})
            rag_docs = knowledge_retriever.search("tax subsidy", top_k=1)
            lit_note = f"\n\n📚 **Evidencia Científica Indexada:**\n- *{rag_docs[0]['title']}* ({rag_docs[0]['authors']}): Elasticidad de demanda {rag_docs[0]['parameters'].get('price_elasticity', 'N/A')}." if rag_docs else ""

            res_tract = sim_data.get("resultados_tracto", {})
            county_impact = sim_data.get("impacto_a_nivel_condado_philadelphia", {})

            reply = (
                f"### 🔬 Resultados de la Simulación en el Gemelo Digital (CRISP-DM V2.1)\n\n"
                f"**Parámetros Evaluados:**\n"
                f"- Tracto objetivo: `{geoid}`\n"
                f"- Impuesto a Bebidas Azucaradas (SSB): **{tax_rate}%**\n"
                f"- Subsidio a Frutas/Verduras: **{subsidy_rate}%**\n"
                f"- Restricción escolar de comida rápida (500m): **{'Activada' if restriction else 'Desactivada'}**\n\n"
                f"**Impacto Estimado en el Tracto:**\n"
                f"- Prevalencia Base: **{res_tract.get('prevalencia_base_pct')}%**\n"
                f"- Prevalencia Proyectada (Horizonte 5 años): **{res_tract.get('prevalencia_proyectada_pct')}%**\n"
                f"- Reducción Territorial: **{res_tract.get('reduccion_puntos_porcentuales')} p.p.**\n"
                f"- Casos de diabetes prevenidos en este tracto: **~{res_tract.get('casos_diabetes_evitados_estimados')} personas**\n\n"
                f"**Impacto Agregado en todo Philadelphia County (376 tractos):**\n"
                f"- Casos totales evitados: **{county_impact.get('total_casos_evitados_todos_los_tractos'):,}** personas.\n"
                f"- Reducción promedio de prevalencia: **{county_impact.get('reduccion_promedio_condado_pp')} p.p.**"
                f"{lit_note}\n\n"
                f"> ⚠️ *Aviso Científico: Estimación exploratoria basada en el modelo HistGradientBoosting. No garantiza causalidad clínica individual.*"
                if is_es else
                f"### 🔬 Digital Twin Simulation Results (CRISP-DM V2.1)\n\n"
                f"**Evaluated Parameters:** Target GEOID `{geoid}`, SSB Tax: {tax_rate}%, Subsidy: {subsidy_rate}%, Zoning Buffer: {restriction}.\n"
                f"**Projected Impact:** Reduction of {res_tract.get('reduccion_puntos_porcentuales')} p.p., saving ~{res_tract.get('casos_diabetes_evitados_estimados')} cases.\n"
                f"**County-wide impact:** {county_impact.get('total_casos_evitados_todos_los_tractos'):,} cases averted."
            )
            return {"reply": reply, "steps": steps, "source": "agent_tool_executor"}

        # 3. Intent: Ranking / Vulnerability
        if any(w in q_lower for w in ["vulnerable", "critico", "ranking", "desierto", "pobreza", "top"]):
            crit = "poverty" if "pobreza" in q_lower else ("food_desert" if "desierto" in q_lower else "diabetes")
            steps.append({"tool": "rank_top_vulnerable_tracts", "args": {"n": 5, "criteria": crit}})
            rank_str = rank_top_vulnerable_tracts.invoke({"n": 5, "criteria": crit})
            rank_data = json.loads(rank_str) if "{" in rank_str else {}
            
            rows_md = ""
            for i, t in enumerate(rank_data.get("top_tractos", []), 1):
                rows_md += f"| {i} | `{t['geoid']}` | {t['diabetes_prevalencia_pct']}% | {t['tasa_pobreza_pct']}% | {'⚠️ Sí' if t['desierto_alimentario_lila'] else 'No'} | {t['sin_vehiculo_pct']}% |\n"

            reply = (
                f"### 📊 Top 5 Tractos Censales de Mayor Vulnerabilidad en Philadelphia (Criterio: {crit})\n\n"
                f"| # | GEOID | Prevalencia Diabetes | Tasa Pobreza | Desierto Alimentario | Sin Vehículo |\n"
                f"|---|-------|----------------------|--------------|----------------------|--------------|\n"
                f"{rows_md}\n"
                f"¿Deseas que ejecute una simulación de intervención de política en alguno de estos tractos prioritarios?"
                if is_es else
                f"### 📊 Top 5 Vulnerable Census Tracts in Philadelphia (Criteria: {crit})\n\n"
                f"{rows_md}"
            )
            return {"reply": reply, "steps": steps, "source": "agent_tool_executor"}

        # 4. Intent: Scientific Evidence RAG
        if any(w in q_lower for w in ["evidencia", "paper", "estudio", "powell", "currie", "afshin", "cdc", "crisp"]):
            steps.append({"tool": "search_scientific_evidence", "args": {"query": query}})
            evidence_str = search_scientific_evidence.invoke({"query": query})
            docs = json.loads(evidence_str) if "{" in evidence_str or "[" in evidence_str else []
            
            docs_md = ""
            for d in docs:
                docs_md += f"#### 📖 {d['titulo']}\n- **Autores / Fuente:** {d['autores_fuente']}\n- **Tema:** {d['tema']}\n- **Hallazgos Clave:** {d['hallazgos_clave']}\n- **Parámetros Utilizados:** `{json.dumps(d['parametros_cientificos'])}`\n\n"

            reply = (
                f"### 📚 Evidencia Científica y Marco Metodológico Indexado (RAG)\n\n"
                f"{docs_md}"
                if is_es else
                f"### 📚 Scientific Evidence & Methodological RAG\n\n{docs_md}"
            )
            return {"reply": reply, "steps": steps, "source": "agent_rag_retriever"}

        # Default Helpful Greeting
        return {
            "reply": (
                "👋 **Hola, soy el Copiloto Inteligente del Gemelo Digital de Entornos Alimentarios Urbanos (LangChain Agent V2.1).**\n\n"
                "Puedo ayudarte a:\n"
                "1. 📍 **Consultar un tracto censal:** *'Muéstrame los indicadores del tracto 42101000100'*\n"
                "2. 🔬 **Simular políticas públicas con el modelo ML:** *'Simula un impuesto del 20% y subsidio del 30% en el tracto 42101000100'*\n"
                "3. 📊 **Identificar áreas críticas:** *'¿Cuáles son los 5 tractos más vulnerables por desierto alimentario o diabetes?'*\n"
                "4. 📚 **Consultar evidencia científica (RAG):** *'¿Qué elasticidades de demanda se usaron según Powell y Afshin?'*\n\n"
                "¿Qué análisis te gustaría realizar hoy?"
                if is_es else
                "👋 **Hello! I am the AI Copilot Agent for the Urban Food Environment Digital Twin.**\n"
                "Ask me to query census tracts, run what-if ML simulations, find vulnerable areas, or review indexed scientific papers."
            ),
            "steps": [],
            "source": "agent_default_guide"
        }

agent_service = LangChainDigitalTwinAgent()
