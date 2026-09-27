# CRISP-DM Phase 1 — Business & Public Health Understanding (V2.1)

## 1. Public Health Problem Statement
In urban areas like Philadelphia County, PA (FIPS 42101), spatial disparities in food access, vehicle availability, and socioeconomic vulnerability correlate with adult crude diabetes prevalence across census tracts. Local decision-makers need a data-driven digital twin prototype to explore spatial associations and potential impacts of food environment policy scenarios.

## 2. Intended Users & Decision Support Scope
- **Users**: Urban health planners, public health researchers, municipal epidemiologists.
- **Decision Support Scope**: Evaluating relative projected shifts under exploratory policy scenarios:
  1. Sugar-Sweetened Beverage (SSB) Tax Scenario (Policy A).
  2. Fruit and Vegetable Retail Subsidy Scenario (Policy B).
  3. Fast Food Store Buffer Zone around schools (Policy C — Deactivated in V2.1 due to absence of verified school/outlet point coordinates).

## 3. Technical & Scientific Success Criteria
- **Technical**: 100% reproducible Python ML pipeline using real public files (CDC PLACES 2022, USDA FARA 2019, TIGER/Line 2019), GroupKFold cross-validation, FastAPI backend, Streamlit CRISP-DM workbench, and React vector polygon GIS.
- **Scientific**: Grounded policy elasticities backed by peer-reviewed literature with explicit disclaimers: associative model, no direct causality claimed, adult crude prevalence estimates from CDC PLACES 2022.
