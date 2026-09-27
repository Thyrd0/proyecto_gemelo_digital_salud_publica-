# V2.1 Final Verification & Audit Report — Real Data Pipeline Integration

Date & Time: **2026-09-04T22:26:45-05:00**  
Project: **Urban Food Environment Digital Twin Prototype**  
Scope: **V2.1 Verification, Real Data Pipeline Audit, Cartography, and ZIP Packaging**  
Status: **100% Verified & Passed (Exit Code 0)**

---

## 1. System Environment & Core Component Versions

- **Python Version**: `Python 3.13.13` (win32 x64)
- **Node.js / npm Version**: `Node.js v20.x` / `npm 10.x`
- **Core Dependencies**:
  - `fastapi` == 0.115.x
  - `scikit-learn` == 1.6.x
  - `geopandas` == 1.0.x / `shapely` == 2.0.x
  - `pandas` == 2.2.x / `numpy` == 2.2.x
  - `react` == 18.3.1 / `typescript` == 5.5.3 / `vite` == 5.4.19 / `three` == 0.168.0

---

## 2. Test Execution & Build Verification Suite

| Command Executed | Timestamp | Exit Code | Result Summary | Passed / Failed |
|---|---|---|---|---|
| `python -m pytest backend/tests/ -v` | 2026-09-04T22:26:02 | **0** | All FastAPI endpoints & V2.1 data integrity tests passed | **16 Passed / 0 Failed** |
| `npx tsc --noEmit` | 2026-09-04T22:26:22 | **0** | Clean TypeScript type check across React components | **0 Errors** |
| `npm run build` | 2026-09-04T22:26:24 | **0** | Vite production bundle generated successfully in `dist/` | **Built in 13.7s** |
| `python ml_pipeline/.../train_evaluate.py` | 2026-09-04T22:26:38 | **0** | Source audit, data preprocessing & model retraining clean | **Pipeline Code 0** |
| `python scratch/run_strict_smoke_test.py` | 2026-09-04T22:26:45 | **0** | All 10 FastAPI endpoints validated with strict assertions | **10 Endpoints Passed** |

---

## 3. Strict FastAPI Endpoints Smoke Test Status

| Endpoint Path | Method | HTTP Status | Validation Checks & Content Assertions | Result |
|---|---|---|---|---|
| `/health` | GET | `200 OK` | `status == 'ok'`, `model_loaded == True`, `version == '2.1.0'` | **PASS** |
| `/api/v1/data/status` | GET | `200 OK` | `fips == '42101'`, `total_tracts == 369`, 3 official public files verified | **PASS** |
| `/api/v1/data/quality` | GET | `200 OK` | `philadelphia_all_count == 376`, `philadelphia_analysis_count == 369`, `excluded == 7` | **PASS** |
| `/api/v1/model/info` | GET | `200 OK` | Algorithm is `HistGradientBoostingRegressor`, V2.1 metadata present | **PASS** |
| `/api/v1/model/evaluation` | GET | `200 OK` | 5-Fold `GroupKFold` metrics and Philly external metrics present | **PASS** |
| `/api/v1/tracts` | GET | `200 OK` | `count == 369`, all tracts have valid 11-digit GEOID starting with `42101` | **PASS** |
| `/api/v1/map/philadelphia` | GET | `200 OK` | `FeatureCollection` with 369 GeoJSON polygon features (`EPSG:4326`) | **PASS** |
| `/api/v1/simulate` | POST | `200 OK` | Initial prevalence `12.97%`, projected prevalence `12.08%`, no NaN/Inf, disclaimer present | **PASS** |
| `/api/v1/scenarios/policies` | GET | `200 OK` | Policy A & B active, Policy C status `deactivated_in_v2_1` | **PASS** |
| `/api/v1/chat` | POST | `200 OK` | Non-empty scientific response returned from local rules / Gemini service | **PASS** |

---

## 4. Definitive Public Dataset Sources, Sizes & SHA-256 Hashes

| Dataset Name | Source Institution | File Name | Size (Bytes) | SHA-256 Checksum |
|---|---|---|---|---|
| **CDC PLACES 2022** | CDC | `PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv` | 53,585,050 | `2c2c4c0bbbcea0d0da43e86613ba6414d61aa6f5269a0c4630aa6172f8d33071` |
| **USDA FARA 2019** | USDA ERS | `FoodAccessResearchAtlasData2019.xlsx` | 85,803,176 | `4faf369a75c0cd45e8707bd23c95f48ad055df3a643f59c3223a52490792daa8` |
| **TIGER/Line 2019** | US Census | `tl_2019_42_tract.zip` | 11,867,358 | `43af07f8ff8d91d4a2a3cd3d9806062c057622c139ed2d7db5832634d3c290b7` |

---

## 5. Definitive Data Pipeline & Tract Reconciliation Counts

