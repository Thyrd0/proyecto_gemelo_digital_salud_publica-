# Official Public Data Sources Inventory — V2.1 Real Data Pipeline

Territory: **Philadelphia County, Pennsylvania — FIPS Code 42101**  
Granularity: **Census Tract Level**  
Pipeline Version: **V2.1**  
Audit Date: **2026-09-04**

---

## 1. Integrated Sources Table

| Dataset | Provider / Source | File Name | Size (Bytes) | SHA-256 Checksum | National Rows | Philly Count | Primary Variables Used |
|---|---|---|---|---|---|---|---|
| **CDC PLACES (2022 Release)** | Centers for Disease Control and Prevention (CDC) | `PLACES__Census_Tract_Data_(GIS_Friendly_Format),_2022_release_20260904.csv` | 53,585,050 | `2c2c4c0bbbcea0d0da43e86613ba6414d61aa6f5269a0c4630aa6172f8d33071` | 72,337 | 376 | `DIABETES_CrudePrev` (Adult crude prevalence %) |
| **USDA FARA (2019 Data)** | USDA Economic Research Service (ERS) | `FoodAccessResearchAtlasData2019.xlsx` | 85,803,176 | `4faf369a75c0cd45e8707bd23c95f48ad055df3a643f59c3223a52490792daa8` | 72,531 | 381 | `Urban`, `Pop2010`, `PovertyRate`, `MedianFamilyIncome`, `lapop1`, `hunvflag`, `OHU2010`, `HUNV1` |
| **TIGER/Line (2019 PA)** | U.S. Census Bureau | `tl_2019_42_tract.zip` | 11,867,358 | `43af07f8ff8d91d4a2a3cd3d9806062c057622c139ed2d7db5832634d3c290b7` | 3,218 (PA) | 384 (Polygons) | Census Tract Boundaries, Coordinates, WGS84 Geometries |

---

## 2. Definitive Tract Reconciliation Audit

| Audit Point | Metric / State | Quantity | Description & Methodological Rationale |
|---|---|---|---|
| 1 | Philadelphia in CDC PLACES | 376 | Total census tracts in Philadelphia County (FIPS 42101) reported in PLACES 2022. |
| 2 | Philadelphia in USDA FARA | 381 | Total tracts in USDA Atlas for FIPS 42101 (includes 5 unpopulated non-census tracts). |
| 3 | Polygons in TIGER/Line 2019 | 384 | Raw boundary shapefiles for FIPS 42101 (includes water/coastal sub-geometries). |
| 4 | Final GEOID Matched Tracts | 376 | Exact 11-digit GEOID matches (`42101xxxxxx`) present in both PLACES and USDA. |
| 5 | Filter `Pop2010 >= 1000` | 376 -> 369 | 7 tracts excluded due to Census 2010 population < 1,000 hab. (parks, airports, industrial zones). |
| 6 | US Urban Training Dataset | 54,277 | National US urban tracts (`Pop2010 >= 1000`, `Urban == 1`) excluding Philadelphia County. |
| 7 | External Evaluation Dataset | 369 | Philadelphia analysis-eligible tracts evaluated externally against winning model. |
| 8 | UI Display (React / Streamlit) | 369 / 376 | 369 tracts used for interactive simulations & evaluation; 376 available for full county mapping (`philadelphia_tracts_all.geojson`). |

---

## 3. Excluded Tracts Detail (7 Tracts)

| Excluded GEOID | Name / Area | Pop2010 | Reason for Exclusion |
|---|---|---|---|
| `42101008801` | Fairmount Park North | 450 | `Pop2010 < 1000` (Insufficient population for stable rate) |
| `42101014800` | Cobbs Creek Park / Industrial | 0 | `Pop2010 < 1000` (Non-residential park zone) |
| `42101036400` | Philadelphia Navy Yard | 28 | `Pop2010 < 1000` (Naval yard / industrial complex) |
| `42101038100` | FDR Park / Sports Complex | 8 | `Pop2010 < 1000` (Park / sports arena complex) |
| `42101980000` | Philadelphia Intl. Airport | 0 | `Pop2010 < 1000` (International Airport) |
| `42101980100` | Northeast Philly Airport | 0 | `Pop2010 < 1000` (Secondary Airport / industrial) |
| `42101980200` | Pennypack Park Corridor | 0 | `Pop2010 < 1000` (Natural park corridor) |
