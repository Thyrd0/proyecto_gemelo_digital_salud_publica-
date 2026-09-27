import { SavedScenario, SimulationSummary } from '../types';

const STORAGE_KEY = 'urban_food_twin_saved_scenarios_v1';
export const MAX_SAVED_SCENARIOS = 3;

export function getSavedScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error al leer escenarios de localStorage:', err);
    return [];
  }
}

export function saveScenario(name: string, summary: SimulationSummary): { success: boolean; message: string; scenarios: SavedScenario[] } {
  const current = getSavedScenarios();

  if (current.length >= MAX_SAVED_SCENARIOS) {
    return {
      success: false,
      message: `Límite alcanzado: Ya existen ${MAX_SAVED_SCENARIOS} escenarios guardados. Debes eliminar uno antes de guardar uno nuevo.`,
      scenarios: current
    };
  }

  const newScenario: SavedScenario = {
    id: `SCENARIO-${Date.now()}`,
    nombre: name.trim() || `Escenario ${current.length + 1}`,
    fecha: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    config: summary.config,
    prevalenciaProyectadaPromedio: summary.prevalenciaProyectadaPromedio,
    diferenciaEstimadaPromedio: summary.diferenciaAbsolutaPromedio,
    totalCasosEvitados: summary.totalCasosEvitados,
    resumenVulnerabilidad: summary.porVulnerabilidad.map(v => ({
      vulnerabilidad: v.vulnerabilidad,
      diferencia: v.diferencia,
      casosEvitados: v.casosEvitados
    }))
  };

  const updated = [...current, newScenario];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return {
      success: true,
      message: 'Escenario guardado exitosamente en el comparador.',
      scenarios: updated
    };
  } catch (err) {
    return {
      success: false,
      message: 'Error al persistir el escenario en el almacenamiento local.',
      scenarios: current
    };
  }
}

export function deleteScenario(id: string): SavedScenario[] {
  const current = getSavedScenarios();
  const filtered = current.filter(s => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error al eliminar escenario:', err);
  }
  return filtered;
}

export function clearAllScenarios(): SavedScenario[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error al limpiar escenarios:', err);
  }
  return [];
}
