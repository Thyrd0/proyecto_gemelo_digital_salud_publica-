import os
import json
import shutil
import hashlib
import numpy as np
import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

PROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/processed"))
ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../artifacts"))

FEATURE_COLS = [
    "Urban", "Pop2010", "PovertyRate", "MedianFamilyIncome",
    "LowIncomeTracts", "HUNVFlag", "LILATracts_1And10", "LILATracts_halfAnd10",
    "LILATracts_Vehicle", "lapophalfshare", "lalowihalfshare", "lahunvhalfshare",
    "lapop1share", "lalowi1share", "lahunv1share", "OHU2010", "TractHUNV", "TractSNAP",
    "no_vehicle_household_share", "snap_household_share", "food_retail_proximity_proxy"
]

TARGET_COL = "diabetes_crude_prevalence"

def archive_legacy_synthetic_artifacts():
    legacy_dir = os.path.join(ARTIFACTS_DIR, "legacy_synthetic_v2")
    os.makedirs(legacy_dir, exist_ok=True)
    
    readme_content = """# Legacy Synthetic Artifacts (V2)

The files previously stored in `artifacts/` were generated using synthetic random datasets and synthetic prevalence formulas.

**IMPORTANT SCIENTIFIC NOTICE**:
- These metrics (e.g., legacy synthetic MAE and R² figures) were obtained from synthetic observations.
- DO NOT use these figures in scientific publications, methodology reports, or active UI components.
- They are preserved strictly for historical auditability and versioning history.
- Active V2.1 code uses real CDC PLACES 2022 and USDA FARA 2019 data and artifacts (`model_v2_1.joblib`).
"""
    with open(os.path.join(legacy_dir, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme_content)

    for sub in ["metadata", "metrics", "models"]:
        sub_path = os.path.join(ARTIFACTS_DIR, sub)
        if os.path.exists(sub_path):
            target_sub = os.path.join(legacy_dir, sub)
            os.makedirs(target_sub, exist_ok=True)
            for fname in os.listdir(sub_path):
                if "v2_1" not in fname and not fname.startswith("legacy"):
                    src_file = os.path.join(sub_path, fname)
                    if os.path.isfile(src_file):
                        shutil.move(src_file, os.path.join(target_sub, fname))

def train_and_evaluate_models():
    print("=== STARTING MODEL TRAINING & EVALUATION (V2.1) ===")
    archive_legacy_synthetic_artifacts()

    us_modeling_path = os.path.join(PROCESSED_DIR, "us_urban_tracts_modeling.csv")
    philly_analysis_path = os.path.join(PROCESSED_DIR, "philadelphia_tracts_analysis.csv")

    if not os.path.exists(us_modeling_path) or not os.path.exists(philly_analysis_path):
        from ml_pipeline.src.data.preprocess import preprocess_and_prepare_datasets
        preprocess_and_prepare_datasets()

    df_us = pd.read_csv(us_modeling_path)
    df_philly = pd.read_csv(philly_analysis_path)

    X_us = df_us[FEATURE_COLS]
    y_us = df_us[TARGET_COL]
    groups_us = df_us["CountyFIPS"].astype(str)

    X_philly = df_philly[FEATURE_COLS]
    y_philly = df_philly[TARGET_COL]

    # Candidate models
    candidates = {
        "DummyRegressor": DummyRegressor(strategy="mean"),
        "Ridge": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("regressor", Ridge(alpha=10.0))
        ]),
        "RandomForestRegressor": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("regressor", RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1))
        ]),
        "HistGradientBoostingRegressor": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("regressor", HistGradientBoostingRegressor(max_iter=100, max_depth=8, random_state=42))
        ])
    }

    gkf = GroupKFold(n_splits=5)
    cv_results = {}

    best_model_name = None
    best_cv_mae = float("inf")
    best_pipeline = None

    print("\n--- 5-Fold GroupKFold Cross Validation (By CountyFIPS) ---")
    for name, model_pipeline in candidates.items():
        maes, rmses, r2s = [], [], []

        for train_idx, val_idx in gkf.split(X_us, y_us, groups=groups_us):
            X_tr, y_tr = X_us.iloc[train_idx], y_us.iloc[train_idx]
            X_val, y_val = X_us.iloc[val_idx], y_us.iloc[val_idx]

            model_pipeline.fit(X_tr, y_tr)
            y_pred = model_pipeline.predict(X_val)

            maes.append(mean_absolute_error(y_val, y_pred))
            rmses.append(np.sqrt(mean_squared_error(y_val, y_pred)))
            r2s.append(r2_score(y_val, y_pred))

        mean_mae = float(np.mean(maes))
        std_mae = float(np.std(maes))
        mean_rmse = float(np.mean(rmses))
        mean_r2 = float(np.mean(r2s))

        cv_results[name] = {
            "mean_mae": mean_mae,
            "std_mae": std_mae,
            "mean_rmse": mean_rmse,
            "mean_r2": mean_r2,
            "maes_per_fold": [float(m) for m in maes]
        }

        print(f"[{name}]")
        print(f"  MAE:  {mean_mae:.4f} ± {std_mae:.4f}")
        print(f"  RMSE: {mean_rmse:.4f}")
        print(f"  R²:   {mean_r2:.4f}")

        if mean_mae < best_cv_mae:
            best_cv_mae = mean_mae
            best_model_name = name
            best_pipeline = model_pipeline

    print(f"\nWINNING MODEL: {best_model_name} (CV MAE = {best_cv_mae:.4f})")

    # Fit best model on entire US urban dataset
    print("\n--- Fitting Winning Model on Full US Urban Dataset ---")
    best_pipeline.fit(X_us, y_us)

    # External Evaluation on Reserved Philadelphia Dataset
    print("\n--- External Geographic Evaluation on Philadelphia County ---")
    philly_preds = best_pipeline.predict(X_philly)
    philly_mae = float(mean_absolute_error(y_philly, philly_preds))
    philly_rmse = float(np.sqrt(mean_squared_error(y_philly, philly_preds)))
    philly_r2 = float(r2_score(y_philly, philly_preds))

    print(f"Philadelphia External MAE:  {philly_mae:.4f}")
    print(f"Philadelphia External RMSE: {philly_rmse:.4f}")
    print(f"Philadelphia External R²:   {philly_r2:.4f}")

    # Save residuals
    df_residuals = pd.DataFrame({
        "GEOID": df_philly["GEOID"],
        "observed_prevalence": y_philly,
        "predicted_prevalence": philly_preds,
        "residual": y_philly - philly_preds,
        "abs_error": np.abs(y_philly - philly_preds)
    })
    
    os.makedirs(os.path.join(ARTIFACTS_DIR, "metrics"), exist_ok=True)
    os.makedirs(os.path.join(ARTIFACTS_DIR, "models"), exist_ok=True)
    os.makedirs(os.path.join(ARTIFACTS_DIR, "metadata"), exist_ok=True)

    residuals_csv_path = os.path.join(ARTIFACTS_DIR, "metrics", "residuals_philadelphia_v2_1.csv")
    df_residuals.to_csv(residuals_csv_path, index=False)

    # Save Model Artifacts
    model_joblib_path = os.path.join(ARTIFACTS_DIR, "models", "model_v2_1.joblib")
    joblib.dump(best_pipeline, model_joblib_path)
    # Symlink/copy to default model.joblib
    joblib.dump(best_pipeline, os.path.join(ARTIFACTS_DIR, "models", "model.joblib"))

    # Save Metadata & Feature Schema
    feature_schema = {
        "target": TARGET_COL,
        "features": FEATURE_COLS,
        "feature_count": len(FEATURE_COLS)
    }
    with open(os.path.join(ARTIFACTS_DIR, "metadata", "feature_schema_v2_1.json"), "w", encoding="utf-8") as f:
        json.dump(feature_schema, f, indent=2)
    with open(os.path.join(ARTIFACTS_DIR, "metadata", "feature_schema.json"), "w", encoding="utf-8") as f:
        json.dump(feature_schema, f, indent=2)

    model_metadata = {
        "model_version": "V2.1",
        "selected_algorithm": best_model_name,
        "target_col": TARGET_COL,
        "us_training_tracts": len(df_us),
        "philly_external_tracts": len(df_philly),
        "validation_strategy": "5-Fold GroupKFold by CountyFIPS",
        "best_cv_metrics": cv_results[best_model_name],
        "philly_external_metrics": {
            "mae": philly_mae,
            "rmse": philly_rmse,
            "r2": philly_r2
        }
    }
    with open(os.path.join(ARTIFACTS_DIR, "metadata", "model_metadata_v2_1.json"), "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    with open(os.path.join(ARTIFACTS_DIR, "metadata", "model_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)

    # Save Cross-Validation Metrics
    with open(os.path.join(ARTIFACTS_DIR, "metrics", "cross_validation_metrics_v2_1.json"), "w", encoding="utf-8") as f:
        json.dump(cv_results, f, indent=2)
    with open(os.path.join(ARTIFACTS_DIR, "metrics", "evaluation_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(cv_results[best_model_name], f, indent=2)

    # Save Philadelphia External Metrics
    philly_eval_data = {
        "sample_size": len(df_philly),
        "mae": philly_mae,
        "rmse": philly_rmse,
        "r2": philly_r2,
        "mean_observed": float(y_philly.mean()),
        "mean_predicted": float(philly_preds.mean()),
        "residual_std": float((y_philly - philly_preds).std())
    }
    with open(os.path.join(ARTIFACTS_DIR, "metrics", "philadelphia_external_evaluation_v2_1.json"), "w", encoding="utf-8") as f:
        json.dump(philly_eval_data, f, indent=2)

    print(f"\nSaved V2.1 artifacts to {ARTIFACTS_DIR}")
    return model_metadata

if __name__ == "__main__":
    train_and_evaluate_models()
