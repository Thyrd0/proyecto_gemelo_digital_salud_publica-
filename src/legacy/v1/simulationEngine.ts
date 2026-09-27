import { CensusTract, PolicyConfig, TractSimulationResult, SimulationSummary, TrajectoryPoint, VulnerabilityLevel } from '../../types';
import { DEMO_SIMULATION_CONFIG } from '../../config/demoSimulationConfig';

/**
 * Legacy Motor V1 determinista conservado únicamente para trazabilidad histórica.
 * NO SE UTILIZA EN LA VERSIÓN ACTIVA V2.1.
 */
function computeTractsForHorizon(
  tracts: CensusTract[],
  config: PolicyConfig,
  horizon: 5 | 10
): TractSimulationResult[] {
  const horizonFactor = DEMO_SIMULATION_CONFIG.timeHorizonFactors[horizon] || 1.0;
  const anyPolicyActive = (config.taxEnabled && config.taxRate > 0) ||
                          (config.subsidyEnabled && config.subsidyRate > 0) ||
                          (config.restrictionEnabled);

  return tracts.map(tract => {
    let reductionPoints = 0;
    let healthyAccessGain = 0;
    let fastFoodDrop = 0;

    if (!config.isBaseline && anyPolicyActive) {
      if (config.taxEnabled && config.taxRate > 0) {
        const vulnMult = DEMO_SIMULATION_CONFIG.policyA_tax.vulnerabilityMultiplier[tract.vulnerabilidad];
        const taxFraction = config.taxRate / 10;
        const taxImpact = taxFraction * DEMO_SIMULATION_CONFIG.policyA_tax.baseImpactFactor * vulnMult;
        reductionPoints += taxImpact;
      }

      if (config.subsidyEnabled && config.subsidyRate > 0) {
        const subsidyFraction = config.subsidyRate / 10;
        const accessDeficit = (100 - tract.indiceAccesoSaludable) / 100;
        const subsidyImpact = subsidyFraction * DEMO_SIMULATION_CONFIG.policyB_subsidy.baseImpactFactor * 
                              (1 + accessDeficit * DEMO_SIMULATION_CONFIG.policyB_subsidy.accessDeficitWeight);
        
        reductionPoints += subsidyImpact;
        healthyAccessGain = (100 - tract.indiceAccesoSaludable) * (config.subsidyRate / 100) * DEMO_SIMULATION_CONFIG.policyB_subsidy.healthyAccessBoostFactor;
      }

      if (config.restrictionEnabled) {
        const radiusEffect = DEMO_SIMULATION_CONFIG.policyC_restriction.radiusEffect[config.restrictionRadius] || 1.0;
        const densityFactor = (tract.densidadComidaRapida / 100);
        const restrictionImpact = radiusEffect * DEMO_SIMULATION_CONFIG.policyC_restriction.baseImpactFactor *
                                  (1 + densityFactor * DEMO_SIMULATION_CONFIG.policyC_restriction.fastFoodDensityWeight);
        
        reductionPoints += restrictionImpact;
        fastFoodDrop = tract.densidadComidaRapida * (radiusEffect * 0.15) * DEMO_SIMULATION_CONFIG.policyC_restriction.fastFoodReductionFactor;
      }
    }

    const effectiveReduction = reductionPoints * horizonFactor;

    let projectedPrevalence: number;
    if (config.isBaseline || !anyPolicyActive) {
      const drift = horizon * DEMO_SIMULATION_CONFIG.baselineAnnualDrift * (tract.vulnerabilidad === 'Alta' ? 1.2 : tract.vulnerabilidad === 'Media' ? 1.0 : 0.7);
      projectedPrevalence = tract.prevalenciaDiabetesInicial + drift;
    } else {
      projectedPrevalence = tract.prevalenciaDiabetesInicial - effectiveReduction;
    }

    projectedPrevalence = Math.max(1.0, Math.min(99.0, Number(projectedPrevalence.toFixed(2))));
    const diferenciaAbsoluta = Number((tract.prevalenciaDiabetesInicial - projectedPrevalence).toFixed(2));
    const cambioRelativo = Number(((diferenciaAbsoluta / tract.prevalenciaDiabetesInicial) * 100).toFixed(2));
    const rawCasos = (tract.poblacion * (tract.prevalenciaDiabetesInicial - projectedPrevalence)) / 100;
    const casosEvitados = Math.max(0, Math.round(rawCasos));

    const accesoSaludableProyectado = Math.min(100, Math.round(tract.indiceAccesoSaludable + healthyAccessGain * horizonFactor));
    const densidadComidaRapidaProyectada = Math.max(0, Math.round(tract.densidadComidaRapida - fastFoodDrop * horizonFactor));

    return {
      geoid: tract.geoid,
      nombre: tract.nombre,
      poblacion: tract.poblacion,
      ingresoMedio: tract.ingresoMedio,
      vulnerabilidad: tract.vulnerabilidad,
      prevalenciaInicial: tract.prevalenciaDiabetesInicial,
      prevalenciaProyectada: projectedPrevalence,
      diferenciaAbsoluta,
      cambioRelativo,
      casosEvitados,
      accesoSaludableInicial: tract.indiceAccesoSaludable,
      accesoSaludableProyectado,
      densidadComidaRapidaInicial: tract.densidadComidaRapida,
      densidadComidaRapidaProyectada,
      cambioAccesoSaludable: accesoSaludableProyectado - tract.indiceAccesoSaludable,
      cambioComidaRapida: densidadComidaRapidaProyectada - tract.densidadComidaRapida,
      coordenadaFila: tract.coordenadaFila,
      coordenadaColumna: tract.coordenadaColumna
    };
  });
}

