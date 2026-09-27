# Streamlit ML Model Training Module

Independent model training and cross-validation workbench for the **Urban Food Environment Digital Twin** project.

## Overview
This application provides an interactive training interface built with Streamlit, pandas, scikit-learn, and Plotly. It executes candidate regressors using 5-Fold `GroupKFold` spatial cross-validation and exports standardized `training_summary.json` artifacts for consumption by the CRISP-DM frontend.

## Quick Start

```powershell
cd streamlit-training
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run app.py --server.port 8501
```

## Features
- Dataset preview, missing value inspection, duplicate check.
- GroupKFold CV by `CountyFIPS` to prevent spatial data leakage.
- Candidate models: Dummy Regressor, Ridge Regression, Random Forest Regressor, HistGradientBoosting Regressor.
- Export of `modelo_entrenado.joblib`, `training_summary.json`, `predicciones.csv`.
- Interactive Plotly figures (Observed vs Predicted scatter plot, Residual distribution, Feature Importances).
