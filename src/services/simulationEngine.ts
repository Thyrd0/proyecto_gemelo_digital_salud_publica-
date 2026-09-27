import { PolicyConfig, SimulationSummary } from '../types';
import { runApiSimulation } from './apiClient';

/**
 * Motor de Simulación V2.1 — Conectado a FastAPI Real Data Backend.
 */
export async function runSimulationV2_1(config: PolicyConfig): Promise<SimulationSummary> {
  return await runApiSimulation(config);
}
