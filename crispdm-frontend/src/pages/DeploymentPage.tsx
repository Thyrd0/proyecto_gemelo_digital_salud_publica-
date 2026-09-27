import React from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, ArrowRight, ShieldCheck, Box, Server, CheckCircle2, AlertOctagon } from 'lucide-react';

const DEPLOYMENT_WORKFLOW = [
  { step: 1, name: 'Entrenamiento', desc: 'Entrenamiento en Streamlit usando 5-Fold GroupKFold por CountyFIPS.' },
  { step: 2, name: 'Evaluación Externa', desc: 'Prueba en 384 tractos censales reservados del condado de Philadelphia.' },
  { step: 3, name: 'Selección de Algoritmo', desc: 'Selección del modelo con menor MAE y mayor R² (HistGradientBoostingRegressor).' },
  { step: 4, name: 'Generación de Artefactos', desc: 'Persistencia de model_v2_1.joblib, model_metadata.json y feature_schema.json.' },
  { step: 5, name: 'Revisión Metodológica', desc: 'Verificación de restricciones de no causalidad y ausencia de data leakage.' },
  { step: 6, name: 'Promoción a API Backend', desc: 'Carga del artefacto en el servicio predictor de FastAPI (backend/app/services/predictor.py).' },
  { step: 7, name: 'Consumo por Gemelo Digital', desc: 'Frontend React 2D/3D consulta el endpoint POST /api/v1/simulate para proyectar escenarios.' },
  { step: 8, name: 'Seguimiento & Reentrenamiento', desc: 'Monitoreo de actualización de datos CDC PLACES y reentrenamiento periódico.' }
];

const MATURITY_LEVELS = [
  { level: 'Prototipo Académico', status: 'V2.2.0 (Activo)', color: 'bg-emerald-950 text-emerald-300 border-emerald-500/40', desc: 'Entorno de investigación y simulación exploratoria no clínica.' },
  { level: 'Modelo Entrenado', status: 'Completado', color: 'bg-sky-950 text-sky-300 border-sky-500/40', desc: 'Pipeline scikit-learn ajustado en 54,277 tractos urbanos.' },
  { level: 'Modelo Evaluado', status: 'Completado', color: 'bg-purple-950 text-purple-300 border-purple-500/40', desc: 'Evaluado externamente en Philadelphia (MAE 2.32, R² 0.61).' },
  { level: 'Modelo Promovido a API', status: 'Completado', color: 'bg-turquoise-950 text-turquoise-300 border-turquoise-500/40', desc: 'Servido mediante FastAPI en endpoint /api/v1/simulate.' },
  { level: 'Modelo Clínicamente Validado', status: 'No Alcanzado / No Aplica', color: 'bg-rose-950 text-rose-300 border-rose-500/40', desc: 'Excluido expresamente. Los modelos son de correlación ecológica espacial, no aptos para diagnóstico ni prescripción clínica.' }
];

export const DeploymentPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Rocket className="w-6 h-6 text-turquoise-400" />
          {t('deployment.title')}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t('deployment.subtitle')}
        </p>
      </div>

      {/* Maturity Levels Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-turquoise-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {t('deployment.levelsTitle')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MATURITY_LEVELS.map((m, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-100">{m.level}</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${m.color}`}>
                  {m.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Workflow */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-turquoise-400" />
          {t('deployment.pipelineTitle')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEPLOYMENT_WORKFLOW.map((w) => (
            <div key={w.step} className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-turquoise-500/20 text-turquoise-300 text-[10px] font-bold flex items-center justify-center border border-turquoise-500/40">
                  {w.step}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">{w.name}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Integration Note */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Box className="w-4 h-4 text-turquoise-400" />
          {t('deployment.artefactsTitle')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700 space-y-1">
            <strong className="text-turquoise-300 block">artifacts/models/model_v2_1.joblib</strong>
            <span className="text-slate-400 text-[11px]">Pipeline HistGradientBoostingRegressor serializado para inferencia en tiempo real.</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded border border-slate-700 space-y-1">
            <strong className="text-turquoise-300 block">artifacts/metadata/model_metadata_v2_1.json</strong>
            <span className="text-slate-400 text-[11px]">Metadatos de versión, hiperparámetros, métricas CV y evaluación en Philadelphia.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
