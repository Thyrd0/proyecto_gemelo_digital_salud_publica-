import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, ArrowRight, ShieldAlert, CheckCircle2, Split, Filter } from 'lucide-react';

const PIPELINE_STEPS = [
  { step: 1, title: 'Carga de Datasets', desc: 'Lectura de archivos raw CDC PLACES 2022, USDA FARA y TIGER/Line.' },
  { step: 2, title: 'Inspección Estructural', desc: 'Verificación de columnas, tipos de datos y esquema preliminar.' },
  { step: 3, title: 'Tipificación Forzada', desc: 'Conversión de GEOID y CountyFIPS a string de 11 y 5 dígitos respectivamente.' },
  { step: 4, title: 'Deduplicación', desc: 'Eliminación de registros duplicados basados en la clave primaria GEOID.' },
  { step: 5, title: 'Tratamiento de Nulos', desc: 'Imputación con mediana para predictores cuantitativos en el pipeline scikit-learn.' },
  { step: 6, title: 'Validación de GEOID', desc: 'Verificación del formato FIPS estándar (42101xxxxxx para Philadelphia).' },
  { step: 7, title: 'Integración Espacial y Tabular', desc: 'Merge por GEOID entre datos de salud, nutrición y polígonos TIGER.' },
  { step: 8, title: 'Exclusión Territorial (Split)', desc: 'Reserva exclusiva de los 384 tractos de Philadelphia como dataset de evaluación externa.' },
  { step: 9, title: 'Selección de Predictores', desc: 'Selección de variables socioeconómicas y del entorno alimentario (excluyendo GEOID).' },
  { step: 10, title: 'Generación del Dataset Final', desc: 'Construcción de us_urban_tracts_modeling.csv (entrenamiento) y philadelphia_tracts_analysis.csv.' }
];

const QUALITY_RULES = [
  { rule: 'Filtro Urbano', criteria: 'Urban == 1', count: '54,277 tractos urbanos EE. UU.', action: 'Incluidos en entrenamiento nacional' },
  { rule: 'Reserva Philadelphia', criteria: 'CountyFIPS == 42101', count: '384 tractos censales', action: 'Excluidos de entrenamiento, reservados para test' },
  { rule: 'Exclusión de GEOID', criteria: 'GEOID en predictores', count: '100 % de modelos', action: 'Descartado como predictor para evitar memorización de ID' },
  { rule: 'Imputación de Faltantes', criteria: 'Valores NaN / nulos', count: 'SimpleImputer(strategy="median")', action: 'Aplicado en pipeline reproducible sin data leakage' },
  { rule: 'Reproducibilidad', criteria: 'Semilla aleatoria', count: 'random_state = 42', action: 'Aplicado en división y algoritmos estocásticos' }
];

export const DataPreparationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-turquoise-400" />
          {t('prep.title')}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t('prep.subtitle')}
        </p>
      </div>

      {/* Split Notice Banner */}
      <div className="bg-slate-900/90 border border-turquoise-500/40 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-turquoise-400 uppercase tracking-wider flex items-center gap-2">
          <Split className="w-5 h-5 text-turquoise-400" />
          {t('prep.splitNoticeTitle')}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {t('prep.splitNoticeText')}
        </p>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800 flex-wrap">
          <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-200">
            Train: US Urban (54,277 tractos)
          </span>
          <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-turquoise-300">
            External Test: Philadelphia County (384 tractos)
          </span>
          <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-amber-300">
            Grouping: CountyFIPS (GroupKFold)
          </span>
        </div>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-turquoise-400" />
          {t('prep.flowTitle')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {PIPELINE_STEPS.map((s) => (
            <div key={s.step} className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="w-5 h-5 rounded-full bg-turquoise-500/20 text-turquoise-300 text-[10px] font-bold flex items-center justify-center border border-turquoise-500/40">
                    {s.step}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">{s.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Quality Rules Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-turquoise-400" />
          {t('prep.rulesTitle')}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Regla de Calidad</th>
                <th className="py-2.5 px-3">Criterio / Condición</th>
                <th className="py-2.5 px-3">Volumen / Parámetro</th>
                <th className="py-2.5 px-3">Acción Aplicada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {QUALITY_RULES.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{row.rule}</td>
                  <td className="py-2.5 px-3 font-mono text-turquoise-300">{row.criteria}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.count}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Readonly Warning */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 italic text-center">
        Nota: Esta interfaz es de consulta y seguimiento metodológico. Los pipelines de preparación de datos se ejecutan en Python reproducible y no alteran directamente las fuentes de datos desde el navegador.
      </div>
    </div>
  );
};
