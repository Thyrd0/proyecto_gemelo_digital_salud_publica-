/**
 * CONFIGURACIÓN DE PARÁMETROS DEMOSTRATIVOS DE SIMULACIÓN
 * 
 * ⚠️ ADVERTENCIA CIENTÍFICA:
 * Estos coeficientes son demostrativos, no fueron calibrados empíricamente
 * y no representan efectos epidemiológicos reales ni relaciones causales comprobadas.
 * Se utilizan exclusivamente para ilustrar la mecánica computacional de un
 * prototipo de gemelo digital en el marco de la V1.
 */

export const DEMO_SIMULATION_CONFIG = {
  // Metadatos de la configuración
  version: 'V1.0-DEMO',
  disclaimer: 'Coeficientes demostrativos sintéticos no calibrados.',

  // Política A: Impuesto a Bebidas Azucaradas (Sugar-Sweetened Beverages)
  policyA_tax: {
    name: 'Impuesto a bebidas azucaradas',
    baseImpactFactor: 0.045, // Factor base de reducción de prevalencia por cada 10% de impuesto
    vulnerabilityMultiplier: {
      Baja: 0.85,
      Media: 1.00,
      Alta: 1.25 // Mayor sensibilidad al precio demostrativa en sectores vulnerables
    },
    defaultRate: 20, // 20%
    minRate: 0,
    maxRate: 30
  },

  // Política B: Subsidio a Frutas y Verduras (Healthy Food Subsidy)
  policyB_subsidy: {
    name: 'Subsidio a frutas y verduras',
    baseImpactFactor: 0.040, // Factor base por cada 10% de subsidio
    accessDeficitWeight: 0.70, // Mayor impacto demostrativo donde el acceso inicial es más bajo
    healthyAccessBoostFactor: 0.45, // Incremento en el índice de acceso saludable (0-100)
    defaultRate: 30, // 30%
    minRate: 0,
    maxRate: 40
  },

  // Política C: Restricción de Comida Rápida alrededor de Escuelas (Zoning Restrictions)
  policyC_restriction: {
    name: 'Restricción de comida rápida en entornos escolares',
    radiusEffect: {
      250: 0.55,
      500: 1.00,
      750: 1.45
    },
    baseImpactFactor: 0.035,
    fastFoodDensityWeight: 0.65, // Mayor impacto demostrativo en zonas con alta densidad inicial
    fastFoodReductionFactor: 0.28, // Reducción en la densidad percibida de comida rápida
    defaultRadius: 500 as const,
    options: [250, 500, 750] as const
  },

  // Factores temporales
  timeHorizonFactors: {
    5: 0.58,  // A los 5 años se alcanza aproximadamente el 58% de la adopción/impacto total
    10: 1.00  // A los 10 años se alcanza el 100% de la proyección
  },

  // Inercia natural del escenario base sin intervención (tendencia inercial anual)
  baselineAnnualDrift: 0.06 // Leve incremento inercial demostrativo anual en ausencia de intervenciones
};
