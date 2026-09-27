# CRISP-DM Phase 6 — Deployment

## 1. Deployment Artifacts Persisted
- `artifacts/models/model.joblib`: Serialized Ridge model pipeline.
- `artifacts/metadata/model_metadata.json`: Model version, training parameters, MAE metrics.
- `artifacts/metadata/feature_schema.json`: Schema definition for features and target.
- `artifacts/metrics/evaluation_metrics.json`: Cross-validation scores for all candidate models.

## 2. API Serving (FastAPI Backend)
- Microservice loaded in memory once at startup via `predictor_service`.
- Serving endpoints:
  - `GET /health`
  - `GET /api/v1/data/status`
  - `GET /api/v1/model/info`
  - `GET /api/v1/tracts`
  - `GET /api/v1/tracts/{geoid}`
  - `POST /api/v1/simulate`
  - `POST /api/v1/chat`

## 3. Frontend Integration (React + Vite)
- Connected to FastAPI at `http://localhost:8000`.
- Renders real Philadelphia County Census Tract maps, policy scenarios, and mandatory scientific disclaimer.
