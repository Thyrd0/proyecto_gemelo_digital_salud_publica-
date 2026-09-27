# CRISP-DM Phase 5 — Evaluation

## 1. Evaluation Results Summary (5-Fold GroupKFold CV)

| Algoritmo | MAE (pp) | RMSE (pp) | R² | Estado |
| --------- | -------- | --------- | -- | ------ |
| **Baseline Mean** | 3.9742 | 4.4303 | -5.8724 | Control Baseline |
| **Ridge Regression** | **0.5057** | **0.6163** | **0.8733** | 🏆 Winning Model |
| **HistGradientBoosting** | 0.6521 | 0.8038 | 0.7825 | Candidate 2 |
| **Random Forest** | 0.6908 | 0.8507 | 0.7557 | Candidate 3 |

## 2. Selection Rationale
Ridge Regression achieved the minimum Mean Absolute Error (`0.5057` percentage points) and highest R² (`0.8733`) across spatial cross-validation folds. It was selected and persisted to `artifacts/models/model.joblib`.
