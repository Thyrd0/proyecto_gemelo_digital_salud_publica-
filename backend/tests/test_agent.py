"""
Unit and Integration Tests for the LangChain Agent and LangFlow integration.
"""
import json
import unittest

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.agent.tools import (
    query_tract_indicators,
    simulate_policy_intervention,
    rank_top_vulnerable_tracts,
    search_scientific_evidence,
    AGENT_TOOLS
)
from backend.app.services.agent.agent_service import agent_service

client = TestClient(app)

def test_agent_tools_count():
    assert len(AGENT_TOOLS) == 4
    tool_names = [t.name for t in AGENT_TOOLS]
    assert "query_tract_indicators" in tool_names
    assert "simulate_policy_intervention" in tool_names
    assert "rank_top_vulnerable_tracts" in tool_names
    assert "search_scientific_evidence" in tool_names

def test_query_tract_tool():
    res = query_tract_indicators.invoke({"geoid": "42101000100"})
    assert "42101000100" in res
    assert "prevalencia_diabetes_base_pct" in res

def test_simulation_tool():
    res = simulate_policy_intervention.invoke({
        "geoid": "42101000100",
        "tax_rate": 20.0,
        "subsidy_rate": 30.0,
        "restriction_enabled": False
    })
    data = json.loads(res)
    assert "resultados_tracto" in data
    assert "impacto_a_nivel_condado_philadelphia" in data

def test_rank_vulnerability_tool():
    res = rank_top_vulnerable_tracts.invoke({"n": 3, "criteria": "diabetes"})
    data = json.loads(res)
    assert len(data.get("top_tractos", [])) == 3

def test_scientific_evidence_tool():
    res = search_scientific_evidence.invoke({"query": "tax price elasticity powell"})
    assert "Powell" in res or "elasticity" in res.lower()

def test_agent_endpoint_chat():
    response = client.post("/api/v1/agent/chat", json={
        "message": "Muéstrame los indicadores del tracto 42101000100",
        "language": "es"
    })
    assert response.status_code == 200
    json_data = response.json()
    assert "reply" in json_data
    assert "steps" in json_data
    assert "42101000100" in json_data["reply"]

def test_agent_endpoint_tools():
    response = client.get("/api/v1/agent/tools")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 4

def test_agent_endpoint_langflow_schema():
    response = client.get("/api/v1/agent/flow")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 5
