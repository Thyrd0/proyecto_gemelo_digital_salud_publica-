import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "FastAPI" in data["service"]

def test_data_status_endpoint():
    response = client.get("/api/v1/data/status")
    assert response.status_code == 200
    data = response.json()
    assert data["fips"] == "42101"
    assert data["total_tracts"] == 369
    assert len(data["verified_public_files"]) == 3

def test_data_quality_endpoint():
    response = client.get("/api/v1/data/quality")
    assert response.status_code == 200
    data = response.json()
    assert data["philadelphia_all_count"] == 376
    assert data["philadelphia_analysis_count"] == 369
    assert data["philadelphia_excluded_count"] == 7

def test_model_info_endpoint():
    response = client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert data["metadata"]["selected_algorithm"] in ["HistGradientBoostingRegressor", "RandomForestRegressor", "Ridge"]

def test_model_evaluation_endpoint():
    response = client.get("/api/v1/model/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "cross_validation_5fold_by_county" in data
    assert "philadelphia_external_evaluation" in data

def test_tracts_endpoint():
    response = client.get("/api/v1/tracts")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 369
    assert len(data["tracts"]) == 369

def test_map_endpoint():
    response = client.get("/api/v1/map/philadelphia")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 369

def test_simulation_endpoint():
    payload = {
        "horizon": 5,
        "taxEnabled": True,
        "taxRate": 20.0,
        "subsidyEnabled": True,
        "subsidyRate": 30.0,
        "restrictionEnabled": False,
        "restrictionRadius": 500,
        "isBaseline": False
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prevalenciaInicialPromedio" in data
    assert len(data["tracts"]) == 369

def test_chatbot_endpoint():
    payload = {
        "message": "¿Cuáles son las fuentes de datos del modelo?",
        "language": "es"
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
