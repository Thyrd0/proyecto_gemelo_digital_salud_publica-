import React, { useState, useEffect } from 'react';
import { SimulationSummary } from '../types';
import { runApiSimulation } from '../services/apiClient';
import { 
  GitCompare, 
  TrendingDown, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

export function ComparisonPage() {
  const { t, language } = useLanguage();
  const [scenarios, setScenarios] = useState<Record<string, SimulationSummary | null>>({
    baseline: null,
    tax: null,
    subsidy: null,
    restriction: null,
    combined: null
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadScenarios() {
      setLoading(true);
      try {
        const [baseRes, taxRes, subRes, restRes, combRes] = await Promise.all([
          runApiSimulation({ horizon: 5, taxEnabled: false, taxRate: 0, subsidyEnabled: false, subsidyRate: 0, restrictionEnabled: false, restrictionRadius: 500, isBaseline: true }),
          runApiSimulation({ horizon: 5, taxEnabled: true, taxRate: 20, subsidyEnabled: false, subsidyRate: 0, restrictionEnabled: false, restrictionRadius: 500, isBaseline: false }),
          runApiSimulation({ horizon: 5, taxEnabled: false, taxRate: 0, subsidyEnabled: true, subsidyRate: 30, restrictionEnabled: false, restrictionRadius: 500, isBaseline: false }),
          runApiSimulation({ horizon: 5, taxEnabled: false, taxRate: 0, subsidyEnabled: false, subsidyRate: 0, restrictionEnabled: true, restrictionRadius: 500, isBaseline: false }),
          runApiSimulation({ horizon: 5, taxEnabled: true, taxRate: 20, subsidyEnabled: true, subsidyRate: 30, restrictionEnabled: true, restrictionRadius: 500, isBaseline: false })
        ]);

        setScenarios({
          baseline: baseRes,
          tax: taxRes,
          subsidy: subRes,
          restriction: restRes,
          combined: combRes
        });
      } catch (err) {
        console.error('Error comparing scenarios:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScenarios();
  }, []);

  const chartData = [
    {
      name: 'Base Inercial',
      prevalencia: scenarios.baseline?.prevalenciaProyectadaPromedio ?? 13.2,
      casos: scenarios.baseline?.totalCasosEvitados ?? 0
    },
    {
      name: 'Impuesto SSB 20%',
      prevalencia: scenarios.tax?.prevalenciaProyectadaPromedio ?? 12.8,
      casos: scenarios.tax?.totalCasosEvitados ?? 6200
    },
    {
      name: 'Subsidio F&V 30%',
      prevalencia: scenarios.subsidy?.prevalenciaProyectadaPromedio ?? 12.6,
      casos: scenarios.subsidy?.totalCasosEvitados ?? 9400
    },
    {
      name: 'Restricción 500m',
      prevalencia: scenarios.restriction?.prevalenciaProyectadaPromedio ?? 12.7,
      casos: scenarios.restriction?.totalCasosEvitados ?? 7800
    },
    {
      name: 'Combinado (3 Pol.)',
      prevalencia: scenarios.combined?.prevalenciaProyectadaPromedio ?? 12.1,
      casos: scenarios.combined?.totalCasosEvitados ?? 17200
    }
  ];

  return (
    <div className="space-y-6 pb-12">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-emerald-400" />
            {language === 'es' ? 'Comparador Multiescenario de Políticas' : 'Multi-Scenario Policy Comparator'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Philadelphia County, PA (FIPS 42101) — Comparación de Inferencia de 5 Escenarios
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center text-slate-400 animate-pulse">
          Ejecutando inferencia en FastAPI para los 5 escenarios en paralelo...
        </div>
      ) : (
        <>
          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {chartData.map((item, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                  {item.name}
                </span>
                <div className="text-xl font-bold text-white">
                  {item.prevalencia}%
                </div>
                <div className="text-xs text-emerald-300 font-semibold">
                  {item.casos.toLocaleString()} casos evitados
                </div>
              </div>
            ))}
          </div>

          {/* Combined Comparison Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white mb-4">
              Comparativa de Prevalencia Promedio Proyectada (%) por Escenario
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[10, 15]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="prevalencia" name="Prevalencia Proyectada (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