1. **CDC PLACES Philadelphia Tracts**: 376 census tracts.
2. **USDA FARA Philadelphia Tracts**: 381 tracts (376 matched census tracts + 5 unpopulated non-census tracts).
3. **TIGER/Line 2019 Shapefile Polygons**: 384 polygons for FIPS 42101.
4. **Final 11-Digit GEOID Matches**: 376 matched census tracts.
5. **Pop2010 Filter (`Pop2010 >= 1000`)**: 376 -> **369 analysis-eligible tracts** (7 tracts excluded due to non-residential population < 1,000 hab.: `42101008801`, `42101014800`, `42101036400`, `42101038100`, `42101980000`, `42101980100`, `42101980200`).
6. **National US Urban Training Set**: 54,277 tracts (`Urban == 1`, `Pop2010 >= 1000`, excluding Philadelphia County).
7. **Philadelphia External Test Set**: 369 analysis tracts.
8. **UI Display & Mapping**: 369 tracts for interactive simulations (`philadelphia_tracts_analysis.geojson`); 376 tracts for full county cartography (`philadelphia_tracts_all.geojson`).

---

## 6. Winning Model Metrics (V2.1 Real Data)

- **Selected Algorithm**: `HistGradientBoostingRegressor`
- **5-Fold Cross Validation (US Urban Dataset, n = 54,277)**:
  - **CV MAE**: `1.6932 ± 0.0394` percentage points
  - **CV RMSE**: `2.3240` percentage points
  - **CV R² Score**: `0.6207`
- **Philadelphia External Geographic Evaluation (n = 369)**:
  - **External MAE**: `2.3229` percentage points
  - **External RMSE**: `3.1613` percentage points
  - **External R² Score**: `0.6091`

---

## 7. Synthetic Data Audit Results

A deep codebase scan across `src/`, `backend/`, `ml_pipeline/`, `research_app/` (excluding `legacy/` folders) confirmed 0 active references to:
- `DEMO-`: 0 matches in active code
- `numpy.random`: 0 matches in active code
- `0.5057 / 0.8733` legacy metrics: 0 matches in active code
- `SYNTHETIC_TRACTS` / `runDeterministicSimulation`: 0 matches in active code
- Output recorded in `docs/verification/synthetic_data_audit.txt` (Result: **PASSED**).

---

## 8. Scientific Limitations & Policy Operationalization

- **CDC PLACES Data Nature**: Provides model-based small-area estimates at the census tract level, not individual clinical health records.
- **Associative Model**: Model predicts territorial prevalence; it does not prove causal mechanics.
- **Policy Scenarios A & B**: Parametric sensitivity scenarios conditioned on published price elasticities (-1.21 for SSB tax, -0.7 for produce subsidy).
- **Policy C Status**: Deactivated in V2.1 due to absence of verified school & fast-food point locations in the 3 official public datasets.
- **Avoided Cases Display**: Avoided adult cases numerical multiplication suppressed due to lack of an adult population denominator; rendered with qualified disclaimer notice.
- **Permanent Scientific Disclaimer**: Retained in Spanish and English across all UI views and API responses.

---

## 9. Operational vs. Non-Operational Functions

- **Operational Functions**:
  - Full React UI Dashboard, 3D Canvas, Leaflet Vector GeoJSON Map, Scenario Simulator, Policy Comparator.
  - Streamlit 10-Tab CRISP-DM Workbench with interactive source auditing tool.
  - FastAPI Backend REST API (`/health`, `/data/status`, `/data/quality`, `/model/info`, `/model/evaluation`, `/tracts`, `/map/philadelphia`, `/simulate`, `/scenarios/policies`, `/chat`).
  - Chatbot with local scientific fallback and optional Gemini integration.
- **Non-Operational Functions**:
  - Policy C (Fast food buffer restriction) is deactivated in real data mode.

---

## 10. List of Modified Files in V2.1

- `ml_pipeline/src/data/verify_sources.py`
- `ml_pipeline/src/data/fetch_real_data.py`
- `ml_pipeline/src/data/preprocess.py`
- `ml_pipeline/src/models/train_evaluate.py`
- `ml_pipeline/configs/policy_parameters.yaml`
- `backend/app/main.py`
- `backend/app/services/predictor.py`
- `backend/app/services/chatbot.py`
- `backend/tests/test_api.py`
- `backend/tests/test_v2_1_integrity.py`
- `research_app/streamlit_app.py`
- `src/App.tsx`
- `src/components/map/CensusTractGeoMap.tsx`
- `src/components/map/Territory3DCanvas.tsx`
- `src/components/common/ChatbotWidget.tsx`
- `src/data/poiData.ts`
- `src/services/apiClient.ts`
- `src/services/exportService.ts`
- `src/services/simulationEngine.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/SimulatorPage.tsx`
- `src/pages/Simulator3DPage.tsx`
- `data/manifests/data_manifest_v2_1.json`
- `data/external/README.md`
- `docs/V2_1_CORRECTION_REPORT.md`
- `docs/V2_1_TECHNICAL_SUMMARY.md`
- `docs/DATA_SOURCES.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_CARD.md`
- `docs/verification/FINAL_VERIFICATION_REPORT.md`

---

## 11. Confirmation

**No advances to V3 were made.** The work performed is strictly contained within **V2.1 — Verifiable Public Data Integration**.
