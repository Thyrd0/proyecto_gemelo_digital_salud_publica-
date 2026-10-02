import { useState, useEffect } from 'react';
import { PolicyConfig, SimulationSummary, MapVariable } from '../types';
import { runApiSimulation } from '../services/apiClient';
import { saveScenario } from '../services/scenarioStorage';
import { Territory3DCanvas } from '../components/map/Territory3DCanvas';
import { NavSection } from '../components/layout/Navbar';
import { useLanguage } from '../context/LanguageContext';
import { 
  Boxes, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  BookmarkPlus,
  Loader2,
  TrendingDown,
  Percent,
  DollarSign,
  ShieldAlert,
  Apple,
  Clock
} from 'lucide-react';

interface Simulator3DPageProps {
  currentSummary?: SimulationSummary;
  onSimulationUpdate: (newSummary: SimulationSummary) => void;
  onNavigate: (section: NavSection) => void;
}

export function Simulator3DPage({
  currentSummary,
  onSimulationUpdate,
  onNavigate
}: Simulator3DPageProps) {
  const { t, language } = useLanguage();

  const [config, setConfig] = useState<PolicyConfig>({
    taxEnabled: currentSummary?.config?.taxEnabled ?? false,
    taxRate: currentSummary?.config?.taxRate ?? 20,
    subsidyEnabled: currentSummary?.config?.subsidyEnabled ?? false,
    subsidyRate: currentSummary?.config?.subsidyRate ?? 30,
    restrictionEnabled: currentSummary?.config?.restrictionEnabled ?? false,
    restrictionRadius: currentSummary?.config?.restrictionRadius ?? 500,
    horizon: currentSummary?.config?.horizon ?? 5,
    isBaseline: currentSummary?.config?.isBaseline ?? true
  });

  const [variable, setVariable] = useState<MapVariable>('prevalenciaProyectada');
  const [yearStep, setYearStep] = useState<number>(5);
  const [selectedGeoid, setSelectedGeoid] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [scenarioNameInput, setScenarioNameInput] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isLoadingSim, setIsLoadingSim] = useState<boolean>(false);

  // Auto-run simulation on mount if currentSummary is missing or empty
  useEffect(() => {
    if (!currentSummary || !currentSummary.tracts || currentSummary.tracts.length === 0) {
      const initSimulation = async () => {
        setIsLoadingSim(true);
        try {
          const summary = await runApiSimulation({
            taxEnabled: false,
            taxRate: 0,
            subsidyEnabled: false,
            subsidyRate: 0,
            restrictionEnabled: false,
            restrictionRadius: 500,
            horizon: 5,
            isBaseline: true
          });
          onSimulationUpdate(summary);
        } catch (err) {
          console.warn('[Simulator3D] Fallback simulation fetch failed:', err);
        } finally {
          setIsLoadingSim(false);
        }
      };
      initSimulation();
    }
  }, []);

  const applyConfigUpdate = async (newConfig: PolicyConfig) => {
    setConfig(newConfig);
    setIsLoadingSim(true);
    try {
      const summary = await runApiSimulation(newConfig);
      onSimulationUpdate(summary);
    } catch (err) {
      console.warn('[Simulator3D] API Simulation failed:', err);
      setNotification({
        type: 'error',
        message: language === 'es' ? 'Error al ejecutar simulación en el servidor' : 'Error executing simulation on backend'
      });
    } finally {
      setIsLoadingSim(false);
    }
  };

  const handleApplyPackage = (pkg: 'all' | 'fiscal' | 'baseline') => {
    let newConfig: PolicyConfig;
    if (pkg === 'all') {
      newConfig = {
        taxEnabled: true, taxRate: 20,
        subsidyEnabled: true, subsidyRate: 30,
        restrictionEnabled: false, restrictionRadius: 500,
        horizon: 5, isBaseline: false
      };
    } else if (pkg === 'fiscal') {
      newConfig = {
        taxEnabled: true, taxRate: 20,
        subsidyEnabled: true, subsidyRate: 30,
        restrictionEnabled: false, restrictionRadius: 500,
        horizon: 5, isBaseline: false
      };
    } else {
      newConfig = {
        taxEnabled: false, taxRate: 0,
        subsidyEnabled: false, subsidyRate: 0,
        restrictionEnabled: false, restrictionRadius: 500,
        horizon: 5, isBaseline: true
      };
    }
    applyConfigUpdate(newConfig);
  };

  const handleReset = () => {
    handleApplyPackage('baseline');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSummary) return;
    const result = saveScenario(scenarioNameInput, currentSummary);
    if (result.success) {
      setNotification({ type: 'success', message: result.message });
      setSaveModalOpen(false);
      setScenarioNameInput('');
    } else {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const tracts = currentSummary?.tracts || [];
  const selectedTract = tracts.find(t => t.geoid === selectedGeoid) || tracts[0];

  const meanInit = currentSummary?.prevalenciaInicialPromedio ?? 14.2;
  const meanProj = currentSummary?.prevalenciaProyectadaPromedio ?? 14.2;
  const meanDiff = currentSummary?.diferenciaAbsolutaPromedio ?? 0.0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
              {t('sim3DTitle')} (V2.1 Datos Reales)
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
              WebGL 3D Real Time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gemelo Digital Urbano 3D con modelado volumétrico de los 369 tractos censales reales de Philadelphia (CDC PLACES 2022 + USDA FARA 2019).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('simulator')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('sim3DSwitch2D')}</span>
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-teal-500" />
            <span>{t('simSaveScenario')}</span>
          </button>
          <button
            onClick={() => onNavigate('results')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('simViewFullResults')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
          notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-900 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">{t('resultsKpiInitial')}</span>
          <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200">
            {meanInit.toFixed(2)}%
          </p>
          <span className="text-[10px] text-slate-400">CDC PLACES 2022</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 shadow-xs">
          <span className="text-xs text-teal-600">{t('resultsKpiProjected')}</span>
          <p className="text-lg sm:text-xl font-extrabold text-teal-600 dark:text-teal-400">
            {meanProj.toFixed(2)}%
          </p>
          <span className="text-[10px] text-teal-500">ML Model v2.1</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-900/60 shadow-xs">
          <span className="text-xs text-cyan-600">Reducción Media</span>
          <p className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
            -{meanDiff.toFixed(2)} p.p.
          </p>
          <span className="text-[10px] text-cyan-500">Efecto simulado</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Tractos Censales 3D</span>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {tracts.length > 0 ? tracts.length : 369}
          </p>
          <span className="text-[10px] text-slate-400">Philadelphia (FIPS 42101)</span>
        </div>
      </div>

      {/* Main 3D Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 3D WebGL Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative">
            {isLoadingSim && (
              <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-xs rounded-2xl flex items-center justify-center gap-2 text-teal-400 font-semibold text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Simulando nuevo escenario ML...</span>
              </div>
            )}
            <Territory3DCanvas
              tracts={tracts}
              selectedGeoid={selectedGeoid || undefined}
              onSelectTract={setSelectedGeoid}
              variable={variable}
              onVariableChange={setVariable}
              yearStep={yearStep}
              onYearStepChange={setYearStep}
              restrictionRadius={config.restrictionRadius}
              subsidyActive={config.subsidyEnabled}
              taxActive={config.taxEnabled}
              restrictionActive={false}
            />
          </div>
        </div>

        {/* Right: Policy Controls & Tract Info */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Tract Card */}
          {selectedTract && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tracto: <code className="text-teal-500 font-mono">{selectedTract.geoid}</code>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold">
                  {selectedTract.vulnerabilidad || (((selectedTract as any).poverty_rate ?? 0) > 25 ? 'Alta' : ((selectedTract as any).poverty_rate ?? 0) > 15 ? 'Media' : 'Baja')}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Población (Censo):</span>
                  <b>{(selectedTract.poblacion || (selectedTract as any).Pop2010 || 0).toLocaleString()}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prevalencia Inicial (CDC):</span>
                  <b className="text-rose-500">{(selectedTract.prevalenciaInicial ?? 0).toFixed(2)}%</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prevalencia Proyectada:</span>
                  <b className="text-teal-500">{(selectedTract.prevalenciaProyectada ?? 0).toFixed(2)}%</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reducción Absoluta:</span>
                  <b className="text-cyan-500">-{(selectedTract.diferenciaAbsoluta ?? 0).toFixed(2)} p.p.</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proxy Proximidad Comercios:</span>
                  <b className="text-emerald-500">{(((selectedTract as any).food_retail_proximity_proxy_projected ?? 0.6) * 100).toFixed(1)}%</b>
                </div>
              </div>
            </div>
          )}

          {/* Policy Scenario Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'es' ? 'Intervenciones de Política (V2.1)' : 'Policy Interventions (V2.1)'}
              </span>
              <button
                onClick={handleReset}
                className="text-[11px] text-teal-600 hover:text-teal-500 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'es' ? 'Resetear' : 'Reset'}</span>
              </button>
            </div>

            {/* Quick Packages */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleApplyPackage('fiscal')}
                className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer text-center"
              >
                {language === 'es' ? 'Paquete Fiscal Completo' : 'Full Fiscal Package'}
              </button>
              <button
                onClick={() => handleApplyPackage('baseline')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer text-center"
              >
                {language === 'es' ? 'Escenario Base' : 'Baseline Scenario'}
              </button>
            </div>

            {/* Policy A: Tax */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.taxEnabled}
                    onChange={e => applyConfigUpdate({ ...config, taxEnabled: e.target.checked, isBaseline: false })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {language === 'es' ? 'Impuesto a Bebidas Azucaradas (A)' : 'Sugar-Sweetened Beverage Tax (A)'}
                  </span>
                </label>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{config.taxRate}%</span>
              </div>
              {config.taxEnabled && (
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={config.taxRate}
                  onChange={e => applyConfigUpdate({ ...config, taxRate: Number(e.target.value) })}
                  className="w-full accent-teal-600"
                />
              )}
            </div>

            {/* Policy B: Subsidy */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.subsidyEnabled}
                    onChange={e => applyConfigUpdate({ ...config, subsidyEnabled: e.target.checked, isBaseline: false })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {language === 'es' ? 'Subsidio a Alimentos Frescos (B)' : 'Fresh Produce Subsidy (B)'}
                  </span>
                </label>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{config.subsidyRate}%</span>
              </div>
              {config.subsidyEnabled && (
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={5}
                  value={config.subsidyRate}
                  onChange={e => applyConfigUpdate({ ...config, subsidyRate: Number(e.target.value) })}
                  className="w-full accent-teal-600"
                />
              )}
            </div>

            {/* Policy C: Warning */}
            <div className="p-2.5 bg-amber-950/30 border border-amber-800/60 rounded-lg text-[11px] text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Política C (Buffer Comida Rápida):</span>
              </div>
              <p className="text-amber-200/80 leading-relaxed">
                Desactivada en V2.1 por ausencia de coordenadas individuales de colegios en los tres datasets oficiales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Scenario Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'es' ? 'Guardar Escenario 3D' : 'Save 3D Scenario'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'es' ? 'Asigna un nombre descriptivo a este escenario de simulación territorial para compararlo más tarde:' : 'Give a name to this spatial simulation scenario to compare later:'}
            </p>
            <input
              type="text"
              value={scenarioNameInput}
              onChange={e => setScenarioNameInput(e.target.value)}
              placeholder="Ej: Impuesto 20% + Subsidio 30% Año 5"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={!scenarioNameInput.trim()}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 cursor-pointer"
              >
                {language === 'es' ? 'Guardar' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
