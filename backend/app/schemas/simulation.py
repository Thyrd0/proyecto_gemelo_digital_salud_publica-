from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class PolicyConfigRequest(BaseModel):
    horizon: int = Field(5, description="Time horizon in years (5 or 10)")
    taxEnabled: bool = Field(False, description="Enable Sugar-Sweetened Beverage Tax")
    taxRate: float = Field(20.0, ge=0.0, le=50.0, description="SSB Tax Rate %")
    subsidyEnabled: bool = Field(False, description="Enable Fruit/Vegetable Subsidy")
    subsidyRate: float = Field(30.0, ge=0.0, le=60.0, description="Subsidy Rate %")
    restrictionEnabled: bool = Field(False, description="Enable Fast Food Restriction Zone")
    restrictionRadius: int = Field(500, description="Restriction radius in meters around schools")
    isBaseline: bool = Field(False, description="Is Baseline scenario without active policy")

class TractResultResponse(BaseModel):
    geoid: str
    nombre: str
    neighborhood: str
    poblacion: int
    ingresoMedio: float
    vulnerabilidad: str
    prevalenciaInicial: float
    prevalenciaProyectada: float
    diferenciaAbsoluta: float
    cambioRelativo: float
    casosEvitados: int
    accesoSaludableInicial: float
    accesoSaludableProyectado: float
    densidadComidaRapidaInicial: float
    densidadComidaRapidaProyectada: float
    cambioAccesoSaludable: float
    cambioComidaRapida: float
    latitude: float
    longitude: float

class VulnerabilityBreakdown(BaseModel):
    vulnerabilidad: str
    prevalenciaInicial: float
    prevalenciaProyectada: float
    diferencia: float
    casosEvitados: int
    poblacionTotal: int
    cantidadTractos: int

class TrajectoryPoint(BaseModel):
    year: int
    baselinePrevalence: float
    interventionPrevalence: float

class SimulationSummaryResponse(BaseModel):
    tracts: List[TractResultResponse]
    prevalenciaInicialPromedio: float
    prevalenciaProyectadaPromedio: float
    diferenciaAbsolutaPromedio: float
    cambioRelativoPromedio: float
    totalCasosEvitados: int
    tractoMayorCambio: Dict[str, Any]
    tractoMenorCambio: Dict[str, Any]
    porVulnerabilidad: List[VulnerabilityBreakdown]
    trayectoriaTemporal: List[TrajectoryPoint]
    config: PolicyConfigRequest
    model_version: str
    data_source: str
    disclaimer_es: str
    disclaimer_en: str
    executedAt: str

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "es"

class ChatResponse(BaseModel):
    reply: str
    source: str
