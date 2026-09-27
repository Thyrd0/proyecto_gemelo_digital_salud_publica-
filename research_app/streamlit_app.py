import os
import json
import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="CRISP-DM Research Workbench — Urban Food Digital Twin V2.1",
    page_icon="🏥",
    layout="wide"
)

PROCESSED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/processed"))
ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../artifacts"))
MANIFEST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/manifests"))

st.title("🏥 CRISP-DM Research Workbench — V2.1 Real Data Integration")
st.caption("Urban Food Environment Digital Twin | CDC PLACES 2022 + USDA FARA 2019 + TIGER/Line 2019")

# Header disclaimers
st.info(
    "**Prototipo académico basado en datos públicos agregados.** CDC PLACES proporciona estimaciones territoriales basadas en modelos. "
    "Los resultados predictivos representan asociaciones y los escenarios de política dependen de supuestos explícitos. "
    "No tienen validez clínica, no demuestran causalidad y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública."
)

# Sidebar - Verification action
st.sidebar.header("🕹️ Acciones de Integración")
if st.sidebar.button("Verificar e integrar fuentes proporcionadas"):
    with st.spinner("Ejecutando verificación e integración de los 3 archivos reales..."):
        try:
            from ml_pipeline.src.data.verify_sources import verify_all_sources
            from ml_pipeline.src.data.fetch_real_data import fetch_and_integrate_data
            from ml_pipeline.src.data.preprocess import preprocess_and_prepare_datasets
            from ml_pipeline.src.models.train_evaluate import train_and_evaluate_models
            
            verify_all_sources()
            fetch_and_integrate_data()
            preprocess_and_prepare_datasets()
            train_and_evaluate_models()
            st.sidebar.success("✅ Verificación e integración V2.1 completada con éxito.")
        except Exception as e:
            st.sidebar.error(f"❌ Error durante la verificación: {str(e)}")

# Create 10 CRISP-DM Tabs
tabs = st.tabs([
    "1. Business Understanding",
    "2. Data Sources Inventory",
    "3. Data Quality",
    "4. GEOID Integration",
    "5. Exploratory Analysis",
    "6. Data Preparation",
    "7. Model Training",
    "8. Internal Evaluation",
    "9. Philadelphia Evaluation",
    "10. Artifacts & Reproducibility"
])

# Tab 1: Business Understanding
with tabs[0]:
    st.header("Fase 1: Comprensión del Negocio y Salud Pública")
    st.markdown("""
    ### Objetivos del Prototipo V2.1
    1. **Predecir asociativamente** la prevalencia territorial estimada de diabetes mellitus en adultos a nivel de tracto censal utilizando predictores de acceso alimentario y condiciones socioeconómicas urbanas.
    2. **Evaluar la transferibilidad geográfica** entrenando el modelo en tractos urbanos de EE. UU. (excluyendo Philadelphia) y realizando una evaluación externa independiente en el Condado de Philadelphia, PA.
    3. **Explorar escenarios paramétricos de política pública** (Impuesto a Bebidas Azucaradas, Subsidio a Frutas/Verduras) bajo supuestos científicos explícitos.
    4. **Garantizar la integridad técnica** eliminando datos sintéticos de los flujos activos y fundamentando todo el análisis en 3 datasets oficiales públicos.
    """)

# Tab 2: Data Sources Inventory
with tabs[1]:
    st.header("Fase 2: Inventario de Fuentes Públicas Oficiales")
    audit_file = os.path.join(PROCESSED_DIR, "source_audit_report.json")
    if os.path.exists(audit_file):
        with open(audit_file, "r", encoding="utf-8") as f:
            audit_data = json.load(f)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.subheader("1. CDC PLACES 2022")
            st.json(audit_data.get("places", {}))
        with col2:
            st.subheader("2. USDA FARA 2019")
            st.json(audit_data.get("fara", {}))
        with col3:
            st.subheader("3. TIGER/Line 2019")
            st.json(audit_data.get("tiger", {}))
    else:
        st.warning("Haga clic en 'Verificar e integrar fuentes proporcionadas' en la barra lateral para generar la auditoría de fuentes.")

# Tab 3: Data Quality
with tabs[2]:
    st.header("Fase 3: Análisis de Calidad de Datos")
    quality_file = os.path.join(PROCESSED_DIR, "data_quality_report.json")
    if os.path.exists(quality_file):
        with open(quality_file, "r", encoding="utf-8") as f:
            qdata = json.load(f)
        st.json(qdata)
    else:
        st.info("Reporte de calidad no disponible. Ejecute el pipeline.")

