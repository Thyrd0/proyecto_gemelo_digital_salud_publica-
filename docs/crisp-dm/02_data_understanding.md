# CRISP-DM Phase 2 — Data Understanding

## 1. Inventory of Data Sources
- **CDC PLACES (2023 Release)**: Census tract level prevalence of diagnosed diabetes among adults (`DIABETES_CrudePrev`).
- **ACS 5-Year Estimates (2018–2022)**: Population, Median Household Income, Poverty Rate %, Bachelor Degree %, Vehicle Access %.
- **USDA Food Access Research Atlas**: Healthy Food Access Index, Low-Income Low-Access (LILA) indicators.
- **TIGER/Line Boundary Shapefiles**: Official polygon geometries for 384 census tracts in Philadelphia County (FIPS 42101).

## 2. Granularity & Key Alignment
- All records use official 11-digit GEOIDs (`42101xxxxxx`).
- Missing values and duplicate GEOID checks performed in Streamlit data quality workspace.
- Distributions inspected across 8 geographic neighborhood clusters in Philadelphia.
