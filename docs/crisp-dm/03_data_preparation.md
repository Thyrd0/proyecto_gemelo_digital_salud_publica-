# CRISP-DM Phase 3 — Data Preparation

## 1. Preprocessing Pipeline (`ml_pipeline/src/data/preprocess.py`)
- **GEOID Sanitization**: Ensured 11-digit string format starting with FIPS `42101`.
- **Outlier Clipping & Physical Boundaries**:
  - `ingresoMedio`: Clipped between $10,000 and $250,000.
  - `poverty_rate`, `bachelor_degree_pct`, `accesoVehiculo`: Clipped to [0, 100]%.
  - `indiceAccesoSaludable`: Clipped to [0, 100].
  - `prevalenciaDiabetesInicial`: Clipped to [1.0, 99.0]%.
- **Output Artifact**: `data/processed/philadelphia_census_tracts_processed.csv`.