# Tab 4: GEOID Integration
with tabs[3]:
    st.header("Fase 4: Integración Nacional y Territorial por GEOID")
    audit_file = os.path.join(PROCESSED_DIR, "source_audit_report.json")
    if os.path.exists(audit_file):
        with open(audit_file, "r", encoding="utf-8") as f:
            audit_data = json.load(f)
        st.subheader("Resultados de la Unión (Join Audit)")
        st.table(pd.DataFrame([audit_data.get("join_audit", {})]))
    else:
        st.info("Ejecute la verificación de fuentes.")

# Tab 5: Exploratory Analysis
with tabs[4]:
    st.header("Fase 5: Análisis Exploratorio de Datos (EDA)")
    philly_path = os.path.join(PROCESSED_DIR, "philadelphia_tracts_analysis.csv")
    if os.path.exists(philly_path):
        df_philly = pd.read_csv(philly_path)
        st.subheader("Distribución de Prevalencia de Diabetes en Philadelphia (CDC PLACES 2022)")
        st.write(df_philly[["GEOID", "diabetes_crude_prevalence", "PovertyRate", "MedianFamilyIncome", "food_retail_proximity_proxy"]].describe())
        st.dataframe(df_philly.head(10))
    else:
        st.info("Dataset de Philadelphia no procesado aún.")

# Tab 6: Data Preparation
with tabs[5]:
    st.header("Fase 6: Preparación de Datos y Control de Fuga (Data Leakage)")
    st.markdown("""
    - **Inclusión**: `Urban == 1`, `Pop2010 >= 1000`, prevalencia válida, GEOID de 11 dígitos válido.
    - **Aislamiento Territorial**: Se aisló el Condado de Philadelphia (`CountyFIPS 42101`) ANTES del entrenamiento.
    - **Transformaciones de Variables**: Imputación por mediana y escalamiento estándar incluidos exclusivamente DENTRO de los pliegues de Validación Cruzada en `sklearn.pipeline.Pipeline`.
    - **Predictores Prohibidos Excluidos**: `OBESITY_CrudePrev`, `LPA_CrudePrev`, `BPHIGH_CrudePrev`, `CHD_CrudePrev`.
    """)

# Tab 7: Model Training
with tabs[6]:
    st.header("Fase 7: Entrenamiento de Algoritmos Candidatos")
    st.markdown("Algoritmos evaluados: `DummyRegressor`, `Ridge`, `RandomForestRegressor`, `HistGradientBoostingRegressor`.")

# Tab 8: Internal Evaluation
with tabs[7]:
    st.header("Fase 8: Evaluación Interna (5-Fold GroupKFold por CountyFIPS)")
    cv_path = os.path.join(ARTIFACTS_DIR, "metrics", "cross_validation_metrics_v2_1.json")
    if os.path.exists(cv_path):
        with open(cv_path, "r", encoding="utf-8") as f:
            cv_data = json.load(f)
        st.json(cv_data)
    else:
        st.info("Métricas de validación cruzada no generadas aún.")

# Tab 9: Philadelphia Evaluation
with tabs[8]:
    st.header("Fase 9: Evaluación Externa Geográfica en Philadelphia")
    philly_eval_path = os.path.join(ARTIFACTS_DIR, "metrics", "philadelphia_external_evaluation_v2_1.json")
    res_path = os.path.join(ARTIFACTS_DIR, "metrics", "residuals_philadelphia_v2_1.csv")
    
    if os.path.exists(philly_eval_path):
        with open(philly_eval_path, "r", encoding="utf-8") as f:
            p_eval = json.load(f)
        st.subheader("Métricas en Conjunto Externo de Philadelphia")
        st.json(p_eval)
        
        if os.path.exists(res_path):
            df_res = pd.read_csv(res_path)
            st.subheader("Residuos por Tracto Censal")
            st.dataframe(df_res.head(20))
    else:
        st.info("Evaluación externa de Philadelphia pendiente.")

# Tab 10: Artifacts & Reproducibility
with tabs[9]:
    st.header("Fase 10: Artefactos, Trazabilidad y Reproducibilidad V2.1")
    meta_path = os.path.join(ARTIFACTS_DIR, "metadata", "model_metadata_v2_1.json")
    manifest_path = os.path.join(MANIFEST_DIR, "data_manifest_v2_1.json")
    
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            st.subheader("Model Metadata V2.1")
            st.json(json.load(f))
            
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            st.subheader("Data Manifest V2.1")
            st.json(json.load(f))
