# Urban Food Environment Digital Twin Prototype (V2.1)

**Integración Verificable de Datos Públicos Reales, Entrenamiento Reproducible y Cartografía TIGER/Line**

---

## 📌 Resumen del Proyecto V2.1
El **Urban Food Environment Digital Twin** es un prototipo interactivo de investigación y ciencia de datos aplicados a la salud pública urbana. Utiliza exclusivamente tres datasets oficiales públicos para analizar la prevalencia territorial estimada de diabetes mellitus en adultos y su asociación con variables de acceso alimentario y vulnerabilidad socioeconómica.

---

## 📊 Fuentes de Datos Públicos Integradas
1. **CDC PLACES 2022 Release** (`PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv`)
   - SHA-256: `2c2c4c0bbbcea0d0da43e86613ba6414d61aa6f5269a0c4630aa6172f8d33071`
   - 72,337 tractos censales nacionales (376 en el Condado de Philadelphia, PA).
2. **USDA Food Access Research Atlas 2019** (`FoodAccessResearchAtlasData2019.xlsx`)
   - SHA-256: `4faf369a75c0cd45e8707bd23c95f48ad055df3a643f59c3223a52490792daa8`
   - 72,531 tractos censales nacionales (381 en el Condado de Philadelphia, PA).
3. **US Census TIGER/Line 2019 Census Tracts** (`tl_2019_42_tract.zip`)
   - SHA-256: `43af07f8ff8d91d4a2a3cd3d9806062c057622c139ed2d7db5832634d3c290b7`
   - Polígonos de tractos censales oficiales de Pennsylvania (`STATEFP = 42`, `COUNTYFP = 101`).

---

## 🛠️ Resultados del Entrenamiento V2.1
- **Conjunto de Entrenamiento**: 54,277 tractos urbanos de EE. UU. (Excluyendo el Condado de Philadelphia).
- **Validación Cruzada**: 5-Fold `GroupKFold` agrupado por `CountyFIPS`.
- **Modelo Ganador**: `HistGradientBoostingRegressor`
  - Cross-Validation MAE: **1.6932 p.p.** (Desviación estándar: ±0.0394 p.p., R²: 0.6207).
- **Evaluación Externa en Philadelphia** (376 tractos censales):
  - Philadelphia External MAE: **2.3830 p.p.** (RMSE: 3.2560 p.p., R²: 0.5964).

---

## 🚀 Guía de Ejecución Local

### Requisitos Previos
- Python 3.11+
- Node.js 18+

### 1. Pipeline de Datos y Machine Learning
```bash
python ml_pipeline/src/data/verify_sources.py
python ml_pipeline/src/data/fetch_real_data.py
python ml_pipeline/src/data/preprocess.py
python ml_pipeline/src/models/train_evaluate.py
```

### 2. Ejecutar Pruebas Automatizadas
```bash
python -m pytest
```

### 3. Iniciar Servicios

#### FastAPI Backend (Puerto 8000)
```bash
uvicorn backend.app.main:app --port 8000 --reload
```

#### Streamlit Workbench CRISP-DM (Puerto 8501)
```bash
streamlit run research_app/streamlit_app.py
```

#### React Frontend App (Puerto 5173 / 3000)
```bash
npm install
npx tsc --noEmit
npm run dev
```

---

## ⚠️ Advertencia Científica
> **Prototipo académico basado en datos públicos agregados. CDC PLACES proporciona estimaciones territoriales basadas en modelos. Los resultados predictivos representan asociaciones y los escenarios de política dependen de supuestos explícitos. No tienen validez clínica, no demuestran causalidad y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública.**
