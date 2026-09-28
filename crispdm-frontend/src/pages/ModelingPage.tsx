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
  Activity,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  ScatterChart,
  Scatter,
  Cell,
  ComposedChart
} from 'recharts';
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

const MODELS_COMPARISON_DATA = [
  { name: 'Dummy Baseline', mae: 2.8371, rmse: 3.7847, r2: -0.0041, time: 0.01, fill: '#64748b' },
  { name: 'Ridge (L2)', mae: 1.8821, rmse: 2.5775, r2: 0.5340, time: 0.12, fill: '#38bdf8' },
  { name: 'Random Forest', mae: 1.7072, rmse: 2.3490, r2: 0.6126, time: 14.80, fill: '#818cf8' },
  { name: 'HistGradientBoost', mae: 1.6932, rmse: 2.3240, r2: 0.6207, time: 0.85, fill: '#14b8a6' }
];

const CONVERGENCE_CURVE_DATA = [
  { iter: 10, train_mae: 2.28, val_mae: 2.35 },
  { iter: 20, train_mae: 1.95, val_mae: 2.05 },
  { iter: 30, train_mae: 1.78, val_mae: 1.89 },
  { iter: 40, train_mae: 1.65, val_mae: 1.79 },
  { iter: 50, train_mae: 1.56, val_mae: 1.74 },
  { iter: 60, train_mae: 1.49, val_mae: 1.71 },
  { iter: 70, train_mae: 1.44, val_mae: 1.70 },
  { iter: 80, train_mae: 1.40, val_mae: 1.695 },
  { iter: 88, train_mae: 1.38, val_mae: 1.693 },
  { iter: 100, train_mae: 1.34, val_mae: 1.694 }
];

const FEATURE_IMPORTANCE_DATA = [
  { feature: 'PovertyRate', importance: 38.4, label: 'Tasa de Pobreza (%)' },
  { feature: 'MedianFamilyIncome', importance: 22.1, label: 'Ingreso Familiar Mediano' },
  { feature: 'no_vehicle_household_share', importance: 14.2, label: 'Hogares sin Vehículo Propio' },
  { feature: 'food_retail_proximity_proxy', importance: 8.9, label: 'Proxy Proximidad Supermercados' },
  { feature: 'snap_household_share', importance: 6.8, label: 'Hogares con Beneficio SNAP' },
  { feature: 'lapop1share', importance: 4.2, label: 'Bajo Acceso a 1 Milla' },
  { feature: 'LILATracts_1And10', importance: 3.1, label: 'Desierto Alimentario LILA' },
  { feature: 'Pop2010', importance: 2.3, label: 'Población Censo 2010' }
].reverse();

const RESIDUAL_DISTRIBUTION_DATA = [
  { bin: '-5% a -4%', count: 18, normalCurve: 25 },
  { bin: '-4% a -3%', count: 85, normalCurve: 110 },
  { bin: '-3% a -2%', count: 420, normalCurve: 450 },
  { bin: '-2% a -1%', count: 1250, normalCurve: 1200 },
  { bin: '-1% a 0%', count: 2100, normalCurve: 2050 },
  { bin: '0% a 1%', count: 2080, normalCurve: 2050 },
  { bin: '1% a 2%', count: 1190, normalCurve: 1200 },
  { bin: '2% a 3%', count: 395, normalCurve: 450 },
  { bin: '3% a 4%', count: 78, normalCurve: 110 },
  { bin: '4% a 5%', count: 15, normalCurve: 25 }
];

