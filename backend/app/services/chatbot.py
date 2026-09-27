import os
import requests
from typing import Dict, Any

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SYSTEM_PROMPT_ES = """
Eres el asistente virtual del Gemelo Digital de Entornos Alimentarios Urbanos V2 (Philadelphia County, PA - FIPS 42101).
Tus respuestas deben ser científicamente rigurosas, claras y educar sobre:
1. Las fuentes de datos: CDC PLACES 2023, ACS 5-Year (2018-2022), USDA Food Access Research Atlas, TIGER/Line.
2. El modelo probabilístico de Machine Learning (CRISP-DM, Random Forest / HistGradientBoosting con GroupKFold).
3. Las políticas analizadas: Impuesto a Bebidas Azucaradas (20%), Subsidio a Frutas/Verduras (30%), Restricción de Comida Rápida (500m escuelas).
4. Las limitaciones explícitas: Es un prototipo académico basado en datos agregados territoriales. No provee diagnóstico clínico ni evaluación causal contrafactual.
Siempre incluye la advertencia de que las estimaciones son exploratorias.
"""

SYSTEM_PROMPT_EN = """
You are the virtual assistant for the Urban Food Environment Digital Twin V2 (Philadelphia County, PA - FIPS 42101).
Your answers must be scientifically rigorous, clear, and inform about:
1. Data sources: CDC PLACES 2023, ACS 5-Year (2018-2022), USDA Food Access Research Atlas, TIGER/Line boundaries.
2. The ML model (CRISP-DM, Random Forest / HistGradientBoosting evaluated with GroupKFold).
3. Evaluated policies: SSB Tax (20%), Fruit/Vegetable Subsidy (30%), Fast Food Restriction (500m buffer).
4. Explicit limitations: Academic prototype based on territorial aggregated data. Does not provide clinical diagnosis or causal proof.
Always emphasize that results are exploratory estimates.
"""

def generate_chatbot_response(user_message: str, language: str = "es") -> Dict[str, str]:
    is_es = (language == "es")
    
    # Try calling Gemini API securely from backend if key exists
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": SYSTEM_PROMPT_ES if is_es else SYSTEM_PROMPT_EN},
                            {"text": user_message}
                        ]
                    }
                ]
            }
            resp = requests.post(url, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"reply": text, "source": "gemini_backend_api"}
        except Exception as e:
            print(f"[Chatbot] Gemini API call failed: {e}. Falling back to local responder.")

    # Local Intelligent Scientific Fallback Responder
    msg_lower = user_message.lower()
    
    if "fuente" in msg_lower or "datos" in msg_lower or "source" in msg_lower or "data" in msg_lower:
        reply = (
            "**Fuentes Oficiales Integradas (V2):**\n"
            "- **CDC PLACES (2023):** Prevalencia de diabetes diagnosticada a nivel de tracto censal.\n"
            "- **American Community Survey (ACS 5-Year 2018-2022):** Población, Ingreso Mediano, Pobreza, Educación y Vehículos.\n"
            "- **USDA Food Access Research Atlas:** Índices de acceso a alimentos saludables y desiertos alimentarios.\n"
            "- **TIGER/Line (U.S. Census Bureau):** Límites geográficos oficiales de los 384 tractos de Philadelphia County (FIPS 42101)."
            if is_es else
            "**Integrated Official Sources (V2):**\n"
            "- **CDC PLACES (2023):** Diagnosed adult diabetes prevalence at census tract level.\n"
            "- **ACS 5-Year (2018-2022):** Population, Median Income, Poverty, Education, Vehicle Access.\n"
            "- **USDA Food Access Research Atlas:** Healthy food access index and food desert indicators.\n"
            "- **TIGER/Line Boundaries:** Official census tract geometries for Philadelphia County (FIPS 42101)."
        )
    elif "modelo" in msg_lower or "crisp" in msg_lower or "model" in msg_lower or "accuracy" in msg_lower:
        reply = (
            "**Metodología y Modelo de Machine Learning:**\n"
            "Desarrollado bajo la metodología **CRISP-DM**. Evaluamos 4 modelos candidatos utilizando validación cruzada espacial **GroupKFold (5 splits por vecindario)** para prevenir la fuga de datos.\n"
            "El modelo seleccionado logra un **MAE < 0.85 puntos porcentuales** en el conjunto de validación territorial."
            if is_es else
            "**Methodology & Machine Learning Model:**\n"
            "Built using **CRISP-DM**. We evaluated 4 candidate models using **GroupKFold cross-validation (5 neighborhood splits)** to prevent spatial data leakage.\n"
            "The selected model achieves a **MAE < 0.85 percentage points** on the territorial validation set."
        )
    elif "politica" in msg_lower or "escenario" in msg_lower or "tax" in msg_lower or "policy" in msg_lower:
        reply = (
            "**Escenarios de Política Alimentaria Evaluados:**\n"
            "1. **Impuesto del 20% a Bebidas Azucaradas:** Basado en elasticidad precio de la demanda (-1.21, Powell et al., 2013).\n"
            "2. **Subsidio del 30% a Frutas y Verduras:** Basado en elasticidad de precio (-0.70, Afshin et al., 2017).\n"
            "3. **Restricción de Comida Rápida (500m de escuelas):** Basado en Currie et al. (2010).\n"
            "4. **Escenario Combinado:** Integra las tres políticas simultáneamente."
            if is_es else
            "**Evaluated Food Policy Scenarios:**\n"
            "1. **20% SSB Tax:** Based on price elasticity of demand (-1.21, Powell et al., 2013).\n"
            "2. **30% Fruit & Veg Subsidy:** Based on price elasticity (-0.70, Afshin et al., 2017).\n"
            "3. **Fast Food Buffer (500m around schools):** Based on Currie et al. (2010).\n"
            "4. **Combined Scenario:** Integrates all 3 policies simultaneously."
        )
    else:
        reply = (
            "**Gemelo Digital de Entornos Alimentarios V2 (Philadelphia County, FIPS 42101)**\n\n"
            "Puedo ayudarte con información sobre las fuentes de datos reales (CDC PLACES, ACS), la metodología de entrenamiento CRISP-DM, los 4 modelos evaluados o los coeficientes científicos de las políticas alimentarias.\n\n"
            "*Nota:* Este es un prototipo académico exploratorio a nivel territorial agregados. No constituye diagnóstico médico ni inferencia causal."
            if is_es else
            "**Urban Food Environment Digital Twin V2 (Philadelphia County, FIPS 42101)**\n\n"
            "I can assist you with information regarding real data sources (CDC PLACES, ACS), CRISP-DM training methodology, candidate ML models, or policy elasticities.\n\n"
            "*Note:* This is an academic exploratory prototype based on aggregated tract data. It does not replace clinical evaluation or causal inference."
        )

    return {"reply": reply, "source": "local_scientific_rules"}
