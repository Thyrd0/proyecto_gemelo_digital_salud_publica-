# CHANGELOG

## [V2.1.0] — 2026-09-04 — Integración Verificable de Datos Públicos Reales

### 🔴 Correcciones Críticas (Fixes)
- **Retiro Total de Datos Sintéticos**: Se eliminó la generación aleatoria (`numpy.random`), GEOIDs secuenciales, fórmulas de prevalencia sintéticas y mapas en cuadrícula de todos los flujos activos de React, FastAPI, Streamlit y el chatbot.
- **Aislamiento de Código Legacy**: Todo el código demostrativo V1 fue archivado en `src/legacy/v1/` y `artifacts/legacy_synthetic_v2/` con documentación histórica explícita.
- **Corrección de Concurrencia JSON**: Se corrigieron las respuestas de la API FastAPI y la conversión de NaNs flotantes en serializaciones JSON.

### 🟢 Novedades y Mejoras (Features)
- **Integración de Tres Fuentes Oficiales Públicas**:
  - CDC PLACES 2022 Release (72,337 tractos censales nacionales, 376 en Philadelphia).
  - USDA Food Access Research Atlas 2019 (72,531 tractos censales nacionales, 381 en Philadelphia).
  - US Census TIGER/Line 2019 Shapefiles (Polígonos censales de Philadelphia en `EPSG:4326`).
- **Pipeline CRISP-DM Reproducible**:
  - Script de auditoría de fuentes (`verify_sources.py`).
  - Procesamiento e integración por GEOID de 11 dígitos (`fetch_real_data.py`, `preprocess.py`).
  - Entrenamiento y evaluación de 4 modelos candidatos con `GroupKFold(5)` por `CountyFIPS` y evaluación externa independiente en Philadelphia (`train_evaluate.py`).
- **Cartografía Vectorial Real**: Mapa territorial dinámico renderizado a partir de polígonos TIGER/Line 2019 sin necesidad de claves de mapa.
- **Workbench Streamlit CRISP-DM**: Panel interno organizado en 10 pestañas metodológicas con auditorías en vivo.
- **Suite de Pruebas Automatizadas**: 16 pruebas Pytest verificando integridad de datos, ausencia de fugas de información, modelos, mapa y endpoints.
