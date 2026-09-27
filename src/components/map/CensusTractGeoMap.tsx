import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Info, Layers, RefreshCw } from 'lucide-react';

interface CensusTractGeoMapProps {
  tracts?: any[];
  selectedTractGeoid?: string;
  onSelectTract?: (geoid: string) => void;
  activeVariable?: 'prevalenciaInicial' | 'prevalenciaProyectada' | 'diferencia' | 'poblacion' | 'poverty';
}

interface GeoJSONFeature {
  type: string;
  properties: {
    GEOID: string;
    diabetes_crude_prevalence?: number;
    PovertyRate?: number;
    MedianFamilyIncome?: number;
    Urban?: number;
    Pop2010?: number;
    food_retail_proximity_proxy?: number;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any[];
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

export const CensusTractGeoMap: React.FC<CensusTractGeoMapProps> = ({
  selectedTractGeoid,
  onSelectTract,
  activeVariable = 'prevalenciaInicial'
}) => {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<GeoJSONFeature | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch real TIGER/Line Philadelphia GeoJSON from FastAPI endpoint or local static fallback
    fetch('http://localhost:8000/api/v1/map/philadelphia')
      .then(res => {
        if (!res.ok) throw new Error('API Map Endpoint error');
        return res.json();
      })
      .catch(() => {
        // Fallback to static processed GeoJSON
        return fetch('/data/processed/philadelphia_tracts_analysis.geojson').then(res => {
          if (!res.ok) throw new Error('No GeoJSON map available');
          return res.json();
        });
      })
      .then((data: GeoJSONData) => {
        if (isMounted) {
          setGeoData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError('No se pudo cargar la cartografía real TIGER/Line 2019 de Philadelphia. Verifique que FastAPI o los archivos en data/processed/ estén disponibles.');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  // Compute SVG Bounding Box and Paths
  const { paths, bbox } = useMemo(() => {
    if (!geoData || !geoData.features || geoData.features.length === 0) {
      return { paths: [], bbox: null };
    }

    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    // First pass to find bounding box
    geoData.features.forEach(feat => {
      const geom = feat.geometry;
      if (!geom || !geom.coordinates) return;

      const processCoords = (rings: number[][]) => {
        rings.forEach(pt => {
          const [lng, lat] = pt;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      };

      if (geom.type === 'Polygon') {
        geom.coordinates.forEach(processCoords);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(poly => poly.forEach(processCoords));
      }
    });

    const width = 800;
    const height = 600;

    const project = (lng: number, lat: number) => {
      const x = ((lng - minLng) / (maxLng - minLng)) * width;
      const y = height - (((lat - minLat) / (maxLat - minLat)) * height);
      return [x, y];
    };

    // Second pass to generate SVG d attributes
    const projectedPaths = geoData.features.map(feat => {
      const geom = feat.geometry;
      let dStr = '';

      const ringToSvg = (ring: number[][]) => {
        return ring.map((pt, i) => {
          const [x, y] = project(pt[0], pt[1]);
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ') + ' Z';
      };

      if (geom.type === 'Polygon') {
        dStr = geom.coordinates.map(ringToSvg).join(' ');
      } else if (geom.type === 'MultiPolygon') {
        dStr = geom.coordinates.map(poly => poly.map(ringToSvg).join(' ')).join(' ');
      }

      return {
        feature: feat,
        geoid: feat.properties.GEOID,
        d: dStr,
        prev: feat.properties.diabetes_crude_prevalence ?? 0,
        poverty: feat.properties.PovertyRate ?? 0,
        income: feat.properties.MedianFamilyIncome ?? 0,
        proxy: feat.properties.food_retail_proximity_proxy ?? 0,
        pop: feat.properties.Pop2010 ?? 0
      };
    });

    return { paths: projectedPaths, bbox: { minLng, maxLng, minLat, maxLat } };
  }, [geoData]);

  const getColor = (prev: number) => {
    if (prev >= 16) return '#dc2626';
    if (prev >= 12) return '#f97316';
    if (prev >= 9) return '#facc15';
    if (prev > 0) return '#10b981';
    return '#64748b';
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Cartografía Poligonal Oficial (TIGER/Line 2019 — Philadelphia, PA)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {paths.length > 0 ? `${paths.length} Polígonos de Tractos Censales Reales (CDC PLACES 2022 + USDA FARA 2019)` : 'Cargando geometrías oficiales...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Sistema: <b>EPSG:4326 (WGS84)</b></span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm">Cargando polígonos TIGER/Line 2019 desde dataset real...</p>
        </div>
      )}

      {error && (
        <div className="my-6 p-4 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && paths.length > 0 && (
        <div className="mt-4 relative bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex justify-center p-2">
          <svg viewBox="0 0 800 600" className="w-full max-h-[500px] h-auto drop-shadow-md">
            {paths.map(p => {
              const isSelected = selectedTractGeoid === p.geoid;
              const isHovered = hoveredFeature?.properties.GEOID === p.geoid;
              const fillColor = getColor(p.prev);

              return (
                <path
                  key={p.geoid}
                  d={p.d}
                  fill={fillColor}
                  fillOpacity={isHovered ? 0.95 : isSelected ? 1.0 : 0.75}
                  stroke={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#1e293b'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.6}
                  className="cursor-pointer transition-all duration-150 hover:opacity-100"
                  onClick={() => onSelectTract && onSelectTract(p.geoid)}
                  onMouseEnter={() => setHoveredFeature(p.feature)}
                  onMouseLeave={() => setHoveredFeature(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Floating Hover Info Card */}
          {hoveredFeature && (
            <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl text-xs max-w-xs text-slate-200 backdrop-blur-md">
              <div className="font-bold text-sm text-emerald-400 border-b border-slate-800 pb-1 mb-2">
                Tracto Censal: <code className="text-white">{hoveredFeature.properties.GEOID}</code>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Población (2010):</span>
                  <span className="font-bold">{hoveredFeature.properties.Pop2010?.toLocaleString() ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prevalencia Diabetes (PLACES 2022):</span>
                  <span className="font-bold text-amber-300">{hoveredFeature.properties.diabetes_crude_prevalence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasa de Pobreza:</span>
                  <span className="font-bold">{hoveredFeature.properties.PovertyRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ingreso Familiar Medio:</span>
                  <span className="font-bold">${hoveredFeature.properties.MedianFamilyIncome?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Proxy Proximidad Alimentaria:</span>
                  <span className="font-bold text-emerald-300">{(hoveredFeature.properties.food_retail_proximity_proxy * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Haz clic en un polígono para inspeccionar el tracto censal oficial.</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-400">Prevalencia Observada (CDC PLACES):</span>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> &lt;9%</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400"></span> 9-12%</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500"></span> 12-16%</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600"></span> &gt;16%</div>
        </div>
      </div>
    </div>
  );
};
