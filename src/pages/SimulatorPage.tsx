import React, { useState } from 'react';
import { PolicyConfig, SimulationSummary } from '../types';
import { runApiSimulation } from '../services/apiClient';
import { CensusTractGeoMap } from '../components/map/CensusTractGeoMap';
import { 
  Play, 
  RotateCcw, 
  Percent, 
  Building2, 
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

export function SimulatorPage() {
  const { language } = useLanguage();

  const [config, setConfig] = useState<PolicyConfig>({
    taxEnabled: true,
    taxRate: 20,
    subsidyEnabled: true,
    subsidyRate: 30,
    restrictionEnabled: false,
    restrictionRadius: 500,
    horizon: 5,
    isBaseline: false
  });

  const [simulationResult, setSimulationResult] = useState<SimulationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const summary = await runApiSimulation(config);
      setSimulationResult(summary);
    } catch (err: any) {
      console.error('Simulation error:', err);
      setErrorMessage(err.message || 'Error executing simulation via FastAPI backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConfig({
      taxEnabled: false,
      taxRate: 20,
      subsidyEnabled: false,
      subsidyRate: 30,
      restrictionEnabled: false,
      restrictionRadius: 500,
      horizon: 5,
      isBaseline: true
    });
    setSimulationResult(null);
  };

  return (
    <div className="space-y-6 pb-12">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            {language === 'es' ? 'Simulador de Escenarios de Política (V2.1 Datos Reales)' : 'Policy Scenario Simulator (V2.1 Real Data)'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Análisis paramétrico de sensibilidad basado en CDC PLACES 2022 y USDA FARA 2019 para 369 tractos censales elegibles de Philadelphia.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-4 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Controls Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Parámetros de Intervención Exploratoria</span>
            <button 
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </h2>

          {/* Policy A */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-400" />
                Impuesto a Bebidas Azucaradas (A)
              </span>
              <input
                type="checkbox"
                checked={config.taxEnabled}
                onChange={(e) => setConfig({ ...config, taxEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
              />
            </label>
            {config.taxEnabled && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Tasa del Impuesto</span>
                  <span className="font-bold text-emerald-400">{config.taxRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={35}
                  step={5}
                  value={config.taxRate}
                  onChange={(e) => setConfig({ ...config, taxRate: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 italic block mt-1">
                  Fuente: Powell et al. (2013) DOI: 10.1016/j.jhealeco.2013.02.004 | Elasticidad: -1.21
                </span>
              </div>
            )}
          </div>

          {/* Policy B */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                Subsidio a Frutas y Verduras (B)
              </span>
              <input
                type="checkbox"
                checked={config.subsidyEnabled}
                onChange={(e) => setConfig({ ...config, subsidyEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
              />
            </label>
            {config.subsidyEnabled && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Descuento Aplicado</span>
                  <span className="font-bold text-emerald-400">{config.subsidyRate}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={config.subsidyRate}
                  onChange={(e) => setConfig({ ...config, subsidyRate: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 italic block mt-1">
                  Fuente: Afshin et al. (2017) DOI: 10.1371/journal.pone.0182243 | Modula proxy de proximidad a grandes comercios de alimentos
                </span>
              </div>
            )}
          </div>

          {/* Policy C: Deactivated */}
          <div className="space-y-2 bg-amber-950/20 p-3.5 rounded-lg border border-amber-800/60 text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              Política C: Restricción de Comida Rápida a 500m
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Esta política requiere ubicaciones verificadas de escuelas y establecimientos de comida rápida. No se encuentra operacionalizada con los tres datasets de V2.1.
            </p>
          </div>

          {/* Horizon Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Horizonte Temporal Exploratorio
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, horizon: 5 })}
                className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  config.horizon === 5
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                5 Años
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, horizon: 10 })}
                className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  config.horizon === 10
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                10 Años
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block italic">
              *El horizonte representa un escenario exploratorio bajo supuestos de acumulación.
            </span>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Ejecutando Inferencia V2.1 en FastAPI...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Ejecutar Simulación V2.1
              </>
            )}
          </button>
        </div>

        {/* Results Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResult ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
                  <span className="text-xs font-medium text-slate-400">Prevalencia Proyectada Promedio</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {simulationResult.prevalenciaProyectadaPromedio}%
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Inicial CDC 2022: {simulationResult.prevalenciaInicialPromedio}%
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
                  <span className="text-xs font-medium text-slate-400">Diferencia Absoluta Promedio</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    -{simulationResult.diferenciaAbsolutaPromedio} p.p.
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Resultado condicionado por supuestos
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Casos Evitados
                  </span>
                  <div className="text-[11px] font-semibold text-amber-300 mt-1 leading-tight">
                    No estimado en V2.1 por ausencia de un denominador de población adulta compatible.
                  </div>
                </div>
              </div>

              {/* Map displaying projections */}
              <CensusTractGeoMap 
                tracts={simulationResult.tracts} 
                activeVariable="prevalenciaProyectada" 
              />

              {/* Vulnerability Breakdown Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-3">
                  Prevalencia Territorial Promedio por Nivel de Pobreza Censal
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={simulationResult.porVulnerabilidad}>
                      <XAxis dataKey="vulnerabilidad" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="prevalenciaInicial" name="Prevalencia Inicial CDC (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="prevalenciaProyectada" name="Prevalencia Proyectada (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4 shadow-xl">
              <Play className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-200">
                Selecciona tus políticas y ejecuta la simulación
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                El backend en FastAPI calculará la inferencia territorial a nivel de tracto censal utilizando el modelo HistGradientBoostingRegressor entrenado con datos reales.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
