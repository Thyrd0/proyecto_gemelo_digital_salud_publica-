# Model Card — Urban Food Environment Digital Twin (V2.1)

## Model Details
- **Model Name**: Histogram-based Gradient Boosting Regressor (`HistGradientBoostingRegressor`)
- **Version**: V2.1
- **Framework**: `scikit-learn.ensemble.HistGradientBoostingRegressor`
- **Pipeline Artifacts**:
  - Model: `artifacts/models/winner_model_v2_1.joblib`
  - Metadata: `artifacts/metadata/model_metadata_v2_1.json`
  - Metrics: `artifacts/metrics/cross_validation_metrics_v2_1.json` & `artifacts/metrics/philadelphia_external_evaluation_v2_1.json`

---

## Intended Use
- **Primary Purpose**: Exploratory policy sensitivity simulation at the census tract level in Philadelphia County, PA (FIPS 42101).
- **Intended Users**: Public health researchers, urban planners, epidemiologists, policy analysts.
- **Out of Scope Uses**:
  - Individual clinical diagnosis or patient risk scoring.
  - Causal counterfactual inference for legal or regulatory enforcement.
  - Extrapolation to rural or non-urban territories without retrained calibration.

---

## Training & Validation Data Pipeline (V2.1)
- **Target Variable**: `DIABETES_CrudePrev` (Adult crude diabetes prevalence %) from CDC PLACES 2022 Release.
- **Predictor Features ($X$)**: USDA FARA 2019 features (`PovertyRate`, `MedianFamilyIncome`, `LowIncomeTracts`, `HUNVFlag`, `LILATracts_1And10`, `lapop1share`, etc.) and derived ratios (`no_vehicle_household_share`, `snap_household_share`, `food_retail_proximity_proxy`).
- **Forbidden Predictors Excluded**: `OBESITY_CrudePrev`, `LPA_CrudePrev`, `BPHIGH_CrudePrev`, `CHD_CrudePrev` (strictly excluded to eliminate target leakage).
- **Training Strategy**: Trained on 54,277 national US urban census tracts (`Pop2010 >= 1000`, `Urban == 1`), strictly excluding Philadelphia County (`CountyFIPS == 42101`).
- **Cross-Validation Strategy**: 5-Fold `GroupKFold` grouped by `CountyFIPS` to prevent spatial autocorrelation data leakage across neighboring tracts.
- **External Test Set**: Reserved 369 analysis-eligible Philadelphia census tracts (`Urban == 1`, `Pop2010 >= 1000`) for geographic external evaluation.

---

## Quantitative Metrics (V2.1 Real Data)

### 1. 5-Fold Cross Validation (US Urban Dataset, n = 54,277)

| Candidate Model | CV MAE (p.p.) | CV RMSE (p.p.) | CV R² Score | Status |
|---|---|---|---|---|
| `DummyRegressor` (Baseline) | 2.8371 ± 0.0926 | 3.7847 | -0.0041 | Baseline |
| `Ridge` | 1.8821 ± 0.0513 | 2.5775 | 0.5340 | Candidate |
| `RandomForestRegressor` | 1.7072 ± 0.0455 | 2.3490 | 0.6126 | Candidate |
| **`HistGradientBoostingRegressor`** | **1.6932 ± 0.0394** | **2.3240** | **0.6207** | **Winning Model** |

### 2. External Geographic Evaluation (Philadelphia County, n = 369)

| Evaluation Metric | Value (Percentage Points) |
|---|---|
| **Philadelphia External MAE** | **2.3229 p.p.** |
| **Philadelphia External RMSE** | **3.1613 p.p.** |
| **Philadelphia External R²** | **0.6091** |
| Mean Observed Prevalence | 12.97% |
| Mean Predicted Prevalence | 11.87% |
| Residual Standard Deviation | 2.97 p.p. |

---

## Ethical & Scientific Considerations
- **Ecological Fallacy Caution**: The model operates on aggregated territorial census tract averages. High or low tract prevalence does not dictate individual resident risk.
- **No Causal Guarantee**: Coefficients reflect associative patterns under cross-sectional observational data. Policy interventions represent parametric sensitivity scenarios, not validated causal proofs.