function calculateWeightedAveragePrevalence(results: TractSimulationResult[], totalPop: number): number {
  if (totalPop === 0) return 0;
  return Number((results.reduce((acc, t) => acc + t.prevalenciaProyectada * t.poblacion, 0) / totalPop).toFixed(2));
}

export function runLegacyDeterministicSimulation(
  tracts: CensusTract[],
  config: PolicyConfig
): SimulationSummary {
  const results = computeTractsForHorizon(tracts, config, config.horizon);
  const totalPoblacion = results.reduce((acc, t) => acc + t.poblacion, 0);
  const prevalenciaInicialPromedio = Number((results.reduce((acc, t) => acc + t.prevalenciaInicial * t.poblacion, 0) / totalPoblacion).toFixed(2));
  const prevalenciaProyectadaPromedio = calculateWeightedAveragePrevalence(results, totalPoblacion);
  const diferenciaAbsolutaPromedio = Number((prevalenciaInicialPromedio - prevalenciaProyectadaPromedio).toFixed(2));
  const cambioRelativoPromedio = Number(((diferenciaAbsolutaPromedio / prevalenciaInicialPromedio) * 100).toFixed(2));
  const totalCasosEvitados = results.reduce((acc, t) => acc + t.casosEvitados, 0);

  const sortedByDiff = [...results].sort((a, b) => b.diferenciaAbsoluta - a.diferenciaAbsoluta);
  const tractoMayorCambio = {
    geoid: sortedByDiff[0].geoid,
    nombre: sortedByDiff[0].nombre,
    diferencia: sortedByDiff[0].diferenciaAbsoluta,
    casosEvitados: sortedByDiff[0].casosEvitados
  };
  const tractoMenorCambio = {
    geoid: sortedByDiff[sortedByDiff.length - 1].geoid,
    nombre: sortedByDiff[sortedByDiff.length - 1].nombre,
    diferencia: sortedByDiff[sortedByDiff.length - 1].diferenciaAbsoluta,
    casosEvitados: sortedByDiff[sortedByDiff.length - 1].casosEvitados
  };

  const vulnLevels: VulnerabilityLevel[] = ['Baja', 'Media', 'Alta'];
  const porVulnerabilidad = vulnLevels.map(vuln => {
    const subset = results.filter(t => t.vulnerabilidad === vuln);
    const pop = subset.reduce((acc, t) => acc + t.poblacion, 0);
    const prevInit = pop > 0 ? Number((subset.reduce((acc, t) => acc + t.prevalenciaInicial * t.poblacion, 0) / pop).toFixed(2)) : 0;
    const prevProj = pop > 0 ? Number((subset.reduce((acc, t) => acc + t.prevalenciaProyectada * t.poblacion, 0) / pop).toFixed(2)) : 0;
    const diff = Number((prevInit - prevProj).toFixed(2));
    const casos = subset.reduce((acc, t) => acc + t.casosEvitados, 0);

    return {
      vulnerabilidad: vuln,
      prevalenciaInicial: prevInit,
      prevalenciaProyectada: prevProj,
      diferencia: diff,
      casosEvitados: casos,
      poblacionTotal: pop,
      cantidadTractos: subset.length
    };
  });

  const baselineYear0 = prevalenciaInicialPromedio;
  const baselineYear5 = Number((prevalenciaInicialPromedio + 5 * DEMO_SIMULATION_CONFIG.baselineAnnualDrift).toFixed(2));
  const baselineYear10 = Number((prevalenciaInicialPromedio + 10 * DEMO_SIMULATION_CONFIG.baselineAnnualDrift).toFixed(2));

  const results5 = config.horizon === 5 ? results : computeTractsForHorizon(tracts, config, 5);
  const results10 = config.horizon === 10 ? results : computeTractsForHorizon(tracts, config, 10);

  const prev5 = calculateWeightedAveragePrevalence(results5, totalPoblacion);
  const prev10 = calculateWeightedAveragePrevalence(results10, totalPoblacion);

  const trayectoriaTemporal: TrajectoryPoint[] = [
    { year: 0, baselinePrevalence: baselineYear0, interventionPrevalence: baselineYear0 },
    { year: 5, baselinePrevalence: baselineYear5, interventionPrevalence: prev5 },
    { year: 10, baselinePrevalence: baselineYear10, interventionPrevalence: prev10 }
  ];

  return {
    tracts: results,
    prevalenciaInicialPromedio,
    prevalenciaProyectadaPromedio,
    diferenciaAbsolutaPromedio,
    cambioRelativoPromedio,
    totalCasosEvitados,
    tractoMayorCambio,
    tractoMenorCambio,
    porVulnerabilidad,
    trayectoriaTemporal,
    config,
    executedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}
