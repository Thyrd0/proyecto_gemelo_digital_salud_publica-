# PROJECT ROADMAP

## Current Milestone: V2.1 — Real Public Data Integration & TIGER/Line Cartography [COMPLETED]
- [x] Audit raw public files (CDC PLACES 2022, USDA FARA 2019, TIGER/Line 2019).
- [x] Standardize 11-digit GEOIDs and decimal formatting.
- [x] Isolate Philadelphia County as external evaluation set prior to training.
- [x] Train candidate models with 5-Fold GroupKFold by CountyFIPS.
- [x] Generate real TIGER/Line 2019 GeoJSON polygons for Philadelphia.
- [x] Update FastAPI backend endpoints and Streamlit CRISP-DM workbench.
- [x] Connect React frontend to real API & GeoJSON polygon map.
- [x] Execute automated pytest suite (16 tests passed).
- [x] Integrate LangChain Autonomous Copilot Agent with Tool Calling & Scientific RAG.
- [x] Export visual LangFlow schema (`langflow_export.json`) for pipeline visualization.
- [x] Integrate Copilot UI view in React frontend with interactive simulation capabilities.
- [x] Document methodology summary for scientific publication.

---



## Future Milestone: V3 — Multi-City Spatial Expansion & Causal Policy Validation [PLANNED]
- [ ] Operationalize Policy C by integrating spatial point datasets of schools and fast-food venues.
- [ ] Expand external evaluation to additional urban counties (e.g. Allegheny County, PA; Cook County, IL).
- [ ] Integrate longitudinal cohort data for multi-year forecasting if temporal datasets become available.
