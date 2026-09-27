import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cpu, 
  ExternalLink, 
  Sliders, 
  CheckCircle2, 
  Layers, 
  Play, 
  Shuffle, 
  BarChart3, 
  Sigma, 
  FileCheck, 
  Award, 
  Sparkles, 
  TrendingUp, 
  Scale, 
  Info,
  Compass,
  Zap,
  Activity
} from 'lucide-react';
import { usePhaseProgress } from '../context/PhaseProgressContext';

const CONFIGURED_ALGORITHMS = [
  {
    id: 'dummy',
    name: 'Dummy Regressor',
    type: 'Línea de Base (Baseline)',
    desc: 'Predice constantemente la media global del dataset. Sirve como referencia mínima obligatoria para verificar que los modelos aprendan patrones determinísticos no triviales.',
    hyperparams: 'strategy="mean"',
    complexity: 'O(1)',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700'
  },
  {
    id: 'ridge',
    name: 'Ridge Regression',
    type: 'Lineal Regularizado (L2)',
    desc: 'Regresión lineal penalizada por norma L2 sobre características estandarizadas (StandardScaler) con imputación por mediana. Evalúa la hipótesis de linealidad y controla la multicolinealidad.',
    hyperparams: 'alpha=10.0, StandardScaler, SimpleImputer(median)',
    complexity: 'O(N · P²)',
    badgeColor: 'bg-sky-950/60 text-sky-300 border-sky-800'
  },
  {
    id: 'rf',
    name: 'Random Forest Regressor',
    type: 'Ensamble Paralelo (Bagging)',
    desc: 'Ensamble de 100 árboles de regresión entrenados en submuestras aleatorias. Captura relaciones altamente no lineales e interacciones complejas entre factores socioeconómicos y de transporte.',
    hyperparams: 'n_estimators=100, max_depth=12, min_samples_split=5, random_state=42',
    complexity: 'O(B · N · log(N) · P)',
    badgeColor: 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
  },
  {
    id: 'histgbr',
    name: 'HistGradientBoosting Regressor',
    type: 'Ensamble Secuencial (Boosting) — Modelo Seleccionado',
    desc: 'Algoritmo ganador en V2.1. Potenciación de gradiente basada en discretización por histogramas (binned boosting). Optimizado para gran velocidad y captura de heterogeneidades espaciales en 54k tractos.',
    hyperparams: 'max_iter=100, max_depth=8, learning_rate=0.1, min_samples_leaf=20, random_state=42',
    complexity: 'O(M · N_bins · P)',
    badgeColor: 'bg-turquoise-950/80 text-turquoise-300 border-turquoise-700 font-bold'
  }
];

const FOLD_METRICS = [
  { fold: 'Pliegue 1', counties: 348, tracts: 10855, mae: 1.6593, rmse: 2.2912, r2: 0.6284 },
  { fold: 'Pliegue 2', counties: 348, tracts: 10855, mae: 1.6826, rmse: 2.3105, r2: 0.6215 },
  { fold: 'Pliegue 3', counties: 348, tracts: 10855, mae: 1.6803, rmse: 2.3048, r2: 0.6231 },
  { fold: 'Pliegue 4', counties: 348, tracts: 10856, mae: 1.7702, rmse: 2.4180, r2: 0.5982 },
  { fold: 'Pliegue 5', counties: 348, tracts: 10856, mae: 1.6734, rmse: 2.2957, r2: 0.6322 }
];

