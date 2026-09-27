# System Architecture — V2 Digital Twin

## Overview of 4-Layer Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      1. Public React Frontend                           │
│     (React 19, Vite, TypeScript, Tailwind CSS, Recharts, GeoMap)       │
│  - Dashboard, Policy Simulator, Multi-Scenario Comparator, Results     │
│  - Chatbot Widget, Web Speech Voice Input, Day/Night & ES/EN Themes     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP REST Requests
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       2. FastAPI Backend API                            │
│           (Uvicorn, Pydantic, CORS Middleware, OpenAPI)                 │
│  - Endpoints: /health, /data/status, /model/info, /tracts, /simulate    │
│  - Loads model.joblib & feature schemas into memory at startup          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Artifact Deserialization
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              3. Machine Learning Pipeline & Persistence                 │
│        (Python 3.13, Pandas, Scikit-Learn, GroupKFold, Joblib)          │
│  - Data Fetching (CDC PLACES + ACS 5-Year + USDA + TIGER/Line)          │
│  - Data Preprocessing, Feature Matrix Generation, Candidate Training   │
│  - Model Persistence: artifacts/models/model.joblib                     │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ Internal Execution
┌────────────────────────────────────┴────────────────────────────────────┐
│                    4. Streamlit Researcher Workspace                    │
│    (Streamlit Internal Panel for Researchers — Port 8501)                │
│  - Data Quality, EDA, Model Training, Cross-Validation, Model Registry  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

1. **Frontend Público (React 19 + Vite + TypeScript)**: Interfaces para el usuario final. Consulta de mapas de tractos censales reales, selección de políticas y visualización de resultados sin acceso directo al modelo Python ni credenciales.
2. **FastAPI Backend (`backend/app/main.py`)**: Microservicio de inferencia de alto rendimiento que sirve predicciones del modelo serializado en milisegundos.
3. **Pipeline ML (`ml_pipeline/`)**: Scripts en Python reproducibles siguiendo la metodología CRISP-DM para ingestar datos públicos, limpiar, estructurar matrices de características y entrenar modelos.
4. **Panel Interno Streamlit (`research_app/streamlit_app.py`)**: Entorno de investigación aislado para diagnóstico de calidad de datos, EDA, entrenamiento interactivo de modelos y auditoría de artefactos.
