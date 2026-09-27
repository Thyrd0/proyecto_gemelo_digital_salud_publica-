import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, FileSpreadsheet, Map, Hash, AlertCircle, CheckCircle } from 'lucide-react';

interface DataSourceInfo {
  name: string;
  year: string;
  granularity: string;
  records: string;
  coverage: string;
  variables: string[];
  limitations: string;
  provenance: string;
}

const DATA_SOURCES: DataSourceInfo[] = [
  {
    name: 'CDC PLACES (Local Data for Better Health)',
    year: '2022 Release (Datos 2020-2021)',
    granularity: 'Tracto Censal (Census Tract)',
    records: '384 tractos (Philadelphia) / 54,277 (EE. UU. Urbano)',
    coverage: 'Nacional y Condado de Philadelphia (FIPS 42101)',
    variables: ['OBESITY_CrudePrev (Prevalencia bruta de obesidad)', 'DIABETES_CrudePrev (Prevalencia bruta de diabetes)'],
    limitations: 'Estimaciones basadas en modelo multinivel (BRFSS), no son censos directos de medición de peso/talla.',
    provenance: 'Centers for Disease Control and Prevention (CDC) - Registro Público Oficial'
  },
  {
    name: 'USDA Food Access Research Atlas (FARA)',
    year: '2019',
    granularity: 'Tracto Censal',
    records: '384 tractos (Philadelphia) / 54,277 (EE. UU.)',
    coverage: 'Condado de Philadelphia y EE. UU.',
    variables: ['LILATracts_1And10', 'LILATracts_halfAnd10', 'HUNVFlag', 'lapophalfshare', 'lalowihalfshare', 'lahunvhalfshare', 'food_retail_proximity_proxy'],
    limitations: 'Basado en censos de supermercados de 2019; no registra tiendas de conveniencia locales informales.',
    provenance: 'United States Department of Agriculture (USDA-ERS)'
  },
  {
    name: 'US Census Bureau TIGER/Line Shapefiles',
    year: '2019 / ACS 2018-2022',
    granularity: 'Tracto Censal (Límites Poligonales)',
    records: '384 polígonos tracto (GEOID 11 dígitos)',
    coverage: 'Philadelphia County, Pennsylvania',
    variables: ['GEOID', 'CountyFIPS (42101)', 'Pop2010', 'PovertyRate', 'MedianFamilyIncome', 'OHU2010', 'TractHUNV', 'TractSNAP', 'no_vehicle_household_share', 'snap_household_share'],
    limitations: 'Geometrías simplificadas para renderizado vectorial web.',
    provenance: 'US Census Bureau TIGER/Line Database'
  },
  {
    name: 'Distritos de Planificación de Philadelphia',
    year: '2020',
    granularity: 'Agrupación de Tractos Censales (18 Distritos)',
    records: '18 distritos oficiales',
    coverage: 'Philadelphia County',
    variables: ['Planning_District_Name', 'District_ID'],
    limitations: 'Nombres agregados de distritos de planificación municipal para referencia comunitaria.',
    provenance: 'Philadelphia City Planning Commission (PCPC)'
  }
];

const VARIABLE_SCHEMA = [
  { name: 'GEOID', type: 'String (11 dígitos)', role: 'Identificador Técnico', desc: 'FIPS único de tracto (ej. 42101000100). No usado como predictor.' },
  { name: 'CountyFIPS', type: 'String (5 dígitos)', role: 'Grupo Territorial', desc: 'Identificador de condado (ej. 42101 para Philadelphia). Usado para GroupKFold.' },
  { name: 'OBESITY_CrudePrev', type: 'Float (%)', role: 'Variable Objetivo (Target)', desc: 'Prevalencia estimada de obesidad en adultos (%)' },
  { name: 'Urban', type: 'Integer (0/1)', role: 'Predictor', desc: 'Indicador de zona urbana' },
  { name: 'Pop2010', type: 'Float', role: 'Predictor', desc: 'Población total del tracto (Censo 2010)' },
  { name: 'PovertyRate', type: 'Float (%)', role: 'Predictor', desc: 'Porcentaje de población en situación de pobreza' },
  { name: 'MedianFamilyIncome', type: 'Float ($)', role: 'Predictor', desc: 'Ingreso familiar mediano en dólares' },
  { name: 'LowIncomeTracts', type: 'Integer (0/1)', role: 'Predictor', desc: 'Indicador USDA de tracto de bajos ingresos' },
  { name: 'HUNVFlag', type: 'Integer (0/1)', role: 'Predictor', desc: 'Tracto con alto porcentaje de hogares sin vehículo y bajo acceso' },
  { name: 'LILATracts_halfAnd10', type: 'Integer (0/1)', role: 'Predictor', desc: 'Bajos ingresos y bajo acceso a 0.5 millas' },
  { name: 'no_vehicle_household_share', type: 'Float (0-1)', role: 'Predictor', desc: 'Proporción de hogares sin vehículo propio' },
  { name: 'snap_household_share', type: 'Float (0-1)', role: 'Predictor', desc: 'Proporción de hogares beneficiarios de asistencia SNAP' },
  { name: 'food_retail_proximity_proxy', type: 'Float (0-1)', role: 'Predictor', desc: 'Proxy de accesibilidad física a tiendas de alimentos' }
];

export const DataUnderstandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-turquoise-400" />
          {t('data.title')}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t('data.subtitle')}
        </p>
      </div>

      {/* Technical ID Notice */}
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex items-start gap-3">
        <Hash className="w-5 h-5 text-turquoise-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-100 mr-1">Aviso sobre Identificadores GEOID:</span>
          {t('data.geoidNote')}
        </div>
      </div>

      {/* Data Sources Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-turquoise-400" />
          {t('data.sourcesTitle')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_SOURCES.map((source, idx) => (
            <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-100">{source.name}</h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-turquoise-300 border border-slate-700">
                  {source.year}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Granularidad:</span>
                  <p className="text-slate-300 font-medium">{source.granularity}</p>
                </div>
                <div>
                  <span className="text-slate-500">Registros:</span>
                  <p className="text-slate-300 font-medium">{source.records}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500">Variables principales:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {source.variables.map((v, vIdx) => (
                    <span key={vIdx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2 space-y-1">
                <p><strong className="text-slate-300">Cobertura:</strong> {source.coverage}</p>
                <p><strong className="text-slate-300">Procedencia:</strong> {source.provenance}</p>
                <p><strong className="text-amber-400">Limitación:</strong> {source.limitations}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variables Schema Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Map className="w-4 h-4 text-turquoise-400" />
          {t('data.variablesTitle')}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {VARIABLE_SCHEMA.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-turquoise-300">{row.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.type}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      row.role.includes('Objetivo') 
                        ? 'bg-purple-950 text-purple-300 border-purple-600/40'
                        : row.role.includes('Técnico') || row.role.includes('Grupo')
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-600/40'
                    }`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
