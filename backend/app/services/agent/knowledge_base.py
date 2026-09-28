"""
Knowledge Base and Vector / Semantic Retrieval Engine for the Urban Food Environment Digital Twin.
Contains indexed scientific literature, methodological frameworks, and policy parameters.
"""
from typing import List, Dict, Any

SCIENTIFIC_LITERATURE = [
    {
        "id": "powell_2013",
        "title": "Assessing the Potential Effectiveness of Sugar-Sweetened Beverage Taxes",
        "authors": "Powell, L. M., Chriqui, J. F., Khan, T., Wada, R., & Chaloupka, F. J. (2013)",
        "source": "American Journal of Public Health",
        "topic": "Sugar-Sweetened Beverage (SSB) Tax & Elasticity",
        "key_findings": "Found a mean price elasticity of demand for sugar-sweetened beverages of -1.21. A 20% price increase leads to an estimated 24% reduction in consumption, translating over a 5-year horizon into a reduction in dietary energy intake and subsequent reduction in obesity and diabetes risk.",
        "parameters": {"price_elasticity": -1.21, "recommended_tax_rate": 0.20, "time_horizon_years": 5}
    },
    {
        "id": "afshin_2017",
        "title": "The Economic and Health Impact of Food Pricing Interventions",
        "authors": "Afshin, A., Peñalvo, J. L., Del Gobbo, L., et al. (2017)",
        "source": "BMJ Open",
        "topic": "Fruit and Vegetable Subsidies & Healthy Food Access",
        "key_findings": "A 10% to 30% price reduction (subsidy) on fresh fruits and vegetables increases consumption by 14% to 21% (elasticity: -0.70). This dietary shift improves glycemic control and reduces diabetes incidence across low-income census tracts with high LILA (Low-Income Low-Access) index.",
        "parameters": {"price_elasticity": -0.70, "recommended_subsidy_rate": 0.30, "target_population": "Low Income Low Access"}
    },
    {
        "id": "currie_2010",
        "title": "The Effect of Fast Food Restaurants on Obesity and Weight Gain",
        "authors": "Currie, J., DellaVigna, S., Moretti, E., & Pathania, V. (2010)",
        "source": "American Economic Journal: Economic Policy",
        "topic": "Urban Fast Food Zoning Restrictions & School Proximity",
        "key_findings": "The presence of a fast-food restaurant within a 0.1 mile (approx. 150m) to 0.5 mile (approx. 800m) buffer around schools increases the probability of obesity among adolescents and nearby adults by 5.2%. Implementing zoning buffers (e.g., 500 meters) moderates the obesogenic food retail proxy.",
        "parameters": {"buffer_radius_meters": 500, "obesity_risk_reduction_pct": 5.2}
    },
    {
        "id": "cdc_places_2022",
        "title": "CDC PLACES: Local Data for Better Health (Census Tract Estimates)",
        "authors": "Centers for Disease Control and Prevention (CDC, 2022/2023 Release)",
        "source": "CDC Division of Population Health",
        "topic": "Prevalence Estimation Methodology & Limitations",
        "key_findings": "PLACES uses small area estimation (SAE) methods combining Behavioral Risk Factor Surveillance System (BRFSS) survey data with Census demographic profiles. Estimates are model-based crude prevalences representing territorial associations, not clinical diagnoses.",
        "parameters": {"geographic_unit": "Census Tract (GEOID 11-digit)", "target_measure": "DIABETES_CrudePrev"}
    },
    {
        "id": "crispdm_methodology",
        "title": "CRISP-DM Standard Framework for Urban Digital Twins",
        "authors": "Chapman, P., Clinton, J., Kerber, R., et al. (2000)",
        "source": "CRISP-DM Consortium",
        "topic": "Six-Phase Lifecycle and Scientific Limitations",
        "key_findings": "CRISP-DM structures the project into 6 phases: Business/Domain Understanding, Data Understanding, Data Preparation, Modeling (HistGradientBoosting / GroupKFold), Evaluation, and Deployment. The digital twin provides what-if counterfactual scenario simulations under explicit structural assumptions, not absolute causal certainty.",
        "parameters": {"cv_strategy": "5-Fold GroupKFold by CountyFIPS", "winner_model": "HistGradientBoostingRegressor"}
    }
]

class ScientificKnowledgeRetriever:
    """In-memory semantic and keyword scientific retrieval system for RAG."""
    def __init__(self):
        self.documents = SCIENTIFIC_LITERATURE

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []
        
        for doc in self.documents:
            score = 0
            text_to_search = f"{doc['title']} {doc['topic']} {doc['key_findings']} {doc['authors']}".lower()
            
            # Simple keyword relevance scoring
            keywords = query_lower.split()
            for kw in keywords:
                if len(kw) > 2 and kw in text_to_search:
                    score += 1
                    
            if "tax" in query_lower or "impuesto" in query_lower or "bebida" in query_lower or "ssb" in query_lower:
                if doc["id"] == "powell_2013":
                    score += 5
            if "subsidio" in query_lower or "subsidy" in query_lower or "fruta" in query_lower or "fruit" in query_lower:
                if doc["id"] == "afshin_2017":
                    score += 5
            if "fast food" in query_lower or "comida rapida" in query_lower or "escuela" in query_lower or "zoning" in query_lower:
                if doc["id"] == "currie_2010":
                    score += 5
            if "cdc" in query_lower or "places" in query_lower or "prevalencia" in query_lower or "brfss" in query_lower:
                if doc["id"] == "cdc_places_2022":
                    score += 4
            if "crisp" in query_lower or "modelo" in query_lower or "limitacion" in query_lower or "metodologia" in query_lower:
                if doc["id"] == "crispdm_methodology":
                    score += 4

            if score > 0:
                results.append((score, doc))
        
        # Sort by relevance score descending
        results.sort(key=lambda x: x[0], reverse=True)
        
        if not results:
            return self.documents[:top_k]
            
        return [doc for _, doc in results[:top_k]]

knowledge_retriever = ScientificKnowledgeRetriever()
