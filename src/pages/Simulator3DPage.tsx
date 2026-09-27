import { useState, useEffect, useRef } from 'react';
import { PolicyConfig, SimulationSummary, MapVariable } from '../types';
import { runApiSimulation } from '../services/apiClient';
import { saveScenario } from '../services/scenarioStorage';
import { Territory3DCanvas } from '../components/map/Territory3DCanvas';
import { NavSection } from '../components/layout/Navbar';
import { useLanguage } from '../context/LanguageContext';
import { POI_DATA } from '../data/poiData';
import { 
  Boxes, 
  Play, 
  Pause, 
  RotateCcw, 
  BookmarkPlus, 
  Sparkles, 
  ArrowRight, 
  Sliders, 
  Clock, 
  Users, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  X,
  MapPin,
  HeartPulse
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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedGeoid, setSelectedGeoid] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [scenarioNameInput, setScenarioNameInput] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setYearStep(prev => {
          if (prev >= 10) return 0;
          if (prev === 0) return 5;
          return 10;
        });
      }, 1800);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const applyConfigUpdate = async (newConfig: PolicyConfig) => {
    setConfig(newConfig);
    try {
      const summary = await runApiSimulation(newConfig);
      onSimulationUpdate(summary);
    } catch (err) {
      console.warn('[Simulator3D] API Simulation failed:', err);
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

  return (
    <div className="space-y-6 pb-12">
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
              WebGL 3D Real
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualización tridimensional de tractos censales reales TIGER/Line 2019 en Philadelphia, PA.
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
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {currentSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500">{t('resultsKpiInitial')}</span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200">
              {currentSummary.prevalenciaInicialPromedio?.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 shadow-xs">
            <span className="text-xs text-teal-600">{t('resultsKpiProjected')}</span>
            <p className="text-lg sm:text-xl font-extrabold text-teal-600 dark:text-teal-400">
              {currentSummary.prevalenciaProyectadaPromedio?.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-900/60 shadow-xs">
            <span className="text-xs text-cyan-600">Diferencia Absoluta</span>
            <p className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
              -{currentSummary.diferenciaAbsolutaPromedio?.toFixed(2)} p.p.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500">Tractos Real Evaluados</span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {tracts.length}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <Territory3DCanvas
            tracts={tracts}
            selectedGeoid={selectedGeoid || undefined}
            onSelectTract={setSelectedGeoid}
            variable={variable}
            onVariableChange={setVariable}
            yearStep={yearStep}
            restrictionRadius={config.restrictionRadius}
            subsidyActive={config.subsidyEnabled}
            taxActive={config.taxEnabled}
            restrictionActive={false}
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {selectedTract && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold">GEOID: <code className="text-teal-600">{selectedTract.geoid}</code></span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Prevalencia CDC:</span><b>{selectedTract.prevalenciaInicial}%</b></div>
                <div className="flex justify-between"><span>Proyectada:</span><b className="text-teal-600">{selectedTract.prevalenciaProyectada}%</b></div>
                <div className="flex justify-between"><span>Diferencia:</span><b className="text-cyan-600">-{selectedTract.diferenciaAbsoluta} p.p.</b></div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="text-xs font-bold border-b pb-2">Controles de Escenario (V2.1)</div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.taxEnabled}
                  onChange={e => applyConfigUpdate({ ...config, taxEnabled: e.target.checked })}
                />
                <span>Impuesto a Bebidas Azucaradas (A)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.subsidyEnabled}
                  onChange={e => applyConfigUpdate({ ...config, subsidyEnabled: e.target.checked })}
                />
                <span>Subsidio a Frutas/Verduras (B)</span>
              </label>
              <div className="p-2 bg-amber-950/30 border border-amber-800 rounded text-[11px] text-amber-300">
                ⚠️ Política C (Comida Rápida 500m) desactivada en V2.1 por ausencia de ubicaciones de escuelas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
