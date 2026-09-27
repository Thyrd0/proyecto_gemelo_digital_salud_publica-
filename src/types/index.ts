export type VulnerabilityLevel = 'Baja' | 'Media' | 'Alta';

export type TimeHorizon = 5 | 10;

export interface CensusTract {
  geoid: string;
  nombre: string;
  poblacion: number;
  ingresoMedio: number;
  prevalenciaDiabetesInicial: number; // en porcentaje (ej: 12.4)
  indiceAccesoSaludable: number; // 0 - 100
  densidadComidaRapida: number; // 0 - 100
  accesoVehiculo: number; // porcentaje con acceso a vehículo (ej: 65)
  vulnerabilidad: VulnerabilityLevel;
  coordenadaFila?: number;
  coordenadaColumna?: number;
  zonaUrbana?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

export interface PolicyConfig {
  // Política A: Impuesto a bebidas azucaradas
  taxEnabled: boolean;
  taxRate: number; // 0 - 30% (default 20%)

  // Política B: Subsidio a frutas y verduras
  subsidyEnabled: boolean;
  subsidyRate: number; // 0 - 40% (default 30%)

  // Política C: Restricción de comida rápida alrededor de escuelas
  restrictionEnabled: boolean;
  restrictionRadius: 250 | 500 | 750; // metros (default 500m)

  // Opciones generales
  horizon: TimeHorizon; // 5 o 10 años
  isBaseline?: boolean; // si es escenario base sin intervención
}

export interface TractSimulationResult {
  geoid: string;
  nombre: string;
  poblacion: number;
  ingresoMedio: number;
  vulnerabilidad: VulnerabilityLevel;
  prevalenciaInicial: number;
  prevalenciaProyectada: number;
  diferenciaAbsoluta: number; // prevalenciaInicial - prevalenciaProyectada (puntos porcentuales)
  cambioRelativo: number; // % de reducción sobre el valor inicial
  casosEvitados: number; // poblacion * (prevalenciaInicial - prevalenciaProyectada) / 100
  accesoSaludableInicial: number;
  accesoSaludableProyectado: number;
  densidadComidaRapidaInicial: number;
  densidadComidaRapidaProyectada: number;
  cambioAccesoSaludable: number;
  cambioComidaRapida: number;
  coordenadaFila: number;
  coordenadaColumna: number;
}

export interface TrajectoryPoint {
  year: number; // 0, 5, 10
  baselinePrevalence: number;
  interventionPrevalence: number;
}

export interface SimulationSummary {
  tracts: TractSimulationResult[];
  prevalenciaInicialPromedio: number;
  prevalenciaProyectadaPromedio: number;
  diferenciaAbsolutaPromedio: number;
  cambioRelativoPromedio: number;
  totalCasosEvitados: number;
  tractoMayorCambio: {
    geoid: string;
    nombre: string;
    diferencia: number;
    casosEvitados: number;
  };
  tractoMenorCambio: {
    geoid: string;
    nombre: string;
    diferencia: number;
    casosEvitados: number;
  };
  porVulnerabilidad: {
    vulnerabilidad: VulnerabilityLevel;
    prevalenciaInicial: number;
    prevalenciaProyectada: number;
    diferencia: number;
    casosEvitados: number;
    poblacionTotal: number;
    cantidadTractos: number;
  }[];
  trayectoriaTemporal: TrajectoryPoint[];
  config: PolicyConfig;
  executedAt: string;
}

export interface SavedScenario {
  id: string;
  nombre: string;
  fecha: string;
  config: PolicyConfig;
  prevalenciaProyectadaPromedio: number;
  diferenciaEstimadaPromedio: number;
  totalCasosEvitados: number;
  resumenVulnerabilidad: {
    vulnerabilidad: VulnerabilityLevel;
    diferencia: number;
    casosEvitados: number;
  }[];
}

export type MapVariable = 
  | 'prevalenciaInicial' 
  | 'prevalenciaProyectada' 
  | 'diferencia' 
  | 'accesoSaludable' 
  | 'vulnerabilidad';
