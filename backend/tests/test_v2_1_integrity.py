import os
import json
import hashlib
import pandas as pd
import geopandas as gpd
import joblib
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from ml_pipeline.src.data.verify_sources import normalize_tract_geoid

client = TestClient(app)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/external"))
PROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed"))
ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../artifacts"))

PLACES_FILENAME = "PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv"
FARA_FILENAME = "FoodAccessResearchAtlasData2019.xlsx"
TIGER_FILENAME = "tl_2019_42_tract.zip"

def test_raw_files_exist_and_hashes():
    for f in [PLACES_FILENAME, FARA_FILENAME, TIGER_FILENAME]:
        p = os.path.join(DATA_DIR, f)
        assert os.path.exists(p), f"Missing external file: {p}"
        assert os.path.getsize(p) > 0, f"File is empty: {p}"

def test_geoid_normalization():
    assert normalize_tract_geoid("42101000100") == "42101000100"
    assert normalize_tract_geoid(42101000100.0) == "42101000100"
    assert normalize_tract_geoid("  42101000100  ") == "42101000100"
    assert normalize_tract_geoid("INVALID_GEOID") == ""
    assert normalize_tract_geoid(None) == ""

def test_data_leakage_and_target_isolation():
    quality_path = os.path.join(PROCESSED_DIR, "data_quality_report.json")
    if os.path.exists(quality_path):
        with open(quality_path, "r", encoding="utf-8") as f:
            q = json.load(f)
        forbidden = ["OBESITY_CrudePrev", "LPA_CrudePrev", "BPHIGH_CrudePrev", "CHD_CrudePrev"]
        for col in forbidden:
            assert col not in q["predictors_raw"], f"Forbidden predictor included: {col}"
            assert col not in q["predictors_derived"], f"Forbidden predictor included: {col}"

def test_philadelphia_training_exclusion():
    us_modeling_path = os.path.join(PROCESSED_DIR, "us_urban_tracts_modeling.csv")
    if os.path.exists(us_modeling_path):
        df_us = pd.read_csv(us_modeling_path, dtype={"GEOID": str})
        philly_in_us = df_us[df_us["CountyFIPS"].astype(str) == "42101"]
        assert len(philly_in_us) == 0, "Philadelphia County MUST be excluded from training set!"

def test_model_artifact_reload_and_determinism():
    model_path = os.path.join(ARTIFACTS_DIR, "models", "model_v2_1.joblib")
    if not os.path.exists(model_path):
        model_path = os.path.join(ARTIFACTS_DIR, "models", "model.joblib")
    if os.path.exists(model_path):
        m = joblib.load(model_path)
        assert m is not None
        df_philly = pd.read_csv(os.path.join(PROCESSED_DIR, "philadelphia_tracts_analysis.csv"))
        feature_cols = [
            "Urban", "Pop2010", "PovertyRate", "MedianFamilyIncome",
            "LowIncomeTracts", "HUNVFlag", "LILATracts_1And10", "LILATracts_halfAnd10",
            "LILATracts_Vehicle", "lapophalfshare", "lalowihalfshare", "lahunvhalfshare",
            "lapop1share", "lalowi1share", "lahunv1share", "OHU2010", "TractHUNV", "TractSNAP",
            "no_vehicle_household_share", "snap_household_share", "food_retail_proximity_proxy"
        ]
        sample = df_philly[feature_cols].iloc[:5]
        p1 = m.predict(sample)
        p2 = m.predict(sample)
        assert (p1 == p2).all(), "Model predictions must be strictly deterministic!"

def test_fastapi_endpoints():
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"

    res_status = client.get("/api/v1/data/status")
    assert res_status.status_code == 200
    assert "verified_public_files" in res_status.json()

    res_tracts = client.get("/api/v1/tracts")
    assert res_tracts.status_code == 200
    assert res_tracts.json()["count"] > 0

    res_policies = client.get("/api/v1/scenarios/policies")
    assert res_policies.status_code == 200
    assert "policy_a_ssb_tax" in res_policies.json()["policies"]

def test_no_synthetic_tracts_imports_in_src():
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src"))
    active_synthetic_found = []
    for root, _, files in os.walk(src_dir):
        if "legacy" in root:
            continue
        for file in files:
            if file.endswith((".ts", ".tsx")):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    target1 = "SYNTHETIC" + "_TRACTS"
                    target2 = "runDeterministic" + "Simulation"
                    if target1 in content or target2 in content:
                        active_synthetic_found.append(filepath)
    assert len(active_synthetic_found) == 0, f"Synthetic imports active outside legacy: {active_synthetic_found}"
