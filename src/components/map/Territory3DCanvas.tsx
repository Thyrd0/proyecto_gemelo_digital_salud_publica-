import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { TractSimulationResult, MapVariable } from '../../types';
import { POI_DATA } from '../../data/poiData';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Maximize2, 
  Eye, 
  Sun, 
  Moon, 
  Sunset, 
  RotateCcw, 
  Layers, 
  Compass, 
  Sparkles,
  Info,
  ShieldCheck,
  TrendingDown,
  Play,
  Pause
} from 'lucide-react';

interface Territory3DCanvasProps {
  tracts: TractSimulationResult[];
  selectedGeoid?: string | null;
  onSelectTract?: (geoid: string) => void;
  variable: MapVariable;
  onVariableChange?: (v: MapVariable) => void;
  yearStep: number; // 0, 5, 10
  onYearStepChange?: (yr: number) => void;
  restrictionRadius?: number; // 250, 500, 750
  subsidyActive?: boolean;
  taxActive?: boolean;
  restrictionActive?: boolean;
  heightScale?: number;
}

export type CameraPreset = 'isometric' | 'perspective' | 'topDown';
export type LightingPreset = 'day' | 'sunset' | 'night';

export function Territory3DCanvas({
  tracts = [],
  selectedGeoid,
  onSelectTract,
  variable = 'prevalenciaProyectada',
  onVariableChange,
  yearStep = 5,
  onYearStepChange,
  restrictionRadius = 500,
  subsidyActive = false,
  taxActive = false,
  restrictionActive = false,
  heightScale = 1.0
}: Territory3DCanvasProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // UI state for 3D view
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>(isDark ? 'night' : 'day');
  const [hoveredTract, setHoveredTract] = useState<TractSimulationResult | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isPlayingLocal, setIsPlayingLocal] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Sync default lighting when global theme changes
  useEffect(() => {
    setLightingPreset(isDark ? 'night' : 'day');
  }, [isDark]);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const tractMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; targetHeight: number; currentHeight: number; targetColor: THREE.Color }>>(new Map());
  const bufferMeshesRef = useRef<THREE.Mesh[]>([]);
  const poiGroupRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 48, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const localYearTimerRef = useRef<number | null>(null);

  // Time travel animation loop
  useEffect(() => {
    if (isPlayingLocal && onYearStepChange) {
      localYearTimerRef.current = window.setInterval(() => {
        const nextYr = yearStep >= 10 ? 0 : (yearStep === 0 ? 5 : 10);
        onYearStepChange(nextYr);
      }, 1600);
    } else {
      if (localYearTimerRef.current) clearInterval(localYearTimerRef.current);
    }

    return () => {
      if (localYearTimerRef.current) clearInterval(localYearTimerRef.current);
    };
  }, [isPlayingLocal, yearStep, onYearStepChange]);

  // Map Tract GEOID to result for quick lookup
  const tractMap = useMemo(() => {
    const map = new Map<string, TractSimulationResult>();
    tracts.forEach(t => {
      if (t && t.geoid) map.set(t.geoid, t);
    });
    return map;
  }, [tracts]);

  // Grid layout calculator for N tracts in Philadelphia
  const tractLayoutMap = useMemo(() => {
    const layout = new Map<string, { x: number; z: number }>();
    const total = tracts.length;
    if (total === 0) return layout;

    // Check if we have legacy mock coordinates (e.g. coordenadaFila / coordenadaColumna)
    const hasExplicitGrid = tracts.some(t => typeof t.coordenadaFila === 'number' && typeof t.coordenadaColumna === 'number');

    if (hasExplicitGrid && total <= 16) {
      const xOffsets = [-18.5, -6.2, 6.2, 18.5];
      const zOffsets = [-13.0, 0, 13.0];
      tracts.forEach(t => {
        const row = t.coordenadaFila ?? 0;
        const col = t.coordenadaColumna ?? 0;
        layout.set(t.geoid, {
          x: xOffsets[col] ?? (col * 10 - 15),
          z: zOffsets[row] ?? (row * 10 - 10)
        });
      });
      return layout;
    }

    // Dynamic grid for 369 real census tracts (approx 19 columns x 20 rows)
    const cols = Math.ceil(Math.sqrt(total * 1.35));
    const spacingX = 2.4;
    const spacingZ = 2.4;
    const startX = -((cols * spacingX) / 2);
    const rows = Math.ceil(total / cols);
    const startZ = -((rows * spacingZ) / 2);

    tracts.forEach((t, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      // Stagger alternate rows slightly for a realistic urban parcel grid
      const stagger = (r % 2 === 1) ? spacingX * 0.35 : 0;
      layout.set(t.geoid, {
        x: startX + c * spacingX + stagger,
        z: startZ + r * spacingZ
      });
    });

    return layout;
  }, [tracts]);

  // Calculate target height and color based on tract and current variable/year
  const getTractVisuals = (tract: TractSimulationResult, yr: number) => {
    const interpRatio = Math.max(0, Math.min(1, yr / 10));
    let val = 0;
    let height = 3.5;
    let hexColor = '#0d9488'; // default teal

    const prevIni = typeof tract.prevalenciaInicial === 'number' ? tract.prevalenciaInicial : 14.0;
    const prevProj = typeof tract.prevalenciaProyectada === 'number' ? tract.prevalenciaProyectada : prevIni;
    const diffAbs = typeof tract.diferenciaAbsoluta === 'number' ? tract.diferenciaAbsoluta : Math.max(0, prevIni - prevProj);
    const accessIni = typeof tract.accesoSaludableInicial === 'number' ? tract.accesoSaludableInicial : (((tract as any).food_retail_proximity_proxy_initial ?? 0.6) * 100);
    const accessProj = typeof tract.accesoSaludableProyectado === 'number' ? tract.accesoSaludableProyectado : (((tract as any).food_retail_proximity_proxy_projected ?? 0.6) * 100);
    const poverty = (tract as any).poverty_rate ?? 15.0;

    switch (variable) {
      case 'prevalenciaInicial':
        val = prevIni;
        height = Math.max(1.5, (val - 4) * 0.85);
        if (val < 10.0) hexColor = '#10b981'; // Emerald
        else if (val <= 14.5) hexColor = '#f59e0b'; // Amber
        else hexColor = '#f43f5e'; // Rose
        break;

      case 'prevalenciaProyectada': {
        const curPrev = prevIni - (prevIni - prevProj) * interpRatio;
        val = curPrev;
        height = Math.max(1.5, (curPrev - 4) * 0.85);
        if (curPrev < 10.0) hexColor = '#10b981';
        else if (curPrev <= 14.5) hexColor = '#f59e0b';
        else hexColor = '#f43f5e';
        break;
      }

      case 'diferencia': {
        const diff = diffAbs * interpRatio;
        val = diff;
        height = Math.max(1.2, diff * 6.0);
        if (diff > 0.8) hexColor = '#06b6d4'; // Cyan
        else if (diff > 0.3) hexColor = '#0ea5e9'; // Sky
        else if (diff > 0) hexColor = '#3b82f6'; // Blue
        else hexColor = '#64748b'; // Slate
        break;
      }

      case 'accesoSaludable': {
        const acc = accessIni + (accessProj - accessIni) * interpRatio;
        val = acc;
        height = Math.max(1.5, (acc / 100) * 9.0);
        if (acc >= 70) hexColor = '#10b981';
        else if (acc >= 45) hexColor = '#f59e0b';
        else hexColor = '#f43f5e';
        break;
      }

      case 'vulnerabilidad': {
        const v = tract.vulnerabilidad || (poverty > 25 ? 'Alta' : poverty > 15 ? 'Media' : 'Baja');
        if (v === 'Baja') {
          height = 2.5;
          hexColor = '#3b82f6';
        } else if (v === 'Media') {
          height = 5.0;
          hexColor = '#f59e0b';
        } else {
          height = 8.5;
          hexColor = '#a855f7';
        }
        val = poverty;
        break;
      }
    }

    return {
      height: Math.max(0.8, height * heightScale),
      color: new THREE.Color(hexColor),
      value: val
    };
  };

  // Update camera coordinates from spherical angles
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    try {
      const { radius, theta, phi } = cameraSphericalRef.current;
      const target = cameraTargetRef.current || new THREE.Vector3(0, 0, 0);
      const x = radius * Math.sin(phi) * Math.sin(theta) + target.x;
      const y = radius * Math.cos(phi) + target.y;
      const z = radius * Math.sin(phi) * Math.cos(theta) + target.z;

      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(target);
    } catch {
      // ignore
    }
  };

  // Setup Lighting
  const setupLighting = (preset: LightingPreset) => {
    if (!lightsGroupRef.current || !sceneRef.current) return;
    lightsGroupRef.current.clear();

    const isNight = preset === 'night';
    const isSunset = preset === 'sunset';

    sceneRef.current.background = new THREE.Color(isNight ? '#030712' : isSunset ? '#1a1226' : (isDark ? '#090d16' : '#f1f5f9'));
    sceneRef.current.fog = new THREE.FogExp2(
      isNight ? '#030712' : isSunset ? '#1a1226' : (isDark ? '#090d16' : '#f1f5f9'),
      0.012
    );

    if (preset === 'day') {
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 0.85);
      hemiLight.position.set(0, 50, 0);
      lightsGroupRef.current.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
      dirLight.position.set(30, 45, 25);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      lightsGroupRef.current.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
      fillLight.position.set(-25, 20, -25);
      lightsGroupRef.current.add(fillLight);
    } else if (preset === 'sunset') {
      const hemiLight = new THREE.HemisphereLight(0xfda4af, 0x4c1d95, 0.65);
      lightsGroupRef.current.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfb923c, 1.3);
      dirLight.position.set(30, 25, 20);
      dirLight.castShadow = true;
      lightsGroupRef.current.add(dirLight);

      const amberPoint = new THREE.PointLight(0xf59e0b, 1.8, 60);
      amberPoint.position.set(0, 12, 0);
      lightsGroupRef.current.add(amberPoint);
    } else {
      // Night
      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 0.5);
      lightsGroupRef.current.add(hemiLight);

      const moonLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
      moonLight.position.set(20, 35, 20);
      moonLight.castShadow = true;
      lightsGroupRef.current.add(moonLight);

      const cyanPoint = new THREE.PointLight(0x14b8a6, 2.2, 70);
      cyanPoint.position.set(0, 14, 0);
      lightsGroupRef.current.add(cyanPoint);
    }
  };

  // Build Terrain, Roads, River
  const buildUrbanEnvironment = (scene: THREE.Scene) => {
    // 1. Base ground plane
    const groundGeo = new THREE.PlaneGeometry(75, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0b1120 : 0xe2e8f0,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. City Grid Roads
    const roadGroup = new THREE.Group();
    roadGroup.name = 'roads';
    const roadMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x94a3b8,
      roughness: 0.8
    });

    [-14, 0, 14].forEach(z => {
      const roadH = new THREE.Mesh(new THREE.PlaneGeometry(65, 1.2), roadMat);
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(0, 0.02, z);
      roadH.receiveShadow = true;
      roadGroup.add(roadH);
    });

    [-18, -6, 6, 18].forEach(x => {
      const roadV = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 50), roadMat);
      roadV.rotation.x = -Math.PI / 2;
      roadV.position.set(x, 0.02, 0);
      roadV.receiveShadow = true;
      roadGroup.add(roadV);
    });
    scene.add(roadGroup);

    // 3. Delaware River representation on eastern border
    const riverGeo = new THREE.PlaneGeometry(6.0, 56);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(30, 0.03, 0);
    river.receiveShadow = true;
    scene.add(river);
  };

  // Build Volumetric Tract Blocks
  const buildTractMeshes = (scene: THREE.Scene) => {
    tractMeshesRef.current.clear();
    const tractGroup = new THREE.Group();
    tractGroup.name = 'tractsGroup';

    const isLargeSet = tracts.length > 20;
    const blockWidth = isLargeSet ? 1.9 : 8.8;
    const blockDepth = isLargeSet ? 1.9 : 9.2;

    tracts.forEach(tract => {
      const pos = tractLayoutMap.get(tract.geoid) || { x: 0, z: 0 };
      const visuals = getTractVisuals(tract, yearStep);

      const geo = new THREE.BoxGeometry(blockWidth, 1, blockDepth);
      const mat = new THREE.MeshStandardMaterial({
        color: visuals.color,
        roughness: 0.35,
        metalness: 0.25,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, visuals.height / 2, pos.z);
      mesh.scale.set(1, visuals.height, 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { geoid: tract.geoid, tract };

      // Edges outline
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({
        color: isDark ? 0x38bdf8 : 0x0f172a,
        transparent: true,
        opacity: isDark ? 0.3 : 0.15
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      mesh.add(wireframe);

      tractGroup.add(mesh);
      tractMeshesRef.current.set(tract.geoid, {
        mesh,
        targetHeight: visuals.height,
        currentHeight: visuals.height,
        targetColor: visuals.color
      });
    });

    scene.add(tractGroup);
  };

  // Build POI Meshes (Schools, Fresh Markets, Fast Food)
  const buildPOIMeshes = (scene: THREE.Scene) => {
    if (poiGroupRef.current) {
      scene.remove(poiGroupRef.current);
    }

    const poiGroup = new THREE.Group();
    poiGroup.name = 'poiGroup';
    bufferMeshesRef.current = [];

    const schoolMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.4 });
    const freshMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3, metalness: 0.3 });
    const fastFoodMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3, metalness: 0.3 });

    POI_DATA.forEach(poi => {
      const tract = tractMap.get(poi.geoid);
      if (!tract) return;
      const tPos = tractLayoutMap.get(tract.geoid) || { x: 0, z: 0 };
      const tractVisual = getTractVisuals(tract, yearStep);

      const pX = tPos.x + poi.offsetX * 1.5;
      const pZ = tPos.z + poi.offsetZ * 1.5;
      const pY = tractVisual.height + 0.2;

      if (poi.type === 'school') {
        const schoolObj = new THREE.Group();
        schoolObj.position.set(pX, pY, pZ);

        const building = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), schoolMat);
        building.position.y = 0.35;
        building.castShadow = true;
        schoolObj.add(building);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 0.9;
        schoolObj.add(roof);

        poiGroup.add(schoolObj);
      } else if (poi.type === 'fresh_market') {
        const marketObj = new THREE.Group();
        marketObj.position.set(pX, pY, pZ);

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), freshMat);
        base.position.y = 0.25;
        base.castShadow = true;
        marketObj.add(base);

        if (subsidyActive) {
          const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.65, 16), new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide }));
          halo.rotation.x = -Math.PI / 2;
          halo.position.y = 0.05;
          marketObj.add(halo);
        }

        poiGroup.add(marketObj);
      } else if (poi.type === 'fast_food') {
        const ffObj = new THREE.Group();
        ffObj.position.set(pX, pY, pZ);

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), fastFoodMat);
        base.position.y = 0.25;
        base.castShadow = true;
        ffObj.add(base);

        poiGroup.add(ffObj);
      }
    });

    scene.add(poiGroup);
    poiGroupRef.current = poiGroup;
  };

  // Main Scene Initialization
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 560;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 400);
      cameraRef.current = camera;
      updateCameraPosition();

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        powerPreference: 'default'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Lights
      const lightsGroup = new THREE.Group();
      lightsGroupRef.current = lightsGroup;
      scene.add(lightsGroup);
      setupLighting(lightingPreset);

      // Environment & Meshes
      buildUrbanEnvironment(scene);
      buildTractMeshes(scene);
      buildPOIMeshes(scene);

      // Animation Loop
      let clock = new THREE.Clock();
      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        tractMeshesRef.current.forEach(({ mesh, targetHeight, targetColor }) => {
          mesh.scale.y += (targetHeight - mesh.scale.y) * 0.1;
          mesh.position.y = mesh.scale.y / 2;

          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat && mat.color) {
            mat.color.lerp(targetColor, 0.1);
          }
        });

        bufferMeshesRef.current.forEach((bufferMesh, idx) => {
          const pulse = 1 + Math.sin(elapsedTime * 2 + idx) * 0.03;
          bufferMesh.scale.set(pulse, 1, pulse);
        });

        renderer.render(scene, camera);
      };
      animate();

      // ResizeObserver
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width: newW, height: newH } = entry.contentRect;
          if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = newW / newH;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH);
          }
        }
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        resizeObserver.disconnect();
        renderer.dispose();
        scene.clear();
      };
    } catch (err: any) {
      console.error('[Territory3DCanvas] WebGL initialization error:', err);
      setWebglError(err?.message || 'Error inicializando WebGL');
    }
  }, []);

  // Update presets
  useEffect(() => {
    if (cameraPreset === 'isometric') {
      cameraSphericalRef.current = { radius: 52, theta: Math.PI / 4.2, phi: Math.PI / 3.4 };
      cameraTargetRef.current.set(0, 0, 0);
    } else if (cameraPreset === 'perspective') {
      cameraSphericalRef.current = { radius: 40, theta: Math.PI / 5.5, phi: Math.PI / 2.6 };
      cameraTargetRef.current.set(0, 1.5, 0);
    } else if (cameraPreset === 'topDown') {
      cameraSphericalRef.current = { radius: 48, theta: 0.001, phi: 0.08 };
      cameraTargetRef.current.set(0, 0, 0);
    }
    updateCameraPosition();
  }, [cameraPreset]);

  useEffect(() => {
    setupLighting(lightingPreset);
  }, [lightingPreset, isDark]);

  // Re-run visuals when variable, yearStep, or policies change
  useEffect(() => {
    tracts.forEach(tract => {
      const entry = tractMeshesRef.current.get(tract.geoid);
      if (entry) {
        const visuals = getTractVisuals(tract, yearStep);
        entry.targetHeight = visuals.height;
        entry.targetColor = visuals.color;
      }
    });

    if (sceneRef.current) {
      buildPOIMeshes(sceneRef.current);
    }
  }, [variable, yearStep, heightScale, restrictionRadius, subsidyActive, taxActive, restrictionActive, tracts]);

  // Focus Camera on Selected Tract
  useEffect(() => {
    if (!selectedGeoid) return;
    const tract = tractMap.get(selectedGeoid);
    if (!tract) return;
    const pos = tractLayoutMap.get(tract.geoid);
    if (pos) {
      cameraTargetRef.current.set(pos.x, 2, pos.z);
      cameraSphericalRef.current.radius = 28;
      updateCameraPosition();
    }
  }, [selectedGeoid, tractLayoutMap]);

  // Mouse Interaction: Orbit Controls & Raycasting
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current || !sceneRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePosRef.current.x;
      const deltaY = e.clientY - previousMousePosRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.007;
      cameraSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, cameraSphericalRef.current.phi + deltaY * 0.007));

      updateCameraPosition();
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hover Raycasting
    try {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const tractMeshes: THREE.Object3D[] = [];
      tractMeshesRef.current.forEach(item => tractMeshes.push(item.mesh));

      const intersects = raycaster.intersectObjects(tractMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const tract = hitMesh.userData?.tract as TractSimulationResult;
        if (tract) {
          setHoveredTract(tract);
          setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      } else {
        setHoveredTract(null);
        setHoverPos(null);
      }
    } catch {
      // ignore raycaster errors
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    cameraSphericalRef.current.radius = Math.max(14, Math.min(95, cameraSphericalRef.current.radius + e.deltaY * 0.04));
    updateCameraPosition();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current || !sceneRef.current) return;

    try {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const tractMeshes: THREE.Object3D[] = [];
      tractMeshesRef.current.forEach(item => tractMeshes.push(item.mesh));

      const intersects = raycaster.intersectObjects(tractMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const tract = hitMesh.userData?.tract as TractSimulationResult;
        if (tract && onSelectTract) {
          onSelectTract(tract.geoid);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleResetCamera = () => {
    cameraTargetRef.current.set(0, 0, 0);
    setCameraPreset('isometric');
  };

  if (webglError) {
    return (
      <div className="w-full h-[520px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-6 text-center text-slate-300">
        <div>
          <p className="text-amber-400 font-bold mb-2">⚠️ Advertencia de Aceleración 3D</p>
          <p className="text-xs text-slate-400">{webglError}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none flex flex-col justify-between"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Top Floating Control Bar */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Metric & Variable Selector */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs">
          <label htmlFor="sim-3d-var-select" className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('sim3DHeightMetric')}</span>
          </label>
          <select
            id="sim-3d-var-select"
            value={variable}
            onChange={(e) => onVariableChange?.(e.target.value as MapVariable)}
            className="bg-slate-800 border border-slate-700 text-teal-300 font-bold rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-teal-400 outline-none cursor-pointer"
          >
            <option value="prevalenciaProyectada">{t('mapVarPrevalenceProjected')}</option>
            <option value="prevalenciaInicial">{t('mapVarPrevalenceInitial')}</option>
            <option value="diferencia">{t('mapVarDifference')}</option>
            <option value="accesoSaludable">{t('mapVarAccess')}</option>
            <option value="vulnerabilidad">{t('mapVarVulnerability')}</option>
          </select>
        </div>

        {/* Center: Time Travel Slider & Play Button */}
        {onYearStepChange && (
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs">
            <button
              onClick={() => setIsPlayingLocal(!isPlayingLocal)}
              className={`p-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                isPlayingLocal ? 'bg-amber-600 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
              title={isPlayingLocal ? 'Pausar Simulación' : 'Reproducir Escenario'}
            >
              {isPlayingLocal ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingLocal ? 'Pausa' : 'Play'}</span>
            </button>
            <div className="flex items-center gap-1">
              {[0, 5, 10].map((yr) => (
                <button
                  key={yr}
                  onClick={() => {
                    setIsPlayingLocal(false);
                    onYearStepChange(yr);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    yearStep === yr ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {yr === 0 ? 'Base' : `Año ${yr}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: Camera & Lighting Presets */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-xs">
          <button
            onClick={() => setCameraPreset('isometric')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              cameraPreset === 'isometric' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={t('sim3DViewIsometric')}
          >
            {t('sim3DViewIsometric')}
          </button>
          <button
            onClick={() => setCameraPreset('perspective')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              cameraPreset === 'perspective' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={t('sim3DViewPerspective')}
          >
            {t('sim3DViewPerspective')}
          </button>
          <button
            onClick={() => setCameraPreset('topDown')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              cameraPreset === 'topDown' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={t('sim3DViewTopDown')}
          >
            {t('sim3DViewTopDown')}
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => setLightingPreset('day')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              lightingPreset === 'day' ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-white'
            }`}
            title={t('sim3DLightDay')}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingPreset('sunset')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              lightingPreset === 'sunset' ? 'bg-slate-700 text-orange-400' : 'text-slate-400 hover:text-white'
            }`}
            title={t('sim3DLightGolden')}
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingPreset('night')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              lightingPreset === 'night' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
            title={t('sim3DLightNight')}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={t('sim3DResetCamera')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Hover Tooltip with 100% Null Safety */}
      {hoveredTract && hoverPos && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-950/95 text-white p-3 rounded-xl border border-teal-500/50 shadow-2xl backdrop-blur-md text-xs w-64 transform -translate-x-1/2 -translate-y-full -mt-3 animate-in fade-in zoom-in-95 duration-150"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
            <span className="font-mono text-[10px] text-teal-400 font-bold">{hoveredTract.geoid}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
              {hoveredTract.vulnerabilidad || (((hoveredTract as any).poverty_rate ?? 0) > 25 ? 'Alta' : ((hoveredTract as any).poverty_rate ?? 0) > 15 ? 'Media' : 'Baja')}
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-100 leading-tight mb-2">
            {hoveredTract.nombre || `Tracto Censal ${hoveredTract.geoid}`}
          </h4>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'es' ? 'Prev. CDC PLACES:' : 'Baseline Prev:'}</span>
              <span className="font-semibold text-rose-400">{(hoveredTract.prevalenciaInicial ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'es' ? 'Prev. Proyectada:' : 'Projected Prev:'}</span>
              <span className="font-bold text-emerald-400">{(hoveredTract.prevalenciaProyectada ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'es' ? 'Reducción Absoluta:' : 'Absolute Red:'}</span>
              <span className="font-bold text-teal-300">-{(hoveredTract.diferenciaAbsoluta ?? 0).toFixed(2)} p.p.</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">{language === 'es' ? 'Proxy Proximidad:' : 'Proximity Proxy:'}</span>
              <span className="font-extrabold text-cyan-300">
                {(((hoveredTract as any).food_retail_proximity_proxy_projected ?? 0.6) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom 3D Legend & Interaction Help */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span>&lt; 10% (Baja Prevalencia)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <div className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span>10% - 14.5% (Media)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
            <div className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span>&gt; 14.5% (Alta)</span>
          </div>
          <div className="h-3 w-px bg-slate-700 mx-0.5" />
          <div className="text-slate-400">
            Tractos 3D: <b>{tracts.length}</b>
          </div>
        </div>

        <div className="pointer-events-auto text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span>{language === 'es' ? 'Arrastra para rotar • Rueda para zoom • Clic para enfocar' : 'Drag to rotate • Wheel to zoom • Click to focus'}</span>
        </div>
      </div>
    </div>
  );
}
