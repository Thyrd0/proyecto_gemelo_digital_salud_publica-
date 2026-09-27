import os
import json
import pandas as pd
import streamlit as st
from trainer import (
    DEFAULT_PREDICTORS,
    train_and_evaluate,
    save_artifacts,
    create_observed_vs_predicted_plot,
    create_residual_distribution_plot,
    get_feature_importances,
    sanitize_dataframe,
    ARTIFACTS_DIR
)

# Page configuration
st.set_page_config(
    page_title="Urban Food Twin — Módulo de Entrenamiento",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Academic Warning Banner
ACADEMIC_WARNING_ES = (
    "Prototipo académico. Los modelos y escenarios son exploratorios, no clínicos ni causales, "
    "y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública."
)
ACADEMIC_WARNING_EN = (
    "Academic prototype. The models and scenarios are exploratory, non-clinical, and non-causal, "
    "and should not be used alone for making medical or public policy decisions."
)

st.markdown(
    f"""
    <div style="background-color: rgba(120, 53, 15, 0.4); border: 1px solid rgba(245, 158, 11, 0.5); 
                padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; color: #fef3c7;">
        <strong>⚠️ [Prototipo Académico / Academic Prototype]:</strong><br/>
        <em>{ACADEMIC_WARNING_ES}</em><br/>
        <small style="color: #fde68a;">{ACADEMIC_WARNING_EN}</small>
    </div>
    """,
    unsafe_allow_html=True
)

st.title("Urban Food Twin — Módulo de Entrenamiento ML")
st.caption("Workbench independiente para el entrenamiento y evaluación de modelos (Fases 4 y 5 CRISP-DM)")

# ----------------------------------------------------
# SIDEBAR NAVIGATION (MENÚ A LA IZQUIERDA)
# ----------------------------------------------------
st.sidebar.title("🤖 Urban Food Twin")
st.sidebar.markdown("---")

# Navigation Menu on Left Sidebar
st.sidebar.header("📌 Menú Principal")
active_section = st.sidebar.radio(
    "Seleccionar sección:",
    [
        "📊 Datos",
        "⚙️ Configuración",
        "🚀 Entrenamiento",
        "📈 Resultados & Gráficos",
        "💾 Exportaciones"
    ]
)

st.sidebar.markdown("---")

# Data Source Selection on Left Sidebar
st.sidebar.header("📁 Fuente de Datos")
data_source_mode = st.sidebar.radio(
    "Origen de datos:",
    ["Archivos del Sistema (data/processed/)", "Cargar CSV Personalizado"]
)

# Root directory dataset paths
ROOT_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/processed"))
DEFAULT_US_PATH = os.path.join(ROOT_DATA_DIR, "us_urban_tracts_modeling.csv")
DEFAULT_PHILLY_PATH = os.path.join(ROOT_DATA_DIR, "philadelphia_tracts_analysis.csv")

df_train = None
df_external = None

if data_source_mode == "Archivos del Sistema (data/processed/)":
    if os.path.exists(DEFAULT_US_PATH):
        raw_df = pd.read_csv(DEFAULT_US_PATH)
        df_train = sanitize_dataframe(raw_df)
        st.sidebar.success(f"Cargado dataset nacional: {len(df_train):,} filas")
    else:
        st.sidebar.warning(f"No se encontró {DEFAULT_US_PATH}")

    if os.path.exists(DEFAULT_PHILLY_PATH):
        raw_ext = pd.read_csv(DEFAULT_PHILLY_PATH)
        df_external = sanitize_dataframe(raw_ext)
        st.sidebar.info(f"Cargado test externo Philadelphia: {len(df_external):,} filas")
else:
    uploaded_file = st.sidebar.file_uploader("Cargar CSV de entrenamiento", type=["csv"])
    if uploaded_file is not None:
        raw_df = pd.read_csv(uploaded_file)
        df_train = sanitize_dataframe(raw_df)
        st.sidebar.success(f"CSV cargado: {len(df_train):,} filas")

# Initialize session state for training results
if "training_result" not in st.session_state:
    st.session_state["training_result"] = None

# Initialize default config in session state if df_train is present
if df_train is not None and "config" not in st.session_state:
    numeric_cols = df_train.select_dtypes(include=["number", "float", "int"]).columns.tolist()
    all_cols = df_train.columns.tolist()
    
    default_target = "OBESITY_CrudePrev" if "OBESITY_CrudePrev" in all_cols else ("diabetes_crude_prevalence" if "diabetes_crude_prevalence" in all_cols else all_cols[0])
    available_pred = [c for c in numeric_cols if c != default_target and c != "GEOID"]
    default_pred = [c for c in DEFAULT_PREDICTORS if c in available_pred] or available_pred[:10]
    
    group_opts = ["None (KFold)"] + [c for c in all_cols if c in ["CountyFIPS", "County", "StateFIPS"] or df_train[c].nunique() < 5000]
    default_group = "CountyFIPS" if "CountyFIPS" in group_opts else group_opts[0]

    st.session_state["config"] = {
        "target_col": default_target,
        "predictor_cols": default_pred,
        "group_col": default_group if default_group != "None (KFold)" else None,
        "n_splits": 5,
        "random_state": 42,
        "selected_algos": ["Dummy Regressor", "Ridge Regression", "Random Forest Regressor", "HistGradientBoosting Regressor"]
    }

# ----------------------------------------------------
# SECCIÓN 1: DATOS
# ----------------------------------------------------
if active_section == "📊 Datos":
    st.header("📊 Inspección del Dataset")
    if df_train is None:
        st.error("No hay un dataset de entrenamiento cargado. Seleccione una fuente en la barra lateral izquierda.")
    else:
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Filas", f"{len(df_train):,}")
        col2.metric("Total Columnas", f"{len(df_train.columns):,}")
        col3.metric("Valores Faltantes (NaN)", f"{df_train.isna().sum().sum():,}")
        col4.metric("Filas Duplicadas", f"{df_train.duplicated().sum():,}")

        st.markdown("#### Vista previa de las primeras 10 filas")
        st.dataframe(df_train.head(10), use_container_width=True)

        with st.expander("Ver tipos de datos y resumen de nulos por columna"):
            info_df = pd.DataFrame({
                "Tipo de Dato": df_train.dtypes.astype(str),
                "Nulos": df_train.isna().sum(),
                "% Nulos": (df_train.isna().sum() / len(df_train) * 100).round(2),
                "Valores Únicos": df_train.nunique()
            })
            st.dataframe(info_df, use_container_width=True)

        st.markdown("#### Validación de Variables Recomendadas")
        possible_targets = [c for c in ["OBESITY_CrudePrev", "diabetes_crude_prevalence"] if c in df_train.columns]
        if possible_targets:
            st.success(f"✅ Variable objetivo detectada en el dataset: `{possible_targets[0]}`")
        else:
            st.warning("⚠️ No se detectó automáticamente OBESITY_CrudePrev ni diabetes_crude_prevalence. Seleccione manualmente en la sección Configuración.")

# ----------------------------------------------------
# SECCIÓN 2: CONFIGURACIÓN
# ----------------------------------------------------
elif active_section == "⚙️ Configuración":
    st.header("⚙️ Configuración del Experimento ML")
    if df_train is None:
        st.error("Por favor cargue un dataset de entrenamiento primero desde la barra lateral.")
    else:
        numeric_cols = df_train.select_dtypes(include=["number", "float", "int"]).columns.tolist()
        all_cols = df_train.columns.tolist()

        current_cfg = st.session_state.get("config", {})

        # Target selection
        default_target_idx = 0
        current_target = current_cfg.get("target_col", "OBESITY_CrudePrev")
        if current_target in all_cols:
            default_target_idx = all_cols.index(current_target)

        target_col = st.selectbox(
            "Variable Objetivo (Target):",
            options=all_cols,
            index=default_target_idx
        )

        # Predictors selection
        available_predictors = [c for c in numeric_cols if c != target_col and c != "GEOID"]
        current_pred = [c for c in current_cfg.get("predictor_cols", []) if c in available_predictors]
        if not current_pred:
            current_pred = [c for c in DEFAULT_PREDICTORS if c in available_predictors] or available_predictors[:10]

        predictor_cols = st.multiselect(
            "Seleccionar Predictores (Excluyendo GEOID):",
            options=available_predictors,
            default=current_pred
        )

        # Grouping & Validation params
        col_cfg1, col_cfg2, col_cfg3 = st.columns(3)

        group_opts = ["None (KFold)"] + [c for c in all_cols if c in ["CountyFIPS", "County", "StateFIPS"] or df_train[c].nunique() < 5000]
        current_group = current_cfg.get("group_col") or "CountyFIPS"
        default_group_idx = group_opts.index(current_group) if current_group in group_opts else 0

        group_col = col_cfg1.selectbox(
            "Columna de Agrupación (GroupKFold):",
            options=group_opts,
            index=default_group_idx
        )

        n_splits = col_cfg2.number_input("Número de Pliegues (Folds):", min_value=2, max_value=20, value=current_cfg.get("n_splits", 5))
        random_state = col_cfg3.number_input("Semilla Aleatoria (random_state):", min_value=0, max_value=999999, value=current_cfg.get("random_state", 42))

        st.markdown("#### Algoritmos a Evaluar")
        current_algos = current_cfg.get("selected_algos", ["Dummy Regressor", "Ridge Regression", "Random Forest Regressor", "HistGradientBoosting Regressor"])
        
        c1, c2, c3, c4 = st.columns(4)
        use_dummy = c1.checkbox("Dummy Regressor", value="Dummy Regressor" in current_algos)
        use_ridge = c2.checkbox("Ridge Regression", value="Ridge Regression" in current_algos)
        use_rf = c3.checkbox("Random Forest Regressor", value="Random Forest Regressor" in current_algos)
        use_hist = c4.checkbox("HistGradientBoosting", value="HistGradientBoosting Regressor" in current_algos)

        selected_algos = []
        if use_dummy: selected_algos.append("Dummy Regressor")
        if use_ridge: selected_algos.append("Ridge Regression")
        if use_rf: selected_algos.append("Random Forest Regressor")
        if use_hist: selected_algos.append("HistGradientBoosting Regressor")

        # Update session state config
        st.session_state["config"] = {
            "target_col": target_col,
            "predictor_cols": predictor_cols,
            "group_col": group_col if group_col != "None (KFold)" else None,
            "n_splits": n_splits,
            "random_state": random_state,
            "selected_algos": selected_algos
        }
        st.success("✅ Configuración guardada. Puede pasar a la sección '🚀 Entrenamiento' en el menú de la izquierda.")

# ----------------------------------------------------
# SECCIÓN 3: ENTRENAMIENTO
# ----------------------------------------------------
elif active_section == "🚀 Entrenamiento":
    st.header("🚀 Ejecución del Entrenamiento")
    if df_train is None:
        st.error("No hay un dataset cargado.")
    elif "config" not in st.session_state:
        st.warning("Verifique la sección de Configuración antes de entrenar.")
    else:
        cfg = st.session_state["config"]
        st.info(f"Target: `{cfg['target_col']}` | Predictores: {len(cfg['predictor_cols'])} | Algoritmos: {len(cfg['selected_algos'])}")

        if st.button("🚀 Ejecutar Entrenamiento Ahora", type="primary", use_container_width=True):
            with st.spinner("Entrenando modelos y calculando validación cruzada..."):
                result = train_and_evaluate(
                    df_train=df_train,
                    target_col=cfg["target_col"],
                    predictor_cols=cfg["predictor_cols"],
                    group_col=cfg["group_col"] or "CountyFIPS",
                    n_splits=cfg["n_splits"],
                    random_state=cfg["random_state"],
                    selected_algos=cfg["selected_algos"],
                    df_external=df_external
                )
                st.session_state["training_result"] = result
                save_artifacts(result)
                st.success(f"✅ ¡Entrenamiento completado en {result['training_duration']} segundos!")

        res = st.session_state["training_result"]
        if res is not None:
            st.markdown("---")
            st.markdown(f"### Modelo Ganador: **{res['best_algo_name']}**")

            summary = res["summary"]
            models_df = pd.DataFrame([
                {
                    "Algoritmo": m["name"],
                    "MAE Medio": round(m["metrics"]["mean_mae"], 4),
                    "DE MAE": round(m["metrics"]["std_mae"], 4) if "std_mae" in m["metrics"] else 0,
                    "RMSE Medio": round(m["metrics"]["mean_rmse"], 4),
                    "R² Medio": round(m["metrics"]["mean_r2"], 4)
                }
                for m in summary["models"]
            ])

            st.dataframe(models_df, use_container_width=True)

            if summary.get("phillyExternalMetrics"):
                ext = summary["phillyExternalMetrics"]
                st.markdown("#### 🎯 Evaluación Externa en Philadelphia")
                ec1, ec2, ec3 = st.columns(3)
                ec1.metric("MAE Externa", f"{ext['mae']:.4f}")
                ec2.metric("RMSE Externa", f"{ext['rmse']:.4f}")
                ec3.metric("R² Externo", f"{ext['r2']:.4f}")

# ----------------------------------------------------
# SECCIÓN 4: RESULTADOS & GRÁFICOS
# ----------------------------------------------------
elif active_section == "📈 Resultados & Gráficos":
    st.header("📈 Visualizaciones de Desempeño y Residuos")
    res = st.session_state["training_result"]
    if res is None:
        st.info("Ejecute el entrenamiento en la sección '🚀 Entrenamiento' del menú izquierdo para ver los gráficos interactivos.")
    else:
        df_preds = res["df_train_preds"]
        target_col = res["summary"]["target"]

        col_g1, col_g2 = st.columns(2)
        with col_g1:
            fig_obs = create_observed_vs_predicted_plot(df_preds, target_col)
            st.plotly_chart(fig_obs, use_container_width=True)

        with col_g2:
            fig_res = create_residual_distribution_plot(df_preds)
            st.plotly_chart(fig_res, use_container_width=True)

        st.markdown("#### Importancia de Variables / Coeficientes")
        fig_imp = get_feature_importances(res["best_pipeline"], res["summary"]["predictors"])
        if fig_imp is not None:
            st.plotly_chart(fig_imp, use_container_width=True)
        else:
            st.write("El modelo seleccionado no posee atributo directo de importancia de características.")

# ----------------------------------------------------
# SECCIÓN 5: EXPORTACIONES
# ----------------------------------------------------
elif active_section == "💾 Exportaciones":
    st.header("💾 Exportar Artefactos de Entrenamiento")
    res = st.session_state["training_result"]
    if res is None:
        st.info("Ejecute el entrenamiento para generar los archivos exportables.")
    else:
        st.markdown("Los artefactos se guardaron automáticamente en el directorio local:")
        st.code(ARTIFACTS_DIR, language="text")

        st.markdown("#### Descarga Directa de Archivos")
        col_d1, col_d2, col_d3 = st.columns(3)

        json_str = json.dumps(res["summary"], indent=2)
        col_d1.download_button(
            label="📄 Descargar training_summary.json",
            data=json_str,
            file_name="training_summary.json",
            mime="application/json",
            use_container_width=True
        )

        csv_str = res["df_train_preds"].to_csv(index=False)
        col_d2.download_button(
            label="📊 Descargar predicciones.csv",
            data=csv_str,
            file_name="predicciones.csv",
            mime="text/csv",
            use_container_width=True
        )

        model_joblib_file = os.path.join(ARTIFACTS_DIR, "modelo_entrenado.joblib")
        if os.path.exists(model_joblib_file):
            with open(model_joblib_file, "rb") as f:
                bytes_data = f.read()
            col_d3.download_button(
                label="📦 Descargar modelo_entrenado.joblib",
                data=bytes_data,
                file_name="modelo_entrenado.joblib",
                mime="application/octet-stream",
                use_container_width=True
            )

        st.markdown("---")
        st.info(
            "💡 **Instrucción de Integración**: El archivo `training_summary.json` generado arriba "
            "puede importarse directamente en la sección **Evaluación** de la aplicación **CRISP-DM Frontend** "
            "(http://localhost:5174/evaluacion)."
        )
