"""
LangChain Tools definition for the Urban Food Environment Digital Twin.
Integrates live territorial datasets, ML inference models, and scientific RAG literature.
"""
import json
from typing import Dict, Any, List, Optional
from langchain_core.tools import tool
from backend.app.services.predictor import predictor_service
from backend.app.services.agent.knowledge_base import knowledge_retriever

@tool
def query_tract_indicators(geoid: str) -> str:
    """
    Query real socioeconomic, demographic, food access, and baseline diabetes prevalence indicators 
    for a specific 11-digit Census Tract in Philadelphia County (e.g., '42101000100').
    """
    tract = predictor_service.get_tract_by_geoid(geoid)
    if not tract:
        return f"Error: No se encontró el tracto censal con GEOID '{geoid}' en Philadelphia."
    
    info = {
        "geoid": tract.get("geoid"),
        "poblacion_total": tract.get("poblacion", 0),
        "prevalencia_diabetes_base_pct": tract.get("prevalenciaDiabetesInicial", 0.0),
        "tasa_pobreza_pct": round(float(tract.get("PovertyRate", 0.0)), 2),
        "ingreso_familiar_mediano_usd": tract.get("MedianFamilyIncome", 0),
        "es_desierto_alimentario_lila": bool(tract.get("LILATracts_halfAnd10", 0)),
        "hogares_sin_vehiculo_pct": round(float(tract.get("no_vehicle_household_share", 0.0)) * 100, 2),
        "hogares_con_snap_pct": round(float(tract.get("snap_household_share", 0.0)) * 100, 2),
        "indice_proximidad_comida_rapida": round(float(tract.get("food_retail_proximity_proxy", 0.0)), 4)
    }
    return json.dumps(info, ensure_ascii=False, indent=2)

@tool
def simulate_policy_intervention(
    geoid: str,
    tax_rate: float = 20.0,
    subsidy_rate: float = 30.0,
    restriction_enabled: bool = False,
    horizon_years: int = 5
) -> str:
    """
    Run a counterfactual machine learning what-if policy simulation on a specific Census Tract GEOID.
    Evaluates changes in diabetes prevalence, averted diabetes cases, and percentage reductions.
    Parameters:
    - geoid: 11-digit Census Tract GEOID (e.g. '42101000100')
    - tax_rate: Sugar-sweetened beverage tax rate (e.g., 20.0 for 20%)
    - subsidy_rate: Fruit and vegetable subsidy rate (e.g., 30.0 for 30%)
    - restriction_enabled: Whether to apply the 500m fast-food school zoning buffer
    - horizon_years: Simulation timeline (typically 5 or 10 years)
    """
    if not predictor_service.is_loaded:
        return "Error: Los artefactos del modelo ML V2.1 no están cargados en el servidor."

    tract = predictor_service.get_tract_by_geoid(geoid)
    if not tract:
        return f"Error: No se encontró el tracto censal con GEOID '{geoid}'."

    # Run simulation config
    config = {
        "horizon": horizon_years,
        "taxEnabled": tax_rate > 0,
        "taxRate": tax_rate,
        "subsidyEnabled": subsidy_rate > 0,
        "subsidyRate": subsidy_rate,
        "restrictionEnabled": restriction_enabled,
        "isBaseline": False
    }

    try:
        sim_result = predictor_service.run_scenario_simulation(config)
        
        # Locate specific tract in details
        tract_detail = next((t for t in sim_result.get("details", []) if str(t.get("geoid")) == str(geoid).zfill(11)), None)
        
        output = {
            "tract_geoid": geoid,
            "escenario": {
                "horizonte_anios": horizon_years,
                "impuesto_bebidas_pct": tax_rate if config["taxEnabled"] else 0,
                "subsidio_frutas_pct": subsidy_rate if config["subsidyEnabled"] else 0,
                "restriccion_zonificacion_comida_rapida": restriction_enabled
            },
            "resultados_tracto": {
                "prevalencia_base_pct": tract_detail.get("prevalenciaBase", 0.0) if tract_detail else tract.get("prevalenciaDiabetesInicial"),
                "prevalencia_proyectada_pct": tract_detail.get("prevalenciaProyectada", 0.0) if tract_detail else "N/A",
                "reduccion_puntos_porcentuales": tract_detail.get("deltaPrevalencia", 0.0) if tract_detail else "N/A",
                "casos_diabetes_evitados_estimados": tract_detail.get("casosEvitados", 0) if tract_detail else "N/A"
            },
            "impacto_a_nivel_condado_philadelphia": {
                "total_casos_evitados_todos_los_tractos": sim_result.get("resumen", {}).get("totalCasosEvitados", 0),
                "reduccion_promedio_condado_pp": sim_result.get("resumen", {}).get("reduccionPromedioPrevalencia", 0)
            },
            "aviso_metodologico": "Resultados exploratorios basados en modelos agregados. No demuestran causalidad médica individual."
        }
        return json.dumps(output, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Error ejecutando la simulación del modelo ML: {str(e)}"

@tool
def rank_top_vulnerable_tracts(n: int = 5, criteria: str = "diabetes") -> str:
    """
    Find the top N most vulnerable census tracts in Philadelphia County based on:
    - criteria='diabetes': Highest base diabetes prevalence.
    - criteria='poverty': Highest poverty rate.
    - criteria='food_desert': Low-Income Low-Access (LILA) tracts with lowest vehicle ownership.
    """
    if predictor_service.df_tracts is None:
        return "Error: Dataset de Philadelphia no cargado."

    df = predictor_service.df_tracts.copy()
    
    if criteria == "poverty":
        sorted_df = df.sort_values(by="PovertyRate", ascending=False).head(n)
    elif criteria == "food_desert":
        sorted_df = df.sort_values(by=["LILATracts_halfAnd10", "no_vehicle_household_share"], ascending=False).head(n)
    else: # default diabetes
        sorted_df = df.sort_values(by="diabetes_crude_prevalence", ascending=False).head(n)

    results = []
    for _, row in sorted_df.iterrows():
        results.append({
            "geoid": str(row["GEOID"]),
            "poblacion": int(row.get("Pop2010", 0)),
            "diabetes_prevalencia_pct": round(float(row.get("diabetes_crude_prevalence", 0)), 2),
            "tasa_pobreza_pct": round(float(row.get("PovertyRate", 0)), 2),
            "desierto_alimentario_lila": bool(row.get("LILATracts_halfAnd10", 0)),
            "sin_vehiculo_pct": round(float(row.get("no_vehicle_household_share", 0)) * 100, 2)
        })

    return json.dumps({"criterio": criteria, "top_tractos": results}, ensure_ascii=False, indent=2)

@tool
def search_scientific_evidence(query: str) -> str:
    """
    Search the indexed scientific literature, price elasticities, and academic papers (Powell, Afshin, Currie, CDC PLACES) 
    to back up public health decisions and policy simulations.
    """
    docs = knowledge_retriever.search(query, top_k=2)
    formatted = []
    for d in docs:
        formatted.append({
            "titulo": d["title"],
            "autores_fuente": f"{d['authors']} - {d['source']}",
            "tema": d["topic"],
            "hallazgos_clave": d["key_findings"],
            "parametros_cientificos": d["parameters"]
        })
    return json.dumps(formatted, ensure_ascii=False, indent=2)

# Export all tools as a list
AGENT_TOOLS = [
    query_tract_indicators,
    simulate_policy_intervention,
    rank_top_vulnerable_tracts,
    search_scientific_evidence
]
