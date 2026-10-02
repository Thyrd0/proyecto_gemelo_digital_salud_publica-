import React from 'react';
import { 
  BookOpen, 
  Database, 
  Layers, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  ShieldAlert,
  GitBranch
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function MethodologyPage() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-6 pb-12">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Metodología Científica V2 (CRISP-DM)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gemelo Digital de Entornos Alimentarios Urbanos — Territorio Piloto: Philadelphia County, PA (FIPS 42101)
          </p>
        </div>
      </div>

      {/* 6 CRISP-DM Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">Fase 1</span>
            Comprensión del Negocio y Salud Pública
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Aborda la disparidad en la prevalencia de diabetes a nivel territorial en Philadelphia County. El objetivo analítico es proporcionar una plataforma exploratoria reproducible para comparar escenarios de política pública alimentaria.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">Fase 2</span>
            Comprensión de los Datos Oficiales
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Integración territorial mediante GEOIDs de 11 dígitos (FIPS 42101) de datos de <b>CDC PLACES 2023</b>, <b>ACS 5-Year (2018-2022)</b>, <b>USDA Food Access Research Atlas</b> y límites <b>TIGER/Line</b> para 384 tractos censales.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">Fase 3</span>
            Preparación de Datos y Feature Matrix
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Validación de formato GEOID, tratamiento de duplicados, alineación de censos, acotamiento de rangos físicos y normalización de características predictoras (ingreso, pobreza, educación, vehículos, acceso saludable y comida rápida).
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">Fase 4</span>
            Modelado y Comparación de Algoritmos
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Comparación rigurosa de 4 modelos: Baseline Mean, Regresión Ridge Regularizada, Random Forest Regressor e HistGradientBoosting. Evaluación mediante validación cruzada <b>GroupKFold por vecindario espacial</b>.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">Fase 5</span>
            Evaluación Científica
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Selección del modelo ganador basado prioritariamente en el Error Absoluto Medio (<b>MAE &lt; 0.85 pp</b>), complementado con RMSE y R² en el conjunto de validación sin fuga espacial.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-xs">Fase 6</span>
            Despliegue e Inferencia FastAPI
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Persistencia de modelo en <code>artifacts/models/model.joblib</code> y metadatos JSON. Exposición mediante API de inferencia en FastAPI y consumo reactivo por el frontend.
          </p>
        </div>
      </div>
    </div>
  );
}
