# Data Dictionary — Urban Food Environment Digital Twin (V2.1 Real Data Pipeline)

Territory: **Philadelphia County, Pennsylvania (FIPS 42101)**  
Level of Aggregation: **Census Tract Level**  
Pipeline Version: **V2.1**

---

## 1. Primary Feature Matrix Dictionary

| Variable Name | Data Type | Range / Unit | Description & Terminology | Official Source | Role in ML Pipeline |
|---|---|---|---|---|---|
| `GEOID` | String | 11 digits (`42101xxxxxx`) | Canonical FIPS Census Tract Unique Identifier | US Census Bureau / TIGER Line 2019 | Primary Key / Spatial Join |
| `Urban` | Integer | `1` (Urban) / `0` (Rural) | USDA Urban classification flag (`Urban == 1` required for inclusion) | USDA FARA 2019 | Eligibility Filter |
| `Pop2010` | Integer | 1,000 – 10,500 hab | Total Census 2010 tract population (`Pop2010 >= 1000` filter) | USDA FARA 2019 / US Census | Filtering / Population Context |
| `PovertyRate` | Float | 0.0% – 65.0% | Percentage of tract population living below poverty line | USDA FARA 2019 | Predictor Feature ($X_1$) |
| `MedianFamilyIncome` | Float | $12,000 – $145,000 USD | **Ingreso familiar mediano** (Mediano por hogar/familia) | USDA FARA 2019 | Predictor Feature ($X_2$) |
| `no_vehicle_household_share` | Float | 0.0 – 1.0 (Ratio) | Share of housing units without access to a vehicle (`HUNV1 / OHU2010`) | USDA FARA 2019 (Derived) | Predictor Feature ($X_3$) |
| `snap_household_share` | Float | 0.0 – 1.0 (Ratio) | Share of housing units receiving SNAP benefits (`TractSNAP / OHU2010`) | USDA FARA 2019 (Derived) | Predictor Feature ($X_4$) |
| `food_retail_proximity_proxy` | Float | 0.0 – 1.0 (Ratio) | **Proxy de proximidad a grandes comercios de alimentos** (`1.0 - lapop1share`). Measures spatial proximity to supermarkets. Not an official USDA metric. | USDA FARA 2019 (Derived) | Predictor Feature ($X_5$) / Modified by Policy B |
| `DIABETES_CrudePrev` | Float | 3.5% – 24.5% | Crude prevalence of diagnosed diabetes among adults (%) | CDC PLACES 2022 Release | Target Variable ($Y$) |

---

## 2. Forbidden Health Outcomes (Excluded from Predictors)

| Excluded Health Outcome | Reason for Exclusion |
|---|---|
| `OBESITY_CrudePrev` | Excluded to prevent direct target leakage and collinearity with chronic metabolic conditions. |
| `LPA_CrudePrev` | Excluded to prevent target leakage (lack of physical activity). |
| `BPHIGH_CrudePrev` | Excluded to prevent target leakage (high blood pressure). |
| `CHD_CrudePrev` | Excluded to prevent target leakage (coronary heart disease). |

---

## 3. Non-Operationalized / Deactivated Variables

| Variable / Scenario | Status in V2.1 | Reason for Status |
|---|---|---|
| `fast_food_density` / `densidadComidaRapida` | **Deactivated / Non-existent** | No verified point locations for fast food establishments or school boundaries in the 3 official datasets. |
| Policy C (`RESTRICT_500M`) | **Deactivated** | Policy C is disabled in real mode to maintain scientific integrity. |