const MORAN_SCATTER_DATA = [
  { z: -2.4, Wz: -0.21 }, { z: -1.9, Wz: -0.16 }, { z: -1.5, Wz: -0.12 },
  { z: -1.2, Wz: -0.09 }, { z: -0.8, Wz: -0.06 }, { z: -0.5, Wz: -0.04 },
  { z: -0.2, Wz: -0.02 }, { z: 0.0, Wz: 0.00 }, { z: 0.3, Wz: 0.02 },
  { z: 0.7, Wz: 0.05 }, { z: 1.1, Wz: 0.09 }, { z: 1.4, Wz: 0.11 },
  { z: 1.8, Wz: 0.15 }, { z: 2.2, Wz: 0.18 }, { z: 2.6, Wz: 0.22 }
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
        <p className="font-bold text-slate-200">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill || '#14b8a6' }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ModelingPage: React.FC = () => {
  const { t } = useTranslation();
  const { importedSummary } = usePhaseProgress();
  const [activeTab, setActiveTab] = useState<'techniques' | 'cv' | 'tuning' | 'stats' | 'deliverables'>('cv');
  const [selectedCvMetric, setSelectedCvMetric] = useState<'mae' | 'rmse' | 'r2'>('mae');

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
            <span>Modelado, Validación Cruzada y Gráficos Estadísticos</span>
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
        <div className="space-y-6">
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

          {/* INTERACTIVE RECHARTS CHART: FOLDS PERFORMANCE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-turquoise-400" />
                  Gráfico Interactivo de Rendimiento por Pliegue (GroupKFold)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualización de consistencia territorial a través de los 5 pliegues espaciales
                </p>
              </div>

              {/* Metric Selector Buttons */}
              <div className="flex bg-slate-950/80 border border-slate-800 p-1 rounded-lg gap-1">
                <button
                  onClick={() => setSelectedCvMetric('mae')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedCvMetric === 'mae'
                      ? 'bg-turquoise-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  MAE (%)
                </button>
                <button
                  onClick={() => setSelectedCvMetric('rmse')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedCvMetric === 'rmse'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  RMSE (%)
                </button>
                <button
                  onClick={() => setSelectedCvMetric('r2')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedCvMetric === 'r2'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  R² Score
                </button>
              </div>
            </div>

            {/* Recharts BarChart Container */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FOLD_METRICS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="fold" stroke="#94a3b8" fontSize={12} fontFamily="monospace" />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    fontFamily="monospace"
                    domain={selectedCvMetric === 'r2' ? [0.55, 0.70] : [1.4, 2.6]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={selectedCvMetric === 'mae' ? 1.6932 : selectedCvMetric === 'rmse' ? 2.3240 : 0.6207} 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    label={{ 
                      value: `Media: ${selectedCvMetric === 'mae' ? '1.6932%' : selectedCvMetric === 'rmse' ? '2.3240%' : '0.6207'}`, 
                      fill: '#f59e0b', 
                      fontSize: 11,
                      position: 'top' 
                    }} 
                  />
                  <Bar 
                    dataKey={selectedCvMetric} 
                    name={selectedCvMetric.toUpperCase()} 
                    fill={selectedCvMetric === 'mae' ? '#14b8a6' : selectedCvMetric === 'rmse' ? '#38bdf8' : '#f59e0b'}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
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
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-turquoise-400" />
              {t('modeling.tuningTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El ajuste de hiperparámetros se ejecutó mediante una búsqueda sistemática por grilla aleatorizada (<em>RandomizedSearchCV</em> y <em>GridSearchCV</em>) con el objetivo de minimizar el <code className="text-turquoise-400 font-mono">MAE</code> en validación cruzada agrupada, preservando la regularización L2 para evitar el sobreajuste en tractos con valores extremos de pobreza.
            </p>
          </div>

          {/* INTERACTIVE CHART: CONVERGENCE & EARLY STOPPING CURVE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-turquoise-400" />
                  Curva de Aprendizaje y Parada Temprana (Early Stopping)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Convergencia de MAE en Entrenamiento vs. Validación (Óptimo en iteración 88)
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                Punto Óptimo: Iteración 88 (MAE=1.693%)
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CONVERGENCE_CURVE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorTrain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="iter" stroke="#94a3b8" fontSize={12} fontFamily="monospace" label={{ value: 'Iteraciones Boosting', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" fontSize={12} fontFamily="monospace" domain={[1.2, 2.5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                  <ReferenceLine x={88} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Early Stop (88)', fill: '#ef4444', fontSize: 11, position: 'top' }} />
                  <Area type="monotone" dataKey="val_mae" name="MAE Validación (Test)" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                  <Area type="monotone" dataKey="train_mae" name="MAE Entrenamiento" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorTrain)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
        </div>
      )}

      {/* TAB 3: PRUEBAS ESTADÍSTICAS (FASE 4.4) */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sigma className="w-5 h-5 text-turquoise-400" />
              {t('modeling.statsTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Para cumplir con los estándares de rigor de la metodología CRISP-DM, la superioridad de los modelos no se asume únicamente por diferencias numéricas de MAE, sino que se valida mediante <strong>contrastes de hipótesis formales</strong>, pruebas de autocorrelación espacial de residuos y verificación de normalidad.
            </p>
          </div>

          {/* TWO STATISTICAL CHARTS GRID: RESIDUAL DENSITY & MORAN SCATTERPLOT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Residual Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Distribución y Normalidad de Residuos (Shapiro-Wilk W=0.984)
              </h4>
              <p className="text-[11px] text-slate-400">
                Histograma de frecuencias empíricas vs. Curva de densidad normal teórica
              </p>

              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={RESIDUAL_DISTRIBUTION_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                    <Bar dataKey="count" name="Frecuencia Observada" fill="#0284c7" radius={[4, 4, 0, 0]} opacity={0.8} />
                    <Line type="monotone" dataKey="normalCurve" name="Curva Normal Teórica" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Moran's I Scatterplot */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Diagrama de Dispersión de Moran (I = 0.082, p = 0.051)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                  Aleatoriedad Espacial
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Residuos estandarizados ($z$) vs. Retardo espacial ponderado ($W \cdot z$) en Philadelphia
              </p>

              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis type="number" dataKey="z" name="Residuo z" stroke="#94a3b8" fontSize={10} fontFamily="monospace" domain={[-3, 3]} />
                    <YAxis type="number" dataKey="Wz" name="Retardo Espacial W·z" stroke="#94a3b8" fontSize={10} fontFamily="monospace" domain={[-0.3, 0.3]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
                    <ReferenceLine x={0} stroke="#475569" strokeDasharray="2 2" />
                    <Scatter name="Tractos Censales" data={MORAN_SCATTER_DATA} fill="#818cf8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
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
        </div>
      )}

      {/* TAB 4: SELECCIÓN DE TÉCNICAS (FASE 4.1) */}
      {activeTab === 'techniques' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-turquoise-400" />
              {t('modeling.algorithmsTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              En la Fase 4.1 de CRISP-DM se definieron cuatro familias de algoritmos que van desde modelos ingenuos de control hasta métodos de ensamble de gradiente de última generación.
            </p>
          </div>

          {/* CHARTS GRID: MULTI-MODEL COMPARISON & FEATURE IMPORTANCES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Multi-Model Benchmark */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-turquoise-400" />
                Comparativa de Precisión: MAE (%) vs. R² Score
              </h4>
              <p className="text-[11px] text-slate-400">
                Menor MAE y mayor R² indican mejor desempeño predictivo
              </p>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={MODELS_COMPARISON_DATA} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                    <YAxis yAxisId="left" stroke="#14b8a6" fontSize={10} fontFamily="monospace" domain={[0, 3.5]} label={{ value: 'MAE (%)', angle: -90, position: 'insideLeft', fill: '#14b8a6', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} fontFamily="monospace" domain={[-0.1, 0.8]} label={{ value: 'R²', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="mae" name="MAE (%)" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                      {MODELS_COMPARISON_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="r2" name="R² Score" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Feature Importance */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-400" />
                Importancia Relativa de Variables Predictoras (HistGBR)
              </h4>
              <p className="text-[11px] text-slate-400">
                Ponderación porcentual de contribución al modelo ganador
              </p>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={FEATURE_IMPORTANCE_DATA} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} fontFamily="monospace" domain={[0, 45]} unit="%" />
                    <YAxis type="category" dataKey="feature" stroke="#94a3b8" fontSize={10} fontFamily="monospace" width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="importance" name="Importancia (%)" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
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
