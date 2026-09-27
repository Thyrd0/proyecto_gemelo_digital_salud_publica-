import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { TractSimulationResult, MapVariable } from '../../types';
import { POI_DATA, PointOfInterest } from '../../data/poiData';
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
  MapPin, 
  GraduationCap, 
  Apple, 
  UtensilsCrossed, 
  Compass, 
  Sparkles,
  Info
} from 'lucide-react';

interface Territory3DCanvasProps {
  tracts: TractSimulationResult[];
  selectedGeoid?: string | null;
  onSelectTract?: (geoid: string) => void;
  variable: MapVariable;
  onVariableChange?: (v: MapVariable) => void;
  yearStep: number; // 0, 5, 10
  restrictionRadius: number; // 250, 500, 750
  subsidyActive: boolean;
  taxActive: boolean;
  restrictionActive: boolean;
  heightScale?: number;
}

export type CameraPreset = 'isometric' | 'perspective' | 'topDown';
export type LightingPreset = 'day' | 'sunset' | 'night';

export function Territory3DCanvas({
  tracts,
  selectedGeoid,
  onSelectTract,
  variable,
  onVariableChange,
  yearStep,
  restrictionRadius,
  subsidyActive,
  taxActive,
  restrictionActive,
  heightScale = 1.0
}: Territory3DCanvasProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // UI state for 3D view
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>(isDark ? 'night' : 'day');
  const [showSchools, setShowSchools] = useState(true);
  const [showFreshMarkets, setShowFreshMarkets] = useState(true);
  const [showFastFood, setShowFastFood] = useState(true);
  const [showBuffers, setShowBuffers] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [hoveredTract, setHoveredTract] = useState<TractSimulationResult | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

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

  // Map Tract GEOID to result for quick lookup
  const tractMap = useMemo(() => {
    const map = new Map<string, TractSimulationResult>();
    tracts.forEach(t => map.set(t.geoid, t));
    return map;
  }, [tracts]);

  // Calculate target height and color based on tract and current variable/year
  const getTractVisuals = (tract: TractSimulationResult, yr: number) => {
    const interpRatio = yr / 10; // 0 to 1
    let val = 0;
    let height = 4;
    let hexColor = '#0d9488'; // default teal

    switch (variable) {
      case 'prevalenciaInicial':
        val = tract.prevalenciaInicial;
        height = Math.max(2, (val - 5) * 1.1);
        if (val < 9.0) hexColor = '#10b981'; // Emerald
        else if (val <= 12.5) hexColor = '#f59e0b'; // Amber
        else hexColor = '#f43f5e'; // Rose
        break;

      case 'prevalenciaProyectada': {
        const curPrev = tract.prevalenciaInicial - (tract.prevalenciaInicial - tract.prevalenciaProyectada) * interpRatio;
        val = curPrev;
        height = Math.max(2, (curPrev - 5) * 1.1);
        if (curPrev < 9.0) hexColor = '#10b981';
        else if (curPrev <= 12.5) hexColor = '#f59e0b';
        else hexColor = '#f43f5e';
        break;
      }

      case 'diferencia': {
        const diff = tract.diferenciaAbsoluta * interpRatio;
        val = diff;
        height = Math.max(1.5, diff * 7.5);
        if (diff > 0.8) hexColor = '#06b6d4'; // Cyan
        else if (diff > 0.3) hexColor = '#0ea5e9'; // Sky
        else if (diff > 0) hexColor = '#3b82f6'; // Blue
        else hexColor = '#64748b'; // Slate
        break;
      }

      case 'accesoSaludable': {
        const acc = tract.accesoSaludableInicial + (tract.accesoSaludableProyectado - tract.accesoSaludableInicial) * interpRatio;
        val = acc;
        height = Math.max(2, (acc / 100) * 12);
        if (acc >= 70) hexColor = '#10b981';
        else if (acc >= 45) hexColor = '#f59e0b';
        else hexColor = '#f43f5e';
        break;
      }

      case 'vulnerabilidad': {
        if (tract.vulnerabilidad === 'Baja') {
          height = 4;
          hexColor = '#3b82f6';
        } else if (tract.vulnerabilidad === 'Media') {
          height = 7;
          hexColor = '#f59e0b';
        } else {
          height = 11;
          hexColor = '#a855f7';
        }
        break;
      }
    }

    return {
      height: height * heightScale,
      color: new THREE.Color(hexColor),
      value: val
    };
  };

  // Setup Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 300);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lights Group
    const lightsGroup = new THREE.Group();
    lightsGroupRef.current = lightsGroup;
    scene.add(lightsGroup);
    setupLighting(lightingPreset);

    // 5. Ground / Urban Environment Base
    buildUrbanEnvironment(scene);

    // 6. Volumetric Tracts
    buildTractMeshes(scene);

    // 7. POIs (Schools, Buffer rings, Markets, Fast Food)
    buildPOIMeshes(scene);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth height and color transitions for tract meshes
      tractMeshesRef.current.forEach(({ mesh, targetHeight, targetColor }, _) => {
        mesh.scale.y += (targetHeight - mesh.scale.y) * 0.08;
        mesh.position.y = mesh.scale.y / 2;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.color.lerp(targetColor, 0.08);
        }
      });

      // Subtle pulsating animation on school restriction buffer rings
      bufferMeshesRef.current.forEach((bufferMesh, idx) => {
        const pulse = 1 + Math.sin(elapsedTime * 2 + idx) * 0.03;
        bufferMesh.scale.set(pulse, 1, pulse);
      });

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize handler with ResizeObserver
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
  }, []);

  // Update camera coordinates from spherical angles
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta) + cameraTargetRef.current.x;
    const y = radius * Math.cos(phi) + cameraTargetRef.current.y;
    const z = radius * Math.sin(phi) * Math.cos(theta) + cameraTargetRef.current.z;

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  // Switch camera preset
  useEffect(() => {
    if (cameraPreset === 'isometric') {
      cameraSphericalRef.current = { radius: 46, theta: Math.PI / 4.2, phi: Math.PI / 3.4 };
      cameraTargetRef.current.set(0, 0, 0);
    } else if (cameraPreset === 'perspective') {
      cameraSphericalRef.current = { radius: 36, theta: Math.PI / 6, phi: Math.PI / 2.5 };
      cameraTargetRef.current.set(0, 1.5, 0);
    } else if (cameraPreset === 'topDown') {
      cameraSphericalRef.current = { radius: 44, theta: 0.001, phi: 0.08 };
      cameraTargetRef.current.set(0, 0, 0);
    }
    updateCameraPosition();
  }, [cameraPreset]);

  // Update lighting preset
  const setupLighting = (preset: LightingPreset) => {
    if (!lightsGroupRef.current || !sceneRef.current) return;
    lightsGroupRef.current.clear();

    if (preset === 'day') {
      sceneRef.current.background = new THREE.Color(isDark ? '#090d16' : '#f1f5f9');
      sceneRef.current.fog = new THREE.FogExp2(isDark ? '#090d16' : '#f1f5f9', 0.012);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8899a6, 0.75);
      hemiLight.position.set(0, 50, 0);
      lightsGroupRef.current.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
      dirLight.position.set(25, 40, 20);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 150;
      const d = 30;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      lightsGroupRef.current.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0xa5f3fc, 0.3);
      fillLight.position.set(-20, 20, -20);
      lightsGroupRef.current.add(fillLight);
    } else if (preset === 'sunset') {
      sceneRef.current.background = new THREE.Color('#1a1226');
      sceneRef.current.fog = new THREE.FogExp2('#1a1226', 0.015);

      const hemiLight = new THREE.HemisphereLight(0xfda4af, 0x4c1d95, 0.6);
      lightsGroupRef.current.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfb923c, 1.2);
      dirLight.position.set(30, 20, 15);
      dirLight.castShadow = true;
      lightsGroupRef.current.add(dirLight);

      const amberPoint = new THREE.PointLight(0xf59e0b, 1.5, 40);
      amberPoint.position.set(0, 8, 0);
      lightsGroupRef.current.add(amberPoint);
    } else if (preset === 'night') {
      sceneRef.current.background = new THREE.Color('#030712');
      sceneRef.current.fog = new THREE.FogExp2('#030712', 0.016);

      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 0.45);
      lightsGroupRef.current.add(hemiLight);

      const moonLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
      moonLight.position.set(20, 35, 20);
      moonLight.castShadow = true;
      lightsGroupRef.current.add(moonLight);

      const cyberPoint = new THREE.PointLight(0x14b8a6, 2.0, 50);
      cyberPoint.position.set(0, 10, 0);
      lightsGroupRef.current.add(cyberPoint);
    }
  };

  useEffect(() => {
    setupLighting(lightingPreset);
  }, [lightingPreset, isDark]);

  // Build Terrain, Roads, River
  const buildUrbanEnvironment = (scene: THREE.Scene) => {
    // 1. Base ground plane
    const groundGeo = new THREE.PlaneGeometry(64, 52);
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

    // 2. City Grid Roads (Connecting the 3x4 layout)
    const roadGroup = new THREE.Group();
    roadGroup.name = 'roads';
    const roadMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x94a3b8,
      roughness: 0.8
    });

    // Horizontal main avenues
    [-6.5, 6.5].forEach(z => {
      const roadH = new THREE.Mesh(new THREE.PlaneGeometry(54, 1.8), roadMat);
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(0, 0.02, z);
      roadH.receiveShadow = true;
      roadGroup.add(roadH);
    });

    // Vertical main avenues
    [-12.5, 0, 12.5].forEach(x => {
      const roadV = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 42), roadMat);
      roadV.rotation.x = -Math.PI / 2;
      roadV.position.set(x, 0.02, 0);
      roadV.receiveShadow = true;
      roadGroup.add(roadV);
    });
    scene.add(roadGroup);

    // 3. River / Waterway on the Eastern edge
    const riverGeo = new THREE.PlaneGeometry(5.5, 48);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(24.5, 0.03, 0);
    river.receiveShadow = true;
    scene.add(river);
  };

  // Convert row (0,1,2) and col (0,1,2,3) to 3D space coordinates
  const getTractPosition = (row: number, col: number): { x: number; z: number } => {
    // 4 columns: -18.5, -6.2, 6.2, 18.5
    const xOffsets = [-18.5, -6.2, 6.2, 18.5];
    // 3 rows: -13.0, 0, 13.0
    const zOffsets = [-13.0, 0, 13.0];
    return {
      x: xOffsets[col] ?? 0,
      z: zOffsets[row] ?? 0
    };
  };

  // Build Volumetric Tract Blocks
  const buildTractMeshes = (scene: THREE.Scene) => {
    tractMeshesRef.current.clear();
    const tractGroup = new THREE.Group();
    tractGroup.name = 'tractsGroup';

    // Dimensions of each block
    const blockWidth = 9.8;
    const blockDepth = 10.4;

    tracts.forEach(tract => {
      const { x, z } = getTractPosition(tract.coordenadaFila, tract.coordenadaColumna);
      const visuals = getTractVisuals(tract, yearStep);

      // Base block geometry (Unit cube scaled dynamically)
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
      mesh.position.set(x, visuals.height / 2, z);
      mesh.scale.set(1, visuals.height, 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { geoid: tract.geoid, tract };

      // Edges helper for architectural clean look
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({
        color: isDark ? 0x38bdf8 : 0x0f172a,
        transparent: true,
        opacity: isDark ? 0.35 : 0.2
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      mesh.add(wireframe);

      // Procedural micro-architecture on top of the block
      addMicroArchitecture(mesh, tract);

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

  // Add decorative procedural micro-buildings atop census tracts
  const addMicroArchitecture = (parentMesh: THREE.Mesh, tract: TractSimulationResult) => {
    const microGroup = new THREE.Group();
    microGroup.name = 'microArchitecture';

    const bMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xf8fafc,
      roughness: 0.5,
      metalness: 0.3
    });

    if (tract.geoid === '42101000100') {
      // Central Downtown Skyscraper Cluster
      const tower1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 1.6), bMat);
      tower1.position.set(0, 0.5 + 1.4, 0);
      tower1.castShadow = true;
      microGroup.add(tower1);

      const tower2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 1.2), bMat);
      tower2.position.set(1.4, 0.5 + 1.0, -1.2);
      tower2.castShadow = true;
      microGroup.add(tower2);

      const tower3 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4), bMat);
      tower3.position.set(-1.4, 0.5 + 0.8, 1.2);
      tower3.castShadow = true;
      microGroup.add(tower3);
    } else if (tract.geoid === '42101000200') {
      // University Campus Pavilion
      const campus = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.0, 8), bMat);
      campus.position.set(0, 0.5 + 0.5, 0);
      campus.castShadow = true;
      microGroup.add(campus);
    } else if (tract.geoid === '42101000300') {
      // Industrial Warehouses
      const warehouse = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 1.8), bMat);
      warehouse.position.set(0, 0.5 + 0.4, 0);
      warehouse.castShadow = true;
      microGroup.add(warehouse);
    } else {
      // Standard residential micro-blocks
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 1.0), bMat);
      h1.position.set(-1.5, 0.5 + 0.3, -1.5);
      h1.castShadow = true;
      microGroup.add(h1);

      const h2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), bMat);
      h2.position.set(1.5, 0.5 + 0.4, 1.5);
      h2.castShadow = true;
      microGroup.add(h2);
    }

    parentMesh.add(microGroup);
  };

  // Build POI Meshes (Schools with Buffer Rings, Fresh Markets, Fast Food Outlets)
  const buildPOIMeshes = (scene: THREE.Scene) => {
    if (poiGroupRef.current) {
      scene.remove(poiGroupRef.current);
    }

    const poiGroup = new THREE.Group();
    poiGroup.name = 'poiGroup';
    bufferMeshesRef.current = [];

    // Reusable Materials
    const schoolMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.4 });
    const freshMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3, metalness: 0.3 });
    const fastFoodMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3, metalness: 0.3 });
    const restrictedFastFoodMat = new THREE.MeshStandardMaterial({ 
      color: 0x94a3b8, 
      roughness: 0.8, 
      transparent: true, 
      opacity: 0.55 
    });

    POI_DATA.forEach(poi => {
      const tract = tractMap.get(poi.geoid);
      if (!tract) return;
      const { x: tX, z: tZ } = getTractPosition(tract.coordenadaFila, tract.coordenadaColumna);
      const tractVisual = getTractVisuals(tract, yearStep);

      // World coordinates of this POI
      const pX = tX + poi.offsetX * 2.8;
      const pZ = tZ + poi.offsetZ * 2.8;
      const pY = tractVisual.height + 0.2;

      if (poi.type === 'school') {
        const schoolObj = new THREE.Group();
        schoolObj.position.set(pX, pY, pZ);

        // 3D School Building
        const building = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.0), schoolMat);
        building.position.y = 0.5;
        building.castShadow = true;
        schoolObj.add(building);

        // Roof
        const roofGeo = new THREE.ConeGeometry(0.85, 0.6, 4);
        roofGeo.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
        roof.position.y = 1.3;
        schoolObj.add(roof);

        // Buffer ring/cylinder (Policy C)
        if (restrictionActive) {
          // Scale buffer radius based on active policy (250m = 2.2, 500m = 3.8, 750m = 5.4 in scene units)
          const radiusMap: Record<number, number> = { 250: 2.2, 500: 3.8, 750: 5.4 };
          const worldRadius = radiusMap[restrictionRadius] || 3.8;

          const bufferGeo = new THREE.CylinderGeometry(worldRadius, worldRadius, 0.4, 32, 1, true);
          const bufferMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
          });
          const bufferMesh = new THREE.Mesh(bufferGeo, bufferMat);
          bufferMesh.position.y = 0.2;
          schoolObj.add(bufferMesh);
          bufferMeshesRef.current.push(bufferMesh);

          // Glowing perimeter ring
          const ringGeo = new THREE.RingGeometry(worldRadius - 0.12, worldRadius, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.42;
          schoolObj.add(ring);
        }

        poiGroup.add(schoolObj);
      } else if (poi.type === 'fresh_market') {
        const marketObj = new THREE.Group();
        marketObj.position.set(pX, pY, pZ);

        // Store base
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), freshMat);
        base.position.y = 0.35;
        base.castShadow = true;
        marketObj.add(base);

        // Green canopy awning
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
        canopy.rotation.y = Math.PI / 4;
        canopy.position.y = 0.9;
        marketObj.add(canopy);

        // If subsidy active, add glowing halo
        if (subsidyActive) {
          const haloGeo = new THREE.RingGeometry(0.6, 0.75, 16);
          const haloMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.rotation.x = -Math.PI / 2;
          halo.position.y = 0.05;
          marketObj.add(halo);
        }

        poiGroup.add(marketObj);
      } else if (poi.type === 'fast_food') {
        const ffObj = new THREE.Group();
        ffObj.position.set(pX, pY, pZ);

        // Check if inside active school buffer
        const isInsideBuffer = restrictionActive && poi.distanceToSchool <= restrictionRadius;
        const currentMat = isInsideBuffer ? restrictedFastFoodMat : fastFoodMat;

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), currentMat);
        base.position.y = 0.35;
        base.castShadow = true;
        ffObj.add(base);

        // Sign topper
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), isInsideBuffer ? new THREE.MeshBasicMaterial({ color: 0x64748b }) : new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        sign.position.y = 0.9;
        ffObj.add(sign);

        poiGroup.add(ffObj);
      }
    });

    scene.add(poiGroup);
    poiGroupRef.current = poiGroup;
  };

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
    const { x, z } = getTractPosition(tract.coordenadaFila, tract.coordenadaColumna);
    
    // Smoothly pan camera target to the selected tract
    cameraTargetRef.current.set(x, 2, z);
    cameraSphericalRef.current.radius = 28;
    updateCameraPosition();
  }, [selectedGeoid]);

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
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    cameraSphericalRef.current.radius = Math.max(16, Math.min(80, cameraSphericalRef.current.radius + e.deltaY * 0.04));
    updateCameraPosition();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current || !sceneRef.current) return;

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
  };

  const handleResetCamera = () => {
    cameraTargetRef.current.set(0, 0, 0);
    setCameraPreset('isometric');
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl select-none flex flex-col justify-between"
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

        {/* Right: Camera & Lighting Presets */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-xs">
          {/* Camera Angles */}
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

          {/* Lighting Mode */}
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

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={t('sim3DResetCamera')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredTract && hoverPos && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-950/95 text-white p-3 rounded-xl border border-teal-500/50 shadow-2xl backdrop-blur-md text-xs w-60 transform -translate-x-1/2 -translate-y-full -mt-3 animate-in fade-in zoom-in-95 duration-150"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
            <span className="font-mono text-[10px] text-teal-400 font-bold">{hoveredTract.geoid}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
              {hoveredTract.vulnerabilidad}
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-100 leading-tight mb-2">
            {hoveredTract.nombre}
          </h4>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'es' ? 'Prev. Inicial:' : 'Baseline Prev:'}</span>
              <span className="font-semibold text-rose-400">{hoveredTract.prevalenciaInicial.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'es' ? 'Prev. Proyectada:' : 'Projected Prev:'}</span>
              <span className="font-bold text-emerald-400">{hoveredTract.prevalenciaProyectada.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'es' ? 'Reducción Absoluta:' : 'Absolute Red:'}</span>
              <span className="font-bold text-teal-300">-{hoveredTract.diferenciaAbsoluta.toFixed(2)} p.p.</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">{language === 'es' ? 'Casos Evitados:' : 'Avoided Cases:'}</span>
              <span className="font-extrabold text-cyan-300">+{hoveredTract.casosEvitados.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom 3D Legend & Interaction Help */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-none">
        {/* Spatial Layer Badges */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg text-[11px]">
          <div className="flex items-center gap-1 text-blue-400 font-semibold">
            <div className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span>{language === 'es' ? 'Escuelas' : 'Schools'}</span>
          </div>
          {restrictionActive && (
            <div className="flex items-center gap-1 text-cyan-300 font-semibold">
              <div className="w-2.5 h-2.5 rounded-full border border-cyan-400 bg-cyan-500/30" />
              <span>{restrictionRadius}m {language === 'es' ? 'Buffer' : 'Buffer'}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span>{language === 'es' ? 'Mercados Frescos' : 'Fresh Produce'}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400 font-semibold">
            <div className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span>{language === 'es' ? 'Comida Rápida' : 'Fast Food'}</span>
          </div>
        </div>

        {/* Orbit Interaction Hint */}
        <div className="pointer-events-auto text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-teal-400 animate-spin-slow" />
          <span>{language === 'es' ? 'Arrastra para rotar • Rueda para zoom • Clic para seleccionar' : 'Drag to rotate • Wheel to zoom • Click to select'}</span>
        </div>
      </div>
    </div>
  );
}
