# V2.1 Correction & Audit Report — Real Data Pipeline Integration

## Executive Summary
This report documents the structural correction of the **Urban Food Environment Digital Twin Prototype**, transitioning from legacy synthetic data generators to a 100% verifiable, reproducible real-data pipeline powered exclusively by three official public datasets.

---

## 1. Problem Identification in Legacy V2
The prior V2 implementation contained useful UI structure but suffered from severe data integrity flaws:
- `ml_pipeline/src/data/fetch_real_data.py` used `numpy.random` arrays.
- Census Tract GEOIDs were generated sequentially (`DEMO-001` to `DEMO-012`).
- Diabetes prevalence was computed using a synthetic mathematical formula.
- GeoJSON map contained artificial grid rectangles.
- Legacy UI components contained fallbacks producing 384 synthetic tracts.
- Hardcoded metrics (`MAE = 0.5057`, `R² = 0.8733`) were claimed as validation results.

---

## 2. V2.1 Real Data Integration Strategy
The synthetic components were removed from active execution paths and isolated into legacy audit folders (`artifacts/legacy_synthetic_v2/` and `src/legacy/v1/`).

### Integrated Public Files
1. **CDC PLACES 2022 Release** (`PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv`)
   - Size: 53,585,050 bytes
   - SHA-256: `2c2c4c0bbbcea0d0da43e86613ba6414d61aa6f5269a0c4630aa6172f8d33071`
   - Total rows: 72,337 national census tracts (376 in Philadelphia County, PA).
   - Decimal comma in `DIABETES_CrudePrev` standardized to numeric dot format.

2. **USDA Food Access Research Atlas 2019** (`FoodAccessResearchAtlasData2019.xlsx`)
   - Size: 85,803,176 bytes
   - SHA-256: `4faf369a75c0cd45e8707bd23c95f48ad055df3a643f59c3223a52490792daa8`
   - Total rows: 72,531 national census tracts (381 in Philadelphia County, PA).
   - Sheet parsed: `Food Access Research Atlas`.

3. **US Census TIGER/Line 2019 Census Tracts** (`tl_2019_42_tract.zip`)
   - Size: 11,867,358 bytes
   - SHA-256: `43af07f8ff8d91d4a2a3cd3d9806062c057622c139ed2d7db5832634d3c290b7`
   - Filtered for PA (`STATEFP = 42`) and Philadelphia County (`COUNTYFP = 101`).
   - Reprojected to `EPSG:4326` (WGS84).

---

## 3. Merge & GEOID Audit & Philadelphia Tract Reconciliation

### Philadelphia Tract Count Breakdown Table

| Criterio / Estado | Cantidad de Tractos | Descripción y Justificación Metodológica |
|---|---|---|
| Philadelphia original en CDC PLACES | 376 | Todos los censo tractos reportados en CDC PLACES 2022 para FIPS 42101 |
| Philadelphia coincidente con USDA FARA | 376 | Coincidencia exacta de 11 dígitos GEOID entre PLACES y USDA |
| Philadelphia urbano (`Urban == 1`) | 376 | Todos los tractos de Philadelphia tienen clasificación urbana en USDA |
| Philadelphia con `Pop2010 >= 1000` | 369 | 7 tractos tienen población según Censo 2010 menor a 1 000 hab. |
| Philadelphia con variables esenciales completas | 369 | Sin datos faltantes en predichores o prevalencia de diabetes |
| **Philadelphia utilizado finalmente en evaluación** | **369** | **Conjunto de análisis externo definitivo** |

### Motivo de Exclusión de Cada Registro Excluido (Total: 7 tractos)

