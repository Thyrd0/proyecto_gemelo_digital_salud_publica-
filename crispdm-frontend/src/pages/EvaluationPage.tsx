import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Upload, Trash2, CheckCircle2, AlertTriangle, FileJson, Info } from 'lucide-react';
import { usePhaseProgress } from '../context/PhaseProgressContext';
import { TrainingSummaryJSON } from '../types/crispdm';

const VERIFIED_DEFAULT_CV_METRICS = [
  { name: 'DummyRegressor', mean_mae: 2.8371, std_mae: 0.0926, mean_rmse: 3.7847, mean_r2: -0.0041, winner: false },
  { name: 'Ridge', mean_mae: 1.8821, std_mae: 0.0513, mean_rmse: 2.5775, mean_r2: 0.5340, winner: false },
  { name: 'RandomForestRegressor', mean_mae: 1.7072, std_mae: 0.0455, mean_rmse: 2.3490, mean_r2: 0.6126, winner: false },
  { name: 'HistGradientBoostingRegressor', mean_mae: 1.6932, std_mae: 0.0394, mean_rmse: 2.3240, mean_r2: 0.6207, winner: true }
];

const VERIFIED_PHILLY_EXTERNAL_METRICS = {
  sample_size: 384,
  mae: 2.3229,
  rmse: 3.1613,
  r2: 0.6091
};

export const EvaluationPage: React.FC = () => {
  const { t } = useTranslation();
  const { importedSummary, setImportedSummary, clearImportedSummary } = usePhaseProgress();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text) as TrainingSummaryJSON;

        if (!json.selectedModel || (!json.metrics && !json.models)) {
          throw new Error('Estructura JSON inválida. Faltan campos de modelos o métricas.');
        }

        setImportedSummary(json);
      } catch (err: any) {
        setErrorMsg(`Error al procesar el archivo: ${err.message || 'JSON inválido'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-turquoise-400" />
          {t('evaluation.title')}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t('evaluation.subtitle')}
        </p>
      </div>

      {/* Import JSON Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-turquoise-400 uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {t('evaluation.importTitle')}
          </h3>

          {importedSummary && (
            <button
              onClick={clearImportedSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/40 hover:bg-rose-900 transition-colors"
              id="clear-imported-summary-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('evaluation.removeImport')}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {t('evaluation.importDesc')}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-sm">
            <FileJson className="w-4 h-4 text-turquoise-400" />
            <span>{t('evaluation.selectFile')}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="json-file-input"
            />
          </label>

          {importedSummary ? (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Resumen cargado: {importedSummary.selectedModel} ({importedSummary.trainingDate || 'Reciente'})
            </span>
          ) : (
            <span className="text-xs text-slate-500 italic">
              Sin archivo importado (Mostrando métricas verificadas V2.1 por defecto)
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Cross Validation Metrics Comparison Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-turquoise-400" />
          {t('evaluation.metricsComparison')}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Algoritmo</th>
                <th className="py-2.5 px-3">MAE Medio (± DE)</th>
                <th className="py-2.5 px-3">RMSE Medio</th>
                <th className="py-2.5 px-3">R² Medio</th>
                <th className="py-2.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {importedSummary?.models && importedSummary.models.length > 0 ? (
                importedSummary.models.map((m, idx) => {
                  const isSelected = m.name === importedSummary.selectedModel;
                  return (
                    <tr key={idx} className={isSelected ? 'bg-turquoise-950/20 font-bold' : ''}>
                      <td className="py-2.5 px-3 font-mono text-slate-100">{m.name}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {m.metrics.mean_mae?.toFixed(4) || m.metrics.mae?.toFixed(4) || 'N/A'} 
                        {m.metrics.std_mae ? ` ± ${m.metrics.std_mae.toFixed(4)}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {m.metrics.mean_rmse?.toFixed(4) || m.metrics.rmse?.toFixed(4) || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {m.metrics.mean_r2?.toFixed(4) || m.metrics.r2?.toFixed(4) || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            Modelo Seleccionado
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Evaluado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                VERIFIED_DEFAULT_CV_METRICS.map((m, idx) => (
                  <tr key={idx} className={m.winner ? 'bg-turquoise-950/20 font-bold' : ''}>
                    <td className="py-2.5 px-3 font-mono text-slate-100">{m.name}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.mean_mae.toFixed(4)} ± {m.std_mae.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.mean_rmse.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.mean_r2.toFixed(4)}</td>
                    <td className="py-2.5 px-3">
                      {m.winner ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          Ganador V2.1
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Evaluado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Evaluation in Philadelphia */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-turquoise-400" />
          {t('evaluation.phillyEvaluation')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">Tractos Evaluados</span>
            <p className="text-lg font-bold text-slate-100 mt-1">
              {importedSummary?.phillyExternalMetrics ? '384' : VERIFIED_PHILLY_EXTERNAL_METRICS.sample_size}
            </p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">MAE Externa</span>
            <p className="text-lg font-bold text-turquoise-400 mt-1">
              {importedSummary?.phillyExternalMetrics?.mae?.toFixed(4) || VERIFIED_PHILLY_EXTERNAL_METRICS.mae.toFixed(4)}
            </p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">RMSE Externa</span>
            <p className="text-lg font-bold text-slate-100 mt-1">
              {importedSummary?.phillyExternalMetrics?.rmse?.toFixed(4) || VERIFIED_PHILLY_EXTERNAL_METRICS.rmse.toFixed(4)}
            </p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">R² Externo</span>
            <p className="text-lg font-bold text-turquoise-400 mt-1">
              {importedSummary?.phillyExternalMetrics?.r2?.toFixed(4) || VERIFIED_PHILLY_EXTERNAL_METRICS.r2.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Technical vs Epidemiological Validation Notice */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          {t('evaluation.validationNoteTitle')}
        </h3>
        <p className="text-xs text-amber-200/90 leading-relaxed">
          {t('evaluation.validationNoteText')}
        </p>
      </div>
    </div>
  );
};
