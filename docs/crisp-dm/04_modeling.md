# CRISP-DM Phase 4 — Modeling

## 1. Candidate Models Evaluated
1. **Baseline Mean Regressor**: Dummy model predicting global mean.
2. **Ridge Regularized Linear Regression**: L2 penalized regression with StandardScaler.
3. **Random Forest Regressor**: Ensemble of 100 decision trees (max depth 6).
4. **HistGradientBoosting Regressor**: Gradient boosted trees for tabular features.

## 2. Spatial Cross-Validation Strategy
- **GroupKFold (5 Splits)** based on Neighborhood Clusters.
- Prevents spatial data leakage between contiguous census tracts.