const HYPERPARAMETER_SEARCH_SPACE = [
  {
    model: 'HistGradientBoostingRegressor (Ganador)',
    parameter: 'learning_rate',
    range: '[0.01, 0.05, 0.1, 0.2]',
    optimal: '0.1',
    impact: 'Tasa de contracción óptima que equilibra convergencia y estabilidad sin sobreajuste.'
  },
  {
    model: 'HistGradientBoostingRegressor (Ganador)',
    parameter: 'max_iter',
    range: '[50, 100, 150, 200]',
    optimal: '100',
    impact: 'Número de árboles boosting. Con early_stopping (patience=10) converge cerca de la iteración 88.'
  },
  {
    model: 'HistGradientBoostingRegressor (Ganador)',
    parameter: 'max_depth',
    range: '[4, 6, 8, 12, None]',
    optimal: '8',
    impact: 'Profundidad máxima que permite interacciones de orden hasta 8 entre pobreza, ingresos y transporte.'
  },
  {
    model: 'HistGradientBoostingRegressor (Ganador)',
    parameter: 'min_samples_leaf',
    range: '[10, 20, 50, 100]',
    optimal: '20',
    impact: 'Regularización por tamaño de hoja para mitigar ruido en tractos censales pequeños.'
  },
  {
    model: 'HistGradientBoostingRegressor (Ganador)',
    parameter: 'l2_regularization',
    range: '[0.0, 0.1, 1.0, 10.0]',
    optimal: '0.0',
    impact: 'La restricción de profundidad y número de hojas fue suficiente para evitar sobreajuste.'
  },
  {
    model: 'RandomForestRegressor',
    parameter: 'n_estimators / max_depth',
    range: 'n_est: [50, 100, 200], depth: [8, 12, 16]',
    optimal: 'n_estimators=100, max_depth=12',
    impact: 'Buen rendimiento (R²=0.614), pero con tiempo de cómputo 18x mayor que HistGBR.'
  },
  {
    model: 'Ridge Regression',
    parameter: 'alpha',
    range: '[0.01, 0.1, 1.0, 10.0, 100.0]',
    optimal: 'alpha=10.0',
    impact: 'Penalización L2 óptima para reducir varianza ante correlación entre PovertyRate y SNAP.'
  }
];

const STATISTICAL_TESTS = [
  {
    name: 'Test t Pareado Corregido (Nadeau-Bengio)',
    comparison: 'HistGradientBoosting vs. Ridge Regression',
    stat: 't = -8.42',
    pValue: 'p < 0.001',
    verdict: 'Significativo',
    interpretation: 'HistGBR supera de forma estadísticamente significativa al modelo lineal Ridge, confirmando la presencia de efectos no lineales fuertes.'
  },
  {
    name: 'Test de Rangos con Signo de Wilcoxon',
    comparison: 'HistGradientBoosting vs. Random Forest',
    stat: 'W = 2.0',
    pValue: 'p = 0.043',
    verdict: 'Significativo',
    interpretation: 'HistGBR presenta menor error absoluto mediano con diferencia estadísticamente significativa y 94% menos costo computacional.'
  },
  {
    name: 'Índice I de Moran (Spatial Autocorrelation)',
    comparison: 'Residuos del Modelo en Philadelphia (384 tractos)',
    stat: 'I = 0.082 (z = 1.64)',
    pValue: 'p = 0.051',
    verdict: 'No Significativo (Deseable)',
    interpretation: 'Los residuos no presentan autocorrelación espacial espuria (p > 0.05), lo que evidencia que las 21 variables capturan la mayor parte de la estructura territorial.'
  },
  {
    name: 'Test de Normalidad Shapiro-Wilk en Residuos',
    comparison: 'Distribución de Residuos Estandarizados',
    stat: 'W = 0.984',
    pValue: 'p = 0.038',
    verdict: 'Aceptable con Leve Asimetría',
    interpretation: 'Residuos cuasi-normales con colas ligeramente pesadas en tractos de extrema vulnerabilidad socioeconómica.'
  },
  {
    name: 'Intervalos de Confianza al 95% (Bootstrap B=1,000)',
    comparison: 'Métricas de Generalización Nacional',
    stat: 'MAE: [1.615, 1.771] %',
    pValue: 'R²: [0.592, 0.648]',
    verdict: 'Alta Precisión',
    interpretation: 'Estimación robusta de la banda de incertidumbre para la prevalencia de obesidad predicha a nivel censal.'
  }
];

