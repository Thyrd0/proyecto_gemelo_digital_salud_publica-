import { useState } from 'react';
import { MapVariable, TractSimulationResult } from '../../types';
import { Info, Layers, Eye, X, Users, DollarSign, ShieldAlert, HeartPulse, Apple, Utensils } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SchematicTerritoryGridProps {
  tracts: TractSimulationResult[];
  selectedGeoid?: string | null;
  onSelectTract?: (geoid: string) => void;
  showProjection?: boolean;
}

export function SchematicTerritoryGrid({
  tracts,
  selectedGeoid,
  onSelectTract,
  showProjection = true
}: SchematicTerritoryGridProps) {
  const { t, language } = useLanguage();
  const [variable, setVariable] = useState<MapVariable>(showProjection ? 'prevalenciaProyectada' : 'prevalenciaInicial');
  const [inspectedTract, setInspectedTract] = useState<TractSimulationResult | null>(null);

  // Ordenar por fila y columna para formar la cuadrícula 3x4
  const sortedGrid = [...tracts].sort((a, b) => {
    if (a.coordenadaFila !== b.coordenadaFila) {
      return a.coordenadaFila - b.coordenadaFila;
    }
    return a.coordenadaColumna - b.coordenadaColumna;
  });

  const getCellColorAndLabel = (tract: TractSimulationResult) => {
    switch (variable) {
      case 'prevalenciaInicial': {
        const val = tract.prevalenciaInicial;
        if (val < 9.0) return { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-200', badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300', valText: `${val.toFixed(1)}%` };
        if (val <= 12.5) return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300', valText: `${val.toFixed(1)}%` };
        return { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-200', badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300', valText: `${val.toFixed(1)}%` };
      }
      case 'prevalenciaProyectada': {
        const val = tract.prevalenciaProyectada;
        if (val < 9.0) return { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-200', badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300', valText: `${val.toFixed(1)}%` };
        if (val <= 12.5) return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300', valText: `${val.toFixed(1)}%` };
        return { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-200', badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300', valText: `${val.toFixed(1)}%` };
      }
      case 'diferencia': {
        const diff = tract.diferenciaAbsoluta;
        if (diff > 0.8) return { bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700/60 text-teal-950 dark:text-teal-200', badge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300', valText: `-${diff.toFixed(2)} p.p.` };
        if (diff > 0) return { bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700/60 text-cyan-950 dark:text-cyan-200', badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300', valText: `-${diff.toFixed(2)} p.p.` };
        if (diff === 0) return { bg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200', badge: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300', valText: `0.00 p.p.` };
        return { bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700/60 text-orange-950 dark:text-orange-200', badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300', valText: `+${Math.abs(diff).toFixed(2)} p.p.` };
      }
      case 'accesoSaludable': {
        const acc = tract.accesoSaludableProyectado;
        if (acc >= 70) return { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-200', badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300', valText: `${acc}/100` };
        if (acc >= 45) return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300', valText: `${acc}/100` };
        return { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-200', badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300', valText: `${acc}/100` };
      }
      case 'vulnerabilidad': {
        const vulnLabel = language === 'en' 
          ? (tract.vulnerabilidad === 'Baja' ? 'Low' : tract.vulnerabilidad === 'Media' ? 'Medium' : 'High')
          : tract.vulnerabilidad;
        if (tract.vulnerabilidad === 'Baja') return { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/60 text-blue-950 dark:text-blue-200', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300', valText: vulnLabel };
        if (tract.vulnerabilidad === 'Media') return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300', valText: vulnLabel };
        return { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700/60 text-purple-950 dark:text-purple-200', badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300', valText: vulnLabel };
      }
    }
  };

  const handleTractClick = (tract: TractSimulationResult) => {
    setInspectedTract(tract);
    if (onSelectTract) {
      onSelectTract(tract.geoid);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4 transition-colors">
      {/* Header with Variable Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('mapTitle')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('mapSubtitle')}
          </p>
        </div>

        {/* Variable selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="map-variable-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 shrink-0">
            <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            {t('mapVariableLabel')}
          </label>
          <select
            id="map-variable-select"
            value={variable}
            onChange={(e) => setVariable(e.target.value as MapVariable)}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="prevalenciaProyectada">{t('mapVarPrevalenceProjected')}</option>
            <option value="prevalenciaInicial">{t('mapVarPrevalenceInitial')}</option>
            <option value="diferencia">{t('mapVarDifference')}</option>
            <option value="accesoSaludable">{t('mapVarAccess')}</option>
            <option value="vulnerabilidad">{t('mapVarVulnerability')}</option>
          </select>
        </div>
      </div>

      {/* Grid Schematic Notice */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          {language === 'es' ? 'Representación territorial esquemática de 12 tractos censales.' : 'Schematic territorial representation of 12 census tracts.'}
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {language === 'es' ? 'Haz clic en cualquier celda para inspeccionar' : 'Click any quadrant to inspect details'}
        </span>
      </div>

      {/* 3x4 Grid of Tracts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sortedGrid.map((tract) => {
          const { bg, badge, valText } = getCellColorAndLabel(tract);
          const isSelected = selectedGeoid === tract.geoid || inspectedTract?.geoid === tract.geoid;

          return (
            <button
              key={tract.geoid}
              onClick={() => handleTractClick(tract)}
              className={`text-left rounded-xl border p-3.5 transition-all relative flex flex-col justify-between cursor-pointer ${bg} ${
                isSelected 
                  ? 'ring-2 ring-teal-600 dark:ring-teal-400 shadow-md scale-[1.01]' 
                  : 'hover:shadow-xs hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              {/* Card top */}
              <div className="flex items-start justify-between gap-1.5 mb-2">
                <div>
                  <span className="text-[11px] font-bold opacity-75 font-mono">
                    {tract.geoid}
                  </span>
                  <h4 className="text-xs font-bold leading-tight line-clamp-1 mt-0.5">
                    {tract.nombre}
                  </h4>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge} shrink-0`}>
                  {valText}
                </span>
              </div>

              {/* Card metrics preview */}
              <div className="space-y-1 text-[11px] pt-2 border-t border-current/10 opacity-90">
                <div className="flex items-center justify-between">
                  <span className="opacity-75">{language === 'es' ? 'Prev. Inicial / Proy:' : 'Initial / Proj. Prev:'}</span>
                  <span className="font-medium">{tract.prevalenciaInicial.toFixed(1)}% → {tract.prevalenciaProyectada.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">{language === 'es' ? 'Acceso Saludable:' : 'Healthy Access:'}</span>
                  <span className="font-medium">{tract.accesoSaludableProyectado}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">{language === 'es' ? 'Dens. Comida Rápida:' : 'Fast Food Density:'}</span>
                  <span className="font-medium">{tract.densidadComidaRapidaProyectada}/100</span>
                </div>
              </div>

              {/* Bottom tag */}
              <div className="mt-2.5 pt-1.5 border-t border-current/10 flex items-center justify-between text-[10px]">
                <span className={`px-1.5 py-0.5 rounded font-semibold ${
                  tract.vulnerabilidad === 'Alta' ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300' :
                  tract.vulnerabilidad === 'Media' ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300' :
                  'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                }`}>
                  {language === 'en' 
                    ? `${tract.vulnerabilidad === 'Baja' ? 'Low' : tract.vulnerabilidad === 'Media' ? 'Med' : 'High'} Vuln` 
                    : `Vuln. ${tract.vulnerabilidad}`}
                </span>
                {tract.casosEvitados > 0 && (
                  <span className="font-semibold text-teal-700 dark:text-teal-300">
                    +{tract.casosEvitados} {language === 'es' ? 'casos evit.' : 'avoided'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{language === 'es' ? 'Leyenda' : 'Legend'} ({variable}):</span>
          {variable === 'vulnerabilidad' ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-200 border border-blue-400"></span> {language === 'es' ? 'Baja' : 'Low'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span> {language === 'es' ? 'Media' : 'Medium'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-200 border border-purple-400"></span> {language === 'es' ? 'Alta' : 'High'}
              </span>
            </>
          ) : variable === 'diferencia' ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-teal-200 border border-teal-500"></span> {language === 'es' ? 'Reducción alta (> 0.8 p.p.)' : 'High reduction (> 0.8 p.p.)'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-200 border border-cyan-400"></span> {language === 'es' ? 'Reducción moderada' : 'Moderate reduction'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-400"></span> {language === 'es' ? 'Sin cambio' : 'No change'}
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400"></span> {language === 'es' ? 'Favorable / Bajo riesgo' : 'Favorable / Low risk'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span> {language === 'es' ? 'Moderado' : 'Moderate'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-200 border border-rose-400"></span> {language === 'es' ? 'Riesgo elevado' : 'Elevated risk'}
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {language === 'es' ? '12 tractos censales' : '12 census tracts'}
        </span>
      </div>

      {/* Tract Inspector Modal */}
      {inspectedTract && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 transition-colors">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  {inspectedTract.geoid}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {inspectedTract.nombre}
                </h3>
              </div>
              <button
                onClick={() => setInspectedTract(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Cerrar modal de tracto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> {t('dashboardTableColPop')}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {inspectedTract.poblacion.toLocaleString()} {language === 'es' ? 'hab.' : 'residents'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" /> {t('dashboardTableColIncome')}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  ${inspectedTract.ingresoMedio.toLocaleString()} {language === 'es' ? '/año' : '/yr'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> {t('dashboardTableColVuln')}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {language === 'en' 
                    ? (inspectedTract.vulnerabilidad === 'Baja' ? 'Low' : inspectedTract.vulnerabilidad === 'Media' ? 'Medium' : 'High') 
                    : inspectedTract.vulnerabilidad}
                </p>
              </div>
              <div className="p-3 bg-teal-50/60 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-800/60">
                <span className="text-teal-700 dark:text-teal-300 font-medium flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> {t('resultsKpiCases')}
                </span>
                <p className="text-sm font-bold text-teal-900 dark:text-teal-200 mt-0.5">
                  {inspectedTract.casosEvitados} {language === 'es' ? 'personas' : 'people'}
                </p>
              </div>
            </div>

            {/* Prevalence comparison */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <h5 className="font-semibold text-slate-800 dark:text-slate-200">{t('mapInspectorPrevalence')}</h5>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">{t('mapInspectorInitial')}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{inspectedTract.prevalenciaInicial.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">{t('mapInspectorProjected')}</span>
                <span className="font-bold text-teal-700 dark:text-teal-400">{inspectedTract.prevalenciaProyectada.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{t('mapInspectorDiff')}</span>
                <span className="font-bold text-teal-800 dark:text-teal-300">
                  {inspectedTract.diferenciaAbsoluta >= 0 ? `-${inspectedTract.diferenciaAbsoluta.toFixed(2)}` : `+${Math.abs(inspectedTract.diferenciaAbsoluta).toFixed(2)}`} p.p. ({inspectedTract.cambioRelativo.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Environment factors */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <Apple className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {t('mapInspectorAccess')}
                </span>
                <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200 mt-1">
                  {inspectedTract.accesoSaludableInicial} → {inspectedTract.accesoSaludableProyectado} / 100
                </p>
              </div>
              <div className="p-3 bg-orange-50/50 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-800/50">
                <span className="text-orange-800 dark:text-orange-300 font-semibold flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> {t('mapInspectorFastFood')}
                </span>
                <p className="text-sm font-bold text-orange-950 dark:text-orange-200 mt-1">
                  {inspectedTract.densidadComidaRapidaInicial} → {inspectedTract.densidadComidaRapidaProyectada} / 100
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectedTract(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
