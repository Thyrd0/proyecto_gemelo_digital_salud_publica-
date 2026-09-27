export interface PointOfInterest {
  id: string;
  geoid: string;
  name: string;
  type: 'school' | 'fresh_market' | 'fast_food';
  // Offset coordinates relative to tract center (-1.5 to 1.5)
  offsetX: number;
  offsetZ: number;
  // Distance to closest school in meters
  distanceToSchool: number;
}

export interface UrbanFeature {
  type: 'waterway' | 'park' | 'highway';
  points: [number, number][];
}

export const POI_DATA: PointOfInterest[] = [
  // 42101000100
  { id: 'poi-1', geoid: '42101000100', name: 'Escuela Primaria Philadelphia Central', type: 'school', offsetX: -0.2, offsetZ: 0.1, distanceToSchool: 0 },
  { id: 'poi-2', geoid: '42101000100', name: 'Mercado Verde Central', type: 'fresh_market', offsetX: 0.3, offsetZ: -0.3, distanceToSchool: 320 },
  { id: 'poi-3', geoid: '42101000100', name: 'Eco-Supermercado Norte', type: 'fresh_market', offsetX: -0.4, offsetZ: 0.4, distanceToSchool: 410 },
  { id: 'poi-4', geoid: '42101000100', name: 'Burger Express Norte', type: 'fast_food', offsetX: 0.2, offsetZ: 0.2, distanceToSchool: 220 },

  // 42101000200
  { id: 'poi-5', geoid: '42101000200', name: 'Campus University City', type: 'school', offsetX: 0.0, offsetZ: 0.0, distanceToSchool: 0 },
  { id: 'poi-6', geoid: '42101000200', name: 'Frutería Universitaria', type: 'fresh_market', offsetX: -0.3, offsetZ: 0.2, distanceToSchool: 280 },
  { id: 'poi-7', geoid: '42101000200', name: 'Fast Bites Campus', type: 'fast_food', offsetX: 0.15, offsetZ: 0.1, distanceToSchool: 180 },
  { id: 'poi-8', geoid: '42101000200', name: 'Pizza & Wings Universitario', type: 'fast_food', offsetX: 0.35, offsetZ: -0.25, distanceToSchool: 460 },

  // 42101000300
  { id: 'poi-9', geoid: '42101000300', name: 'Instituto Técnico Industrial', type: 'school', offsetX: -0.1, offsetZ: -0.2, distanceToSchool: 0 },
  { id: 'poi-10', geoid: '42101000300', name: 'Minisuper Industrial', type: 'fresh_market', offsetX: 0.4, offsetZ: 0.3, distanceToSchool: 650 },
  { id: 'poi-11', geoid: '42101000300', name: 'Fried Chicken Central', type: 'fast_food', offsetX: -0.05, offsetZ: 0.1, distanceToSchool: 210 },
  { id: 'poi-12', geoid: '42101000300', name: 'Burger Station Este', type: 'fast_food', offsetX: 0.2, offsetZ: -0.15, distanceToSchool: 310 },

  // 42101000402
  { id: 'poi-13', geoid: '42101000402', name: 'Escuela Comunitaria Ribera', type: 'school', offsetX: 0.1, offsetZ: 0.1, distanceToSchool: 0 },
  { id: 'poi-14', geoid: '42101000402', name: 'Puesto Ribereño de Frutas', type: 'fresh_market', offsetX: -0.4, offsetZ: -0.3, distanceToSchool: 580 },
  { id: 'poi-15', geoid: '42101000402', name: 'Mega Snack Ribera', type: 'fast_food', offsetX: 0.15, offsetZ: 0.25, distanceToSchool: 190 },
  { id: 'poi-16', geoid: '42101000402', name: 'Tacos & Dogs 24h', type: 'fast_food', offsetX: -0.1, offsetZ: 0.2, distanceToSchool: 260 },

  // 42101000500
  { id: 'poi-17', geoid: '42101000500', name: 'Colegio West Philly', type: 'school', offsetX: 0.2, offsetZ: -0.1, distanceToSchool: 0 },
  { id: 'poi-18', geoid: '42101000500', name: 'Granja Orgánica Las Colinas', type: 'fresh_market', offsetX: -0.2, offsetZ: -0.3, distanceToSchool: 430 },
  { id: 'poi-19', geoid: '42101000500', name: 'Mercado Gourmet Oeste', type: 'fresh_market', offsetX: 0.1, offsetZ: 0.3, distanceToSchool: 390 },
  { id: 'poi-20', geoid: '42101000500', name: 'Boutique Burger', type: 'fast_food', offsetX: -0.3, offsetZ: 0.1, distanceToSchool: 520 },

  // 42101000600
  { id: 'poi-21', geoid: '42101000600', name: 'Liceo Center City', type: 'school', offsetX: -0.25, offsetZ: -0.15, distanceToSchool: 0 },
  { id: 'poi-22', geoid: '42101000600', name: 'Mercado Central de Abastos', type: 'fresh_market', offsetX: 0.3, offsetZ: 0.2, distanceToSchool: 510 },
  { id: 'poi-23', geoid: '42101000600', name: 'Cadena FastFood Plaza', type: 'fast_food', offsetX: -0.15, offsetZ: -0.05, distanceToSchool: 160 },
  { id: 'poi-24', geoid: '42101000600', name: 'Combo King Centro', type: 'fast_food', offsetX: 0.05, offsetZ: 0.1, distanceToSchool: 340 },
  { id: 'poi-25', geoid: '42101000600', name: 'Donut & Shake Express', type: 'fast_food', offsetX: -0.3, offsetZ: 0.25, distanceToSchool: 420 },

  // 42101000700
  { id: 'poi-26', geoid: '42101000700', name: 'Escuela Técnica Terminal', type: 'school', offsetX: 0.1, offsetZ: 0.2, distanceToSchool: 0 },
  { id: 'poi-27', geoid: '42101000700', name: 'Pabellón Frutas del Ferrocarril', type: 'fresh_market', offsetX: -0.3, offsetZ: -0.2, distanceToSchool: 480 },
  { id: 'poi-28', geoid: '42101000700', name: 'Fast Fries Terminal', type: 'fast_food', offsetX: 0.15, offsetZ: 0.05, distanceToSchool: 230 },
  { id: 'poi-29', geoid: '42101000700', name: 'Burgers Al Paso', type: 'fast_food', offsetX: -0.1, offsetZ: 0.15, distanceToSchool: 270 },

  // 42101000801
  { id: 'poi-30', geoid: '42101000801', name: 'Colegio Comunitario South Philly', type: 'school', offsetX: -0.1, offsetZ: -0.1, distanceToSchool: 0 },
  { id: 'poi-31', geoid: '42101000801', name: 'Frutería South Philly', type: 'fresh_market', offsetX: 0.4, offsetZ: 0.3, distanceToSchool: 610 },
  { id: 'poi-32', geoid: '42101000801', name: 'Ultra Fried Chicken', type: 'fast_food', offsetX: -0.05, offsetZ: 0.05, distanceToSchool: 140 },
  { id: 'poi-33', geoid: '42101000801', name: 'Mega Pizza Oriental', type: 'fast_food', offsetX: 0.1, offsetZ: -0.2, distanceToSchool: 280 },

  // 42101000900
  { id: 'poi-34', geoid: '42101000900', name: 'Escuela Primaria del Suroeste', type: 'school', offsetX: 0.0, offsetZ: -0.2, distanceToSchool: 0 },
  { id: 'poi-35', geoid: '42101000900', name: 'Supermercado Fresco Sur', type: 'fresh_market', offsetX: -0.3, offsetZ: 0.2, distanceToSchool: 440 },
  { id: 'poi-36', geoid: '42101000900', name: 'Almacén Saludable', type: 'fresh_market', offsetX: 0.3, offsetZ: 0.1, distanceToSchool: 370 },
  { id: 'poi-37', geoid: '42101000900', name: 'Snack Bar Suroeste', type: 'fast_food', offsetX: 0.1, offsetZ: -0.05, distanceToSchool: 210 },

  // 42101001001
  { id: 'poi-38', geoid: '42101001001', name: 'Liceo Alameda', type: 'school', offsetX: -0.2, offsetZ: 0.0, distanceToSchool: 0 },
  { id: 'poi-39', geoid: '42101001001', name: 'Mercado Alameda de Verduras', type: 'fresh_market', offsetX: 0.2, offsetZ: -0.3, distanceToSchool: 470 },
  { id: 'poi-40', geoid: '42101001001', name: 'Burger & Hotdog Alameda', type: 'fast_food', offsetX: -0.1, offsetZ: 0.15, distanceToSchool: 220 },
  { id: 'poi-41', geoid: '42101001001', name: 'Pollería y Fast Food', type: 'fast_food', offsetX: 0.25, offsetZ: 0.2, distanceToSchool: 490 },

  // 42101001101
  { id: 'poi-42', geoid: '42101001101', name: 'Escuela Nueva Esperanza', type: 'school', offsetX: 0.1, offsetZ: -0.1, distanceToSchool: 0 },
  { id: 'poi-43', geoid: '42101001101', name: 'Tienda de Abarrotes y Frutas', type: 'fresh_market', offsetX: -0.3, offsetZ: 0.3, distanceToSchool: 520 },
  { id: 'poi-44', geoid: '42101001101', name: 'Frituras y Pollos Sur', type: 'fast_food', offsetX: 0.05, offsetZ: 0.05, distanceToSchool: 170 },
  { id: 'poi-45', geoid: '42101001101', name: 'Burger Combo Sur', type: 'fast_food', offsetX: 0.2, offsetZ: -0.25, distanceToSchool: 310 },

  // 42101001200
  { id: 'poi-46', geoid: '42101001200', name: 'Escuela Villa Esperanza', type: 'school', offsetX: -0.1, offsetZ: 0.1, distanceToSchool: 0 },
  { id: 'poi-47', geoid: '42101001200', name: 'Puesto Callejero de Verduras', type: 'fresh_market', offsetX: 0.3, offsetZ: -0.3, distanceToSchool: 590 },
  { id: 'poi-48', geoid: '42101001200', name: 'Fast Chicken Villa', type: 'fast_food', offsetX: -0.05, offsetZ: -0.05, distanceToSchool: 180 },
  { id: 'poi-49', geoid: '42101001200', name: 'Salchipapas y Gaseosas 24h', type: 'fast_food', offsetX: 0.15, offsetZ: 0.2, distanceToSchool: 290 },
];
