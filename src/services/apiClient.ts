import { SimulationSummary, PolicyConfig, CensusTract } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DataStatus {
  status: string;
  territory: string;
  fips: string;
  total_tracts: number;
  official_sources: string[];
}

export interface ModelInfo {
  model_name: string;
  primary_metric: string;
  best_cv_mae: number;
  best_cv_rmse: number;
  best_cv_r2: number;
  train_samples: number;
  fips_territory: string;
}

export async function fetchHealthStatus(): Promise<{ status: string; model_loaded: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.warn('[ApiClient] Backend health check failed, offline mode.', err);
    return { status: 'offline', model_loaded: false };
  }
}

export async function fetchDataStatus(): Promise<DataStatus> {
  const res = await fetch(`${API_BASE_URL}/api/v1/data/status`);
  if (!res.ok) throw new Error('Failed to fetch data status');
  return await res.json();
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE_URL}/api/v1/model/info`);
  if (!res.ok) throw new Error('Failed to fetch model info');
  return await res.json();
}

export async function fetchTracts(): Promise<CensusTract[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tracts`);
  if (!res.ok) throw new Error('Failed to fetch census tracts');
  const data = await res.json();
  return data.tracts || [];
}

export async function runApiSimulation(config: PolicyConfig): Promise<SimulationSummary> {
  const payload = {
    horizon: config.horizon,
    taxEnabled: config.taxEnabled,
    taxRate: config.taxRate,
    subsidyEnabled: config.subsidyEnabled,
    subsidyRate: config.subsidyRate,
    restrictionEnabled: config.restrictionEnabled,
    restrictionRadius: config.restrictionRadius,
    isBaseline: config.isBaseline
  };

  const res = await fetch(`${API_BASE_URL}/api/v1/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Simulation API request failed');
  }

  return await res.json();
}

export async function sendChatMessage(message: string, language: string = 'es'): Promise<{ reply: string; source: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language })
  });

  if (!res.ok) {
    throw new Error('Chat API request failed');
  }

  return await res.json();
}
