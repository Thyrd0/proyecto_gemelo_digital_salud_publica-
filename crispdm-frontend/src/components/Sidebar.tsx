import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Briefcase, 
  Database, 
  Wrench, 
  Cpu, 
  BarChart3, 
  Rocket, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Bot,
  Sparkles,
  X
} from 'lucide-react';
import { usePhaseProgress } from '../context/PhaseProgressContext';
import { getStatusBadgeStyle, getStatusIcon } from './ProgressStepper';
import { PhaseKey } from '../types/crispdm';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ElementType;
  phaseKey?: PhaseKey;
  isSpecial?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'nav.dashboard', icon: Home },
  { path: '/comprension-negocio', labelKey: 'nav.business_understanding', icon: Briefcase, phaseKey: 'comprension_negocio' },
  { path: '/comprension-datos', labelKey: 'nav.data_understanding', icon: Database, phaseKey: 'comprension_datos' },
  { path: '/preparacion-datos', labelKey: 'nav.data_preparation', icon: Wrench, phaseKey: 'preparacion_datos' },
  { path: '/modelado', labelKey: 'nav.modeling', icon: Cpu, phaseKey: 'modelado' },
  { path: '/evaluacion', labelKey: 'nav.evaluation', icon: BarChart3, phaseKey: 'evaluacion' },
  { path: '/despliegue', labelKey: 'nav.deployment', icon: Rocket, phaseKey: 'despliegue' },
  { path: '/copiloto', labelKey: 'nav.copilot', icon: Bot, isSpecial: true },
];


export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile
}) => {
  const { t } = useTranslation();
  const { statuses } = usePhaseProgress();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}
      >
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-turquoise-500 to-sky-600 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-lg shadow-turquoise-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-100 tracking-tight leading-tight truncate">
                  Urban Food Twin
                </span>
                <span className="text-[11px] font-semibold text-turquoise-400 leading-none mt-0.5 truncate">
                  CRISP-DM
                </span>
              </div>
            )}
          </div>

          {/* Close Mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Subtitle & Academic Badge (Desktop expanded) */}
        {(!isCollapsed || isOpen) && (
          <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800/80">
            <p className="text-[11px] text-slate-400 leading-snug">
              {t('systemSubtitle')}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-turquoise-950/80 text-turquoise-300 border border-turquoise-500/30">
              <ShieldCheck className="w-3 h-3 text-turquoise-400" />
              {t('academicTag')}
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const status = item.phaseKey ? statuses[item.phaseKey] : null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-turquoise-500/10 text-turquoise-300 border border-turquoise-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-turquoise-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />

                    {(!isCollapsed || isOpen) && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{t(item.labelKey)}</span>
                        {status && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded border shrink-0 ml-1 ${getStatusBadgeStyle(status)}`}>
                            {getStatusIcon(status)}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Collapse Toggle (Desktop only) */}
        <div className="p-3 border-t border-slate-800 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs font-medium"
            id="collapse-sidebar-button"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Contraer menú</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
