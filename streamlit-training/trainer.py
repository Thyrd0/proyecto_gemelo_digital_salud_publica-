import os
import json
import time
import numpy as np
import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.model_selection import GroupKFold, KFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

import plotly.express as px
import plotly.graph_objects as bg

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

DEFAULT_PREDICTORS = [
    "Urban", "Pop2010", "PovertyRate", "MedianFamilyIncome",
    "LowIncomeTracts", "HUNVFlag", "LILATracts_1And10", "LILATracts_halfAnd10",
    "LILATracts_Vehicle", "lapophalfshare", "lalowihalfshare", "lahunvhalfshare",
    "lapop1share", "lalowi1share", "lahunv1share", "OHU2010", "TractHUNV", "TractSNAP",
    "no_vehicle_household_share", "snap_household_share", "food_retail_proximity_proxy"
]

def clean_numeric_series(series: pd.Series) -> pd.Series:
    if series.dtype == object or series.dtype == str or not pd.api.types.is_numeric_dtype(series):
        s_str = series.astype(str).str.replace(',', '.', regex=False)
        return pd.to_numeric(s_str, errors='coerce')
    return pd.to_numeric(series, errors='coerce')

def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if df is None:
        return None
    df_clean = df.copy()
    for col in df_clean.columns:
        if df_clean[col].dtype == object:
            # Attempt numeric conversion if strings contain comma decimals or numbers
            s_clean = df_clean[col].astype(str).str.replace(',', '.', regex=False)
            converted = pd.to_numeric(s_clean, errors='ignore')
            if pd.api.types.is_numeric_dtype(converted):
                df_clean[col] = converted
    return df_clean

def build_model_pipeline(algo_name: str, random_state: int = 42):
    if algo_name == "Dummy Regressor":
        return DummyRegressor(strategy="mean")
    elif algo_name == "Ridge Regression":
        return Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("regressor", Ridge(alpha=10.0))
        ])
    elif algo_name == "Random Forest Regressor":
        return Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("regressor", RandomForestRegressor(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1))
        ])
    elif algo_name == "HistGradientBoosting Regressor":
        return Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("regressor", HistGradientBoostingRegressor(max_iter=100, max_depth=8, random_state=random_state))
        ])
    else:
        raise ValueError(f"Algoritmo desconocido: {algo_name}")

