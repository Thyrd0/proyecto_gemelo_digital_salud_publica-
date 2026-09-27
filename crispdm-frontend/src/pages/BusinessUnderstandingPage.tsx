import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Target, MapPin, Users, AlertTriangle, Layers, HelpCircle } from 'lucide-react';

export const BusinessUnderstandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-turquoise-400" />
          {t('business.title')}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Fase 1 — Definición del problema epidemiológico, alcances, usuarios y escenarios
        </p>
      </div>

      {/* Problem & Objective Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-turquoise-400 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            {t('business.problemTitle')}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t('business.problemText')}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-turquoise-400 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" />
            {t('business.objectiveTitle')}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t('business.objectiveText')}
          </p>
        </div>
      </div>

      {/* Territorial Scope & Specs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-turquoise-400" />
          {t('business.scopeTitle')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">Territorio</span>
            <p className="text-sm font-bold text-slate-100 mt-1">{t('business.territorialScope')}</p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">Unidad de Análisis</span>
            <p className="text-sm font-bold text-slate-100 mt-1">{t('business.analysisUnit')}</p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">Variable Objetivo</span>
            <p className="text-sm font-bold text-slate-100 mt-1">{t('business.targetVarText')}</p>
          </div>
        </div>
      </div>

      {/* Policy Scenarios */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-turquoise-400" />
            {t('business.scenariosTitle')}
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/40 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Modelos asociativos — No causales
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/40">
              Escenario 0
            </span>
            <h4 className="text-sm font-bold text-slate-100 mt-2">{t('business.scenarioBase')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('business.scenarioBaseDesc')}</p>
          </div>

          {/* SSB Tax */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-turquoise-950 text-turquoise-300 border border-turquoise-600/40">
              Escenario 1
            </span>
            <h4 className="text-sm font-bold text-slate-100 mt-2">{t('business.scenarioTax')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('business.scenarioTaxDesc')}</p>
          </div>

          {/* Fruit/Veg Subsidy */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">
              Escenario 2
            </span>
            <h4 className="text-sm font-bold text-slate-100 mt-2">{t('business.scenarioSubsidy')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('business.scenarioSubsidyDesc')}</p>
          </div>

          {/* Combined */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600/40">
              Escenario 3
            </span>
            <h4 className="text-sm font-bold text-slate-100 mt-2">{t('business.scenarioCombined')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('business.scenarioCombinedDesc')}</p>
          </div>

          {/* Fast food buffer - Explicitly Planned - not executed */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 md:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-bold text-amber-200">{t('business.scenarioRestriction')}</h4>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                {t('business.scenarioRestrictionStatus')}
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-1">
              Desactivado en V2.2.0 debido a la falta de coordenadas georreferenciadas individuales de locales comerciales y escuelas en las fuentes públicas disponibles.
            </p>
          </div>
        </div>
      </div>

      {/* Intended Users & Limitations */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-turquoise-400" />
          {t('business.usersTitle')}
        </h3>
        <p className="text-sm text-slate-300">
          <strong>Usuarios previstos:</strong> {t('business.usersText')}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
          <strong>Limitaciones metodológicas:</strong> {t('business.limitationsText')}
        </p>
      </div>
    </div>
  );
};
