# V2.1 Technical Summary — Materials & Methods Reference

## 1. Version & System Architecture
- **Version**: V2.1 — Verifiable Public Data Integration & TIGER/Line Cartography
- **Architecture**:
  - **Backend**: FastAPI (Python 3.11/3.13, Uvicorn)
  - **Machine Learning**: Scikit-Learn (Pipelines, GroupKFold, Joblib)
  - **GIS / Spatial**: GeoPandas, Shapely, PyOGRIO (EPSG:4326)
  - **Research Workbench**: Streamlit (10 CRISP-DM Tabs)
  - **Frontend**: React 18, TypeScript 5, Vite, WebGL 3D, Leaflet / SVG Polygons

---

## 2. Public Data Sources & Cryptographic Audit
| Source Dataset | File Name | Size (Bytes) | SHA-256 Checksum | Temporal Period |
| :--- | :--- | :--- | :--- | :--- |
| **CDC PLACES 2022** | `PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv` | 53,585,050 | `2c2c4c0bbbcea0d0da43e86613ba6414d61aa6f5269a0c4630aa6172f8d33071` | 2020 Model Estimates (2022 Release) |
| **USDA FARA 2019** | `FoodAccessResearchAtlasData2019.xlsx` | 85,803,176 | `4faf369a75c0cd45e8707bd23c95f48ad055df3a643f59c3223a52490792daa8` | 2019 Census Tract Data |
| **US Census TIGER/Line 2019** | `tl_2019_42_tract.zip` | 11,867,358 | `43af07f8ff8d91d4a2a3cd3d9806062c057622c139ed2d7db5832634d3c290b7` | 2019 Boundaries (PA Code 42) |

---

## 3. Data Integration & Definitive 8-Point Tract Audit
- **Canonical GEOID**: 11-digit text string (`normalize_tract_geoid`).

| Audit Point | Metric / State | Quantity | Methodological Rationale |
|---|---|---|---|
| 1 | Philadelphia in CDC PLACES | 376 | Total census tracts in Philadelphia County (FIPS 42101) in PLACES 2022. |
| 2 | Philadelphia in USDA FARA | 381 | Total tracts in USDA Atlas for FIPS 42101 (includes 5 unpopulated non-census tracts). |
| 3 | Polygons in TIGER/Line 2019 | 384 | Raw boundary shapefiles for FIPS 42101 (includes water sub-geometries). |
| 4 | Final GEOID Matched Tracts | 376 | Exact 11-digit GEOID matches (`42101xxxxxx`) present in both PLACES and USDA. |
| 5 | Filter `Pop2010 >= 1000` | 376 -> 369 | 7 tracts excluded due to Census 2010 population < 1,000 hab. (parks, airports, industrial zones). |
| 6 | US Urban Training Dataset | 54,277 | National US urban tracts (`Pop2010 >= 1000`, `Urban == 1`) excluding Philadelphia County. |
| 7 | External Evaluation Dataset | 369 | Reserved Philadelphia analysis-eligible tracts evaluated against winning model. |
| 8 | UI Display (React / Streamlit) | 369 / 376 | 369 tracts used for interactive simulations & evaluation; 376 available for full county mapping (`philadelphia_tracts_all.geojson`). |

---

## 4. Dataset Partitioning & Data Leakage Prevention
- **Selection Criteria for Modeling**: `Urban == 1`, `Pop2010 >= 1000`, valid `DIABETES_CrudePrev`, valid 11-digit GEOID.
- **US Urban Modeling Dataset**: 54,277 census tracts (Excludes Philadelphia County `CountyFIPS == 42101`).
- **External Evaluation Dataset**: 369 census tracts in Philadelphia County, PA.
- **Data Leakage Safeguards**: All imputer and scaler transformations fit exclusively within `sklearn.pipeline.Pipeline` inside cross-validation folds. Target variable `diabetes_crude_prevalence` excluded from predictor set. Other PLACES health outcomes (`OBESITY_CrudePrev`, `LPA_CrudePrev`, `BPHIGH_CrudePrev`, `CHD_CrudePrev`) excluded.

---

## 5. Model Candidate Comparison & Validation Strategy
- **Validation Strategy**: 5-Fold `GroupKFold` grouped by `CountyFIPS` on US urban modeling dataset.
- **Primary Metric**: Mean Absolute Error (MAE).
- **Candidates Evaluated**:
  1. `DummyRegressor(strategy="mean")`
  2. `Ridge(alpha=10.0)`
  3. `RandomForestRegressor(n_estimators=100, max_depth=12)`
  4. `HistGradientBoostingRegressor(max_iter=100, max_depth=8)`

---

## 6. Real GIS Cartography
- **Generated GeoJSON**: `data/processed/philadelphia_tracts_analysis.geojson` (376 polygon features in `EPSG:4326`).
- **Frontend Map**: Renders exact TIGER/Line 2019 polygon vector boundaries with interactive tooltips showing observed prevalence, model prediction, error, poverty rate, median family income, and healthy food proximity proxy.

---

## 7. Policy Operationalization Status
- **Policy A (SSB Tax)**: Active exploratory sensitivity scenario based on price elasticity (-1.21).
- **Policy B (Produce Subsidy)**: Active exploratory sensitivity scenario modulating food retail proximity proxy.
- **Policy C (Fast Food 500m Buffer)**: Deactivated in V2.1 with informative UI notice (`"Esta política requiere ubicaciones verificadas de escuelas y establecimientos de comida rápida. No se encuentra operacionalizada con los tres datasets de V2.1."`).
- **Adult Avoided Cases**: Not calculated using total population. Accompanied by qualified disclaimer notice.

---

## 8. Scientific Disclaimer
> **Prototipo académico basado en datos públicos agregados. CDC PLACES proporciona estimaciones territoriales basadas en modelos. Los resultados predictivos representan asociaciones y los escenarios de política dependen de supuestos explícitos. No tienen validez clínica, no demuestran causalidad y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública.**
