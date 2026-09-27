import React from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, ExternalLink, Sliders, CheckCircle2, ShieldAlert, Layers, Play } from 'lucide-react';
import { usePhaseProgress } from '../context/PhaseProgressContext';

const CONFIGURED_ALGORITHMS = [
  {
    name: 'Dummy Regressor',
    type: 'Línea de Base (Baseline)',
    desc: 'Predice constantemente la media global. Sirve como referencia mínima para verificar que los modelos aprendan patrones no triviales.',
    hyperparams: 'strategy="mean"'
  },
  {
    name: 'Ridge Regression',
    type: 'Lineal Regulado (L2)',
    desc: 'Regresión lineal penalizada por norma L2 sobre características estandarizadas (StandardScaler) e imputación mediana.',
    hyperparams: 'alpha=10.0, StandardScaler, SimpleImputer'
  },
  {
    name: 'Random Forest Regressor',
    type: 'Ensamble (Bagging)',
    desc: 'Ensamble de 100 árboles de decisión en paralelo. Captura relaciones no lineales y de interacción entre predictores.',
    hyperparams: 'n_estimators=100, max_depth=12, random_state=42'
  },
  {
    name: 'HistGradientBoosting Regressor',
    type: 'Ensamble (Boosting)',
    desc: 'Algoritmo ganador en V2.1. Potenciación de gradiente basado en histogramas para optimización en grandes volúmenes tabulares.',
    hyperparams: 'max_iter=100, max_depth=8, random_state=42'
  }
];

export const ModelingPage: React.FC = () => {
  const { t } = useTranslation();
  const { importedSummary } = usePhaseProgress();

  const streamlitUrl = import.meta.env.VITE_STREAMLIT_URL || 'http://localhost:8501';

  const handleOpenStreamlit = () => {
    if (!streamlitUrl) {
      alert(t('modeling.streamlitMissing'));
      return;
    }
    window.open(streamlitUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header with CTA Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-turquoise-400" />
            {t('modeling.title')}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {t('modeling.subtitle')}
          </p>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={handleOpenStreamlit}
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-turquoise-500 to-sky-600 hover:from-turquoise-400 hover:to-sky-500 text-slate-950 font-bold text-sm shadow-lg shadow-turquoise-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          id="open-streamlit-btn"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{t('modeling.openStreamlitBtn')}</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Streamlit URL Badge */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between flex-wrap gap-2">
        <span className="text-slate-400">
          Enlace configurado (VITE_STREAMLIT_URL): <code className="text-turquoise-400 font-mono">{streamlitUrl}</code>
        </span>
        <span className="text-slate-500 text-[11px]">
          Abre el entorno interactivo de entrenamiento Streamlit en una pestaña nueva
        </span>
      </div>

      {/* Process Description */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-turquoise-400 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          {t('modeling.processTitle')}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {t('modeling.processText')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-300 pt-2">
          <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Estrategia Validación:</span>
            <strong>5-Fold GroupKFold (CountyFIPS)</strong>
          </div>
          <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Métricas Principales:</span>
            <strong>MAE, RMSE, R² (Media ± D.E.)</strong>
          </div>
          <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Semilla Aleatoria:</span>
            <strong>random_state = 42</strong>
          </div>
        </div>
      </div>

      {/* Candidate Algorithms Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-turquoise-400" />
          {t('modeling.algorithmsTitle')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONFIGURED_ALGORITHMS.map((algo, idx) => (
            <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-100">{algo.name}</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-turquoise-300 border border-slate-700">
                  {algo.type}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{algo.desc}</p>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                Hiperparámetros: {algo.hyperparams}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Imported Training Status */}
      {importedSummary && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Estado del Último Entrenamiento Importado de Streamlit
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Modelo Ganador:</span>
              <span className="font-bold text-slate-100">{importedSummary.selectedModel}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Fecha:</span>
              <span className="font-bold text-slate-100">{importedSummary.trainingDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block">CV MAE:</span>
              <span className="font-bold text-emerald-400">{importedSummary.metrics.mean_mae?.toFixed(4) || importedSummary.metrics.mae?.toFixed(4) || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">CV R²:</span>
              <span className="font-bold text-emerald-400">{importedSummary.metrics.mean_r2?.toFixed(4) || importedSummary.metrics.r2?.toFixed(4) || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