def train_and_evaluate(
    df_train: pd.DataFrame,
    target_col: str,
    predictor_cols: list,
    group_col: str = "CountyFIPS",
    n_splits: int = 5,
    random_state: int = 42,
    selected_algos: list = None,
    df_external: pd.DataFrame = None
):
    if selected_algos is None or len(selected_algos) == 0:
        selected_algos = [
            "Dummy Regressor",
            "Ridge Regression",
            "Random Forest Regressor",
            "HistGradientBoosting Regressor"
        ]

    start_time = time.time()
    
    # Sanitize inputs to ensure all numeric columns with ',' or strings are converted to float
    df_clean = df_train.copy()
    df_clean[target_col] = clean_numeric_series(df_clean[target_col])
    for p in predictor_cols:
        if p in df_clean.columns:
            df_clean[p] = clean_numeric_series(df_clean[p])

    # Drop missing targets after coercion
    df_clean = df_clean.dropna(subset=[target_col]).copy()
    X = df_clean[predictor_cols].astype(float)
    y = df_clean[target_col].astype(float)
    
    # Determine splitter
    use_grouping = group_col in df_clean.columns and df_clean[group_col].nunique() > 1
    if use_grouping:
        groups = df_clean[group_col].astype(str)
        n_splits_adj = min(n_splits, groups.nunique())
        splitter = GroupKFold(n_splits=n_splits_adj)
        split_args = (X, y, groups)
    else:
        splitter = KFold(n_splits=n_splits, shuffle=True, random_state=random_state)
        split_args = (X, y)

    models_summary = []
    best_algo_name = None
    best_mae = float("inf")
    best_pipeline = None
    all_trained_pipelines = {}

    for algo in selected_algos:
        pipeline = build_model_pipeline(algo, random_state=random_state)
        maes, rmses, r2s = [], [], []

        for train_idx, val_idx in splitter.split(*split_args):
            X_tr, y_tr = X.iloc[train_idx], y.iloc[train_idx]
            X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]

            pipeline.fit(X_tr, y_tr)
            preds = pipeline.predict(X_val)

            maes.append(float(mean_absolute_error(y_val, preds)))
            rmses.append(float(np.sqrt(mean_squared_error(y_val, preds))))
            r2s.append(float(r2_score(y_val, preds)))

        mean_mae = float(np.mean(maes))
        std_mae = float(np.std(maes))
        mean_rmse = float(np.mean(rmses))
        mean_r2 = float(np.mean(r2s))

        # Refit on whole dataset
        pipeline.fit(X, y)
        all_trained_pipelines[algo] = pipeline

        models_summary.append({
            "name": algo,
            "metrics": {
                "mean_mae": mean_mae,
                "std_mae": std_mae,
                "mean_rmse": mean_rmse,
                "mean_r2": mean_r2,
                "maes_per_fold": maes
            }
        })

        if mean_mae < best_mae:
            best_mae = mean_mae
            best_algo_name = algo
            best_pipeline = pipeline

    # External evaluation on external test set if present
    philly_eval = None
    df_preds_external = None
    if df_external is not None and target_col in df_external.columns:
        df_ext_clean = df_external.copy()
        df_ext_clean[target_col] = clean_numeric_series(df_ext_clean[target_col])
        for p in predictor_cols:
            if p in df_ext_clean.columns:
                df_ext_clean[p] = clean_numeric_series(df_ext_clean[p])

        df_ext_clean = df_ext_clean.dropna(subset=[target_col]).copy()
        X_ext = df_ext_clean[predictor_cols].astype(float)
        y_ext = df_ext_clean[target_col].astype(float)

        ext_preds = best_pipeline.predict(X_ext)
        ext_mae = float(mean_absolute_error(y_ext, ext_preds))
        ext_rmse = float(np.sqrt(mean_squared_error(y_ext, ext_preds)))
        ext_r2 = float(r2_score(y_ext, ext_preds))

        philly_eval = {
            "mae": ext_mae,
            "rmse": ext_rmse,
            "r2": ext_r2
        }

        df_preds_external = df_ext_clean.copy()
        df_preds_external["predicted"] = ext_preds
        df_preds_external["residual"] = y_ext - ext_preds
        df_preds_external["abs_error"] = np.abs(y_ext - ext_preds)

    training_duration = round(time.time() - start_time, 2)

    # Best model predictions on training set for plotting
    train_preds = best_pipeline.predict(X)
    df_train_preds = df_clean.copy()
    df_train_preds["predicted"] = train_preds
    df_train_preds["residual"] = y - train_preds
    df_train_preds["abs_error"] = np.abs(y - train_preds)

    # Build summary dict matching frontend schema
    summary_dict = {
        "project": "Urban Food Twin — Streamlit Training",
        "trainingDate": time.strftime("%Y-%m-%d %H:%M:%S"),
        "datasetVersion": "Custom / Processed Streamlit Dataset",
        "target": target_col,
        "predictors": predictor_cols,
        "groupColumn": group_col if use_grouping else "None (KFold)",
        "randomState": random_state,
        "models": models_summary,
        "selectedModel": best_algo_name,
        "metrics": next(m["metrics"] for m in models_summary if m["name"] == best_algo_name),
        "phillyExternalMetrics": philly_eval,
        "warnings": [
            "Prototipo académico. Los modelos son asociativos y no representan estimaciones causales ni diagnósticos clínicos.",
            "Validación técnica basada en métricas R², MAE y RMSE sobre datos tabulares agregados."
        ]
    }

    return {
        "summary": summary_dict,
        "best_pipeline": best_pipeline,
        "best_algo_name": best_algo_name,
        "df_train_preds": df_train_preds,
        "df_preds_external": df_preds_external,
        "training_duration": training_duration
    }

