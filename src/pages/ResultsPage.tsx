import React, { useState, useEffect, useMemo } from 'react';
import { CensusTract, TractSimulationResult } from '../types';
import { fetchTracts, runApiSimulation } from '../services/apiClient';
import { 
  Download, 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  Database,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function ResultsPage() {
  const { t, language } = useLanguage();
  const [tracts, setTracts] = useState<CensusTract[]>([]);
  const [simulationResults, setSimulationResults] = useState<TractSimulationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('ALL');
  const [sortField, setSortField] = useState<string>('geoid');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const rawTracts = await fetchTracts();
        setTracts(rawTracts);
        // Default simulation run
        const summary = await runApiSimulation({
          horizon: 5,
          taxEnabled: true,
          taxRate: 20,
          subsidyEnabled: true,
          subsidyRate: 30,
          restrictionEnabled: true,
          restrictionRadius: 500,
          isBaseline: false
        });
        setSimulationResults(summary.tracts);
      } catch (err) {
        console.error('Error fetching results:', err);
      }
    }
    loadData();
  }, []);

  const displayData = simulationResults.length > 0 ? simulationResults : tracts;

  const neighborhoods = useMemo(() => {
    return Array.from(new Set(displayData.map((d: any) => d.neighborhood || 'Philadelphia'))).sort();
  }, [displayData]);

  const filteredData = useMemo(() => {
    return displayData.filter((item: any) => {
      const matchSearch = item.geoid.includes(searchTerm) || item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNeigh = selectedNeighborhood === 'ALL' || item.neighborhood === selectedNeighborhood;
      return matchSearch && matchNeigh;
    }).sort((a: any, b: any) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [displayData, searchTerm, selectedNeighborhood, sortField, sortAsc]);

  const handleExportCSV = () => {
    const headers = ['geoid', 'nombre', 'neighborhood', 'poblacion', 'prevalenciaInicial', 'prevalenciaProyectada', 'diferenciaAbsoluta', 'casosEvitados'];
    const rows = filteredData.map((d: any) => [
      d.geoid,
      `"${d.nombre}"`,
      `"${d.neighborhood || ''}"`,
      d.poblacion,
      d.prevalenciaInicial ?? d.prevalenciaDiabetesInicial,
      d.prevalenciaProyectada ?? d.prevalenciaDiabetesInicial,
      d.diferenciaAbsoluta ?? 0,
      d.casosEvitados ?? 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `philadelphia_tract_results_fips42101.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Tabla de Resultados por Tracto Censal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Philadelphia County, PA (FIPS 42101) — 384 Tractos Censales
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar Resultados CSV
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por GEOID o Nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">Todos los Distritos ({displayData.length})</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortField('geoid'); setSortAsc(!sortAsc); }}>
                  GEOID <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-4 py-3">Nombre del Tracto</th>
                <th className="px-4 py-3">Población</th>
                <th className="px-4 py-3">Ingreso Mediano</th>
                <th className="px-4 py-3">Prevalencia CDC (%)</th>
                <th className="px-4 py-3">Proyectada (%)</th>
                <th className="px-4 py-3">Diferencia (pp)</th>
                <th className="px-4 py-3">Casos Evitados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredData.map((item: any) => (
                <tr key={item.geoid} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2.5 text-emerald-400 font-bold">{item.geoid}</td>
                  <td className="px-4 py-2.5 font-sans font-medium text-slate-200">{item.nombre}</td>
                  <td className="px-4 py-2.5">{item.poblacion?.toLocaleString()}</td>
                  <td className="px-4 py-2.5">${item.ingresoMedio?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-amber-300">{item.prevalenciaInicial ?? item.prevalenciaDiabetesInicial}%</td>
                  <td className="px-4 py-2.5 text-emerald-400 font-bold">{item.prevalenciaProyectada ?? item.prevalenciaDiabetesInicial}%</td>
                  <td className="px-4 py-2.5 text-emerald-300">-{item.diferenciaAbsoluta ?? 0} pp</td>
                  <td className="px-4 py-2.5 text-white font-bold">{item.casosEvitados ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
