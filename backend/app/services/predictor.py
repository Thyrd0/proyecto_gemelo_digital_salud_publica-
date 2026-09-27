import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

MODEL_PATH = 'artifacts/models/model_v2_1.joblib'
METADATA_PATH = 'artifacts/metadata/model_metadata_v2_1.json'
DATA_PATH = 'data/processed/philadelphia_tracts_analysis.csv'
MANIFEST_PATH = 'data/manifests/data_manifest_v2_1.json'

FEATURE_COLS = [
    "Urban", "Pop2010", "PovertyRate", "MedianFamilyIncome",
    "LowIncomeTracts", "HUNVFlag", "LILATracts_1And10", "LILATracts_halfAnd10",
    "LILATracts_Vehicle", "lapophalfshare", "lalowihalfshare", "lahunvhalfshare",
    "lapop1share", "lalowi1share", "lahunv1share", "OHU2010", "TractHUNV", "TractSNAP",
    "no_vehicle_household_share", "snap_household_share", "food_retail_proximity_proxy"
]

def sanitize_val(v):
    if pd.isna(v) or v is None:
        return 0.0
    if isinstance(v, (float, np.floating)):
        if np.isnan(v) or np.isinf(v):
            return 0.0
        return float(v)
    if isinstance(v, (int, np.integer)):
        return int(v)
    return str(v)