def save_artifacts(result: dict):
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    # 1. Save Joblib
    model_path = os.path.join(ARTIFACTS_DIR, "modelo_entrenado.joblib")
    joblib.dump(result["best_pipeline"], model_path)

    # 2. Save training_summary.json
    json_path = os.path.join(ARTIFACTS_DIR, "training_summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result["summary"], f, indent=2)

    # 3. Save predictions CSV
    csv_path = os.path.join(ARTIFACTS_DIR, "predicciones.csv")
    result["df_train_preds"].to_csv(csv_path, index=False)

    return model_path, json_path, csv_path

def create_observed_vs_predicted_plot(df: pd.DataFrame, target_col: str):
    fig = px.scatter(
        df,
        x=target_col,
        y="predicted",
        hover_data=[c for c in ["GEOID", "CountyFIPS"] if c in df.columns],
        title="Valores Observados vs. Predichos",
        labels={target_col: "Observado (%)", "predicted": "Predicho (%)"},
        color_discrete_sequence=["#14b8a6"]
    )
    # Add ideal 1:1 line
    min_val = min(df[target_col].min(), df["predicted"].min())
    max_val = max(df[target_col].max(), df["predicted"].max())
    fig.add_shape(
        type="line",
        x0=min_val, y0=min_val, x1=max_val, y1=max_val,
        line=dict(color="#f59e0b", dash="dash", width=2)
    )
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(15,23,42,0.8)",
        plot_bgcolor="rgba(15,23,42,0.8)",
        font=dict(family="Inter, sans-serif")
    )
    return fig

def create_residual_distribution_plot(df: pd.DataFrame):
    fig = px.histogram(
        df,
        x="residual",
        nbins=40,
        title="Distribución de Residuos (Observado - Predicho)",
        labels={"residual": "Residuo (%)"},
        color_discrete_sequence=["#0284c7"]
    )
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(15,23,42,0.8)",
        plot_bgcolor="rgba(15,23,42,0.8)",
        font=dict(family="Inter, sans-serif")
    )
    return fig

def get_feature_importances(pipeline, predictors: list):
    try:
        regressor = pipeline.named_steps.get("regressor", pipeline)
        if hasattr(regressor, "feature_importances_"):
            importances = regressor.feature_importances_
            df_imp = pd.DataFrame({"Feature": predictors, "Importance": importances})
            df_imp = df_imp.sort_values(by="Importance", ascending=True)
            fig = px.bar(
                df_imp,
                y="Feature",
                x="Importance",
                orientation="h",
                title="Importancia de Variables (Feature Importance)",
                color_discrete_sequence=["#2dd4bf"]
            )
            fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(15,23,42,0.8)",
                plot_bgcolor="rgba(15,23,42,0.8)",
                font=dict(family="Inter, sans-serif")
            )
            return fig
        elif hasattr(regressor, "coef_"):
            coefs = np.abs(regressor.coef_)
            df_imp = pd.DataFrame({"Feature": predictors, "Importance": coefs})
            df_imp = df_imp.sort_values(by="Importance", ascending=True)
            fig = px.bar(
                df_imp,
                y="Feature",
                x="Importance",
                orientation="h",
                title="Magnitud Absoluta de Coeficientes (|Ridge Coef|)",
                color_discrete_sequence=["#38bdf8"]
            )
            fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(15,23,42,0.8)",
                plot_bgcolor="rgba(15,23,42,0.8)",
                font=dict(family="Inter, sans-serif")
            )
            return fig
    except Exception as e:
        return None
    return None

def create_models_comparison_plot(models_summary: list):
    """Genera un gráfico comparativo de barras con barras de error para los modelos evaluados."""
    names = [m["name"] for m in models_summary]
    maes = [m["metrics"]["mean_mae"] for m in models_summary]
    std_maes = [m["metrics"].get("std_mae", 0.0) for m in models_summary]
    r2s = [m["metrics"]["mean_r2"] for m in models_summary]
    
    df_comp = pd.DataFrame({
        "Algoritmo": names,
        "MAE": maes,
        "std_mae": std_maes,
        "R2": r2s
    })
    
    fig = bg.Figure()
    
    # Barra MAE (Eje Y principal)
    fig.add_trace(bg.Bar(
        x=df_comp["Algoritmo"],
        y=df_comp["MAE"],
        name="MAE Medio (%)",
        error_y=dict(type='data', array=df_comp["std_mae"], visible=True, color="#cbd5e1"),
        marker_color="#14b8a6",
        yaxis="y1"
    ))
    
    # Línea / Puntos R² (Eje Y secundario)
    fig.add_trace(bg.Scatter(
        x=df_comp["Algoritmo"],
        y=df_comp["R2"],
        name="R² Score",
        mode="lines+markers",
        marker=dict(size=10, color="#f59e0b"),
        line=dict(color="#f59e0b", width=3),
        yaxis="y2"
    ))
    
    fig.update_layout(
        title="Comparativa de Modelos (MAE con Intervalo ±1 D.E. y R² Score)",
        template="plotly_dark",
        paper_bgcolor="rgba(15,23,42,0.8)",
        plot_bgcolor="rgba(15,23,42,0.8)",
        font=dict(family="Inter, sans-serif"),
        yaxis=dict(title="Error Absoluto Medio - MAE (%)", side="left", showgrid=True, gridcolor="#334155"),
        yaxis2=dict(title="Coeficiente de Determinación R²", overlaying="y", side="right", showgrid=False, range=[-0.1, 1.0]),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    return fig

def create_residuals_vs_predicted_plot(df: pd.DataFrame):
    """Genera el gráfico de Residuos vs. Valores Predichos para diagnóstico de homocedasticidad."""
    fig = px.scatter(
        df,
        x="predicted",
        y="residual",
        title="Diagnóstico de Residuos vs. Valores Predichos",
        labels={"predicted": "Valor Predicho (%)", "residual": "Residuo (Observado - Predicho)"},
        color="abs_error",
        color_continuous_scale="Viridis",
        hover_data=[c for c in ["GEOID", "CountyFIPS"] if c in df.columns]
    )
    
    # Línea horizontal de referencia cero
    fig.add_hline(y=0, line_dash="dash", line_color="#ef4444", line_width=2)
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(15,23,42,0.8)",
        plot_bgcolor="rgba(15,23,42,0.8)",
        font=dict(family="Inter, sans-serif")
    )
    return fig

