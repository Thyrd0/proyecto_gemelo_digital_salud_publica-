import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressStepper } from '../components/ProgressStepper';
import { MetricCard } from '../components/MetricCard';
import { usePhaseProgress } from '../context/PhaseProgressContext';
import { Database, Target, Cpu, Clock, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { importedSummary } = usePhaseProgress();

  const activeModelName = importedSummary?.selectedModel || 'HistGradientBoostingRegressor (Default V2.1)';
  const lastTrainingDate = importedSummary?.trainingDate || t('dashboard.noTrainingAvailable');
  const targetVarName = importedSummary?.target || 'OBESITY_CrudePrev / diabetes_crude_prevalence';
  const datasetVersion = importedSummary?.datasetVersion || 'US Urban Tracts + Philadelphia Analysis V2.1';

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          {t('dashboard.title')}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t('systemSubtitle')}
        </p>
      </div>

      {/* Purpose Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-turquoise-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {t('dashboard.purposeTitle')}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {t('dashboard.purposeText')}
        </p>
      </div>

      {/* CRISP-DM Stepper */}
      <ProgressStepper />

      {/* System Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('dashboard.dataSource')}
          value="CDC PLACES & USDA"
          subtitle={datasetVersion}
          icon={<Database className="w-5 h-5" />}
          badge="2022 Release"
        />
        <MetricCard
          title={t('dashboard.targetVariable')}
          value="OBESITY"
          subtitle={targetVarName}
          icon={<Target className="w-5 h-5" />}
          badge="Tract Level"
          variant="accent"
        />
        <MetricCard
          title={t('dashboard.activeModel')}
          value={importedSummary?.selectedModel ? importedSummary.selectedModel.substring(0, 15) : 'HistGradient'}
          subtitle={activeModelName}
          icon={<Cpu className="w-5 h-5" />}
          badge={importedSummary ? 'Importado' : 'Por Defecto'}
          variant={importedSummary ? 'emerald' : 'default'}
        />
        <MetricCard
          title={t('dashboard.lastTraining')}
          value={importedSummary ? 'Verificado' : 'No disponible'}
          subtitle={lastTrainingDate}
          icon={<Clock className="w-5 h-5" />}
          badge={importedSummary ? 'Streamlit' : 'Pendiente'}
        />
      </div>

      {/* Quick Access Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">
          {t('dashboard.quickAccess')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/comprension-negocio"
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-turquoise-500/50 hover:bg-slate-800/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-turquoise-400">Fase 1</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-turquoise-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mb-1">Comprensión del Negocio</h4>
            <p className="text-xs text-slate-400">Problema de investigación, alcance territorial y escenarios de política pública.</p>
          </Link>

          <Link
            to="/modelado"
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-turquoise-500/50 hover:bg-slate-800/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-turquoise-400">Fase 4</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-turquoise-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mb-1">Módulo de Entrenamiento</h4>
            <p className="text-xs text-slate-400">Especificación de algoritmos y enlace al workbench interactivo de Streamlit.</p>
          </Link>

          <Link
            to="/evaluacion"
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-turquoise-500/50 hover:bg-slate-800/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-turquoise-400">Fase 5</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-turquoise-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mb-1">Evaluación e Importación</h4>
            <p className="text-xs text-slate-400">Importe 'training_summary.json' de Streamlit y compare métricas R², MAE y RMSE.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
