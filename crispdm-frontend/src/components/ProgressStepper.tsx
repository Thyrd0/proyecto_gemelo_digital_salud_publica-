import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePhaseProgress } from '../context/PhaseProgressContext';
import { PhaseKey, PhaseStatus } from '../types/crispdm';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, FileText, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface PhaseItem {
  key: PhaseKey;
  num: number;
  labelKey: string;
  path: string;
}

const PHASES: PhaseItem[] = [
  { key: 'comprension_negocio', num: 1, labelKey: 'nav.business_understanding', path: '/comprension-negocio' },
  { key: 'comprension_datos', num: 2, labelKey: 'nav.data_understanding', path: '/comprension-datos' },
  { key: 'preparacion_datos', num: 3, labelKey: 'nav.data_preparation', path: '/preparacion-datos' },
  { key: 'modelado', num: 4, labelKey: 'nav.modeling', path: '/modelado' },
  { key: 'evaluacion', num: 5, labelKey: 'nav.evaluation', path: '/evaluacion' },
  { key: 'despliegue', num: 6, labelKey: 'nav.deployment', path: '/despliegue' },
];

export const getStatusBadgeStyle = (status: PhaseStatus) => {
  switch (status) {
    case 'Documentado':
      return 'bg-sky-950/80 text-sky-300 border-sky-600/50';
    case 'Configurado':
      return 'bg-purple-950/80 text-purple-300 border-purple-600/50';
    case 'Ejecutado':
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';
    case 'Pendiente':
      return 'bg-amber-950/80 text-amber-300 border-amber-600/50';
    case 'No disponible':
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};

export const getStatusIcon = (status: PhaseStatus) => {
  switch (status) {
    case 'Documentado':
      return <FileText className="w-3.5 h-3.5" />;
    case 'Configurado':
      return <Settings className="w-3.5 h-3.5" />;
    case 'Ejecutado':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'Pendiente':
      return <Clock className="w-3.5 h-3.5" />;
    case 'No disponible':
    default:
      return <AlertCircle className="w-3.5 h-3.5" />;
  }
};

export const ProgressStepper: React.FC = () => {
  const { t } = useTranslation();
  const { statuses } = usePhaseProgress();
  const location = useLocation();

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 sm:p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-turquoise-400 animate-spin-slow" />
          {t('dashboard.phasesTitle')}
        </h3>
        <span className="text-xs text-slate-400 italic">
          {t('dashboard.iterativeNote')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {PHASES.map((phase) => {
          const status = statuses[phase.key] || 'No disponible';
          const isActive = location.pathname === phase.path;

          return (
            <Link
              key={phase.key}
              to={phase.path}
              className={`p-3 rounded-lg border transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-700/80 border-turquoise-500 shadow-md shadow-turquoise-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-turquoise-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {phase.num}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(status)}`}>
                    {getStatusIcon(status)}
                    {t(`status.${status}`)}
                  </span>
                </div>
                <h4 className="text-xs font-medium text-slate-200 line-clamp-2">
                  {t(phase.labelKey)}
                </h4>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
