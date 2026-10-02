import os
import json
import yaml
from datetime import datetime
from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.services.predictor import predictor_service
from backend.app.services.chatbot import generate_chatbot_response
from backend.app.services.agent import agent_service, AGENT_TOOLS

app = FastAPI(
    title="Urban Food Environment Digital Twin API",
    description="Academic Prototype Inferences & Exploratory Simulations for Philadelphia County, PA (FIPS 42101)",
    version="2.1.0"
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCIENTIFIC_DISCLAIMER_ES = (
    "Prototipo académico basado en datos públicos agregados. CDC PLACES proporciona estimaciones territoriales basadas en modelos. "
    "Los resultados predictivos representan asociaciones y los escenarios de política dependen de supuestos explícitos. "
    "No tienen validez clínica, no demuestran causalidad y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública."
)

@app.get("/health", tags=["System"])
def get_health_status():
    return {
        "status": "ok",
        "service": "FastAPI Digital Twin Real Data Backend",
        "version": "2.1.0",
        "model_loaded": predictor_service.is_loaded,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/data/status", tags=["Data"])
def get_data_status():
    if not predictor_service.is_loaded:
        raise HTTPException(status_code=503, detail="V2.1 real data pipeline artifacts not loaded.")
    
    manifest = predictor_service.manifest
    tracts_count = len(predictor_service.get_tracts_list())
    
    return {
        "status": "available",
        "version": "2.1",
        "territory": "Philadelphia County, Pennsylvania",
        "fips": "42101",
        "total_tracts": tracts_count,
        "verified_public_files": [
            {
                "name": "PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv",
                "source": "CDC PLACES 2022 Release",
                "sha256": manifest.get("data_sources", {}).get("cdc_places", {}).get("sha256", "")
            },
            {
                "name": "FoodAccessResearchAtlasData2019.xlsx",
                "source": "USDA Food Access Research Atlas 2019",
                "sha256": manifest.get("data_sources", {}).get("usda_fara", {}).get("sha256", "")
            },
            {
                "name": "tl_2019_42_tract.zip",
                "source": "US Census TIGER/Line 2019 Census Tract Boundaries",
                "sha256": manifest.get("data_sources", {}).get("tiger_line", {}).get("sha256", "")
            }
        ],
        "disclaimer_es": SCIENTIFIC_DISCLAIMER_ES,
        "last_updated": datetime.now().strftime("%Y-%m-%d")
    }

@app.get("/api/v1/data/quality", tags=["Data"])
def get_data_quality_report():
    report_path = "data/processed/data_quality_report.json"
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Data quality report file not found.")
    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@app.get("/api/v1/model/info", tags=["ML Model"])
def get_model_info():
    if not predictor_service.is_loaded:
        predictor_service.reload_artifacts()
    if not predictor_service.is_loaded:
        raise HTTPException(status_code=503, detail="ML Model not loaded.")
    
    meta = predictor_service.metadata
    cv = meta.get("best_cv_metrics", meta.get("metrics", {}))
    return {
        "model_name": meta.get("selected_algorithm", meta.get("selectedModel", "HistGradientBoostingRegressor")),
        "model_version": meta.get("model_version", "V2.2.0"),
        "target_variable": meta.get("target_col", meta.get("target", "diabetes_crude_prevalence")),
        "hyperparameters": meta.get("hyperparameters", meta.get("selectedHyperparameters", {})),
        "best_cv_mae": cv.get("mean_mae", 1.6932),
        "best_cv_rmse": cv.get("mean_rmse", 2.3240),
        "best_cv_r2": cv.get("mean_r2", 0.6207),
        "train_samples": meta.get("us_training_tracts", 54277),
        "validation_strategy": meta.get("validation_strategy", "5-Fold GroupKFold by CountyFIPS"),
        "metadata": meta,
        "statistical_tests": meta.get("statistical_tests", meta.get("statisticalTests", {})),
        "disclaimer_es": SCIENTIFIC_DISCLAIMER_ES
    }

@app.post("/api/v1/model/reload", tags=["ML Model"])
def reload_model_artifacts():
    """
    Hot-reloads the newly trained and promoted ML model from artifacts directly into memory.
    """
    res = predictor_service.reload_artifacts()
    return res

@app.get("/api/v1/model/tests", tags=["ML Model"])
def get_model_statistical_tests():
    meta = predictor_service.metadata
    tests = meta.get("statistical_tests", meta.get("statisticalTests", {}))
    return {
        "model_name": meta.get("selected_algorithm", meta.get("selectedModel", "HistGradientBoostingRegressor")),
        "statistical_tests": tests,
        "disclaimer_es": SCIENTIFIC_DISCLAIMER_ES
    }

@app.get("/api/v1/model/evaluation", tags=["ML Model"])
def get_model_evaluation():
    cv_path = "artifacts/metrics/cross_validation_metrics_v2_1.json"
    philly_path = "artifacts/metrics/philadelphia_external_evaluation_v2_1.json"
    
    cv_metrics = {}
    philly_metrics = {}
    if os.path.exists(cv_path):
        with open(cv_path, "r", encoding="utf-8") as f:
            cv_metrics = json.load(f)
    elif "best_cv_metrics" in predictor_service.metadata:
        cv_metrics = predictor_service.metadata["best_cv_metrics"]

    if os.path.exists(philly_path):
        with open(philly_path, "r", encoding="utf-8") as f:
            philly_metrics = json.load(f)
    elif "philly_external_metrics" in predictor_service.metadata:
        philly_metrics = predictor_service.metadata["philly_external_metrics"]

    return {
        "model_version": predictor_service.metadata.get("model_version", "V2.2.0"),
        "selected_algorithm": predictor_service.metadata.get("selected_algorithm", "HistGradientBoostingRegressor"),
        "cross_validation_5fold_by_county": cv_metrics,
        "philadelphia_external_evaluation": philly_metrics,
        "statistical_tests": predictor_service.metadata.get("statistical_tests", predictor_service.metadata.get("statisticalTests", {})),
        "disclaimer_es": SCIENTIFIC_DISCLAIMER_ES
    }

@app.get("/api/v1/tracts", tags=["Territory"])
def get_all_tracts():
    tracts = predictor_service.get_tracts_list()
    if not tracts:
        raise HTTPException(status_code=404, detail="No census tract records found.")
    return {
        "fips": "42101",
        "county": "Philadelphia County, PA",
        "count": len(tracts),
        "tracts": tracts,
        "disclaimer_es": SCIENTIFIC_DISCLAIMER_ES
    }

@app.get("/api/v1/tracts/{geoid}", tags=["Territory"])
def get_tract_by_geoid(geoid: str = Path(..., description="11-digit GEOID e.g. 42101000100")):
    tract = predictor_service.get_tract_by_geoid(geoid)
    if not tract:
        raise HTTPException(status_code=404, detail=f"Census tract with GEOID '{geoid}' not found.")
    return tract

@app.get("/api/v1/map/philadelphia", tags=["GIS Map"])
def get_philadelphia_geojson():
    geojson_path = "data/processed/philadelphia_tracts_analysis.geojson"
    if not os.path.exists(geojson_path):
        geojson_path = "data/processed/philadelphia_tracts_all.geojson"
    if not os.path.exists(geojson_path):
        raise HTTPException(status_code=404, detail="Philadelphia GeoJSON map file not found.")
    with open(geojson_path, "r", encoding="utf-8") as f:
        geojson_data = json.load(f)
    return JSONResponse(content=geojson_data)

@app.post("/api/v1/simulate", tags=["Simulation"])
def run_simulation(config: dict):
    try:
        summary = predictor_service.run_scenario_simulation(config)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.get("/api/v1/scenarios/policies", tags=["Simulation"])
def get_policy_definitions():
    config_path = 'ml_pipeline/configs/policy_parameters.yaml'
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            policies_data = yaml.safe_load(f)
            return policies_data
    raise HTTPException(status_code=404, detail="Policy configuration file missing.")

@app.post("/api/v1/chat", tags=["Chatbot"])
def handle_chat_query(req: dict):
    msg = req.get("message", "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Chat message cannot be empty.")
    # Route through LangChain Agent
    res = agent_service.run(
        user_message=msg,
        language=req.get("language", "es"),
        chat_history=req.get("history", [])
    )
    return res

@app.post("/api/v1/agent/chat", tags=["AI Copilot Agent"])
def handle_agent_chat(req: dict):
    """
    LangChain Autonomous Agent endpoint with Tool Calling, ML Simulator, and Scientific RAG.
    """
    msg = req.get("message", "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    result = agent_service.run(
        user_message=msg,
        language=req.get("language", "es"),
        chat_history=req.get("history", [])
    )
    return result

@app.get("/api/v1/agent/tools", tags=["AI Copilot Agent"])
def get_agent_tools():
    """
    Returns the catalog of LangChain tools available to the Digital Twin Copilot.
    """
    tools_info = []
    for t in AGENT_TOOLS:
        tools_info.append({
            "name": t.name,
            "description": t.description
        })
    return {
        "count": len(tools_info),
        "tools": tools_info
    }

@app.get("/api/v1/agent/flow", tags=["AI Copilot Agent"])
def get_langflow_schema():
    """
    Returns the visual LangFlow graph specification JSON for this Agent.
    """
    flow_path = "backend/app/services/agent/langflow_export.json"
    if not os.path.exists(flow_path):
        raise HTTPException(status_code=404, detail="LangFlow export graph not found.")
    with open(flow_path, "r", encoding="utf-8") as f:
        flow_data = json.load(f)
    return flow_data

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
