import { SimulationSummary } from '../types';

export function exportSimulationToCSV(summary: SimulationSummary): void {
  const headers = [
    'GEOID',
    'Prevalencia Inicial (%)',
    'Prevalencia Proyectada (%)',
    'Diferencia (p.p.)',
    'Cambio Relativo (%)',
    'Poblacion (2010)',
    'Tasa Pobreza (%)',
    'Ingreso Familiar Medio ($)',
    'Proxy Proximidad Alimentaria'
  ];

  const rows = summary.tracts.map(t => [
    `"${t.geoid}"`,
    (t.prevalenciaInicial ?? 0).toFixed(2),
    (t.prevalenciaProyectada ?? 0).toFixed(2),
    (t.diferenciaAbsoluta ?? 0).toFixed(2),
    (t.cambioRelativo ?? 0).toFixed(2),
    (t as any).poblacion ?? 0,
    (t as any).poverty_rate ?? 0,
    (t as any).median_income ?? 0,
    ((t as any).food_retail_proximity_proxy_projected ?? 0).toFixed(3)
  ]);

  const disclaimerRow = [
    '"# ADVERTENCIA CIENTIFICA: Prototipo academico V2.1 basado en CDC PLACES 2022 y USDA FARA 2019. Los resultados representan estimaciones exploratorias asociativas y no constituyen diagnosticos clinicos ni evidencia causal directa."'
  ];

  const configRow = [
    `"# Configuracion: Horizonte=${summary.config.horizon} anios | Impuesto Bebidas=${summary.config.taxEnabled ? summary.config.taxRate + '%' : 'Desactivado'} | Subsidio Frutas/Verduras=${summary.config.subsidyEnabled ? summary.config.subsidyRate + '%' : 'Desactivado'} | Restriccion Escolar=Desactivado (requiere datos de locales)"`
  ];

  const csvContent = [
    disclaimerRow.join(','),
    configRow.join(','),
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `simulacion_entorno_alimentario_v2_1_${summary.config.horizon}anios_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateTextSummary(summary: SimulationSummary): string {
  const cfg = summary.config;
  const policiesList: string[] = [];

  if (cfg.taxEnabled && cfg.taxRate > 0) {
    policiesList.push(`• Política A (Impuesto a bebidas azucaradas): ${cfg.taxRate}%`);
  }
  if (cfg.subsidyEnabled && cfg.subsidyRate > 0) {
    policiesList.push(`• Política B (Subsidio a frutas y verduras): ${cfg.subsidyRate}%`);
  }
  if (cfg.restrictionEnabled) {
    policiesList.push(`• Política C (Restricción comida rápida 500m): Desactivada en V2.1 (requiere ubicaciones de escuelas)`);
  }
  if (policiesList.length === 0) {
    policiesList.push('• Escenario base inercial (Sin intervenciones activas)');
  }

  return `===============================================================
PROTOTIPO DE GEMELO DIGITAL DEL ENTORNO ALIMENTARIO URBANO (V2.1)
RESUMEN EJECUTIVO CON DATOS REALES (CDC PLACES 2022 + USDA FARA 2019)
===============================================================
Territorio Evaluado: Philadelphia County, PA (FIPS 42101)
Horizonte temporal evaluado: ${cfg.horizon} años
Hora de ejecución: ${summary.executedAt || new Date().toISOString()}

CONFIGURACIÓN DE POLÍTICAS:
${policiesList.join('\n')}

INDICADORES GLOBALES RESULTANTES:
• Prevalencia inicial promedio: ${(summary.prevalenciaInicialPromedio ?? 0).toFixed(2)}%
• Prevalencia proyectada promedio: ${(summary.prevalenciaProyectadaPromedio ?? 0).toFixed(2)}%
• Diferencia absoluta promedio: ${(summary.diferenciaAbsolutaPromedio ?? 0).toFixed(2)} p.p.
• Casos evitados: No estimados en V2.1 por ausencia de denominador poblacional adulto compatible.

---------------------------------------------------------------
⚠️ ADVERTENCIA CIENTÍFICA:
Prototipo académico basado en datos públicos agregados (CDC PLACES 2022,
USDA FARA 2019, TIGER/Line 2019). No posee validez clínica ni demuestra
efectos causales y no debe utilizarse para la toma de decisiones médicas.
===============================================================`;
}

export function triggerPrintWindow(): void {
  window.print();
}