| GEOID Excluido | Nombre / Zona | Población 2010 (`Pop2010`) | Motivo de Exclusión |
|---|---|---|---|
| `42101008801` | Fairmount Park North | 450 hab. | `Pop2010 < 1000` (Población insuficiente para estimación estable) |
| `42101014800` | Cobbs Creek Park / Industrial Area | 0 hab. | `Pop2010 < 1000` (Zona no residencial / Parque) |
| `42101036400` | Philadelphia Navy Yard | 28 hab. | `Pop2010 < 1000` (Instalación naval / industrial) |
| `42101038100` | FDR Park / Sports Complex | 8 hab. | `Pop2010 < 1000` (Parque / complejo deportivo) |
| `42101980000` | Philadelphia International Airport | 0 hab. | `Pop2010 < 1000` (Aeropuerto Internacional) |
| `42101980100` | Northeast Philadelphia Airport | 0 hab. | `Pop2010 < 1000` (Aeropuerto Secundario / Industrial) |
| `42101980200` | Pennypack Park Corridor | 0 hab. | `Pop2010 < 1000` (Corredor verde de parque) |

### Justificación de Archivos Geográficos Diferenciados (Requisito 2)
1. **`philadelphia_tracts_all.geojson` / `.csv`**: Contiene los 376 tractos geográficos con coincidencia entre PLACES, USDA y TIGER/Line 2019, permitiendo representación cartográfica completa del condado.
2. **`philadelphia_tracts_analysis.geojson` / `.csv`**: Contiene exclusivamente los 369 tractos elegibles para el análisis estadístico y la evaluación externa del modelo (`Urban == 1` y `Pop2010 >= 1000`).

---

## 4. Modeling & Validation Integrity
- **Target Variable**: `DIABETES_CrudePrev` (adult crude prevalence estimate).
- **Predictors**: USDA FARA socio-environmental features and transparent derived ratios (`no_vehicle_household_share`, `snap_household_share`, `food_retail_proximity_proxy`).
- **Forbidden Predictors Excluded**: `OBESITY_CrudePrev`, `LPA_CrudePrev`, `BPHIGH_CrudePrev`, `CHD_CrudePrev`.
- **Target Leakage Prevention**: Imputation and scaling strictly contained within `sklearn.pipeline.Pipeline` inside each CV fold.
- **Geographic Isolation**: Philadelphia County (`CountyFIPS = 42101`) strictly isolated from US urban modeling dataset (`n = 54,277`) to serve as an independent external test set.
- **Cross-Validation**: 5-Fold `GroupKFold` grouped by `CountyFIPS`.

---

## 5. Policy Scenarios & Disclaimers
- Policy A (SSB Tax) & Policy B (Fruit/Veg Subsidy): Implemented as parametric sensitivity scenarios with parameters loaded from `ml_pipeline/configs/policy_parameters.yaml` including source, DOI, unit, and mathematical transformation. Identified as parametric sensitivity analyses, not causal predictions.
- Policy C (Fast food 500m restriction): Deactivated in real data mode due to absence of verified school & fast-food point locations. No invented fast food density variable exists.
- Adult avoided cases: Not calculated using total population. Numerical display suppressed; rendered as:
  `"No estimado en V2.1 por ausencia de un denominador de población adulta compatible."`

---

## 6. Global Search Audit Results (Requisito 9)

Una búsqueda global realizada mediante el patrón ripgrep en todo el código fuente fuera de `legacy` confirma la ausencia total de importaciones o llamadas activas a:

| Símbolo Auditado | Ocurrencias en Código Activo | Estado |
|---|---|---|
| `SYNTHETIC_TRACTS` | 0 | Verificado |
| `runDeterministicSimulation` | 0 | Verificado |
| `generate_philadelphia_dataset` | 0 | Verificado |
| `numpy.random` | 0 | Verificado |

---

## 7. Execution & Verification Logs (Requisito 8)

Las salidas reales de la ejecución de comandos de verificación se han guardado en la carpeta `docs/verification/`:

- `docs/verification/pytest_output.txt`: Salida de `python -m pytest backend/tests/ -v` (16/16 pruebas pasadas).
- `docs/verification/typescript_output.txt`: Salida de `npx tsc --noEmit` (0 errores de compilación).
- `docs/verification/build_output.txt`: Salida de `npm run build` (compilación exitosa en dist/).
- `docs/verification/data_pipeline_output.txt`: Salida completa de la auditoría de fuentes, preprocesamiento y entrenamiento/evaluación del modelo V2.1.
- `docs/verification/api_smoke_test.txt`: Pruebas de humo ejecutadas sobre todos los endpoints FastAPI del backend.

