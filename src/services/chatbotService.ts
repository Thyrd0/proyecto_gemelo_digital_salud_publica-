import { SimulationSummary } from '../types';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export async function generateChatbotResponse(
  userQuery: string,
  history: ChatMessage[],
  summary?: SimulationSummary,
  language: 'es' | 'en' = 'es'
): Promise<string> {
  const isEs = language === 'es';

  // Try calling FastAPI chatbot endpoint proxy
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userQuery, language })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return data.reply;
      }
    }
  } catch (err) {
    console.warn('[ChatbotService] FastAPI proxy unavailable, using local domain knowledge response.', err);
  }

  // Local domain response based on real V2.1 methodology
  const queryLower = userQuery.toLowerCase().trim();

  if (queryLower.includes('impuesto') || queryLower.includes('bebida') || queryLower.includes('azucar') || queryLower.includes('tax')) {
    return isEs
      ? `🥤 **Política A: Impuesto a Bebidas Azucaradas (Escenario Sensibilidad V2.1)**\n` +
        `Analiza la respuesta paramétrica exploratoria basada en la elasticidad precio (-1.21, Powell et al. 2013). ` +
        `CDC PLACES 2022 y USDA FARA 2019 no miden ventas ni consumo individual de bebidas.`
      : `🥤 **Policy A: Sugar-Sweetened Beverage Tax (V2.1 Sensitivity Scenario)**\n` +
        `Evaluates parametric response based on price elasticity (-1.21). ` +
        `CDC PLACES 2022 and USDA FARA 2019 do not track individual SSB purchases.`;
  }

  if (queryLower.includes('subsidio') || queryLower.includes('fruta') || queryLower.includes('verdura') || queryLower.includes('subsidy')) {
    return isEs
      ? `🍎 **Política B: Subsidio a Frutas y Verduras (Escenario Sensibilidad V2.1)**\n` +
        `Modula el proxy de proximidad alimentaria derivado del USDA Food Access Research Atlas 2019. ` +
        `Permite estimar variaciones condicionales bajo supuestos dietéticos.`
      : `🍎 **Policy B: Produce Subsidy (V2.1 Sensitivity Scenario)**\n` +
        `Modulates food retail proximity proxy derived from USDA FARA 2019.`;
  }

  if (queryLower.includes('escuela') || queryLower.includes('restriccion') || queryLower.includes('comida rapida') || queryLower.includes('school')) {
    return isEs
      ? `🏫 **Política C: Restricción de Comida Rápida (Desactivada en V2.1)**\n` +
        `Esta política requiere ubicaciones verificadas de escuelas y establecimientos de comida rápida. ` +
        `No se encuentra operacionalizada con los tres datasets de V2.1.`
      : `🏫 **Policy C: Fast-Food School Buffer Zones (Deactivated in V2.1)**\n` +
        `This policy requires verified point locations for schools and fast-food venues, which are absent in V2.1.`;
  }

  if (isEs) {
    return `🤖 **Asistente NutriTwin AI V2.1 (Datos Públicos Reales)**:\n` +
      `Basado en **CDC PLACES 2022**, **USDA FARA 2019** y polígonos **TIGER/Line 2019** de Philadelphia (FIPS 42101).\n` +
      `¿En qué puedo ayudarte? Puedes consultar metodologías, métricas de validación cruzada o configuración de escenarios.`;
  } else {
    return `🤖 **NutriTwin AI Assistant V2.1 (Real Public Data)**:\n` +
      `Powered by **CDC PLACES 2022**, **USDA FARA 2019**, and **TIGER/Line 2019** census tract polygons for Philadelphia County, PA.\n` +
      `How can I assist you with methodology or scenarios?`;
  }
}