class ScenarioPredictorService:
    def __init__(self):
        self.model = None
        self.metadata = {}
        self.df_tracts = None
        self.manifest = {}
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
        elif os.path.exists('artifacts/models/model.joblib'):
            self.model = joblib.load('artifacts/models/model.joblib')

        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)

        if os.path.exists(DATA_PATH):
            self.df_tracts = pd.read_csv(DATA_PATH, dtype={"GEOID": str})
            self.df_tracts['GEOID'] = self.df_tracts['GEOID'].astype(str).str.zfill(11)

        if os.path.exists(MANIFEST_PATH):
            with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
                self.manifest = json.load(f)

        self.is_loaded = (self.model is not None) and (self.df_tracts is not None)

    def get_tracts_list(self) -> List[Dict[str, Any]]:
        if self.df_tracts is None:
            return []
        records = []
        for idx, row in self.df_tracts.iterrows():
            rec = {k: sanitize_val(v) for k, v in row.to_dict().items()}
            rec["geoid"] = str(row["GEOID"])
            rec["prevalenciaDiabetesInicial"] = sanitize_val(row.get("diabetes_crude_prevalence", 0.0))
            rec["poblacion"] = int(sanitize_val(row.get("Pop2010", 0)))
            records.append(rec)
        return records

    def get_tract_by_geoid(self, geoid: str) -> Optional[Dict[str, Any]]:
        if self.df_tracts is None:
            return None
        geoid_clean = str(geoid).strip().zfill(11)
        match = self.df_tracts[self.df_tracts['GEOID'] == geoid_clean]
        if len(match) == 0:
            return None
        raw_rec = match.iloc[0].to_dict()
        rec = {k: sanitize_val(v) for k, v in raw_rec.items()}
        rec["geoid"] = geoid_clean
        rec["prevalenciaDiabetesInicial"] = sanitize_val(rec.get("diabetes_crude_prevalence", 0.0))
        rec["poblacion"] = int(sanitize_val(rec.get("Pop2010", 0)))
        return rec

    def run_scenario_simulation(self, config: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_loaded:
            raise RuntimeError("V2.1 artifacts not loaded into memory.")

        horizon = config.get("horizon", 5)
        tax_enabled = config.get("taxEnabled", False) and config.get("taxRate", 0) > 0
        tax_rate = config.get("taxRate", 20.0) if tax_enabled else 0.0

        subsidy_enabled = config.get("subsidyEnabled", False) and config.get("subsidyRate", 0) > 0
        subsidy_rate = config.get("subsidyRate", 30.0) if subsidy_enabled else 0.0

        restriction_enabled = config.get("restrictionEnabled", False)
        is_baseline = config.get("isBaseline", False) or not (tax_enabled or subsidy_enabled or restriction_enabled)

        results = []

        for idx, row in self.df_tracts.iterrows():
            orig_features = {col: sanitize_val(row[col]) if col in row else 0.0 for col in FEATURE_COLS}
            mod_features = orig_features.copy()

            if subsidy_enabled:
                proxy_boost = (1.0 - orig_features["food_retail_proximity_proxy"]) * (subsidy_rate / 100.0) * 0.40
                mod_features["food_retail_proximity_proxy"] = min(1.0, orig_features["food_retail_proximity_proxy"] + proxy_boost)

            X_orig = pd.DataFrame([orig_features])
            X_mod = pd.DataFrame([mod_features])

            base_pred = float(self.model.predict(X_orig)[0])
            mod_pred = float(self.model.predict(X_mod)[0])

            tax_shift = (tax_rate / 100.0) * 0.85 if tax_enabled else 0.0
            obs_prev = float(sanitize_val(row.get("diabetes_crude_prevalence", base_pred)))

            if is_baseline:
                projected_prevalence = round(obs_prev, 2)
            else:
                model_diff = base_pred - mod_pred
                total_effect = model_diff + tax_shift
                horizon_factor = 1.0 if horizon == 5 else 1.25
                projected_prevalence = round(obs_prev - (total_effect * horizon_factor), 2)

            projected_prevalence = max(1.0, min(99.0, projected_prevalence))
            diff_abs = round(obs_prev - projected_prevalence, 2)
            rel_change = round((diff_abs / obs_prev) * 100.0, 2) if obs_prev > 0 else 0.0

            results.append({
                "geoid": str(row["GEOID"]),
                "poblacion": int(sanitize_val(row.get("Pop2010", 0))),
                "poverty_rate": float(sanitize_val(row.get("PovertyRate", 0.0))),
                "median_income": float(sanitize_val(row.get("MedianFamilyIncome", 0.0))),
                "prevalenciaInicial": obs_prev,
                "prevalenciaProyectada": projected_prevalence,
                "diferenciaAbsoluta": diff_abs,
                "cambioRelativo": rel_change,
                "casosEvitadosNote": "No estimado en V2.1 por ausencia de denominador poblacional adulto compatible.",
                "food_retail_proximity_proxy_initial": round(orig_features["food_retail_proximity_proxy"], 3),
                "food_retail_proximity_proxy_projected": round(mod_features["food_retail_proximity_proxy"], 3)
            })

        mean_init = round(float(np.mean([r["prevalenciaInicial"] for r in results])), 2)
        mean_proj = round(float(np.mean([r["prevalenciaProyectada"] for r in results])), 2)
        mean_diff = round(mean_init - mean_proj, 2)

        policy_c_status = {
            "enabled": restriction_enabled,
            "status": "deactivated_in_v2_1",
            "message": "Esta política requiere ubicaciones verificadas de escuelas y establecimientos de comida rápida. No se encuentra operacionalizada con los tres datasets de V2.1."
        }

        return {
            "tracts": results,
            "totalTracts": len(results),
            "prevalenciaInicialPromedio": mean_init,
            "prevalenciaProyectadaPromedio": mean_proj,
            "diferenciaAbsolutaPromedio": mean_diff,
            "policyCStatus": policy_c_status,
            "casosEvitadosDisclaimer": "Casos potencialmente evitados: no estimados en V2.1 por ausencia de denominador poblacional adulto compatible.",
            "config": config,
            "model_version": self.metadata.get("selected_algorithm", "V2.1_Model"),
            "data_sources": [
                "CDC PLACES 2022 Release (Adult crude prevalence estimates)",
                "USDA Food Access Research Atlas 2019",
                "US Census TIGER/Line 2019 PA Census Tracts"
            ],
            "disclaimer_es": "Prototipo académico basado en datos públicos agregados. CDC PLACES proporciona estimaciones territoriales basadas en modelos. Los resultados predictivos representan asociaciones y los escenarios de política dependen de supuestos explícitos. No tienen validez clínica, no demuestran causalidad y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública.",
            "disclaimer_en": "Academic prototype based on aggregated public data. CDC PLACES provides model-based territorial estimates. Predictive results represent associations, and policy scenarios depend on explicit assumptions. They lack clinical validity, do not demonstrate causality, and must not be used solely for medical or public policy decisions.",
            "executedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

predictor_service = ScenarioPredictorService()
