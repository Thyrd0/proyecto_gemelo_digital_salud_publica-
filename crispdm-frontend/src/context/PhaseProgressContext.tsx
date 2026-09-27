import React, { createContext, useContext, useState, useEffect } from 'react';
import { PhaseKey, PhaseStatus, TrainingSummaryJSON } from '../types/crispdm';

export type PhaseStatusMap = Record<PhaseKey, PhaseStatus>;

const DEFAULT_STATUSES: PhaseStatusMap = {
  comprension_negocio: 'Documentado',
  comprension_datos: 'Documentado',
  preparacion_datos: 'Documentado',
  modelado: 'Configurado',
  evaluacion: 'Pendiente',
  despliegue: 'Documentado'
};

interface PhaseProgressContextType {
  statuses: PhaseStatusMap;
  updatePhaseStatus: (key: PhaseKey, status: PhaseStatus) => void;
  importedSummary: TrainingSummaryJSON | null;
  setImportedSummary: (summary: TrainingSummaryJSON | null) => void;
  clearImportedSummary: () => void;
}

const PhaseProgressContext = createContext<PhaseProgressContextType | undefined>(undefined);

export const PhaseProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [statuses, setStatuses] = useState<PhaseStatusMap>(() => {
    try {
      const saved = localStorage.getItem('crispdm_phase_statuses');
      return saved ? JSON.parse(saved) : DEFAULT_STATUSES;
    } catch {
      return DEFAULT_STATUSES;
    }
  });

  const [importedSummary, setImportedSummaryState] = useState<TrainingSummaryJSON | null>(() => {
    try {
      const saved = localStorage.getItem('crispdm_imported_summary');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('crispdm_phase_statuses', JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    if (importedSummary) {
      localStorage.setItem('crispdm_imported_summary', JSON.stringify(importedSummary));
      // Update evaluation status to Executed if imported summary exists
      setStatuses(prev => ({
        ...prev,
        evaluacion: 'Ejecutado',
        modelado: 'Ejecutado'
      }));
    } else {
      localStorage.removeItem('crispdm_imported_summary');
    }
  }, [importedSummary]);

  const updatePhaseStatus = (key: PhaseKey, status: PhaseStatus) => {
    setStatuses(prev => ({ ...prev, [key]: status }));
  };

  const setImportedSummary = (summary: TrainingSummaryJSON | null) => {
    setImportedSummaryState(summary);
  };

  const clearImportedSummary = () => {
    setImportedSummaryState(null);
    setStatuses(prev => ({
      ...prev,
      evaluacion: 'Pendiente'
    }));
  };

  return (
    <PhaseProgressContext.Provider value={{
      statuses,
      updatePhaseStatus,
      importedSummary,
      setImportedSummary,
      clearImportedSummary
    }}>
      {children}
    </PhaseProgressContext.Provider>
  );
};

export const usePhaseProgress = (): PhaseProgressContextType => {
  const context = useContext(PhaseProgressContext);
  if (!context) {
    throw new Error('usePhaseProgress must be used within a PhaseProgressProvider');
  }
  return context;
};
