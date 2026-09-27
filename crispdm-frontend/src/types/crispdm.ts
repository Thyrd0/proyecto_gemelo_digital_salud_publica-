export type PhaseStatus = 'Documentado' | 'Configurado' | 'Ejecutado' | 'Pendiente' | 'No disponible';

export type PhaseKey = 
  | 'comprension_negocio'
  | 'comprension_datos'
  | 'preparacion_datos'
  | 'modelado'
  | 'evaluacion'
  | 'despliegue';

export interface PhaseInfo {
  key: PhaseKey;
  id: number;
  titleKey: string;
  path: string;
  iconName: string;
  status: PhaseStatus;
  descriptionKey: string;
}

export interface ModelMetrics {
  mean_mae?: number;
  std_mae?: number;
  mean_rmse?: number;
  mean_r2?: number;
  maes_per_fold?: number[];
  mae?: number;
  rmse?: number;
  r2?: number;
}

export interface CandidateModelSummary {
  name: string;
  metrics: ModelMetrics;
}

export interface TrainingSummaryJSON {
  project: string;
  trainingDate: string;
  datasetVersion: string;
  target: string;
  predictors: string[];
  groupColumn: string;
  randomState: number;
  models: CandidateModelSummary[];
  selectedModel: string;
  metrics: ModelMetrics;
  phillyExternalMetrics?: {
    mae: number;
    rmse: number;
    r2: number;
  };
  warnings: string[];
}