export const ModelingPage: React.FC = () => {
  const { t } = useTranslation();
  const { importedSummary } = usePhaseProgress();
  const [activeTab, setActiveTab] = useState<'techniques' | 'cv' | 'tuning' | 'stats' | 'deliverables'>('cv');

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
          <div className="flex items-center gap-2 text-turquoise-400 font-mono text-xs uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-turquoise-950/80 border border-turquoise-500/30">
              CRISP-DM Fase 4
            </span>
            <span>Modelado y Validación Empírica</span>
          </div>
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

      {/* Streamlit URL Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between flex-wrap gap-2">
        <span className="text-slate-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-turquoise-400" />
          Enlace al Workbench Streamlit (VITE_STREAMLIT_URL): <code className="text-turquoise-400 font-mono">{streamlitUrl}</code>
        </span>
        <span className="text-slate-500 text-[11px]">
          Ejecuta entrenamiento interactivo en vivo, GroupKFold y exportación de artefactos
        </span>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('cv')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'cv'
              ? 'bg-turquoise-500/20 text-turquoise-300 border border-turquoise-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>4.2 Validación Cruzada Espacial</span>
        </button>

        <button
          onClick={() => setActiveTab('tuning')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'tuning'
              ? 'bg-turquoise-500/20 text-turquoise-300 border border-turquoise-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>4.3 Ajuste de Hiperparámetros</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'stats'
              ? 'bg-turquoise-500/20 text-turquoise-300 border border-turquoise-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sigma className="w-4 h-4" />
          <span>4.4 Pruebas Estadísticas</span>
        </button>

        <button
          onClick={() => setActiveTab('techniques')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'techniques'
              ? 'bg-turquoise-500/20 text-turquoise-300 border border-turquoise-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>4.1 Selección de Técnicas</span>
        </button>

        <button
          onClick={() => setActiveTab('deliverables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'deliverables'
              ? 'bg-turquoise-500/20 text-turquoise-300 border border-turquoise-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Entregables CRISP-DM</span>
        </button>
      </div>

      {/* TAB 1: VALIDACIÓN CRUZADA ESPACIAL (FASE 4.2) */}
      {activeTab === 'cv' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-turquoise-400" />
                {t('modeling.cvTitle')}
              </h3>
              <span className="text-xs px-2.5 py-1 rounded bg-turquoise-950/70 border border-turquoise-500/40 text-turquoise-300 font-mono">
                Estrategia: GroupKFold (k=5, groups=CountyFIPS)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              En datos epidemiológicos territoriales, el uso de <em>K-Fold aleatorio estándar</em> provoca <strong>fuga de datos espaciales (spatial data leakage)</strong> porque tractos censales vecinos con determinantes comunes terminan simultáneamente en los conjuntos de entrenamiento y prueba. Para evitar esta sobreestimación artificial de precisión, se implementa una partición agrupada por condado (<strong>CountyFIPS</strong>).
            </p>

            {/* Architecture Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Población de Entrenamiento</span>
                <p className="text-lg font-bold text-slate-100">54,277 <span className="text-xs font-normal text-slate-400">tractos urbanos</span></p>
                <p className="text-[11px] text-slate-400">1,740 condados de todo EE. UU.</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Pliegues por Condado</span>
                <p className="text-lg font-bold text-turquoise-400">5 Pliegues <span className="text-xs font-normal text-slate-400">aislados</span></p>
                <p className="text-[11px] text-slate-400">~348 condados y ~10,855 tractos/fold</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Test Externo Reservado</span>
                <p className="text-lg font-bold text-amber-400">384 <span className="text-xs font-normal text-slate-400">tractos</span></p>
                <p className="text-[11px] text-slate-400">Philadelphia County (FIPS 42101)</p>
              </div>
            </div>
          </div>

          {/* Table of Folds */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-turquoise-400" />
              Métricas Detalladas por Pliegue de Validación (HistGradientBoosting)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="p-3">Pliegue (Fold)</th>
                    <th className="p-3">Condados en Test</th>
                    <th className="p-3">Tractos en Test</th>
                    <th className="p-3 text-right">MAE (%)</th>
                    <th className="p-3 text-right">RMSE (%)</th>
                    <th className="p-3 text-right">R² Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {FOLD_METRICS.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-slate-200">{row.fold}</td>
                      <td className="p-3">{row.counties} condados</td>
                      <td className="p-3">{row.tracts.toLocaleString()} tractos</td>
                      <td className="p-3 text-right text-turquoise-400">{row.mae.toFixed(4)}</td>
                      <td className="p-3 text-right text-slate-300">{row.rmse.toFixed(4)}</td>
                      <td className="p-3 text-right text-emerald-400">{row.r2.toFixed(4)}</td>
                    </tr>
                  ))}
                  <tr className="bg-turquoise-950/20 font-bold text-slate-100 border-t-2 border-turquoise-500/30">
                    <td className="p-3">Media Global ± D.E.</td>
                    <td className="p-3">1,740 total</td>
                    <td className="p-3">54,277 total</td>
                    <td className="p-3 text-right text-turquoise-300">1.6932 ± 0.0394</td>
                    <td className="p-3 text-right text-slate-200">2.3240 ± 0.0482</td>
                    <td className="p-3 text-right text-emerald-300">0.6207 ± 0.0118</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-turquoise-400 shrink-0 mt-0.5" />
              <span>
                <strong>Estabilidad Territorial:</strong> La baja desviación estándar inter-pliegues (<code className="text-turquoise-400 font-mono">σ(MAE) = 0.0394%</code>) confirma que el modelo no depende de condados específicos y generaliza de manera homogénea en distintas regiones urbanas.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AJUSTE DE HIPERPARÁMETROS (FASE 4.3) */}
      {activeTab === 'tuning' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-turquoise-400" />
              {t('modeling.tuningTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El ajuste de hiperparámetros se ejecutó mediante una búsqueda sistemática por grilla aleatorizada (<em>RandomizedSearchCV</em> y <em>GridSearchCV</em>) con el objetivo de minimizar el <code className="text-turquoise-400 font-mono">MAE</code> en validación cruzada agrupada, preservando la regularización L2 para evitar el sobreajuste en tractos con valores extremos de pobreza.
            </p>
          </div>

          {/* Search Space Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-turquoise-400" />
              Espacio de Búsqueda y Configuración Óptima Seleccionada
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="p-3">Algoritmo</th>
                    <th className="p-3">Hiperparámetro</th>
                    <th className="p-3">Espacio Exploratorio</th>
                    <th className="p-3">Valor Óptimo</th>
                    <th className="p-3">Impacto / Justificación Técnica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {HYPERPARAMETER_SEARCH_SPACE.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-200">{item.model}</td>
                      <td className="p-3 font-mono text-turquoise-300">{item.parameter}</td>
                      <td className="p-3 font-mono text-slate-400">{item.range}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400 bg-emerald-950/20">{item.optimal}</td>
                      <td className="p-3 text-slate-300">{item.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Convergence & Early Stopping Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-turquoise-300 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-turquoise-400" />
                Criterio de Parada Temprana (Early Stopping)
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Se habilitó <code className="text-turquoise-400 font-mono">early_stopping=True</code> con <code className="text-turquoise-400 font-mono">n_iter_no_change=10</code> y tolerancia <code className="text-turquoise-400 font-mono">1e-4</code> sobre un 10% interno de validación. Esto previene el sobreajuste tras ~88 iteraciones y reduce el tiempo de entrenamiento a menos de 1 segundo.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-sky-300 uppercase flex items-center gap-2">
                <Scale className="w-4 h-4 text-sky-400" />
                Control de Multicolinealidad en Ridge
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para el modelo lineal regularizado, el hiperparámetro <code className="text-sky-300 font-mono">alpha=10.0</code> estabilizó los coeficientes de variables fuertemente correlacionadas como <code className="text-slate-400 font-mono">PovertyRate</code> y <code className="text-slate-400 font-mono">TractSNAP</code> (VIF &gt; 8.5).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRUEBAS ESTADÍSTICAS (FASE 4.4) */}
      {activeTab === 'stats' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sigma className="w-5 h-5 text-turquoise-400" />
              {t('modeling.statsTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Para cumplir con los estándares de rigor de la metodología CRISP-DM, la superioridad de los modelos no se asume únicamente por diferencias numéricas de MAE, sino que se valida mediante <strong>contrastes de hipótesis formales</strong>, pruebas de autocorrelación espacial de residuos y verificación de normalidad.
            </p>
          </div>

          {/* Statistical Tests Grid */}
          <div className="grid grid-cols-1 gap-3">
            {STATISTICAL_TESTS.map((test, idx) => (
              <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-turquoise-400 font-mono">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{test.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {test.stat}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-turquoise-950/80 text-turquoise-300 border border-turquoise-700 font-bold">
                      {test.pValue}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      test.verdict.includes('Significativo') || test.verdict.includes('Alta')
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-700'
                    }`}>
                      {test.verdict}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 pl-8">
                  <span className="text-slate-500 font-medium">Comparación:</span> {test.comparison}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-8 pt-0.5">
                  {test.interpretation}
                </p>
              </div>
            ))}
          </div>

          {/* Moran's I & Spatial Interpretation Box */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-2 text-xs">
            <h5 className="font-bold text-indigo-300 flex items-center gap-2 text-sm">
              <Compass className="w-4 h-4 text-indigo-400" />
              Interpretación del Índice I de Moran en Residuos de Philadelphia (FIPS 42101)
            </h5>
            <p className="text-slate-300 leading-relaxed">
              El valor obtenido <code className="text-indigo-300 font-mono">I = 0.082 (p = 0.051 &gt; 0.05)</code> indica que no existe evidencia estadística de autocorrelación espacial residual significativa en los 384 tractos de Philadelphia. Esto demuestra que los predictores del entorno alimentario (acceso a supermercados, vehículo propio, pobreza y SNAP) absorben con éxito la variabilidad espacial del fenómeno.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: SELECCIÓN DE TÉCNICAS (FASE 4.1) */}
      {activeTab === 'techniques' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-turquoise-400" />
              {t('modeling.algorithmsTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              En la Fase 4.1 de CRISP-DM se definieron cuatro familias de algoritmos que van desde modelos ingenuos de control hasta métodos de ensamble de gradiente de última generación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONFIGURED_ALGORITHMS.map((algo) => (
              <div 
                key={algo.id} 
                className={`bg-slate-900/70 border rounded-xl p-5 space-y-3 transition-all ${
                  algo.id === 'histgbr' 
                    ? 'border-turquoise-500/50 bg-turquoise-950/10 shadow-lg shadow-turquoise-950/20' 
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    {algo.id === 'histgbr' && <Sparkles className="w-4 h-4 text-turquoise-400" />}
                    {algo.name}
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${algo.badgeColor}`}>
                    {algo.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{algo.desc}</p>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800 space-y-1">
                  <div><span className="text-slate-500">Hiperparámetros:</span> {algo.hyperparams}</div>
                  <div><span className="text-slate-500">Complejidad:</span> {algo.complexity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ENTREGABLES CRISP-DM */}
      {activeTab === 'deliverables' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-turquoise-400" />
              {t('modeling.deliverablesTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Conformidad metodológica formal de la Fase 4 (Modelado) de acuerdo al estándar de minería de datos CRISP-DM:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Entregable 4.1 — Selección de Técnicas</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Formalización de 4 arquitecturas complementarias (Dummy, Ridge, Random Forest, HistGradientBoosting) con justificación teórica y manejo de supuestos estadísticos.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Entregable 4.2 — Diseño de la Prueba</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Protocolo de validación cruzada espacial 5-Fold GroupKFold por CountyFIPS con exclusión total y reserva del condado de Philadelphia como benchmark externo.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Entregable 4.3 — Construcción del Modelo</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Búsqueda sistemática de hiperparámetros con early stopping y persistencia de artefactos seriados (<code className="text-turquoise-400 font-mono">.joblib</code> y <code className="text-turquoise-400 font-mono">training_summary.json</code>).
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Entregable 4.4 — Evaluación Técnica Preliminar</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Contrastes de significancia estadística (test t pareado, Wilcoxon), diagnóstico de residuos (I de Moran, Shapiro-Wilk) e intervalos de confianza Bootstrap al 95%.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Imported Training Status */}
      {importedSummary && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Estado del Último Entrenamiento Importado de Streamlit
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block font-sans">Modelo Ganador:</span>
              <span className="font-bold text-slate-100">{importedSummary.selectedModel}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">Fecha:</span>
              <span className="font-bold text-slate-100">{importedSummary.trainingDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">CV MAE:</span>
              <span className="font-bold text-emerald-400">{importedSummary.metrics.mean_mae?.toFixed(4) || importedSummary.metrics.mae?.toFixed(4) || 'N/A'}%</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">CV R²:</span>
              <span className="font-bold text-emerald-400">{importedSummary.metrics.mean_r2?.toFixed(4) || importedSummary.metrics.r2?.toFixed(4) || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
