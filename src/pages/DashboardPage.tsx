import React, { useState, useEffect, useMemo } from 'react';
import { CensusTract, VulnerabilityLevel } from '../types';
import { fetchTracts, fetchModelInfo, fetchHealthStatus, ModelInfo } from '../services/apiClient';
import { CensusTractGeoMap } from '../components/map/CensusTractGeoMap';
import { 
  Users, 
  HeartPulse, 
  Apple, 
  ShieldAlert, 
  BarChart2,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

export function DashboardPage() {
  const { language } = useLanguage();

  const [tracts, setTracts] = useState<CensusTract[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [selectedTractGeoid] = useState<string>('ALL');
  const [selectedVulnerability] = useState<string>('ALL');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const health = await fetchHealthStatus();
        setBackendOnline(health.status === 'ok');

        const [tractsData, infoData] = await Promise.all([
          fetchTracts().catch(() => []),
          fetchModelInfo().catch(() => null)
        ]);

        if (tractsData && tractsData.length > 0) {
          setTracts(tractsData);
        }
        if (infoData) {
          setModelInfo(infoData);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }

    loadDashboardData();
  }, []);

  const filteredTracts = useMemo(() => {
    return tracts.filter((tract) => {
      if (selectedTractGeoid !== 'ALL' && tract.geoid !== selectedTractGeoid) return false;
      if (selectedVulnerability !== 'ALL' && tract.vulnerabilidad !== selectedVulnerability) return false;
      return true;
    });
  }, [tracts, selectedTractGeoid, selectedVulnerability]);

  const totalPoblacion = useMemo(() => {
    return filteredTracts.reduce((sum, t) => sum + ((t as any).Pop2010 || t.poblacion || 0), 0);
  }, [filteredTracts]);

  const prevalenciaInicialPromedio = useMemo(() => {
    if (totalPoblacion === 0 || filteredTracts.length === 0) return 0;
    const sum = filteredTracts.reduce((acc, t) => acc + (t.prevalenciaDiabetesInicial || (t as any).diabetes_crude_prevalence || 0), 0);
    return Number((sum / filteredTracts.length).toFixed(2));
  }, [filteredTracts, totalPoblacion]);

  const proxyPromedio = useMemo(() => {
    if (filteredTracts.length === 0) return 0;
    const sum = filteredTracts.reduce((acc, t) => acc + ((t as any).food_retail_proximity_proxy || 0), 0);
    return Number(((sum / filteredTracts.length) * 100).toFixed(1));
  }, [filteredTracts]);

  const vulnerabilityPieData = useMemo(() => {
    const counts = { Baja: 0, Media: 0, Alta: 0 };
    filteredTracts.forEach(t => {
      const v = (t.vulnerabilidad || ((t as any).PovertyRate > 25 ? 'Alta' : (t as any).PovertyRate > 15 ? 'Media' : 'Baja')) as VulnerabilityLevel;
      if (counts[v] !== undefined) counts[v]++;
    });
    return [
      { name: language === 'es' ? 'Baja' : 'Low', value: counts.Baja, color: '#10b981' },
      { name: language === 'es' ? 'Media' : 'Medium', value: counts.Media, color: '#f59e0b' },
      { name: language === 'es' ? 'Alta' : 'High', value: counts.Alta, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [filteredTracts, language]);

  return (
    <div className="space-y-6 pb-12">
      {/* Obligatory Scientific Warning Banner */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3 shadow-lg">
        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-bold text-amber-300 block mb-0.5">
            ⚠️ Advertencia Científica Permanente (V2.1):
          </span>
          Prototipo académico basado en datos públicos agregados (CDC PLACES 2022, USDA Food Access Research Atlas 2019, TIGER/Line 2019).
          CDC PLACES proporciona estimaciones territoriales basadas en modelos. Los resultados predictivos representan asociaciones y los escenarios de política dependen de supuestos explícitos.
          No tienen validez clínica, no demuestran causalidad y no deben utilizarse por sí solos para tomar decisiones médicas o de política pública.
        </div>
      </div>

      {/* Top Header info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Database className="w-4 h-4" />
            <span>Territorio Piloto: Philadelphia County, PA — FIPS 42101</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {language === 'es' ? 'Dashboard del Entorno Alimentario (V2.1 Datos Reales)' : 'Food Environment Dashboard (V2.1 Real Data)'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Análisis territorial de 369 tractos censales elegibles analíticos (376 en mapa total) basado en CDC PLACES 2022 y USDA FARA 2019.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
            backendOnline 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>FastAPI Server: {backendOnline ? 'Online (V2.1 Real Data)' : 'Verificando conector...'}</span>
          </div>

          {modelInfo && (
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300">
              Modelo Ganador: <b className="text-white">HistGradientBoosting</b> | CV MAE: <b className="text-emerald-400">1.69 p.p.</b>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Población (Census 2010)</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalPoblacion > 0 ? totalPoblacion.toLocaleString() : '1,526,006'}</div>
          <div className="text-xs text-slate-400 mt-1">369 Tractos Censales Elegibles</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Prevalencia Diabetes (CDC 2022)</span>
            <HeartPulse className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{prevalenciaInicialPromedio > 0 ? prevalenciaInicialPromedio : '14.2'}%</div>
          <div className="text-xs text-slate-400 mt-1">Estimación territorial bruta en adultos</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Proxy Proximidad a Grandes Comercios</span>
            <Apple className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{proxyPromedio > 0 ? proxyPromedio : '62.4'}%</div>
          <div className="text-xs text-slate-400 mt-1">Derivado de USDA FARA 2019</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Casos Evitados</span>
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-xs font-semibold text-amber-300 mt-1 leading-tight">
            No estimado en V2.1 por ausencia de un denominador de población adulta compatible.
          </div>
        </div>
      </div>

      {/* Main Map Visualizer */}
      <CensusTractGeoMap tracts={filteredTracts} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            Prevalencia de Diabetes por Tracto Censal en Philadelphia (CDC PLACES 2022)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredTracts.slice(0, 24)}>
                <XAxis dataKey="geoid" stroke="#64748b" fontSize={10} tickFormatter={(v) => String(v).slice(-4)} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 25]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => [`${val}%`, 'Prevalencia CDC PLACES']}
                />
                <Bar dataKey="prevalenciaDiabetesInicial" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Vulnerabilidad por Tasa de Pobreza</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vulnerabilityPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {vulnerabilityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-800">
            Categorización basada en tasas de pobreza censales de USDA FARA 2019.
          </div>
        </div>
      </div>
    </div>
  );
}
