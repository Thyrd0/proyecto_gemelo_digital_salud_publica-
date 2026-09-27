# Resumen Técnico V2 para Artículo Científico (Materiales y Métodos)

## 1. IMPLEMENTADO EN LA V2

### 1.1. Arquitectura y Tecnologías Realmente Utilizadas
- **Frontend Público**: React 19, Vite 6, TypeScript 5.8, Tailwind CSS v4, Recharts, Lucide Icons, Web Speech API (Voz y Texto).
- **Backend API**: FastAPI (Python 3.13), Uvicorn, Pydantic v2, PyYAML, CORS Middleware, OpenAPI Docs.
- **Pipeline Científico de ML**: Python 3.13, Pandas, NumPy, Scikit-Learn, Joblib, Pytest.
- **Panel Interno del Investigador**: Streamlit 1.56 (aislado del frontend público).

### 1.2. Territorio Piloto y Fuentes de Datos Efectivamente Integradas
- **Territorio Piloto**: Philadelphia County, Pennsylvania — FIPS `42101`.
- **Número de Registros**: **384 Tractos Censales Oficiales**.
- **Clave Geográfica**: GEOIDs oficiales de 11 dígitos (`42101xxxxxx`).
- **Fuentes Integradas**:
  1. **CDC PLACES (2023 Release)**: Prevalencia de diabetes diagnosticada a nivel de tracto censal (`DIABETES_CrudePrev`).
  2. **American Community Survey (ACS 5-Year 2018–2022)**: Población total, Ingreso mediano por hogar (`B19013`), Tasa de pobreza (`B17001`), Nivel educativo (`B15003`), Acceso a vehículo privado (`B25044`).
  3. **USDA Food Access Research Atlas**: Índice de acceso a alimentos saludables y desiertos alimentarios (`LILATracts`).
  4. **TIGER/Line Boundary Shapefiles (U.S. Census Bureau)**: Geometría de límites de tractos censales para mapeo GeoJSON.

### 1.3. Preprocesamiento de Datos y Feature Engineering
- Validación estricta de GEOIDs de 11 dígitos.
- Limpieza y acotamiento de valores fuera de rangos físicos (Ingreso: $10k–$250k; Pobreza, Educación, Vehículos, Acceso Saludable: 0–100%).
- Matriz de características predictoras ($X$): `ingresoMedio`, `poverty_rate`, `bachelor_degree_pct`, `accesoVehiculo`, `indiceAccesoSaludable`, `densidadComidaRapida`.
- Variable objetivo ($Y$): `prevalenciaDiabetesInicial` (CDC PLACES).

### 1.4. Modelado y Evaluación (CRISP-DM)
- **Estrategia de Partición**: Validacion Cruzada `GroupKFold` de 5 pliegues segmentados por vecindario urbano para eliminar la fuga de datos por autocorrelación espacial entre tractos contiguos.
- **Modelos Entrenados y Comparados**:
  1. **Baseline Mean Dummy Regressor**: MAE = `3.9742` pp | RMSE = `4.4303` pp | R² = `-5.8724`
  2. **Ridge Regularized Linear Regression**: MAE = `0.5057` pp | RMSE = `0.6163` pp | R² = `0.8733`
  3. **HistGradientBoosting Regressor**: MAE = `0.6521` pp | RMSE = `0.8038` pp | R² = `0.7825`
  4. **Random Forest Regressor**: MAE = `0.6908` pp | RMSE = `0.8507` pp | R² = `0.7557`
- **Modelo Ganador Seleccionado**: **Ridge Regression** (MAE = `0.5057` pp).
- **Artefacto Persistido**: `artifacts/models/model.joblib`.

### 1.5. Endpoints Expuestos por FastAPI Backend
- `GET /health`: Estado del servicio de inferencia.
- `GET /api/v1/data/status`: Resumen del territorio y fuentes.
- `GET /api/v1/model/info`: Metadatos del modelo serializado y métricas de error.
- `GET /api/v1/tracts`: Listado de los 384 tractos censales.
- `GET /api/v1/tracts/{geoid}`: Detalle individual por GEOID de 11 dígitos.
- `POST /api/v1/simulate`: Inferencia de escenarios multivariados.
- `POST /api/v1/chat`: Asistente virtual con proxy a API Gemini o fallback local riguroso.

### 1.6. Pruebas Automatizadas Ejecutadas
- Pruebas backend con Pytest (`backend/tests/test_api.py`): 7/7 pasadas exitosamente (100%).
- Verificación tipada de TypeScript (`npx tsc --noEmit`): 0 errores.

---

## 2. NO IMPLEMENTADO / PLANIFICADO (ROADMAP V3 & V4)

- **Modelo Basado en Agentes (ABM)**: Planificado para V3 (simulación de microsimulación de agentes individuales).
- **Población Sintética Nacional**: Planificado para V3/V4.
- **Validación Causal Definitiva / Grafos Causal DAG**: La V2 utiliza modelos observacionales regresivos; no garantiza inferencia causal contrafactual.
- **Evaluación Clínica Individual**: No aplica en V2 (trabaja a nivel territorial agregados).
- **Despliegue Productivo en Kubernetes / Cloud Cluster**: Planificado para V4.
- **Actualización de Datos en Tiempo Real por IoT/Streaming**: No aplica (datos censales agregados).