def create_qq_plot(df: pd.DataFrame):
    """Genera un gráfico Q-Q (Cuantil-Cuantil) para evaluar normalidad de residuos."""
    residuals = df["residual"].dropna().values
    residuals_standardized = (residuals - np.mean(residuals)) / np.std(residuals)
    residuals_sorted = np.sort(residuals_standardized)
    
    n = len(residuals_sorted)
    # Cuantiles teóricos de la distribución normal
    from scipy import stats
    theoretical_quantiles = stats.norm.ppf((np.arange(1, n + 1) - 0.5) / n)
    
    df_qq = pd.DataFrame({
        "Cuantiles Teóricos (Normal)": theoretical_quantiles,
        "Cuantiles Muestrales (Residuos Estandarizados)": residuals_sorted
    })
    
    fig = px.scatter(
        df_qq,
        x="Cuantiles Teóricos (Normal)",
        y="Cuantiles Muestrales (Residuos Estandarizados)",
        title="Gráfico Q-Q Normal de Residuos Estandarizados",
        color_discrete_sequence=["#38bdf8"]
    )
    
    # Línea teórica 45 grados (y = x)
    min_val = min(theoretical_quantiles.min(), residuals_sorted.min())
    max_val = max(theoretical_quantiles.max(), residuals_sorted.max())
    fig.add_shape(
        type="line",
        x0=min_val, y0=min_val, x1=max_val, y1=max_val,
        line=dict(color="#f43f5e", dash="dash", width=2)
    )
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(15,23,42,0.8)",
        plot_bgcolor="rgba(15,23,42,0.8)",
        font=dict(family="Inter, sans-serif")
    )
    return fig

def create_folds_performance_plot(models_summary: list, best_algo_name: str):
    """Genera un gráfico de barras con el rendimiento pliegue a pliegue del modelo ganador."""
    best_m = next((m for m in models_summary if m["name"] == best_algo_name), None)
    if not best_m or "maes_per_fold" not in best_m["metrics"]:
        return None
        
    maes_fold = best_m["metrics"]["maes_per_fold"]
    folds_labels = [f"Pliegue {i+1}" for i in range(len(maes_fold))]
    
    df_folds = pd.DataFrame({
        "Pliegue": folds_labels,
        "MAE": maes_fold
    })
    
    mean_mae = best_m["metrics"]["mean_mae"]
    
    fig = px.bar(
        df_folds,
        x="Pliegue",
        y="MAE",
        title=f"Rendimiento por Pliegue de GroupKFold — {best_algo_name}",
        labels={"MAE": "MAE del Pliegue (%)"},
        color="MAE",
        color_continuous_scale="Teal",
        text_auto=".4f"
    )
    
    # Línea horizontal con la media
    fig.add_hline(
        y=mean_mae, 
        line_dash="dot", 
        line_color="#f59e0b", 
        annotation_text=f"Media Global: {mean_mae:.4f}%",
        annotation_position="bottom right"
    )
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(15,23,42,0.8)",
        plot_bgcolor="rgba(15,23,42,0.8)",
        font=dict(family="Inter, sans-serif")
    )
    return fig

