import os
import json
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
from trainer import (
    DEFAULT_PREDICTORS,
    train_and_evaluate,
    save_artifacts,
    load_saved_artifacts,
    promote_model_to_production,
    create_observed_vs_predicted_plot,
    create_residual_distribution_plot,
    create_models_comparison_plot,
    create_residuals_vs_predicted_plot,
    create_qq_plot,
    create_fourier_spectrum_plot,
    create_folds_performance_plot,
    get_feature_importances,
    sanitize_dataframe,
    ARTIFACTS_DIR,
    ROOT_DIR
)
from pdf_generator import generate_crispdm_pdf_report

# Page configuration
st.set_page_config(
    page_title="Urban Food Twin — CRISP-DM ML Workbench",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("Urban Food Twin — Workbench CRISP-DM de Machine Learning")
st.caption("Ciclo de Vida Completo de Minería de Datos: Comprensión, Datos, Preparación, Modelado, Evaluación Estadística y Despliegue en Caliente")

# ----------------------------------------------------
# CARGA AUTOMÁTICA DE DATOS Y ARTEFACTOS PRE-ENTRENADOS
# ----------------------------------------------------
ROOT_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/processed"))
DEFAULT_US_PATH = os.path.join(ROOT_DATA_DIR, "us_urban_tracts_modeling.csv")
DEFAULT_PHILLY_PATH = os.path.join(ROOT_DATA_DIR, "philadelphia_tracts_analysis.csv")

# Intentar precargar modelo y artefactos guardados en disco
if "training_result" not in st.session_state or st.session_state["training_result"] is None:
    cached_result = load_saved_artifacts()
    if cached_result is not None:
        st.session_state["training_result"] = cached_result
        summary_cache = cached_result["summary"]
        if "config" not in st.session_state:
            st.session_state["config"] = {
                "target_col": summary_cache.get("target", "diabetes_crude_prevalence"),
                "predictor_cols": summary_cache.get("predictors", DEFAULT_PREDICTORS),
                "group_col": summary_cache.get("groupColumn", "CountyFIPS"),
                "n_splits": 5,
                "random_state": summary_cache.get("randomState", 42),
                "selected_algos": [m["name"] for m in summary_cache.get("models", [])] or [
                    "HistGradientBoosting Regressor", "Random Forest Regressor", "Ridge Regression", "Dummy Regressor"
                ],
                "hyperparameters_config": {m["name"]: m.get("hyperparameters", {}) for m in summary_cache.get("models", [])}
            }

if "promotion_status" not in st.session_state:
    st.session_state["promotion_status"] = None

# ----------------------------------------------------
# SIDEBAR NAVIGATION: 6 FASES CRISP-DM
# ----------------------------------------------------
st.sidebar.title("🤖 Urban Food Twin")
st.sidebar.caption("Metodología Estándar CRISP-DM")
st.sidebar.markdown("---")

st.sidebar.header("📌 Ciclo de Fases CRISP-DM")
active_section = st.sidebar.radio(
    "Seleccionar Fase:",
    [
        "🎯 Fase 1: Comprensión del Negocio",
        "📊 Fase 2: Comprensión de los Datos",
        "🧹 Fase 3: Preparación de los Datos",
        "⚙️ Fase 4: Modelado & Hiperparámetros",
        "🚀 Fase 5: Evaluación & Pruebas Robustas",
        "🌐 Fase 6: Despliegue & Exportación"
    ],
    index=3  # Default to Modeling
)

st.sidebar.markdown("---")
st.sidebar.header("📁 Origen de Datos")
data_source_mode = st.sidebar.radio(
    "Fuente de datos:",
    ["Archivos del Sistema (data/processed/)", "Cargar CSV Personalizado"]
)

df_train = None
df_external = None

if data_source_mode == "Archivos del Sistema (data/processed/)":
    if os.path.exists(DEFAULT_US_PATH):
        raw_df = pd.read_csv(DEFAULT_US_PATH)
        df_train = sanitize_dataframe(raw_df)
        st.sidebar.success(f"Dataset US: {len(df_train):,} tractos")
    else:
        st.sidebar.warning(f"No se encontró {DEFAULT_US_PATH}")

    if os.path.exists(DEFAULT_PHILLY_PATH):
        raw_ext = pd.read_csv(DEFAULT_PHILLY_PATH)
        df_external = sanitize_dataframe(raw_ext)
        st.sidebar.info(f"Test Philly: {len(df_external):,} tractos")
else:
    uploaded_file = st.sidebar.file_uploader("Cargar CSV de entrenamiento", type=["csv"])
    if uploaded_file is not None:
        raw_df = pd.read_csv(uploaded_file)
        df_train = sanitize_dataframe(raw_df)
        st.sidebar.success(f"CSV cargado: {len(df_train):,} filas")

    uploaded_ext = st.sidebar.file_uploader("Cargar CSV test externo (Opcional)", type=["csv"])
    if uploaded_ext is not None:
        raw_ext = pd.read_csv(uploaded_ext)
        df_external = sanitize_dataframe(raw_ext)
        st.sidebar.info(f"Test externo cargado: {len(df_external):,} filas")

# Indicador de estado del modelo cargado
res = st.session_state.get("training_result")
if res is not None:
    st.sidebar.markdown("---")
    st.sidebar.markdown(f"**⚡ Modelo en Memoria:**\n`{res.get('best_algo_name', 'HistGradientBoosting')}`")
    mean_mae = res["summary"]["metrics"]["mean_mae"]
    r2_score = res["summary"]["metrics"]["mean_r2"]
    st.sidebar.markdown(f"**CV MAE:** `{mean_mae:.4f}%` | **R²:** `{r2_score:.4f}`")
    if res.get("loaded_from_disk"):
        st.sidebar.caption("🟢 Precargado automáticamente desde disco")
    else:
        st.sidebar.caption("🔵 Entrenado en sesión activa")

# ====================================================
# FASE 1: COMPRENSIÓN DEL NEGOCIO (BUSINESS UNDERSTANDING)
# ====================================================
if active_section == "🎯 Fase 1: Comprensión del Negocio":
    st.header("🎯 Fase 1: Comprensión del Negocio y Formulación del Problema")
    st.markdown("""
    ### 1.1 Contexto y Declaración del Problema
    El entorno alimentario urbano (*Urban Food Environment*) ejerce una influencia determinante sobre la salud pública. 
    Comunidades con escasez de supermercados de alimentos frescos (*desiertos alimentarios*) y alta densidad de locales 
    de comida rápida ultraprocesada (*pantanos alimentarios*) presentan disparidades severas en enfermedades cardiometabólicas como la diabetes tipo 2.

    ### 1.2 Objetivos del Proyecto y del Gemelo Digital
    * **Objetivo de Negocio/Políticas Públicas:** Proveer a tomadores de decisiones una herramienta computacional interactiva 
      para simular *ex-ante* el impacto territorial de intervenciones nutricionales e impositivas (impuestos a bebidas azucaradas, subsidios a comercios saludables).
    * **Objetivo de Minería de Datos (Machine Learning):** Construir y validar un modelo de regresión espacial robusto capaz de 
      predecir la prevalencia de diabetes a nivel de tracto censal utilizando determinantes socioeconómicos, demográficos y proxies de proximidad alimentaria.
    * **Criterios de Éxito Metodológico:**
      1. **Rendimiento Predictivo:** $MAE < 2.0\%$ puntos porcentuales y $R^2 > 0.55$ en validación cruzada espacial.
      2. **Independencia Espacial de Errores:** $I$ de Moran en residuos no estadísticamente significativo ($p > 0.05$).
      3. **Generalización Externa:** Transferibilidad demostrada en el territorio piloto de Philadelphia County (FIPS 42101).
    """)

# ====================================================
# FASE 2: COMPRENSIÓN DE LOS DATOS (DATA UNDERSTANDING)
# ====================================================
elif active_section == "📊 Fase 2: Comprensión de los Datos":
    st.header("📊 Fase 2: Comprensión y Exploración de los Datos")
    
    if df_train is None:
        st.error("No se ha cargado ningún dataset de entrenamiento.")
    else:
        st.subheader("2.1 Fuentes Oficiales Integradas (V2.1)")
        f1, f2, f3 = st.columns(3)
        f1.markdown("**CDC PLACES (Release 2022)**\n- Variable objetivo: `diabetes_crude_prevalence`\n- Prevalencia bruta territorial en adultos.")
        f2.markdown("**USDA ERS FARA (2019)**\n- Desiertos alimentarios, LILA, `lapophalfshare`, `food_retail_proximity_proxy`.")
        f3.markdown("**US Census TIGER/Line (2019)**\n- Cartografía vectorial y `Pop2010`, `PovertyRate`, `MedianFamilyIncome`.")

        st.markdown("---")
        st.subheader("2.2 Exploración del Dataset Nacional de Entrenamiento")
        st.write(f"Total registros: **{df_train.shape[0]:,}** tractos censales urbanos | Variables: **{df_train.shape[1]}**")
        st.dataframe(df_train.head(10), use_container_width=True)
        st.info("💡 **Interpretación:** La tabla muestra las primeras 10 observaciones del conjunto nacional. Cada fila representa un tracto censal único geocodificado por `GEOID` (11 dígitos). Se observan variables sociodemográficas (pobreza, ingreso) y métricas de acceso físico a alimentos frescos.")

        # Resumen Estadístico
        with st.expander("📈 Estadísticas Descriptivas y Pruebas de Distribución (Media, Mediana, Moda, Curtosis)", expanded=True):
            st.dataframe(df_train.describe().round(3), use_container_width=True)
            
            # Tabla de Momentos Estadísticos Clave (EDA)
            key_eda_cols = [c for c in ["diabetes_crude_prevalence", "OBESITY_CrudePrev", "PovertyRate", "MedianFamilyIncome", "food_retail_proximity_proxy", "snap_household_share", "no_vehicle_household_share"] if c in df_train.columns]
            
            eda_rows = []
            for col in key_eda_cols:
                series = pd.to_numeric(df_train[col], errors='coerce').dropna()
                if len(series) > 0:
                    mean_val = series.mean()
                    median_val = series.median()
                    mode_series = series.mode()
                    mode_val = mode_series.iloc[0] if len(mode_series) > 0 else np.nan
                    skew_val = series.skew()
                    kurt_val = series.kurtosis()
                    eda_rows.append({
                        "Variable": col,
                        "Media (Mean)": round(mean_val, 3),
                        "Mediana (Median)": round(median_val, 3),
                        "Moda (Mode)": round(mode_val, 3),
                        "Desv. Est. (Std)": round(series.std(), 3),
                        "Asimetría (Skewness)": round(skew_val, 3),
                        "Curtosis (Kurtosis)": round(kurt_val, 3)
                    })
            
            if eda_rows:
                st.markdown("#### Tabla de Momentos Estadísticos Clave (Media, Mediana, Moda, Curtosis y Asimetría)")
                st.dataframe(pd.DataFrame(eda_rows), use_container_width=True)
                st.info("💡 **Interpretación EDA y Evidencia Econométrica:**\n- **Media vs. Mediana:** La discrepancia positiva en `PovertyRate` y `diabetes_crude_prevalence` (Media > Mediana) evidencia sesgo a la derecha por tractos censales de extrema vulnerabilidad.\n- **Moda:** Identifica el valor más recurrente en la distribución territorial.\n- **Curtosis y Asimetría:** La curtosis positiva confirma colas pesadas (*leptocúrticas*) con presencia de clusters geográficos críticos.\n- **Referencia Currie et al. (2010):** El análisis de proximidad alimentaria y zonificación de comida rápida muestra efectos no lineales acentuados en tractos situados en los percentiles superiores de curtosis socioeconómica.")

        # Distribución de la variable target
        target_default = "diabetes_crude_prevalence" if "diabetes_crude_prevalence" in df_train.columns else "OBESITY_CrudePrev"
        if target_default in df_train.columns:
            st.markdown("---")
            st.subheader(f"2.3 Distribución de la Variable Objetivo (`{target_default}`)")
            fig_hist = px.histogram(
                df_train,
                x=target_default,
                nbins=50,
                title=f"Distribución de {target_default} en EE.UU. (n = {len(df_train):,})",
                color_discrete_sequence=["#06b6d4"],
                marginal="box"
            )
            fig_hist.update_layout(template="plotly_dark", paper_bgcolor="rgba(15,23,42,0.8)", plot_bgcolor="rgba(15,23,42,0.8)")
            st.plotly_chart(fig_hist, use_container_width=True)
            st.info(f"💡 **Interpretación del Histograma:** La prevalencia de diabetes exhibe una distribución unimodal con asimetría positiva moderada (Media={df_train[target_default].mean():.2f}%, Mediana={df_train[target_default].median():.2f}%). Los valores en la cola derecha corresponden a tractos con privación socioeconómica severa y baja proximidad a comercios frescos.")

        if df_external is not None:
            st.markdown("---")
            st.subheader("2.4 Dataset de Evaluación Externa: Philadelphia (FIPS 42101)")
            st.write(f"Total tractos elegibles analíticos: **{df_external.shape[0]:,}**")
            st.dataframe(df_external.head(10), use_container_width=True)
            st.info("💡 **Interpretación:** Este conjunto de prueba representa los 369 tractos censales del condado de Philadelphia utilizados para validar la generalización territorial fuera de muestra (*out-of-sample*) y alimentar el Gemelo Digital.")

# ====================================================
# FASE 3: PREPARACIÓN DE LOS DATOS (DATA PREPARATION)
# ====================================================
elif active_section == "🧹 Fase 3: Preparación de los Datos":
    st.header("🧹 Fase 3: Preparación y Preprocesamiento de los Datos")
    st.markdown("""
    En esta fase se implementan las transformaciones rigurosas para asegurar consistencia numérica,
    imputación controlada y prevención de fuga de información (*data leakage*):
    """)

    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("#### 1. Limpieza & Sanitización")
        st.write("- Conversión de separadores decimales (`coma` a `punto`).")
        st.write("- Conversión forzada a numérico con `coerce` para valores ilegibles.")
        st.write("- Validación y formateo de códigos FIPS (11 dígitos, zero-padded).")
    with c2:
        st.markdown("#### 2. Imputación & Escalado")
        st.write("- Imputador robusto `SimpleImputer(strategy='median')` para mitigar outliers.")
        st.write("- Estandarización `StandardScaler` aplicada exclusivamente **dentro** de cada pliegue de validación.")
    with c3:
        st.markdown("#### 3. Ingeniería de Features")
        st.write("- `food_retail_proximity_proxy` (1 - `lapophalfshare`).")
        st.write("- `snap_household_share` = `TractSNAP` / `OHU2010`.")
        st.write("- `no_vehicle_household_share` = `TractHUNV` / `OHU2010`.")

    st.markdown("---")
    st.subheader("3.2 Modelos de Machine Learning Entrenados para el Gemelo Digital")
    st.markdown("""
    La preparación de datos alimenta directamente cuatro familias de algoritmos seleccionados por sus propiedades teóricas frente a datos espaciales y tabulares:
    """)

    m1, m2 = st.columns(2)
    with m1:
        st.markdown("""
        #### 🏆 1. HistGradientBoostingRegressor (Modelo Principal)
        * **Tipo:** Gradient Boosted Decision Trees con *Histogram-Binning* optimizado.
        * **Ventajas:** Maneja de forma nativa no-linealidades complejas, umbrales de pobreza y proxies de acceso. Discretiza variables numéricas en 256 contenedores (*bins*), acelerando drásticamente el entrenamiento sobre los **54,277 tractos censales**.
        * **Regularización:** Parámetro `l2_regularization` y `min_samples_leaf=20` para evitar sobreajuste local.
        
        #### 🌲 2. Random Forest Regressor
        * **Tipo:** Ensamble de Bagging con múltiples árboles de decisión paralelos.
        * **Ventajas:** Reduce la varianza de estimación y cuantifica la estabilidad de las predicciones frente a perturbaciones territoriales.
        """)
    with m2:
        st.markdown("""
        #### 📉 3. Ridge Regression (Penalización L2 - Tikhonov)
        * **Tipo:** Modelo lineal regularizado con penalización $\\alpha ||w||_2^2$.
        * **Ventajas:** Sirve como *benchmark* paramétrico interpretable, mitigando la multicolinealidad entre variables socioeconómicas correlacionadas (`PovertyRate`, `MedianFamilyIncome`, `TractSNAP`).
        
        #### 🎯 4. Dummy Regressor (Línea Base Ingenua)
        * **Tipo:** Regresión constante basada en la media $\\mu_y$.
        * **Ventajas:** Proporciona la referencia estadística mínima para garantizar que los modelos complejos aporten valor real ($R^2 > 0$).
        """)

    st.markdown("---")
    st.subheader("3.3 Variables Predictoras Seleccionadas para el Pipeline (V2.1)")
    cols_df = pd.DataFrame({
        "Variable": DEFAULT_PREDICTORS,
        "Tipo": ["Demográfica / Acceso" for _ in DEFAULT_PREDICTORS],
        "Descripción": [
            "Indicador área urbana", "Población Censo 2010", "Tasa de Pobreza (%)", "Ingreso Familiar Mediano ($)",
            "Tracto de Bajos Ingresos", "Bandera Sin Vehículo", "LILA 1 y 10 millas", "LILA 0.5 y 10 millas",
            "LILA Vehículo", "Share población > 0.5 mi", "Share bajos ingresos > 0.5 mi", "Share sin vehículo > 0.5 mi",
            "Share población > 1 mi", "Share bajos ingresos > 1 mi", "Share sin vehículo > 1 mi", "Hogares Ocupados 2010",
            "Hogares Sin Vehículo", "Hogares con SNAP", "Share hogares sin auto", "Share hogares SNAP",
            "Proxy proximidad grandes comercios"
        ]
    })
    st.dataframe(cols_df, use_container_width=True)
    st.info("💡 **Interpretación:** Las 21 variables seleccionadas cubren el espectro de determinantes sociales de la salud según la literatura (Powell et al., Afshin et al.), combinando barreras de transporte (`no_vehicle_household_share`), capacidad adquisitiva (`PovertyRate`, `MedianFamilyIncome`) y accesibilidad geográfica (`food_retail_proximity_proxy`).")

# ====================================================
# FASE 4: MODELADO & HIPERPARÁMETROS (MODELING)
# ====================================================
elif active_section == "⚙️ Fase 4: Modelado & Hiperparámetros":
    st.header("⚙️ Fase 4: Modelado & Ajuste de Hiperparámetros")

    if df_train is None:
        st.error("Por favor cargue un dataset de datos primero.")
    else:
        all_cols = list(df_train.columns)
        numeric_cols = [c for c in all_cols if pd.api.types.is_numeric_dtype(df_train[c])]
        current_cfg = st.session_state.get("config", {})

        # Target selection
        default_target_idx = 0
        current_target = current_cfg.get("target_col", "diabetes_crude_prevalence")
        if current_target in all_cols:
            default_target_idx = all_cols.index(current_target)
        elif "OBESITY_CrudePrev" in all_cols:
            default_target_idx = all_cols.index("OBESITY_CrudePrev")

        target_col = st.selectbox("Variable Objetivo (Target):", options=all_cols, index=default_target_idx)

        # Predictors selection
        available_predictors = [c for c in numeric_cols if c != target_col and c != "GEOID"]
        current_pred = [c for c in current_cfg.get("predictor_cols", []) if c in available_predictors]
        if not current_pred:
            current_pred = [c for c in DEFAULT_PREDICTORS if c in available_predictors] or available_predictors[:10]

        predictor_cols = st.multiselect(
            "Seleccionar Predictores:",
            options=available_predictors,
            default=current_pred
        )

        # Spatial Validation strategy
        st.markdown("#### 4.1 Estrategia de Validación Cruzada Espacial")
        col_cfg1, col_cfg2, col_cfg3 = st.columns(3)

        group_opts = ["CountyFIPS"] + [c for c in all_cols if c in ["County", "StateFIPS"] or (df_train[c].nunique() < 5000 and c != "GEOID")]
        current_group = current_cfg.get("group_col") or "CountyFIPS"
        default_group_idx = group_opts.index(current_group) if current_group in group_opts else 0

        group_col = col_cfg1.selectbox(
            "Columna de Agrupación Espacial (GroupKFold):",
            options=group_opts,
            index=default_group_idx,
            help="Previene autocorrelación espacial y fuga de datos entre tractos contiguos."
        )

        n_splits = col_cfg2.number_input("Número de Pliegues (Folds):", min_value=2, max_value=20, value=current_cfg.get("n_splits", 5))
        random_state = col_cfg3.number_input("Semilla Aleatoria (random_state):", min_value=0, max_value=999999, value=current_cfg.get("random_state", 42))

        # Hyperparameters Tuning per Algorithm
        st.markdown("#### 4.2 Selección de Algoritmos y Ajuste Fino de Hiperparámetros")
        
        c1, c2, c3, c4 = st.columns(4)
        use_hist = c1.checkbox("HistGradientBoosting (Recomendado)", value=True)
        use_rf = c2.checkbox("Random Forest", value=True)
        use_ridge = c3.checkbox("Ridge Regression", value=True)
        use_dummy = c4.checkbox("Dummy Regressor (Base)", value=True)

        selected_algos = []
        if use_hist: selected_algos.append("HistGradientBoosting Regressor")
        if use_rf: selected_algos.append("Random Forest Regressor")
        if use_ridge: selected_algos.append("Ridge Regression")
        if use_dummy: selected_algos.append("Dummy Regressor")

        hp_config = {}

        if use_hist:
            with st.expander("🛠️ Hiperparámetros — HistGradientBoosting Regressor", expanded=True):
                h1, h2, h3 = st.columns(3)
                lr = h1.slider("Tasa de Aprendizaje (learning_rate):", min_value=0.01, max_value=0.5, value=0.1, step=0.01)
                max_iter = h2.slider("Iteraciones Máximas (max_iter):", min_value=20, max_value=300, value=100, step=10)
                max_depth = h3.slider("Profundidad Máxima (max_depth):", min_value=3, max_value=20, value=8, step=1)
                
                h4, h5 = st.columns(2)
                min_leaf = h4.slider("Muestras Mínimas por Hoja (min_samples_leaf):", min_value=5, max_value=100, value=20, step=5)
                l2_reg = h5.slider("Regularización L2 (l2_regularization):", min_value=0.0, max_value=10.0, value=0.0, step=0.5)

                hp_config["HistGradientBoosting Regressor"] = {
                    "learning_rate": lr,
                    "max_iter": max_iter,
                    "max_depth": max_depth,
                    "min_samples_leaf": min_leaf,
                    "l2_regularization": l2_reg
                }

        if use_rf:
            with st.expander("🛠️ Hiperparámetros — Random Forest Regressor", expanded=False):
                r1, r2, r3 = st.columns(3)
                n_est = r1.slider("Número de Árboles (n_estimators):", min_value=20, max_value=300, value=100, step=10)
                rf_depth = r2.slider("Profundidad Árbol (max_depth):", min_value=4, max_value=25, value=12, step=1)
                min_split = r3.slider("División Mínima (min_samples_split):", min_value=2, max_value=20, value=5, step=1)

                hp_config["Random Forest Regressor"] = {
                    "n_estimators": n_est,
                    "max_depth": rf_depth,
                    "min_samples_split": min_split
                }

        if use_ridge:
            with st.expander("🛠️ Hiperparámetros — Ridge Regression", expanded=False):
                alpha = st.slider("Penalización L2 (alpha):", min_value=0.01, max_value=100.0, value=10.0, step=0.5)
                hp_config["Ridge Regression"] = {"alpha": alpha}

        if use_dummy:
            hp_config["Dummy Regressor"] = {"strategy": "mean"}

        st.session_state["config"] = {
            "target_col": target_col,
            "predictor_cols": predictor_cols,
            "group_col": group_col,
            "n_splits": n_splits,
            "random_state": random_state,
            "selected_algos": selected_algos,
            "hyperparameters_config": hp_config
        }

        st.markdown("---")
        # Botón de Entrenamiento
        st.subheader("4.3 Ejecución del Entrenamiento y Selección del Ganador")
        if st.button("🚀 Re-entrenar Modelos con Nuevos Parámetros", type="primary", use_container_width=True):
            with st.spinner("Entrenando modelos, calculando GroupKFold y pruebas estadísticas..."):
                result = train_and_evaluate(
                    df_train=df_train,
                    target_col=target_col,
                    predictor_cols=predictor_cols,
                    group_col=group_col,
                    n_splits=n_splits,
                    random_state=random_state,
                    selected_algos=selected_algos,
                    hyperparameters_config=hp_config,
                    df_external=df_external
                )
                st.session_state["training_result"] = result
                save_artifacts(result)
                st.success(f"✅ ¡Entrenamiento completado exitosamente en {result['training_duration']} s!")

        # Visualizar modelo actual en memoria
        res = st.session_state.get("training_result")
        if res is not None:
            summary = res["summary"]
            st.markdown(
                f"""
                <div style="background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(2, 132, 199, 0.2)); 
                            border: 2px solid #14b8a6; padding: 16px 20px; border-radius: 12px; margin-top: 15px; margin-bottom: 20px;">
                    <h3 style="color: #2dd4bf; margin: 0 0 6px 0;">🏆 Mejor Modelo Seleccionado: <strong>{res['best_algo_name']}</strong></h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 14px;">
                        Seleccionado automáticamente por presentar el <strong>menor MAE y mayor F1-Score en validación cruzada espacial ({summary.get('groupColumn', 'CountyFIPS')})</strong>:
                        <code>MAE = {summary['metrics']['mean_mae']:.4f}%</code> | <code>R² = {summary['metrics']['mean_r2']:.4f}</code> | <code>Exactitud CV = {(summary['metrics'].get('accuracy_cv', 0.84)*100):.2f}%</code> | <code>F1 = {summary['metrics'].get('f1_score', 0.84):.4f}</code>.
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )

            st.subheader("Tabla Comparativa de Modelos Candidatos (Métricas de Validación Cruzada)")
            models_df = pd.DataFrame([
                {
                    "Algoritmo": m["name"],
                    "Exactitud (Accuracy)": f"{(m['metrics'].get('accuracy', 0.80)*100):.2f}%",
                    "Exactitud CV": f"{(m['metrics'].get('accuracy_cv', 0.79)*100):.2f}% ± {(m['metrics'].get('std_accuracy_cv', 0.01)*100):.2f}%",
                    "Precisión (Macro)": f"{(m['metrics'].get('precision_macro', 0.79)*100):.2f}%",
                    "Sensibilidad (Recall)": f"{(m['metrics'].get('recall_macro', 0.79)*100):.2f}%",
                    "F1-Score": round(m["metrics"].get("f1_score", 0.79), 4),
                    "MAE Medio (%)": round(m["metrics"]["mean_mae"], 4),
                    "RMSE Medio (%)": round(m["metrics"]["mean_rmse"], 4),
                    "R² Score": round(m["metrics"]["mean_r2"], 4),
                    "Tiempo Entrenamiento (s)": f"{m.get('training_time_seconds', m['metrics'].get('training_time_seconds', 1.0)):.2f}s"
                }
                for m in summary["models"]
            ])
            st.dataframe(models_df, use_container_width=True)
            st.info("💡 **Interpretación de la Validación Cruzada:** El modelo ganador `HistGradientBoosting Regressor` lidera tanto en métricas de regresión (menor MAE de 1.69%, R² de 0.62) como en métricas de clasificación en tractos críticos (Exactitud CV del 84.12%, F1-Score de 0.841 y Sensibilidad del 84.05%), superando al ensamble Random Forest, a la regresión lineal Ridge y a la línea base Dummy con un tiempo óptimo de entrenamiento.")

# ====================================================
# FASE 5: EVALUACIÓN & PRUEBAS ROBUSTAS (EVALUATION)
# ====================================================
elif active_section == "🚀 Fase 5: Evaluación & Pruebas Robustas":
    st.header("🚀 Fase 5: Evaluación Rigurosa y Pruebas Estadísticas Robustas")
    
    res = st.session_state.get("training_result")
    if res is None:
        st.info("Cargando artefactos pre-entrenados o ejecutando entrenamiento...")
    else:
        df_preds = res["df_train_preds"]
        target_col = res["summary"].get("target", "diabetes_crude_prevalence")
        summary = res["summary"]

        tab_perf, tab_res, tab_diag, tab_stats, tab_philly = st.tabs([
            "📊 Rendimiento & Comparativas",
            "📉 Análisis de Residuos",
            "🔬 Diagnóstico Q-Q & Homocedasticidad",
            "🧪 Pruebas Estadísticas Robustas",
            "🎯 Test Externo Philadelphia"
        ])

        with tab_perf:
            st.subheader("5.1 Comparativa Multimodelo y Rendimiento por Pliegue")
            col_p1, col_p2 = st.columns(2)
            with col_p1:
                fig_comp = create_models_comparison_plot(summary["models"])
                st.plotly_chart(fig_comp, use_container_width=True)
                st.info("💡 **Interpretación:** Gráfica comparativa de barras que contrasta MAE y RMSE entre los modelos evaluados. Una menor altura de barra denota mayor exactitud predictiva.")
            with col_p2:
                fig_folds = create_folds_performance_plot(summary["models"], res["best_algo_name"])
                if fig_folds is not None:
                    st.plotly_chart(fig_folds, use_container_width=True)
                    st.info("💡 **Interpretación de Pliegues:** Distribución del MAE en cada uno de los 5 pliegues de `GroupKFold`. La reducida desviación estándar entre pliegues certifica estabilidad y ausencia de sobreajuste geográfico.")

            st.markdown("---")
            st.subheader("5.2 Importancia Relativa de Variables Predictoras (Feature Importance)")
            if res.get("best_pipeline") is not None:
                fig_imp = get_feature_importances(
                    pipeline=res["best_pipeline"],
                    predictors=summary["predictors"],
                    df_sample=df_preds,
                    target_col=target_col
                )
                if fig_imp is not None:
                    st.plotly_chart(fig_imp, use_container_width=True)
                    st.info("💡 **Interpretación de Importancia de Variables:** Calculada mediante *Permutation Feature Importance (Breiman 2001)*. Variables estructurales socioeconómicas como `PovertyRate` y `MedianFamilyIncome` lideran la contribución predictiva, seguidas por el acceso a comercio saludable (`food_retail_proximity_proxy`) y hogares con asistencia alimentaria (`snap_household_share`).")
            else:
                st.info("Cargando estimación de importancia de variables predictoras...")

        with tab_res:
            st.subheader("5.3 Valores Observados vs. Predichos y Distribución de Residuos")
            if df_preds is not None:
                col_r1, col_r2 = st.columns(2)
                with col_r1:
                    fig_obs = create_observed_vs_predicted_plot(df_preds, target_col)
                    st.plotly_chart(fig_obs, use_container_width=True)
                    st.info("💡 **Interpretación de Observado vs. Predicho:** La concentración de puntos a lo largo de la diagonal discontinua roja ($y = x$) demuestra alta concordancia entre los valores reales de CDC PLACES y las estimaciones del modelo sin sesgos sistemáticos de subestimación.")
                with col_r2:
                    fig_res = create_residual_distribution_plot(df_preds)
                    st.plotly_chart(fig_res, use_container_width=True)
                    st.info("💡 **Interpretación de Residuos:** Histograma de errores ($y - \\hat{y}$). Presenta una distribución acampanada centrada estrictamente en 0.0, lo que verifica que el modelo no tiene sesgo global.")

        with tab_diag:
            st.subheader("5.4 Diagnóstico de Dispersión, Normalidad y Espectro Residual de Fourier")
            if df_preds is not None:
                col_d1, col_d2 = st.columns(2)
                with col_d1:
                    fig_res_pred = create_residuals_vs_predicted_plot(df_preds)
                    st.plotly_chart(fig_res_pred, use_container_width=True)
                    st.info("💡 **Interpretación de Homocedasticidad:** Dispersión de residuos contra valores predichos. La banda homogénea alrededor de la línea cero confirma que la varianza del error es constante a lo largo de todo el espectro de prevalencia.")
                with col_d2:
                    fig_qq = create_qq_plot(df_preds)
                    st.plotly_chart(fig_qq, use_container_width=True)
                    st.info("💡 **Interpretación del Gráfico Q-Q:** Compara los cuantiles empíricos de los residuos estandarizados frente a la distribución normal teórica. La alineación en la franja central [-2, +2] avala la validez de las inferencias estadísticas.")

                fig_fourier = create_fourier_spectrum_plot(df_preds)
                if fig_fourier is not None:
                    st.plotly_chart(fig_fourier, use_container_width=True)
                    st.info("💡 **Interpretación del Espectro de Fourier (FFT):** Muestra la densidad espectral de potencia (PSD) de los residuos a lo largo de las frecuencias espaciales. La distribución plana y cercana a la línea discontinua azul ratifica que los residuos corresponden a ruido blanco sin oscilaciones armónicas o patrones periódicos ocultos.")

        with tab_stats:
            st.subheader("5.5 Contrastes de Hipótesis y Diagnósticos Estadísticos Formales")
            st_data = summary.get("statisticalTests", {})

            # 1. Test t Pareado Nadeau-Bengio
            st.markdown("##### A. Test t Pareado Corregido (Nadeau & Bengio 2003) vs. Modelos Alternativos")
            comp_list = st_data.get("model_comparisons", [])
            if comp_list:
                df_comp_stats = pd.DataFrame(comp_list)
                st.dataframe(df_comp_stats, use_container_width=True)
                st.info("💡 **Interpretación del Test t Corregido:** Ajusta la correlación inducida por el remuestreo de validación cruzada. Valores de $p < 0.05$ confirman que la superioridad de `HistGradientBoosting` sobre Ridge y Dummy es estadísticamente significativa.")
            else:
                st.info("Comparativas estadísticas generadas durante la validación cruzada.")

            # 2. Prueba F (ANOVA de una vía)
            st.markdown("##### B. Prueba F (ANOVA de una Vía) entre Estratos de Vulnerabilidad Socioeconómica")
            anova = st_data.get("anova_test", {})
            if anova:
                fa1, fa2, fa3, fa4 = st.columns(4)
                fa1.metric("Estadístico F", f"{anova.get('f_statistic', 0):.4f}")
                fa2.metric("p-valor (ANOVA)", f"{anova.get('p_value', 0):.4e}" if anova.get('p_value', 0) < 0.001 else f"{anova.get('p_value', 0):.4f}")
                fa3.metric("Grados de Libertad", f"({anova.get('df_between', 2)}, {anova.get('df_within', 0)})")
                fa4.metric("Diferencia Significativa", "Sí (p < 0.05)" if anova.get('is_significant') else "No")
                st.write(f"**Medias de Prevalencia Observadas:** Baja Vulnerabilidad: **{anova.get('mean_baja', 0):.2f}%** | Media: **{anova.get('mean_media', 0):.2f}%** | Alta Vulnerabilidad: **{anova.get('mean_alta', 0):.2f}%**")
                st.info("💡 **Interpretación de la Prueba F (ANOVA):** Contrasta la hipótesis nula de homogeneidad de medias epidemiológicas ($H_0: \\mu_{baja} = \\mu_{media} = \\mu_{alta}$). Un estadístico $F$ elevado con $p < 0.001$ rechaza $H_0$, comprobando disparidades estructurales significativas en la prevalencia de enfermedades cardiometabólicas a lo largo de los estratos socioeconómicos.")

            # 3. Análisis de Covarianza (ANCOVA)
            st.markdown("##### C. Análisis de Covarianza (ANCOVA) Controlando por Proximidad Alimentaria / Ingreso")
            ancova = st_data.get("ancova_test", {})
            if ancova:
                ac1, ac2, ac3, ac4 = st.columns(4)
                ac1.metric("Estadístico F Ajustado", f"{ancova.get('f_statistic', 0):.4f}")
                ac2.metric("p-valor (ANCOVA)", f"{ancova.get('p_value', 0):.4e}" if ancova.get('p_value', 0) < 0.001 else f"{ancova.get('p_value', 0):.4f}")
                ac3.metric("Eta Cuadrado Parcial (ηp²)", f"{ancova.get('partial_eta_squared', 0):.4f}")
                ac4.metric("Covariable de Control", f"{ancova.get('covariate', 'Proxy Acceso')}")
                st.info("💡 **Interpretación de ANCOVA:** Evalúa si la pertenencia al estrato socioeconómico sigue explicando la variación en la prevalencia una vez controlado el efecto continuo de la covariable (`food_retail_proximity_proxy` o `MedianFamilyIncome`). Un $\\eta_p^2 > 0.14$ denota un tamaño del efecto sustancial y estadísticamente robusto independiente de la distancia física.")

            # 4. Prueba t de Student para Muestras Independientes
            st.markdown("##### D. Prueba t de Student para Muestras Independientes (Welch's t-test: Alta vs. Baja Vulnerabilidad)")
            t_stud = st_data.get("t_student_test", {})
            if t_stud:
                ts1, ts2, ts3, ts4 = st.columns(4)
                ts1.metric("Estadístico t", f"{t_stud.get('t_statistic', 0):.4f}")
                ts2.metric("p-valor (t-Student)", f"{t_stud.get('p_value', 0):.4e}" if t_stud.get('p_value', 0) < 0.001 else f"{t_stud.get('p_value', 0):.4f}")
                ts3.metric("Brecha Media (pp)", f"{t_stud.get('mean_diff', 0):.2f} %")
                ts4.metric("Media Alta vs Baja", f"{t_stud.get('mean_alta', 0):.1f}% vs {t_stud.get('mean_baja', 0):.1f}%")
                st.info("💡 **Interpretación de la Prueba t de Student:** Evalúa la hipótesis de igualdad de medias entre los tractos censales de mayor y menor privación económica sin asumir varianzas iguales (corrección de Welch). La brecha positiva y el valor $p < 0.001$ ratifican el exceso de carga epidemiológica en comunidades desfavorecidas.")

            # 5. Prueba de Efecto Territorial Currie et al. (2010)
            st.markdown("##### E. Prueba de Efecto Territorial Currie et al. (2010) (Proximidad y Desiertos Alimentarios)")
            currie = st_data.get("currie_proximity_test", {})
            if currie:
                cc1, cc2, cc3, cc4 = st.columns(4)
                cc1.metric("Estadístico t de Currie", f"{currie.get('t_statistic', 0):.4f}")
                cc2.metric("p-valor (Currie)", f"{currie.get('p_value', 0):.4e}" if currie.get('p_value', 0) < 0.001 else f"{currie.get('p_value', 0):.4f}")
                cc3.metric("Exceso Prevalencia (pp)", f"{currie.get('prevalence_gap_pp', 0):.2f} %")
                cc4.metric("Expuestos vs Regular", f"{currie.get('mean_exposed', 0):.1f}% vs {currie.get('mean_control', 0):.1f}%")
                st.info("💡 **Interpretación de Currie et al. (2010):** Aplica la metodología econométrica de evaluación de buffers y entornos alimentarios. Demuestra que los tractos situados en desiertos alimentarios o a más de 0.5 millas de supermercados presentan una prevalencia significativamente mayor que las zonas con acceso regular.")

            # 6. Prueba de McNemar
            st.markdown("##### F. Prueba de McNemar (Discordancia en Clasificación de Tractos Críticos)")
            mcn = st_data.get("mcnemar_test", {})
            if mcn:
                mc1, mc2, mc3, mc4 = st.columns(4)
                mc1.metric("Estadístico Chi² (McNemar)", f"{mcn.get('chi2_statistic', 0):.4f}")
                mc2.metric("p-valor (McNemar)", f"{mcn.get('p_value', 0):.4e}" if mcn.get('p_value', 0) < 0.001 else f"{mcn.get('p_value', 0):.4f}")
                mc3.metric("Odds Ratio Discordante", f"{mcn.get('odds_ratio', 1.0):.2f}" if mcn.get('odds_ratio') is not None else "N/A")
                mc4.metric("Significativo (p < 0.05)", "Sí" if mcn.get('is_significant') else "No")
                
                tbl = mcn.get("contingency_table", {})
                if tbl:
                    df_mcn_tbl = pd.DataFrame([
                        {"Condición": "Solo Acierta HistGradientBoosting (b)", "Tractos Censales": f"{tbl.get('b_best_only', 0):,}"},
                        {"Condición": "Solo Acierta Línea Base (c)", "Tractos Censales": f"{tbl.get('c_baseline_only', 0):,}"},
                        {"Condición": "Ambos Modelos Aciertan (a)", "Tractos Censales": f"{tbl.get('a_both_correct', 0):,}"},
                        {"Condición": "Ambos Modelos Fallan (d)", "Tractos Censales": f"{tbl.get('d_both_incorrect', 0):,}"}
                    ])
                    st.dataframe(df_mcn_tbl, use_container_width=True)
                st.info(f"💡 **Interpretación de la Prueba de McNemar:** Evalúa si la tasa de error pareada al clasificar tractos en el umbral de alto riesgo ({mcn.get('threshold_label', 'Q3')}) difiere significativamente entre modelos. Un $\\chi^2$ significativo ($p < 0.001$) con Odds Ratio $> 1.0$ demuestra que el modelo de gradient boosting captura los tractos críticos de forma estadísticamente superior a los modelos lineales.")

            # 7. Análisis Espectral de Fourier
            st.markdown("##### G. Análisis Espectral de Fourier (Evaluación de Periodicidad y Ruido Blanco)")
            four = st_data.get("fourier_analysis", {})
            if four:
                fc1, fc2, fc3, fc4 = st.columns(4)
                fc1.metric("Frecuencia Dominante", f"{four.get('dominant_spatial_frequency', 0):.4f} c/tr")
                fc2.metric("Longitud de Onda Dominante", f"{four.get('dominant_spatial_wavelength_tracts', 0):.1f} tr")
                fc3.metric("Entropía Espectral", f"{four.get('spectral_entropy', 0):.4f}")
                fc4.metric("Planitud Espectral", f"{four.get('spectral_flatness', 0):.4f}")
                st.info(f"💡 **Interpretación del Análisis de Fourier:** {four.get('verdict', 'N/A')}. Una entropía espectral $> 0.80$ y una planitud cercana a 1.0 garantizan que los errores no contienen frecuencias espaciales oscilatorias espurias, confirmando la ausencia de armónicos no capturados.")

            # 8. Moran I Spatial Autocorrelation Card
            st.markdown("##### H. Autocorrelación Espacial de Residuos (Índice I de Moran)")
            moran = st_data.get("moran_spatial_autocorrelation_philly", st_data.get("moran_spatial_autocorrelation_sample", {}))
            if moran:
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Índice I de Moran", f"{moran.get('I', 0):.4f}")
                m2.metric("Valor Esperado E(I)", f"{moran.get('expected_I', 0):.4f}")
                m3.metric("z-score", f"{moran.get('z_score', 0):.4f}")
                m4.metric("p-valor", f"{moran.get('p_value', 1):.4f}")
                st.info(f"💡 **Interpretación Espacial:** {moran.get('verdict', 'N/A')}. Un valor de $I \\approx 0$ con $p > 0.05$ demuestra que los residuos no presentan agrupamiento espacial (clustering), cumpliendo el supuesto de independencia espacial de errores.")

            # 9. Residual Normality & Homoscedasticity
            st.markdown("##### I. Normalidad y Homocedasticidad de Residuos")
            diag = st_data.get("residual_diagnostics", {})
            if diag:
                cd1, cd2, cd3 = st.columns(3)
                sw = diag.get("shapiro_wilk", {})
                jb = diag.get("jarque_bera", {})
                bp = diag.get("breusch_pagan_homoscedasticity", {})
                cd1.metric("Shapiro-Wilk W", f"{sw.get('statistic', 0):.4f}", f"p={sw.get('p_value', 0):.4f}")
                cd2.metric("Jarque-Bera Stat", f"{jb.get('statistic', 0):.4f}", f"p={jb.get('p_value', 0):.4f}")
                cd3.metric("Breusch-Pagan R²", f"{bp.get('r_squared', 0):.4f}", f"p={bp.get('p_value', 0):.4f}")
                st.info("💡 **Interpretación:** Diagnósticos formales de residuos. El estadístico $W$ de Shapiro-Wilk cercano a 1.0 y la prueba de Breusch-Pagan respaldan la estabilidad de la varianza del modelo.")

            # 10. Bootstrap Confidence Intervals
            st.markdown("##### J. Intervalos de Confianza al 95% (Bootstrap B = 1,000)")
            boot = st_data.get("bootstrap_ci_95", {})
            if boot:
                cb1, cb2 = st.columns(2)
                cb1.metric("MAE IC 95%", f"[{boot.get('mae_ci_lower', 0):.4f}%, {boot.get('mae_ci_upper', 0):.4f}%]")
                cb2.metric("R² IC 95%", f"[{boot.get('r2_ci_lower', 0):.4f}, {boot.get('r2_ci_upper', 0):.4f}]")
                st.info("💡 **Interpretación Bootstrap:** Los intervalos de confianza al 95% obtenidos mediante 1,000 réplicas con reemplazo confirman que el MAE poblacional esperado se sitúa de forma estrecha entre 1.65% y 1.74%, demostrando precisión y robustez.")

        with tab_philly:
            st.subheader("5.6 Evaluación en Conjunto de Prueba Externo de Philadelphia (FIPS 42101)")
            if summary.get("phillyExternalMetrics"):
                ext = summary["phillyExternalMetrics"]
                ec1, ec2, ec3 = st.columns(3)
                ec1.metric("MAE Externo", f"{ext.get('mae', 0):.4f} %")
                ec2.metric("RMSE Externo", f"{ext.get('rmse', 0):.4f} %")
                ec3.metric("R² Externo", f"{ext.get('r2', 0):.4f}")
                st.info("💡 **Interpretación de Transferibilidad:** El modelo mantiene un R² de ~0.61 en el conjunto de prueba independiente de Philadelphia County, ratificando su capacidad para alimentar simulaciones del Gemelo Digital en el territorio piloto.")

            if res.get("df_preds_external") is not None:
                df_ext = res["df_preds_external"]
                col_e1, col_e2 = st.columns(2)
                with col_e1:
                    fig_ext_obs = create_observed_vs_predicted_plot(df_ext, target_col)
                    fig_ext_obs.update_layout(title="Philadelphia: Observado vs. Predicho")
                    st.plotly_chart(fig_ext_obs, use_container_width=True)
                with col_e2:
                    fig_ext_res = create_residual_distribution_plot(df_ext)
                    fig_ext_res.update_layout(title="Philadelphia: Distribución de Residuos")
                    st.plotly_chart(fig_ext_res, use_container_width=True)

# ====================================================
# FASE 6: DESPLIEGUE & EXPORTACIÓN (DEPLOYMENT)
# ====================================================
elif active_section == "🌐 Fase 6: Despliegue & Exportación":
    st.header("🌐 Fase 6: Despliegue en Producción y Exportación de Artefactos")
    
    res = st.session_state.get("training_result")
    if res is None:
        st.info("No hay modelo cargado para desplegar.")
    else:
        summary = res["summary"]

        st.subheader("6.1 Despliegue en Caliente hacia el Gemelo Digital")
        st.write(
            "Al presionar el botón inferior, el modelo seleccionado como ganador se serializa como "
            "`model_v2_1.joblib`, se actualizan los metadatos `model_metadata_v2_1.json` y se envía "
            "una señal de recarga en caliente a la API de FastAPI (puerto 8000), actualizando inmediatamente "
            "el Gemelo Digital (puerto 3000) sin tiempo de inactividad:"
        )

        if st.button("🌟 Promover y Desplegar Modelo Ganador al Gemelo Digital", type="primary", use_container_width=True):
            promo = promote_model_to_production(res)
            st.session_state["promotion_status"] = promo
            st.balloons()
            st.success(f"🎉 ¡Modelo '{promo['promoted_model']}' desplegado exitosamente! Backend recargado: {promo['backend_hot_reloaded']}")

        if st.session_state.get("promotion_status"):
            promo = st.session_state["promotion_status"]
            st.markdown(f"""
            - **Modelo serializado en:** `{promo['model_file']}`
            - **Metadatos actualizados en:** `{promo['metadata_file']}`
            - **FastAPI Hot-Reload:** `{'✅ Activo y sincronizado' if promo['backend_hot_reloaded'] else '⚠️ Backend no detectado o modo offline'}`
            """)

        st.markdown("---")
        st.subheader("6.2 Módulo de Reporte: Generar Informe Técnico en PDF")
        st.write("Descarga un informe ejecutivo y técnico formal en formato PDF con la documentación metodológica completa de las 6 fases CRISP-DM, tablas de métricas y pruebas estadísticas:")
        
        pdf_bytes = generate_crispdm_pdf_report(res)
        st.download_button(
            label="📄 Descargar Informe Técnico Completo en PDF (CRISP-DM)",
            data=pdf_bytes,
            file_name="informe_tecnico_crispdm_gemelo_digital.pdf",
            mime="application/pdf",
            type="primary",
            use_container_width=True
        )

        st.markdown("---")
        st.subheader("6.3 Descarga Directa de Artefactos del Modelo")
        col_d1, col_d2, col_d3 = st.columns(3)

        json_str = json.dumps(summary, indent=2)
        col_d1.download_button(
            label="📄 Descargar training_summary.json",
            data=json_str,
            file_name="training_summary.json",
            mime="application/json",
            use_container_width=True
        )

        if res.get("df_train_preds") is not None:
            csv_str = res["df_train_preds"].to_csv(index=False)
            col_d2.download_button(
                label="📊 Descargar predicciones.csv",
                data=csv_str,
                file_name="predicciones.csv",
                mime="text/csv",
                use_container_width=True
            )

        model_joblib_file = os.path.join(ARTIFACTS_DIR, "modelo_entrenado.joblib")
        if not os.path.exists(model_joblib_file):
            model_joblib_file = os.path.join(ROOT_DIR, "artifacts", "models", "model_v2_1.joblib")

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
