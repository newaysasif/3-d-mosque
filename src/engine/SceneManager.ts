import * as THREE from 'three';
import {
  ActivePlacementSession,
  CameraMode,
  LightingEnv,
  PlacedFurnitureItem,
  RoomConfig,
  WallDirection,
} from '../types';
import { buildFurnitureModel } from './furnitureModels';
import {
  getProceduralFlooringTexture,
  getWoodSlatsTexture,
  getIslamicCalligraphyFriezeTexture,
  getIslamicGeometricTileTexture,
  getCalligraphyMedallionTexture,
  getMihrabArchPanelTexture,
  getCarvedWhiteJaliTexture,
  getIslamicDoorStarLatticeTexture,
} from './proceduralTextures';

export interface SceneCallbacks {
  onItemSelected: (item: PlacedFurnitureItem | null) => void;
  onItemMoved: (item: PlacedFurnitureItem) => void;
}

export class SceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;

  // Cameras
  private orbitCamera: THREE.PerspectiveCamera;
  private planCamera: THREE.OrthographicCamera;
  private walkCamera: THREE.PerspectiveCamera;
  private activeCamera: THREE.Camera;
  private cameraMode: CameraMode = '3d-orbit';

  // Orbit controls state
  private isOrbiting = false;
  private isPanning = false;
  private previousMousePosition = { x: 0, y: 0 };
  private orbitSpherical = { radius: 11, theta: Math.PI * 0.25, phi: Math.PI * 0.3 };
  private orbitTarget = new THREE.Vector3(0, 0.8, 0);

  // Walkthrough controls state
  private walkPosition = new THREE.Vector3(0, 1.65, 0);
  private walkEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private walkKeys = { forward: false, backward: false, left: false, right: false };
  private walkVelocity = new THREE.Vector3();

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;
  private eveningInteriorLight: THREE.PointLight;

  // Architectural Meshes
  private floorMesh!: THREE.Mesh;
  private ceilingMesh!: THREE.Mesh;
  private wallMeshes: Record<string, THREE.Mesh> = {};
  private baseboardMeshes: THREE.Mesh[] = [];
  private extraMasjidMeshes: THREE.Object3D[] = [];
  private gridHelper!: THREE.GridHelper;
  private floorPlaneTarget!: THREE.Mesh; // Raycast plane

  // Furniture Objects
  private furnitureGroup: THREE.Group;
  private itemMeshMap = new Map<string, THREE.Group>();
  private selectedItemId: string | null = null;
  private selectionBoxHelper: THREE.BoxHelper | null = null;
  private selectionRing: THREE.Mesh | null = null;

  // Raycasting & Dragging
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isDraggingItem = false;
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragOffset = new THREE.Vector3();

  // Live Cursor Placement Mode (Move with Cursor & Place)
  private isPlacingWithCursor = false;
  private placementGhostGroup: THREE.Group | null = null;
  private placementFootprint: THREE.Group | null = null;
  private placementSession: ActivePlacementSession | null = null;
  private onPlacementCompleteCallback: ((pos: [number, number, number], rot: number, dims: { width: number; depth: number; height: number }) => void) | null = null;
  private onPlacementHoverCallback: ((coords: { x: number; z: number }) => void) | null = null;
  private onPlacementCancelCallback: (() => void) | null = null;

  // State
  private roomConfig: RoomConfig;
  private items: PlacedFurnitureItem[] = [];
  private lightingEnv: LightingEnv = 'daylight';
  private callbacks: SceneCallbacks;
  private animationFrameId: number | null = null;
  private lastTime = performance.now();

  constructor(
    container: HTMLElement,
    roomConfig: RoomConfig,
    items: PlacedFurnitureItem[],
    callbacks: SceneCallbacks
  ) {
    this.container = container;
    this.roomConfig = roomConfig;
    this.items = items;
    this.callbacks = callbacks;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f1f5f9');

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 3. Cameras
    // 3D Orbit Camera
    this.orbitCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.updateOrbitCameraPosition();

    // 2D Floor Plan Orthographic Camera
    const aspect = width / height;
    const frustumSize = Math.max(roomConfig.width, roomConfig.length) * 1.35;
    this.planCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    this.planCamera.position.set(0, 20, 0);
    this.planCamera.lookAt(0, 0, 0);
    this.planCamera.up.set(0, 0, -1);

    // Walkthrough Camera
    this.walkCamera = new THREE.PerspectiveCamera(65, width / height, 0.1, 80);
    this.walkCamera.position.copy(this.walkPosition);

    this.activeCamera = this.orbitCamera;

    // 4. Lighting Setup
    this.dirLight = new THREE.DirectionalLight(0xfffdf5, 1.25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 40;
    this.dirLight.shadow.bias = -0.0004;

    const shadowExtent = Math.max(roomConfig.width, roomConfig.length) * 1.1;
    this.dirLight.shadow.camera.left = -shadowExtent;
    this.dirLight.shadow.camera.right = shadowExtent;
    this.dirLight.shadow.camera.top = shadowExtent;
    this.dirLight.shadow.camera.bottom = -shadowExtent;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xe2e8f0, 0.75);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambientLight);

    this.eveningInteriorLight = new THREE.PointLight(0xffecc7, 0, 15);
    this.eveningInteriorLight.position.set(0, 2.5, 0);
    this.scene.add(this.eveningInteriorLight);

    // 5. Furniture Group
    this.furnitureGroup = new THREE.Group();
    this.scene.add(this.furnitureGroup);

    // 6. Build Architecture
    this.rebuildArchitecture();

    // 7. Populate Furniture
    this.syncFurnitureItems(this.items);

    // 8. Update Lighting Environment
    this.setLightingEnv(this.lightingEnv);

    // 9. Event Listeners
    this.bindEvents();

    // 10. Start Render Loop
    this.renderLoop();
  }

  // -------------------------------------------------------------
  // Architecture & Geometry Generation
  // -------------------------------------------------------------
  public rebuildArchitecture() {
    // Remove previous architectural meshes
    if (this.floorMesh) this.scene.remove(this.floorMesh);
    if (this.ceilingMesh) this.scene.remove(this.ceilingMesh);
    if (this.floorPlaneTarget) this.scene.remove(this.floorPlaneTarget);
    if (this.gridHelper) this.scene.remove(this.gridHelper);
    Object.values(this.wallMeshes).forEach((mesh) => this.scene.remove(mesh));
    this.wallMeshes = {};
    this.baseboardMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.baseboardMeshes = [];
    this.extraMasjidMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.extraMasjidMeshes = [];

    const { width: rw, length: rl, height: rh, flooring, baseWallColor, accentWalls } = this.roomConfig;

    if (this.roomConfig.masjidConfig?.isMasjid) {
      // -------------------------------------------------------------
      // MASJID MUSALLA ARCHITECTURE
      // Short Wall: 40.9' Qibla Facing (North)
      // Mehrab Alcove: 18' wide x 7' deep protruding OUT of the 40.9' wall
      // Left Wall: 73.5'
      // Right Wall: 69.1'
      // Back Wall: 63.2'
      // Front Extension: 40.9' x 8' with 4 columns
      // 22 Main Columns: 650mm x 900mm
      // Tie Beam at 13 ft: 150mm x 450mm
      // Main Beam at 19 ft: 450mm x 900mm
      // -------------------------------------------------------------
      const mCfg = this.roomConfig.masjidConfig;
      const ft2m = 0.3048;
      const wQ = (mCfg.qiblaWallFeet || 40.9) * ft2m; // ~12.466m
      const wM = (mCfg.mehrabWidthFeet || 18.0) * ft2m; // ~5.486m
      const dM = (mCfg.mehrabDepthFeet || 7.0) * ft2m; // ~2.134m
      const wB = (mCfg.backWallFeet || 63.2) * ft2m; // ~19.263m
      const lLeft = (mCfg.leftWallFeet || 73.5) * ft2m; // ~22.403m
      const lRight = (mCfg.rightWallFeet || 69.1) * ft2m; // ~21.062m
      const dExt = (mCfg.extensionFeet || 8.0) * ft2m; // ~2.438m (8 ft extension)

      const lengthAvg = (lLeft + lRight) / 2; // ~21.73m
      const zNorth = -lengthAvg / 2;
      const zSouth = +lengthAvg / 2;
      const zExt = zNorth - dExt; // 8 ft extension line
      const zMehrab = zExt - dM; // Mehrab protruding from front

      // Wall Dimensions
      const wallThick = this.roomConfig.wallThicknessMeters || 0.23; // 230mm (9" standard masonry)
      const wallHeight = this.roomConfig.wallHeightMeters || (mCfg.mainBeamElevationMm ? mCfg.mainBeamElevationMm / 1000 : (mCfg.mainBeamHeightFt ? mCfg.mainBeamHeightFt * ft2m : 5.761)); // 5.761m (5761mm)
      const wallVis = this.roomConfig.wallVisibility || {
        north: true,
        south: true,
        east: true,
        west: true,
        extension: true,
      };

      // 10 Perimeter Polygon Vertices (X, Z) incorporating the 40.9' x 8' extension & Mehrab
      const P_ext_left = { x: -wQ / 2, z: zExt };
      const P_m_left_start = { x: -wM / 2, z: zExt };
      const P_m_back_left = { x: -wM / 2, z: zMehrab };
      const P_m_back_right = { x: +wM / 2, z: zMehrab };
      const P_m_right_end = { x: +wM / 2, z: zExt };
      const P_ext_right = { x: +wQ / 2, z: zExt };
      const P_qibla_right = { x: +wQ / 2, z: zNorth };
      const P_back_right = { x: +wB / 2, z: zSouth };
      const P_back_left = { x: -wB / 2, z: zSouth };
      const P_qibla_left = { x: -wQ / 2, z: zNorth };

      // -------------------------------------------------------------
      // DIAGONAL RIGHT CORNER MAIN GATE (6 FEET DEEPER IN THE INNER)
      // "it is a diagonal gate the gate will be in the inner it make a triangular shappe
      // so change it in digoanal 6 feet deeper from the boundry wall"
      // -------------------------------------------------------------
      const isRightCornerGate = mCfg.gatePosition !== 'center';
      const isDiagonalGate = isRightCornerGate && mCfg.isDiagonalGate !== false;
      const gateDepthFt = mCfg.gateDepthFeet || 6.0; // 6 feet deeper from boundary wall corner
      const gateDepthM = gateDepthFt * ft2m; // ~1.8288 m
      // In a 45-deg right triangle, boundary setback leg = depth * sqrt(2)
      const diagLegM = gateDepthM * Math.SQRT2; // ~2.5863 m (~8.485 ft)

      // Key Corner / Gate Coordinates:
      // South wall boundary intersection:
      const P_gate_south = { x: +wB / 2 - diagLegM, z: zSouth };
      // East wall boundary intersection:
      const P_gate_east = { x: +wB / 2, z: zSouth - diagLegM };
      // Boundary corner vertex (housing extra right corner column):
      const P_corner_boundary = { x: +wB / 2, z: zSouth };
      // Center point of the diagonal gate:
      const P_gate_center = {
        x: (P_gate_south.x + P_gate_east.x) / 2,
        z: (P_gate_south.z + P_gate_east.z) / 2,
      };
      const diagGateSpanM = Math.hypot(P_gate_east.x - P_gate_south.x, P_gate_east.z - P_gate_south.z); // ~3.658 m (12 ft)
      const diagGateAngle = Math.PI / 4; // 45 degrees outward facing

      // Build Continuous Floor Shape (Prayer Hall Interior)
      const floorShape = new THREE.Shape();
      floorShape.moveTo(P_ext_left.x, -P_ext_left.z);
      floorShape.lineTo(P_m_left_start.x, -P_m_left_start.z);
      floorShape.lineTo(P_m_back_left.x, -P_m_back_left.z);
      floorShape.lineTo(P_m_back_right.x, -P_m_back_right.z);
      floorShape.lineTo(P_m_right_end.x, -P_m_right_end.z);
      floorShape.lineTo(P_ext_right.x, -P_ext_right.z);
      floorShape.lineTo(P_qibla_right.x, -P_qibla_right.z);
      if (isDiagonalGate) {
        // Interior carpet neatly chamfers at the inner diagonal gate line
        floorShape.lineTo(P_gate_east.x, -P_gate_east.z);
        floorShape.lineTo(P_gate_south.x, -P_gate_south.z);
      } else {
        floorShape.lineTo(P_back_right.x, -P_back_right.z);
      }
      floorShape.lineTo(P_back_left.x, -P_back_left.z);
      floorShape.lineTo(P_qibla_left.x, -P_qibla_left.z);
      floorShape.closePath();

      const floorGeo = new THREE.ShapeGeometry(floorShape);
      // Generate UV mapping scaled to carpet repeat
      const posAttr = floorGeo.attributes.position;
      const uvs = new Float32Array(posAttr.count * 2);
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        uvs[i * 2] = (vx + 25) / 0.9;
        uvs[i * 2 + 1] = (vy + 25) / 1.2;
      }
      floorGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

      const floorData = getProceduralFlooringTexture(flooring, wB, lengthAvg + dExt);
      const floorMat = new THREE.MeshStandardMaterial({
        map: floorData.map,
        roughness: floorData.roughness,
        metalness: floorData.metalness,
      });
      this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
      this.floorMesh.rotation.x = -Math.PI / 2;
      this.floorMesh.receiveShadow = true;
      this.scene.add(this.floorMesh);

      // Invisible Raycast Target
      this.floorPlaneTarget = new THREE.Mesh(floorGeo.clone(), new THREE.MeshBasicMaterial({ visible: false }));
      this.floorPlaneTarget.rotation.x = -Math.PI / 2;
      this.scene.add(this.floorPlaneTarget);

      // Exterior Triangular Porch & Covered Portico in front of Diagonal Gate (6 ft deeper from boundary)
      if (isDiagonalGate) {
        const porchShape = new THREE.Shape();
        porchShape.moveTo(P_gate_south.x, -P_gate_south.z);
        porchShape.lineTo(P_corner_boundary.x, -P_corner_boundary.z);
        porchShape.lineTo(P_gate_east.x, -P_gate_east.z);
        porchShape.closePath();

        const porchGeo = new THREE.ShapeGeometry(porchShape);
        const porchMat = new THREE.MeshStandardMaterial({
          color: 0xf5f3ee, // Polished exterior white/cream marble
          roughness: 0.25,
          metalness: 0.1,
        });
        const porchMesh = new THREE.Mesh(porchGeo, porchMat);
        porchMesh.rotation.x = -Math.PI / 2;
        porchMesh.position.y = 0.02; // slightly raised exterior marble plinth
        porchMesh.receiveShadow = true;
        this.scene.add(porchMesh);
        this.extraMasjidMeshes.push(porchMesh);

        // Triangular Porch Ceiling / Soffit at wall height (5.761m)
        const porchCeilMat = new THREE.MeshStandardMaterial({
          color: 0xfcfbf9,
          roughness: 0.85,
        });
        const porchCeilMesh = new THREE.Mesh(porchGeo.clone(), porchCeilMat);
        porchCeilMesh.rotation.x = Math.PI / 2;
        porchCeilMesh.position.y = wallHeight;
        this.scene.add(porchCeilMesh);
        this.extraMasjidMeshes.push(porchCeilMesh);

        // Triangular Porch Recessed Spotlight
        const porchLight = new THREE.PointLight(0xfff3d6, 1.8, 8.0, 1.2);
        porchLight.position.set(
          (P_gate_south.x + P_corner_boundary.x + P_gate_east.x) / 3,
          wallHeight - 0.25,
          (P_gate_south.z + P_corner_boundary.z + P_gate_east.z) / 3
        );
        this.scene.add(porchLight);
        this.extraMasjidMeshes.push(porchLight);
      }

      // Ceiling Shape
      const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xfcfbf9, roughness: 0.9, side: THREE.BackSide });
      this.ceilingMesh = new THREE.Mesh(floorGeo.clone(), ceilingMat);
      this.ceilingMesh.rotation.x = Math.PI / 2;
      this.ceilingMesh.position.y = wallHeight;
      this.ceilingMesh.visible = this.cameraMode === 'walkthrough' && this.roomConfig.showCeiling;
      this.scene.add(this.ceilingMesh);

      // Wall Materials
      const standardWallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(baseWallColor), roughness: 0.85 });
      const qiblaWallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0d4a36'), roughness: 0.6 }); // Deep emerald
      const mehrabBackMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#093828'), roughness: 0.4 }); // Ornate niche
      const goldTrimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#d4af37'), roughness: 0.25, metalness: 0.85 });
      const concreteMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#e0ddd5'), roughness: 0.65 }); // Structural RC concrete

      const addWallSeg = (
        id: string,
        start: { x: number; z: number },
        end: { x: number; z: number },
        mat: THREE.Material,
        height: number = wallHeight,
        thick: number = wallThick
      ) => {
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const len = Math.hypot(dx, dz);
        const rotY = Math.atan2(dx, dz);
        const geo = new THREE.BoxGeometry(thick, height, len);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((start.x + end.x) / 2, height / 2, (start.z + end.z) / 2);
        mesh.rotation.y = rotY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.wallMeshes[id] = mesh;
        return mesh;
      };

      // Perimeter Wall Segments (Respecting wall visibility toggles):
      if (wallVis.north) {
        addWallSeg('qibla_left', P_qibla_left, { x: -wM / 2, z: zNorth }, qiblaWallMat);
        addWallSeg('qibla_right', { x: +wM / 2, z: zNorth }, P_qibla_right, qiblaWallMat);
        addWallSeg('mehrab_west', P_m_left_start, P_m_back_left, standardWallMat);
        addWallSeg('mehrab_back', P_m_back_left, P_m_back_right, mehrabBackMat);
        addWallSeg('mehrab_east', P_m_back_right, P_m_right_end, standardWallMat);

        // --- MAGNIFICENT ARCHITECTURAL QIBLA WALL ENSEMBLE ---
        const marbleMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#f8f6f0'),
          roughness: 0.2,
          metalness: 0.08,
        });
        const goldMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#d4af37'),
          roughness: 0.22,
          metalness: 0.88,
        });
        const tileTex = getIslamicGeometricTileTexture();
        const tileMat = new THREE.MeshStandardMaterial({
          map: tileTex,
          roughness: 0.35,
        });
        const friezeTex = getIslamicCalligraphyFriezeTexture('emerald');
        const friezeMat = new THREE.MeshStandardMaterial({
          map: friezeTex,
          roughness: 0.25,
        });
        const archPanelTex = getMihrabArchPanelTexture();
        const archMat = new THREE.MeshStandardMaterial({
          map: archPanelTex,
          roughness: 0.25,
        });

        const leftSpan = Math.abs(-wM / 2 - P_qibla_left.x);
        const rightSpan = Math.abs(P_qibla_right.x - wM / 2);
        const zFront = zNorth + wallThick / 2 + 0.02;

        // 1. Lower Marble Wainscoting & Gold Chair Rail across Left and Right Wings
        [-1, 1].forEach((dir) => {
          const span = dir === -1 ? leftSpan : rightSpan;
          const centerX = dir === -1 ? (-wM / 2 + P_qibla_left.x) / 2 : (wM / 2 + P_qibla_right.x) / 2;

          // Wainscot base
          const wainscot = new THREE.Mesh(new THREE.BoxGeometry(span, 0.95, 0.06), marbleMat);
          wainscot.position.set(centerX, 0.475, zFront);
          this.scene.add(wainscot);
          this.extraMasjidMeshes.push(wainscot);

          // Gold Dado Trim
          const dado = new THREE.Mesh(new THREE.BoxGeometry(span, 0.08, 0.08), goldMat);
          dado.position.set(centerX, 0.95, zFront + 0.01);
          this.scene.add(dado);
          this.extraMasjidMeshes.push(dado);

          // Geometric Moroccan Zellij Tile Upper Field
          const tileHeight = wallHeight - 2.1;
          const tileField = new THREE.Mesh(new THREE.BoxGeometry(span, tileHeight, 0.04), tileMat);
          tileField.position.set(centerX, 0.99 + tileHeight / 2, zFront);
          this.scene.add(tileField);
          this.extraMasjidMeshes.push(tileField);

          // Gilded Calligraphy Medallions on Qibla Wall ("Allah" on Left, "Muhammad" on Right)
          const medTex = getCalligraphyMedallionTexture(dir === -1 ? 'allah' : 'muhammad');
          const medMat = new THREE.MeshStandardMaterial({
            map: medTex,
            roughness: 0.22,
            metalness: 0.3,
          });
          const medDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.08, 48), medMat);
          medDisc.rotation.x = Math.PI / 2;
          medDisc.position.set(centerX, 0.99 + tileHeight * 0.58, zFront + 0.06);
          this.scene.add(medDisc);
          this.extraMasjidMeshes.push(medDisc);

          const medRim = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.04, 16, 48), goldMat);
          medRim.position.set(centerX, 0.99 + tileHeight * 0.58, zFront + 0.08);
          this.scene.add(medRim);
          this.extraMasjidMeshes.push(medRim);

          // Floor Cove Warm Uplighting washing up the Qibla wall
          const coveLight = new THREE.SpotLight(0xffecc2, 3.8, 12, Math.PI / 3.5, 0.45);
          coveLight.position.set(centerX, 0.3, zFront + 0.8);
          const coveTarget = new THREE.Object3D();
          coveTarget.position.set(centerX, 3.2, zFront);
          this.scene.add(coveTarget);
          coveLight.target = coveTarget;
          this.scene.add(coveLight);
          this.extraMasjidMeshes.push(coveLight, coveTarget);
        });

        // 2. Flanking Carved Marble Pilasters with Gold Muqarnas Capitals
        const pilasterPositions = [
          P_qibla_left.x + 0.3,
          -wM / 2 - 0.25,
          wM / 2 + 0.25,
          P_qibla_right.x - 0.3,
        ];
        pilasterPositions.forEach((px) => {
          // Shaft
          const pilaster = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, wallHeight - 0.8, 0.16),
            marbleMat
          );
          pilaster.position.set(px, (wallHeight - 0.8) / 2, zFront + 0.04);
          this.scene.add(pilaster);
          this.extraMasjidMeshes.push(pilaster);

          // Base plinth
          const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.5, 0.22), marbleMat);
          pBase.position.set(px, 0.25, zFront + 0.06);
          this.scene.add(pBase);
          this.extraMasjidMeshes.push(pBase);

          // Gold capital
          const pCap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.26), goldMat);
          pCap.position.set(px, wallHeight - 0.8 + 0.15, zFront + 0.06);
          this.scene.add(pCap);
          this.extraMasjidMeshes.push(pCap);
        });

        // 3. Grand Mehrab Horseshoe Arch Portal Header
        const archPortal = new THREE.Mesh(
          new THREE.BoxGeometry(wM + 0.1, wallHeight - 2.8, 0.26),
          archMat
        );
        archPortal.position.set(0, wallHeight - (wallHeight - 2.8) / 2, zFront);
        this.scene.add(archPortal);
        this.extraMasjidMeshes.push(archPortal);

        // Gold Arch Moulding Trim
        const archMould = new THREE.Mesh(
          new THREE.BoxGeometry(wM + 0.16, 0.12, 0.3),
          goldMat
        );
        archMould.position.set(0, 2.8, zFront + 0.02);
        this.scene.add(archMould);
        this.extraMasjidMeshes.push(archMould);

        // 4. Continuous Quranic Calligraphy Frieze Running across Entire Qibla Span
        const friezeH = 0.68;
        const totalQiblaW = wQ;
        const friezeMesh = new THREE.Mesh(
          new THREE.BoxGeometry(totalQiblaW, friezeH, 0.24),
          friezeMat
        );
        friezeMesh.position.set(0, wallHeight - 0.44, zFront + 0.04);
        this.scene.add(friezeMesh);
        this.extraMasjidMeshes.push(friezeMesh);

        // Gold Cornice & Dentils Crown
        const cornice = new THREE.Mesh(
          new THREE.BoxGeometry(totalQiblaW + 0.1, 0.16, 0.32),
          goldMat
        );
        cornice.position.set(0, wallHeight - 0.08, zFront + 0.06);
        this.scene.add(cornice);
        this.extraMasjidMeshes.push(cornice);

        // Decorative Islamic Cresting Finials along the Top Edge
        const finialCount = 21;
        const finialStep = (totalQiblaW - 1.0) / (finialCount - 1);
        for (let i = 0; i < finialCount; i++) {
          const fx = -totalQiblaW / 2 + 0.5 + i * finialStep;
          const finial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), goldMat);
          finial.position.set(fx, wallHeight + 0.1, zFront + 0.06);
          finial.rotation.y = Math.PI / 4;
          this.scene.add(finial);
          this.extraMasjidMeshes.push(finial);
        }

        // 5. Dedicated Warm Mehrab Sanctuary Spotlight
        const mehrabSpot = new THREE.SpotLight(0xfffae0, 5.2, 16, Math.PI / 4, 0.3);
        mehrabSpot.position.set(0, 4.4, zMehrab + 0.8);
        const spotTarget = new THREE.Object3D();
        spotTarget.position.set(0, 0, zMehrab + 0.8);
        this.scene.add(spotTarget);
        mehrabSpot.target = spotTarget;
        this.scene.add(mehrabSpot);
        this.extraMasjidMeshes.push(mehrabSpot, spotTarget);
      }

      // Extension perimeter walls (if enabled):
      if (wallVis.extension) {
        addWallSeg('ext_left', P_qibla_left, P_ext_left, standardWallMat);
        addWallSeg('ext_front_left', P_ext_left, P_m_left_start, standardWallMat);
        addWallSeg('ext_front_right', P_m_right_end, P_ext_right, standardWallMat);
        addWallSeg('ext_right', P_ext_right, P_qibla_right, standardWallMat);
      }

      // East (Right 69.1'), South (Back 63.2'), West (Left 73.5') walls:
      if (wallVis.east) {
        if (isDiagonalGate) {
          // East wall terminates at the diagonal gate portal intersection (recessed by ~8.5 ft / 6 ft depth)
          addWallSeg('east', P_qibla_right, P_gate_east, standardWallMat);
        } else {
          addWallSeg('east', P_qibla_right, P_back_right, standardWallMat);
        }
      }

      // -------------------------------------------------------------
      // MAIN GATE POSITIONING (DIAGONAL 6 FT DEEPER / RIGHT CORNER)
      // Placed on right corner, recessed 6 feet deeper creating triangular porch.
      // Extra column added to the right side of the building of main gate.
      // -------------------------------------------------------------
      const flatRightPierW = 0.65;
      const flatGateSpanM = (mCfg.gateWidthFeet || 12) * ft2m;
      const xGateR_flat = +wB / 2 - flatRightPierW;
      const xGateL_flat = xGateR_flat - flatGateSpanM;
      const xGateCenter_flat = (xGateL_flat + xGateR_flat) / 2;
      const xGateExtraR_flat = +wB / 2 - 0.225;

      const activeGateSpanM = isDiagonalGate ? diagGateSpanM : flatGateSpanM;

      if (wallVis.south) {
        if (isDiagonalGate) {
          // South Wall runs from Left Back corner to Diagonal Gate South intersection
          addWallSeg('south_left', P_gate_south, P_back_left, standardWallMat);

          // Overhead Lintel Wall above the Diagonal Arched Entrance (from arch apex y=4.6m up to wallHeight=5.761m)
          const lintelH = wallHeight - 4.6;
          if (lintelH > 0) {
            const lintelWall = addWallSeg(
              'gate_diagonal_lintel',
              P_gate_south,
              P_gate_east,
              standardWallMat,
              lintelH,
              wallThick
            );
            lintelWall.position.y = 4.6 + lintelH / 2;
          }
        } else if (isRightCornerGate) {
          // Left South Wall: from P_back_left (-wB/2, zSouth) to Left Gate Column (xGateL_flat, zSouth)
          addWallSeg('south_left', { x: xGateL_flat, z: zSouth }, P_back_left, standardWallMat);
          // Right Corner Pier: from P_back_right (+wB/2, zSouth) to Right Gate Column (xGateR_flat, zSouth)
          addWallSeg('south_right', P_back_right, { x: xGateR_flat, z: zSouth }, standardWallMat);
          // Overhead Lintel Wall above the Grand Arched Entrance (from arch apex y=4.6m up to wallHeight=5.761m)
          const lintelH = wallHeight - 4.6;
          if (lintelH > 0) {
            const lintelGeo = new THREE.BoxGeometry(flatGateSpanM, lintelH, wallThick);
            const lintelMesh = new THREE.Mesh(lintelGeo, standardWallMat);
            lintelMesh.position.set(xGateCenter_flat, 4.6 + lintelH / 2, zSouth);
            lintelMesh.castShadow = true;
            lintelMesh.receiveShadow = true;
            this.scene.add(lintelMesh);
            this.extraMasjidMeshes.push(lintelMesh);
          }
        } else {
          addWallSeg('south', P_back_right, P_back_left, standardWallMat);
        }
      }
      if (wallVis.west) {
        addWallSeg('west', P_back_left, P_qibla_left, standardWallMat);
      }

      // =============================================================
      // GRAND ARMORED ISLAMIC MAIN GATE PORTAL (PHOTO-ACCURATE)
      // Placed on Diagonal Recess / Right Side Corner
      // - Honey ochre/sandstone Islamic pointed arch portal
      // - Dark timber double doors with satin brass rectangular grid
      // - Arched fanlight transom with radial brass mullions
      // - Long vertical brass tubular pull handles
      // - Cascading multi-tier brass lantern chandelier with warm glow
      // - Digital Islamic prayer time clock panel with green LED readout
      // - Flanking potted tropical palm trees in dark planters
      // - Tiered polished marble threshold steps & chrome stanchion ropes
      // - Arabic calligraphy medallion above the arch apex
      // =============================================================
      if (wallVis.south) {
        const portalGroup = new THREE.Group();
        portalGroup.name = 'grand-main-gate-portal';

        // Materials:
        const whiteStoneMat = new THREE.MeshStandardMaterial({
          color: 0xf8f6f0, // Pristine ivory / off-white carved marble
          roughness: 0.35,
          metalness: 0.05,
        });
        const stoneCreamMat = new THREE.MeshStandardMaterial({
          color: 0xedeae2, // Limestone reveal & mouldings
          roughness: 0.45,
          metalness: 0.06,
        });
        const carvedJaliMat = new THREE.MeshStandardMaterial({
          map: getCarvedWhiteJaliTexture(),
          color: 0xfdfcfa,
          roughness: 0.4,
          metalness: 0.08,
        });
        const ledArchHaloMat = new THREE.MeshStandardMaterial({
          color: 0xffefb8, // Continuous warm architectural LED halo
          emissive: 0xffdf78,
          emissiveIntensity: 2.8,
          roughness: 0.2,
        });
        const ledLightboxMat = new THREE.MeshStandardMaterial({
          color: 0xfff8db, // Backlit vertical pillar light box
          emissive: 0xffe899,
          emissiveIntensity: 2.2,
          roughness: 0.25,
        });
        const darkIronDoorMat = new THREE.MeshStandardMaterial({
          color: 0x1e1e24, // Charcoal wrought iron / dark bronze door frame
          roughness: 0.35,
          metalness: 0.85,
        });
        const doorLatticeMat = new THREE.MeshStandardMaterial({
          map: getIslamicDoorStarLatticeTexture(),
          color: 0x24222a,
          roughness: 0.3,
          metalness: 0.8,
        });
        const amberGlassMat = new THREE.MeshStandardMaterial({
          color: 0xffdfa0, // Warm amber translucent glazing behind star lattice
          roughness: 0.15,
          metalness: 0.2,
          transparent: true,
          opacity: 0.55,
        });
        const brassMullionMat = new THREE.MeshStandardMaterial({
          color: 0xd4af37, // Satin architectural brass / gold accents
          roughness: 0.22,
          metalness: 0.88,
        });
        const chromeMetalMat = new THREE.MeshStandardMaterial({
          color: 0xf1f5f9, // Polished chrome stanchions
          roughness: 0.08,
          metalness: 0.95,
        });
        const ropeRedMat = new THREE.MeshStandardMaterial({
          color: 0x991b1b, // Deep velvet barrier rope
          roughness: 0.7,
        });
        const greenLedMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e, // Green LED prayer clock display
          emissive: 0x15803d,
          emissiveIntensity: 1.0,
          roughness: 0.2,
        });
        const darkDisplayMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.2,
          metalness: 0.6,
        });
        const palmPotMat = new THREE.MeshStandardMaterial({
          color: 0x262626,
          roughness: 0.6,
        });
        const palmTrunkMat = new THREE.MeshStandardMaterial({
          color: 0x4a3728,
          roughness: 0.9,
        });
        const palmLeafMat = new THREE.MeshStandardMaterial({
          color: 0x1e4620,
          roughness: 0.5,
          side: THREE.DoubleSide,
        });
        const stepMarbleMat = new THREE.MeshStandardMaterial({
          color: 0xf5f3ee, // Polished white marble floating step treads
          roughness: 0.25,
          metalness: 0.08,
        });
        const stepLedMat = new THREE.MeshStandardMaterial({
          color: 0xfff4cc, // Under-tread warm architectural LED strip
          emissive: 0xffe58a,
          emissiveIntensity: 2.5,
          roughness: 0.2,
        });
        const darkPlinthMat = new THREE.MeshStandardMaterial({
          color: 0x1c1917, // Basalt / black granite threshold apron
          roughness: 0.25,
        });

        const gateSpanM = activeGateSpanM;
        const pierW = 0.65;
        const pierD = 0.55;
        const pierH = 3.35;
        const archClearW = gateSpanM - pierW * 2; // ~2.55m
        const archHalfW = archClearW / 2;
        const archApexY = 4.65;
        const archSpringY = 3.35;

        // 1. Cascading Floating Polished Marble Steps (5 Tiers) with Linear Under-Tread LEDs
        const stepCount = 5;
        const stepRiserH = 0.11;
        const stepTreadD = 0.36;
        const baseZ = 0.2;

        // Dark basalt apron base
        const apronMesh = new THREE.Mesh(
          new THREE.BoxGeometry(gateSpanM + 1.2, 0.04, stepCount * stepTreadD + 0.8),
          darkPlinthMat
        );
        apronMesh.position.set(0, 0.02, baseZ + (stepCount * stepTreadD) / 2 + 0.2);
        apronMesh.receiveShadow = true;
        portalGroup.add(apronMesh);

        for (let s = 0; s < stepCount; s++) {
          const treadW = gateSpanM + 0.95 - s * 0.14;
          const treadY = (stepCount - 1 - s) * stepRiserH + stepRiserH;
          const treadZ = baseZ + (s + 1) * stepTreadD;

          // Polished marble tread slab with slight bullnose front overhang
          const tread = new THREE.Mesh(
            new THREE.BoxGeometry(treadW, 0.045, stepTreadD + 0.035),
            stepMarbleMat
          );
          tread.position.set(0, treadY, treadZ);
          tread.castShadow = true;
          tread.receiveShadow = true;
          portalGroup.add(tread);

          // Continuous warm linear LED strip tucked under the front overhang
          const stepLed = new THREE.Mesh(
            new THREE.BoxGeometry(treadW - 0.08, 0.016, 0.02),
            stepLedMat
          );
          stepLed.position.set(0, treadY - 0.024, treadZ + (stepTreadD + 0.035) / 2 - 0.012);
          portalGroup.add(stepLed);

          // Step riser beneath
          const riser = new THREE.Mesh(
            new THREE.BoxGeometry(treadW - 0.04, stepRiserH, 0.04),
            stoneCreamMat
          );
          riser.position.set(0, treadY - stepRiserH / 2, treadZ - stepTreadD / 2 + 0.02);
          riser.receiveShadow = true;
          portalGroup.add(riser);
        }

        // 2. Left & Right Ivory Carved Stone Piers with Vertical Backlit Jali Light-Boxes
        [-1, 1].forEach((dir) => {
          const px = dir * (gateSpanM / 2 - pierW / 2);

          // Main pier shaft
          const pier = new THREE.Mesh(
            new THREE.BoxGeometry(pierW, pierH, pierD),
            whiteStoneMat
          );
          pier.position.set(px, pierH / 2, 0);
          pier.castShadow = true;
          pier.receiveShadow = true;
          portalGroup.add(pier);

          // Moulded base plinth
          const plinth = new THREE.Mesh(
            new THREE.BoxGeometry(pierW + 0.08, 0.45, pierD + 0.08),
            stoneCreamMat
          );
          plinth.position.set(px, 0.225, 0);
          portalGroup.add(plinth);

          // Capital moulding with gold trim band
          const capital = new THREE.Mesh(
            new THREE.BoxGeometry(pierW + 0.08, 0.18, pierD + 0.08),
            stoneCreamMat
          );
          capital.position.set(px, pierH + 0.09, 0);
          portalGroup.add(capital);

          const capGold = new THREE.Mesh(
            new THREE.BoxGeometry(pierW + 0.1, 0.035, pierD + 0.1),
            brassMullionMat
          );
          capGold.position.set(px, pierH + 0.02, 0);
          portalGroup.add(capGold);

          // Vertical Illuminated Light-Box Panel on pier front face
          const lbW = pierW * 0.52;
          const lbH = 2.15;
          const lbY = 1.75;
          const lbZ = pierD / 2 + 0.015;

          // Glowing translucent acrylic backing
          const lightBacking = new THREE.Mesh(
            new THREE.BoxGeometry(lbW, lbH, 0.02),
            ledLightboxMat
          );
          lightBacking.position.set(px, lbY, lbZ);
          portalGroup.add(lightBacking);

          // Carved geometric star jali fretwork overlay
          const jaliScreen = new THREE.Mesh(
            new THREE.BoxGeometry(lbW - 0.02, lbH - 0.02, 0.018),
            carvedJaliMat
          );
          jaliScreen.position.set(px, lbY, lbZ + 0.012);
          portalGroup.add(jaliScreen);

          // Framing border moulding for the light box
          const frameTop = new THREE.Mesh(new THREE.BoxGeometry(lbW + 0.04, 0.04, 0.03), brassMullionMat);
          frameTop.position.set(px, lbY + lbH / 2 + 0.02, lbZ + 0.01);
          portalGroup.add(frameTop);

          const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(lbW + 0.04, 0.04, 0.03), brassMullionMat);
          frameBottom.position.set(px, lbY - lbH / 2 - 0.02, lbZ + 0.01);
          portalGroup.add(frameBottom);
        });

        // 3. Pointed Arch Tympanum with Carved Mashrabiya Star Jali Spandrels
        const archShape = new THREE.Shape();
        archShape.moveTo(-archHalfW - pierW, archSpringY);
        archShape.lineTo(-archHalfW - pierW, archApexY + 0.35);
        archShape.lineTo(archHalfW + pierW, archApexY + 0.35);
        archShape.lineTo(archHalfW + pierW, archSpringY);
        archShape.lineTo(archHalfW, archSpringY);
        archShape.quadraticCurveTo(archHalfW * 0.45, archApexY, 0, archApexY);
        archShape.quadraticCurveTo(-archHalfW * 0.45, archApexY, -archHalfW, archSpringY);
        archShape.closePath();

        const archGeo = new THREE.ExtrudeGeometry(archShape, {
          depth: pierD,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.03,
          bevelThickness: 0.03,
        });
        const archMesh = new THREE.Mesh(archGeo, whiteStoneMat);
        archMesh.position.set(0, 0, -pierD / 2);
        archMesh.castShadow = true;
        archMesh.receiveShadow = true;
        portalGroup.add(archMesh);

        // Carved Jali Relief Panels on the triangular spandrels above arch shoulders
        [-1, 1].forEach((dir) => {
          const spandrelShape = new THREE.Shape();
          const sx1 = dir * (archHalfW * 0.2);
          const sx2 = dir * (archHalfW + pierW * 0.8);
          spandrelShape.moveTo(sx1, archApexY + 0.22);
          spandrelShape.lineTo(sx2, archApexY + 0.22);
          spandrelShape.lineTo(sx2, archSpringY + 0.15);
          spandrelShape.closePath();

          const spandrelGeo = new THREE.ShapeGeometry(spandrelShape);
          const spandrelMesh = new THREE.Mesh(spandrelGeo, carvedJaliMat);
          spandrelMesh.position.set(0, 0, pierD / 2 + 0.032);
          portalGroup.add(spandrelMesh);

          // Centered Islamic 8-pointed star rosette medallion
          const rox = dir * (archHalfW * 0.68);
          const roy = archSpringY + 0.72;
          const rosetteGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 8);
          rosetteGeo.rotateX(Math.PI / 2);
          const rosetteMesh = new THREE.Mesh(rosetteGeo, brassMullionMat);
          rosetteMesh.position.set(rox, roy, pierD / 2 + 0.05);
          portalGroup.add(rosetteMesh);

          const rosetteInner = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8),
            new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3, metalness: 0.8 })
          );
          rosetteInner.rotateX(Math.PI / 2);
          rosetteInner.rotation.z = Math.PI / 8;
          rosetteInner.position.set(rox, roy, pierD / 2 + 0.055);
          portalGroup.add(rosetteInner);
        });

        // 4. Continuous Warm Architectural LED Halo along the Pointed Arch Curve
        const archRimPoints: THREE.Vector3[] = [];
        const rimSegs = 32;
        const zHalo = pierD / 2 + 0.02;
        for (let i = 0; i <= rimSegs; i++) {
          const t = i / rimSegs;
          let rx: number;
          let ry: number;
          if (t <= 0.5) {
            const u = t / 0.5;
            rx = -archHalfW * (1 - u);
            ry = (1 - u) * (1 - u) * archSpringY + 2 * (1 - u) * u * (archSpringY + 0.8) + u * u * archApexY;
          } else {
            const u = (t - 0.5) / 0.5;
            rx = archHalfW * u;
            ry = (1 - u) * (1 - u) * archApexY + 2 * (1 - u) * u * (archSpringY + 0.8) + u * u * archSpringY;
          }
          archRimPoints.push(new THREE.Vector3(rx, ry, zHalo));
        }
        const rimCurve = new THREE.CatmullRomCurve3(archRimPoints);
        const rimGeo = new THREE.TubeGeometry(rimCurve, 32, 0.038, 8, false);
        const rimMesh = new THREE.Mesh(rimGeo, ledArchHaloMat);
        portalGroup.add(rimMesh);

        // Gold outer arch moulding trim
        const goldRimGeo = new THREE.TubeGeometry(rimCurve, 32, 0.022, 8, false);
        const goldRimMesh = new THREE.Mesh(goldRimGeo, brassMullionMat);
        goldRimMesh.position.z += 0.015;
        portalGroup.add(goldRimMesh);

        // 5. Grand Charcoal Wrought Iron Double Doors with Islamic Girih Star Lattice
        const doorLeafW = (archClearW - 0.04) / 2; // ~1.24m per leaf
        const doorH = 3.25;
        const doorZ = 0.06;

        // LEFT DOOR LEAF: Welcoming OPEN INWARD at ~28° (0.48 radians)
        const leftDoorPivot = new THREE.Group();
        leftDoorPivot.position.set(-archHalfW + 0.02, 0, doorZ);
        leftDoorPivot.rotation.y = 0.48; // Swing open inward into mosque

        const leftDoorPanel = new THREE.Mesh(
          new THREE.BoxGeometry(doorLeafW, doorH, 0.06),
          darkIronDoorMat
        );
        leftDoorPanel.position.set(doorLeafW / 2, doorH / 2, 0);
        leftDoorPanel.castShadow = true;
        leftDoorPivot.add(leftDoorPanel);

        // Star lattice screen insert on left leaf
        const leftLattice = new THREE.Mesh(
          new THREE.BoxGeometry(doorLeafW - 0.12, doorH - 0.22, 0.025),
          doorLatticeMat
        );
        leftLattice.position.set(doorLeafW / 2, doorH / 2, 0.02);
        leftDoorPivot.add(leftLattice);

        // Translucent warm amber glazing behind the lattice
        const leftGlass = new THREE.Mesh(
          new THREE.BoxGeometry(doorLeafW - 0.14, doorH - 0.24, 0.012),
          amberGlassMat
        );
        leftGlass.position.set(doorLeafW / 2, doorH / 2, 0.005);
        leftDoorPivot.add(leftGlass);

        // Vertical tubular brass pull handle on left leaf
        const leftHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 1.35, 16),
          brassMullionMat
        );
        leftHandle.position.set(doorLeafW - 0.12, 1.45, 0.07);
        leftDoorPivot.add(leftHandle);

        [0.85, 2.05].forEach((my) => {
          const standoff = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.05, 12),
            brassMullionMat
          );
          standoff.rotateX(Math.PI / 2);
          standoff.position.set(doorLeafW - 0.12, my, 0.04);
          leftDoorPivot.add(standoff);
        });

        portalGroup.add(leftDoorPivot);

        // RIGHT DOOR LEAF: Closed in pointed arch frame with full star lattice
        const rightDoorPanel = new THREE.Mesh(
          new THREE.BoxGeometry(doorLeafW, doorH, 0.06),
          darkIronDoorMat
        );
        rightDoorPanel.position.set(doorLeafW / 2 + 0.01, doorH / 2, doorZ);
        rightDoorPanel.castShadow = true;
        portalGroup.add(rightDoorPanel);

        const rightLattice = new THREE.Mesh(
          new THREE.BoxGeometry(doorLeafW - 0.12, doorH - 0.22, 0.025),
          doorLatticeMat
        );
        rightLattice.position.set(doorLeafW / 2 + 0.01, doorH / 2, doorZ + 0.02);
        portalGroup.add(rightLattice);

        const rightGlass = new THREE.Mesh(
          new THREE.BoxGeometry(doorLeafW - 0.14, doorH - 0.24, 0.012),
          amberGlassMat
        );
        rightGlass.position.set(doorLeafW / 2 + 0.01, doorH / 2, doorZ + 0.005);
        portalGroup.add(rightGlass);

        // Right Door vertical tubular pull handle
        const rightHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 1.35, 16),
          brassMullionMat
        );
        rightHandle.position.set(0.14, 1.45, doorZ + 0.07);
        portalGroup.add(rightHandle);

        [0.85, 2.05].forEach((my) => {
          const standoff = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.05, 12),
            brassMullionMat
          );
          standoff.rotateX(Math.PI / 2);
          standoff.position.set(0.14, my, doorZ + 0.04);
          portalGroup.add(standoff);
        });

        // 6. Arched Fanlight Transom above doors
        const transomH = archSpringY - doorH + 0.2;
        const transomMesh = new THREE.Mesh(
          new THREE.BoxGeometry(archClearW, transomH, 0.04),
          amberGlassMat
        );
        transomMesh.position.set(0, doorH + transomH / 2, doorZ);
        portalGroup.add(transomMesh);

        // Radial brass spokes in transom
        [-1, -0.5, 0, 0.5, 1].forEach((fr) => {
          const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, transomH, 0.05),
            brassMullionMat
          );
          spoke.position.set(fr * archHalfW * 0.7, doorH + transomH / 2, doorZ);
          spoke.rotation.z = -fr * 0.25;
          portalGroup.add(spoke);
        });

        // 7. Hanging Multi-Tier Satin Brass Lantern Chandelier with Warm Glow
        const chandelierGroup = new THREE.Group();
        const chainGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.75, 8);
        const chainMesh = new THREE.Mesh(chainGeo, brassMullionMat);
        chainMesh.position.set(0, archApexY - 0.38, 0.75);
        chandelierGroup.add(chainMesh);

        const lanternTier1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.34, 0.28, 6),
          brassMullionMat
        );
        lanternTier1.position.set(0, archApexY - 0.85, 0.75);
        chandelierGroup.add(lanternTier1);

        const lanternGlass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.22, 0.32, 6),
          new THREE.MeshStandardMaterial({
            color: 0xfff0c2,
            emissive: 0xffdf80,
            emissiveIntensity: 1.8,
            transparent: true,
            opacity: 0.9,
          })
        );
        lanternGlass.position.set(0, archApexY - 1.15, 0.75);
        chandelierGroup.add(lanternGlass);

        const lanternLight = new THREE.PointLight(0xffeed0, 2.4, 8.5, 1.2);
        lanternLight.position.set(0, archApexY - 1.15, 0.75);
        chandelierGroup.add(lanternLight);

        portalGroup.add(chandelierGroup);

        // 8. Digital Islamic Prayer Times Clock Panel on Right Pier
        const clockGroup = new THREE.Group();
        const clockW = pierW * 0.65;
        const clockH = 0.85;
        const clockBody = new THREE.Mesh(
          new THREE.BoxGeometry(clockW, clockH, 0.05),
          darkDisplayMat
        );
        clockGroup.add(clockBody);

        const clockRim = new THREE.Mesh(
          new THREE.BoxGeometry(clockW + 0.03, clockH + 0.03, 0.04),
          brassMullionMat
        );
        clockRim.position.z = -0.01;
        clockGroup.add(clockRim);

        // Green digital time display rows
        const timesCount = 4;
        for (let r = 0; r < timesCount; r++) {
          const cy = 0.28 - r * 0.18;
          const displayStrip = new THREE.Mesh(
            new THREE.BoxGeometry(clockW * 0.85, 0.09, 0.01),
            greenLedMat
          );
          displayStrip.position.set(0, cy, 0.028);
          clockGroup.add(displayStrip);
        }
        clockGroup.position.set(+gateSpanM / 2 - pierW / 2, 2.2, pierD / 2 + 0.04);
        portalGroup.add(clockGroup);

        // 9. Polished Chrome Stanchions with Red Velvet Barrier Ropes
        const stanchionPositions = [
          { x: -gateSpanM / 2 - 0.2, z: baseZ + stepTreadD * 2 },
          { x: -gateSpanM / 2 - 0.2, z: baseZ + stepTreadD * 4.5 },
          { x: +gateSpanM / 2 + 0.2, z: baseZ + stepTreadD * 2 },
          { x: +gateSpanM / 2 + 0.2, z: baseZ + stepTreadD * 4.5 },
        ];
        const makeStanchion = (x: number, z: number) => {
          const sGroup = new THREE.Group();
          const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), chromeMetalMat);
          sBase.position.y = 0.02;
          sGroup.add(sBase);
          const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.92, 16), chromeMetalMat);
          sPole.position.y = 0.48;
          sGroup.add(sPole);
          const sBall = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), chromeMetalMat);
          sBall.position.y = 0.96;
          sGroup.add(sBall);
          sGroup.position.set(x, 0, z);
          return sGroup;
        };
        stanchionPositions.forEach((pos) => portalGroup.add(makeStanchion(pos.x, pos.z)));

        // Red velvet sagging ropes between stanchions
        [-1, 1].forEach((dir) => {
          const sx = dir * (gateSpanM / 2 + 0.2);
          const z1 = baseZ + stepTreadD * 2;
          const z2 = baseZ + stepTreadD * 4.5;
          const ropeCurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(sx, 0.9, z1),
            new THREE.Vector3(sx, 0.68, (z1 + z2) / 2),
            new THREE.Vector3(sx, 0.9, z2)
          );
          const ropeGeo = new THREE.TubeGeometry(ropeCurve, 16, 0.022, 8, false);
          const ropeMesh = new THREE.Mesh(ropeGeo, ropeRedMat);
          portalGroup.add(ropeMesh);
        });

        // 10. Flanking Tropical Potted Palm Trees
        const makePalmTree = (x: number, z: number) => {
          const palmGroup = new THREE.Group();
          palmGroup.position.set(x, 0, z);
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.55, 16), palmPotMat);
          pot.position.y = 0.275;
          pot.castShadow = true;
          palmGroup.add(pot);

          const trunkCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.55, 0),
            new THREE.Vector3(0.04, 1.2, 0.02),
            new THREE.Vector3(-0.02, 1.85, -0.01),
          ]);
          const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 12, 0.065, 8, false), palmTrunkMat);
          trunk.castShadow = true;
          palmGroup.add(trunk);

          const leafCount = 9;
          for (let i = 0; i < leafCount; i++) {
            const angle = (i / leafCount) * Math.PI * 2;
            const bladeGeo = new THREE.ConeGeometry(0.18, 1.15, 4);
            bladeGeo.rotateX(Math.PI / 2);
            bladeGeo.scale(1, 0.12, 1);
            const bladeMesh = new THREE.Mesh(bladeGeo, palmLeafMat);
            bladeMesh.position.set(
              Math.sin(angle) * 0.45,
              1.85 - Math.cos(angle * 2) * 0.08,
              Math.cos(angle) * 0.45
            );
            bladeMesh.rotation.y = -angle;
            bladeMesh.rotation.z = 0.4;
            palmGroup.add(bladeMesh);
          }
          return palmGroup;
        };

        // Left palm outside the arch
        portalGroup.add(makePalmTree(-gateSpanM / 2 - 0.45, 0.85));
        // Right palm near the corner landing
        portalGroup.add(makePalmTree(+gateSpanM / 2 + 0.45, 0.85));

        // Position and orient the portal group:
        const portalPosX = isDiagonalGate ? P_gate_center.x : (isRightCornerGate ? xGateCenter_flat : 0);
        const portalPosZ = isDiagonalGate ? P_gate_center.z : zSouth;
        const portalRotY = isDiagonalGate ? diagGateAngle : 0;
        portalGroup.position.set(portalPosX, 0, portalPosZ);
        portalGroup.rotation.y = portalRotY;

        this.scene.add(portalGroup);
        this.extraMasjidMeshes.push(portalGroup);
      }

      // -------------------------------------------------------------
      // STRUCTURAL GRID: OUTER COLUMNS & CLEAR-SPAN BEAMS
      // Beams rest on outer columns; center columns removed for 100% open hall
      // Beam Size: 450mm width x 900mm height placed at 5761mm from ground level
      // -------------------------------------------------------------
      if (mCfg.showStructuralGrid !== false) {
        const colW = (mCfg.mainColumnWidthMm || 650) / 1000; // 0.65 m
        const colD = (mCfg.mainColumnDepthMm || 900) / 1000; // 0.90 m
        
        // Exact 5761 mm (5.761 m) elevation from ground level
        const beamElevationM = mCfg.mainBeamElevationMm !== undefined
          ? mCfg.mainBeamElevationMm / 1000
          : (mCfg.mainBeamHeightFt !== undefined ? mCfg.mainBeamHeightFt * ft2m : 5.761); // 5.761 m
        
        // Outer Column Height matches beam resting level at 5761 mm
        const colH = beamElevationM; // 5.761 m (5761 mm from ground level)

        const tieH_ft = mCfg.tieBeamHeightFt || 13.0; // 13 ft
        const tieY = tieH_ft * ft2m; // 3.96 m
        const tieW = (mCfg.tieBeamWidthMm || 150) / 1000; // 0.15 m
        const tieD = (mCfg.tieBeamHeightMm || 450) / 1000; // 0.45 m (depth of tie beam)

        // Main Beam: 450mm width x 900mm height (depth)
        const mainW = (mCfg.mainBeamWidthMm || 450) / 1000; // 0.45 m (450 mm)
        const mainD = (mCfg.mainBeamDepthMm || 900) / 1000; // 0.90 m (900 mm)
        // With beamY = beamElevationM + mainD, beam position y is (beamElevationM + mainD/2),
        // and its bottom face is at exactly beamElevationM = 5.761 m (5761 mm),
        // resting perfectly on top of the outer column capital!
        const mainY = beamElevationM + mainD;

        const extColW = (mCfg.extensionColumnWidthMm || 150) / 1000; // 0.15 m
        const extColD = (mCfg.extensionColumnDepthMm || 200) / 1000; // 0.20 m

        // Center columns removed by default for clear-span hall
        const removeCenterColumns = mCfg.removeCenterColumns !== false;

        let colSeq = 1;
        let beamSeq = 1;

        const createColumn = (x: number, z: number, w: number, d: number, h: number, label?: string) => {
          const colTag = label || `C${colSeq++}`;
          const colGroup = new THREE.Group();
          colGroup.name = colTag;
          colGroup.userData = {
            structuralId: colTag,
            type: 'column',
            widthMm: Math.round(w * 1000),
            depthMm: Math.round(d * 1000),
            heightMm: Math.round(h * 1000),
            elevationMm: Math.round(h * 1000),
            isOuter: true,
          };
          colGroup.position.set(x, 0, z);

          // Column concrete shaft
          const shaftGeo = new THREE.BoxGeometry(w, h, d);
          const shaftMesh = new THREE.Mesh(shaftGeo, concreteMat);
          shaftMesh.position.set(0, h / 2, 0);
          shaftMesh.castShadow = true;
          shaftMesh.receiveShadow = true;
          colGroup.add(shaftMesh);

          // Base plinth
          const plinthGeo = new THREE.BoxGeometry(w + 0.08, 0.25, d + 0.08);
          const plinthMesh = new THREE.Mesh(plinthGeo, concreteMat);
          plinthMesh.position.set(0, 0.125, 0);
          colGroup.add(plinthMesh);

          // Top Capital molding (ends exactly at column top h = 5.761m where beam rests)
          const capGeo = new THREE.BoxGeometry(w + 0.08, 0.18, d + 0.08);
          const capMesh = new THREE.Mesh(capGeo, concreteMat);
          capMesh.position.set(0, h - 0.09, 0);
          colGroup.add(capMesh);

          this.scene.add(colGroup);
          this.extraMasjidMeshes.push(colGroup);
          return colGroup;
        };

        const createBeam = (
          x1: number,
          z1: number,
          x2: number,
          z2: number,
          beamY: number,
          width: number,
          depth: number,
          label?: string
        ) => {
          const beamTag = label || `B${beamSeq++}`;
          const dx = x2 - x1;
          const dz = z2 - z1;
          const len = Math.hypot(dx, dz);
          const rotY = Math.atan2(dx, dz);
          const beamGeo = new THREE.BoxGeometry(width, depth, len);
          const beamMesh = new THREE.Mesh(beamGeo, concreteMat);
          beamMesh.name = beamTag;
          beamMesh.userData = {
            structuralId: beamTag,
            type: 'beam',
            widthMm: Math.round(width * 1000),
            depthMm: Math.round(depth * 1000),
            elevationMm: Math.round((beamY - depth) * 1000), // Bearing elevation from ground
            isClearSpan: true,
          };
          beamMesh.position.set((x1 + x2) / 2, beamY - depth / 2, (z1 + z2) / 2);
          beamMesh.rotation.y = rotY;
          beamMesh.castShadow = true;
          beamMesh.receiveShadow = true;
          this.scene.add(beamMesh);
          this.extraMasjidMeshes.push(beamMesh);
          return beamMesh;
        };

        // 6 Transverse rows of outer columns along perimeter walls
        const numRows = 6;
        const columnGridRows: { left: [number, number]; midLeft?: [number, number]; midRight?: [number, number]; right: [number, number] }[] = [];

        for (let r = 0; r < numRows; r++) {
          const t = r / (numRows - 1);
          const zRow = zNorth + lengthAvg * t;
          const wRow = wQ + (wB - wQ) * t;

          const xLeft = -wRow / 2 + colW / 2;
          const xRight = +wRow / 2 - colW / 2;

          // Outer Perimeter columns at every row (Left & Right)
          if (mCfg.showColumns !== false) {
            createColumn(xLeft, zRow, colW, colD, colH, `C-L${r + 1}`);
            createColumn(xRight, zRow, colW, colD, colH, `C-R${r + 1}`);
          }

          // Interior Center Columns: REMOVED when removeCenterColumns is true
          let xMidLeft: number | undefined;
          let xMidRight: number | undefined;
          if (!removeCenterColumns && r > 0) {
            xMidLeft = -wRow * 0.17;
            xMidRight = +wRow * 0.17;
            if (mCfg.showColumns !== false) {
              createColumn(xMidLeft, zRow, colW, colD, colH, `C-ML${r}`);
              createColumn(xMidRight, zRow, colW, colD, colH, `C-MR${r}`);
            }
          }

          columnGridRows.push({
            left: [xLeft, zRow],
            midLeft: xMidLeft !== undefined ? [xMidLeft, zRow] : undefined,
            midRight: xMidRight !== undefined ? [xMidRight, zRow] : undefined,
            right: [xRight, zRow],
          });
        }

        // Extension Columns at the 8 ft front extension (z = zExt)
        // When center is cleared, only the 2 outer corner extension columns remain
        const extColumns: [number, number][] = removeCenterColumns
          ? [
              [-wQ / 2 + 0.1, zExt],
              [+wQ / 2 - 0.1, zExt],
            ]
          : [
              [-wQ / 2 + 0.1, zExt],
              [-wQ * 0.17, zExt],
              [+wQ * 0.17, zExt],
              [+wQ / 2 - 0.1, zExt],
            ];

        if (mCfg.showColumns !== false) {
          extColumns.forEach(([ex, ez], idx) => {
            const tag = removeCenterColumns
              ? (idx === 0 ? 'C-EXT-L' : 'C-EXT-R')
              : `C-EXT${idx + 1}`;
            createColumn(ex, ez, extColW, extColD, colH, tag);
          });
        }

        // -------------------------------------------------------------
        // TWO MAIN GATE COLUMNS & TWO QIBLA WALL COLUMNS (450mm x 450mm)
        // Main gate placed on the right side of the corner.
        // Extra column added to the right side of the building of main gate.
        // Qibla columns and 20 ft center bay spacing preserved without changes.
        // -------------------------------------------------------------
        const gateColW = (mCfg.gateColumnWidthMm || 450) / 1000; // 0.45m (450mm)
        const gateColD = (mCfg.gateColumnDepthMm || 450) / 1000; // 0.45m (450mm)
        const qiblaColW = (mCfg.qiblaColumnWidthMm || mCfg.qiblaCenterColumnWidthMm || 450) / 1000; // 0.45m (450mm)
        const qiblaColD = (mCfg.qiblaColumnDepthMm || mCfg.qiblaCenterColumnDepthMm || 450) / 1000; // 0.45m (450mm)

        // 20 feet (6.096m) between both center column lines (10 ft / 3.048m each side of center)
        const colSpacingFt = mCfg.columnSpacingFeet || 20;
        const halfSpacingM = (colSpacingFt * 0.3048) / 2; // 3.048m (10 ft)
        const xColL = -halfSpacingM; // -3.048m (-10 ft)
        const xColR = +halfSpacingM; // +3.048m (+10 ft)
        const zGate = zSouth;
        const zQibla = zNorth;

        // Gate column coordinates on South wall / Diagonal gate:
        const xGateColL_flat = isRightCornerGate ? xGateL_flat : xColL;
        const xGateColR_flat = isRightCornerGate ? xGateR_flat : xColR;

        if (mCfg.showColumns !== false) {
          if (isDiagonalGate) {
            // Diagonal Gate Left Column (at South wall intersection)
            createColumn(P_gate_south.x, P_gate_south.z, gateColW, gateColD, colH, 'C-GATE-DIAG-L');
            // Diagonal Gate Right Column (at East wall intersection)
            createColumn(P_gate_east.x, P_gate_east.z, gateColW, gateColD, colH, 'C-GATE-DIAG-R');
            // Extra column added to right side of building of main gate (at boundary corner)
            if (mCfg.hasExtraGateRightColumn !== false) {
              const extraColW = (mCfg.extraGateRightColumnWidthMm || 450) / 1000;
              const extraColD = (mCfg.extraGateRightColumnDepthMm || 450) / 1000;
              createColumn(P_corner_boundary.x, P_corner_boundary.z, extraColW, extraColD, colH, 'C-GATE-EXTRA-R');
            }
          } else {
            // Left and Right Columns on Main Gate / Door (450mm x 450mm @ 5761mm)
            createColumn(xGateColL_flat, zGate, gateColW, gateColD, colH, 'C-GATE-L');
            createColumn(xGateColR_flat, zGate, gateColW, gateColD, colH, 'C-GATE-R');

            // Extra column added to the right side of the building of main gate
            if (isRightCornerGate && mCfg.hasExtraGateRightColumn !== false) {
              const extraColW = (mCfg.extraGateRightColumnWidthMm || 450) / 1000;
              const extraColD = (mCfg.extraGateRightColumnDepthMm || 450) / 1000;
              createColumn(xGateExtraR_flat, zGate, extraColW, extraColD, colH, 'C-GATE-EXTRA-R');
            }
          }

          // Left and Right Columns on Qibla Wall (450mm x 450mm @ 5761mm) - Untouched
          createColumn(xColL, zQibla, qiblaColW, qiblaColD, colH, 'C-QIBLA-L');
          createColumn(xColR, zQibla, qiblaColW, qiblaColD, colH, 'C-QIBLA-R');
        }

        // Tie Beams at 13 ft (150mm width x 450mm height)
        if (mCfg.showTieBeams !== false) {
          if (isDiagonalGate) {
            // Diagonal tie beam over the diagonal gate opening
            createBeam(P_gate_south.x, P_gate_south.z, P_gate_east.x, P_gate_east.z, tieY, tieW, tieD, 'TIE-GATE-DIAG');
            if (mCfg.hasExtraGateRightColumn !== false) {
              // Tie beams along the boundary walls to the extra right corner column
              createBeam(P_gate_south.x, P_gate_south.z, P_corner_boundary.x, P_corner_boundary.z, tieY, tieW, tieD, 'TIE-GATE-SOUTH');
              createBeam(P_gate_east.x, P_gate_east.z, P_corner_boundary.x, P_corner_boundary.z, tieY, tieW, tieD, 'TIE-GATE-EAST');
            }
            // Transverse tie connecting Left Diagonal Gate Column to the longitudinal tie grid
            createBeam(P_gate_south.x, zGate, xColR, zGate, tieY, tieW, tieD, 'TIE-GATE-TRANS');
          } else if (isRightCornerGate && mCfg.hasExtraGateRightColumn !== false) {
            createBeam(xGateColL_flat, zGate, xGateColR_flat, zGate, tieY, tieW, tieD, 'TIE-GATE');
            createBeam(xGateColR_flat, zGate, xGateExtraR_flat, zGate, tieY, tieW, tieD, 'TIE-GATE-CORNER');
            createBeam(xGateColL_flat, zGate, xColR, zGate, tieY, tieW, tieD, 'TIE-GATE-TRANS');
          } else {
            createBeam(xGateColL_flat, zGate, xGateColR_flat, zGate, tieY, tieW, tieD, 'TIE-GATE');
            if (isRightCornerGate) {
              createBeam(xGateColL_flat, zGate, xColR, zGate, tieY, tieW, tieD, 'TIE-GATE-TRANS');
            }
          }
          // Qibla tie beam between C-QIBLA-L and C-QIBLA-R (20 ft span)
          createBeam(xColL, zQibla, xColR, zQibla, tieY, tieW, tieD, 'TIE-QIBLA');
          // Left longitudinal tie beam from Left Gate column line to Left Qibla column
          createBeam(xColL, zGate, xColL, zQibla, tieY, tieW, tieD, 'TIE-LONG-L');
          // Right longitudinal tie beam from Right Gate column line to Right Qibla column
          createBeam(xColR, zGate, xColR, zQibla, tieY, tieW, tieD, 'TIE-LONG-R');

          // Longitudinal tie beams along outer perimeter column lines
          for (let r = 0; r < numRows - 1; r++) {
            const curr = columnGridRows[r];
            const next = columnGridRows[r + 1];
            createBeam(curr.left[0], curr.left[1], next.left[0], next.left[1], tieY, tieW, tieD, `TIE-L${r + 1}`);
            createBeam(curr.right[0], curr.right[1], next.right[0], next.right[1], tieY, tieW, tieD, `TIE-R${r + 1}`);
            if (curr.midLeft && next.midLeft) {
              createBeam(curr.midLeft[0], curr.midLeft[1], next.midLeft[0], next.midLeft[1], tieY, tieW, tieD);
            }
            if (curr.midRight && next.midRight) {
              createBeam(curr.midRight[0], curr.midRight[1], next.midRight[0], next.midRight[1], tieY, tieW, tieD);
            }
          }

          // Transverse tie beams across rows (spanning across outer columns)
          columnGridRows.forEach((row, idx) => {
            if (row.midLeft && row.midRight) {
              createBeam(row.left[0], row.left[1], row.midLeft[0], row.midLeft[1], tieY, tieW, tieD);
              createBeam(row.midLeft[0], row.midLeft[1], row.midRight[0], row.midRight[1], tieY, tieW, tieD);
              createBeam(row.midRight[0], row.midRight[1], row.right[0], row.right[1], tieY, tieW, tieD);
            } else {
              createBeam(row.left[0], row.left[1], row.right[0], row.right[1], tieY, tieW, tieD, `TIE-TRANS-${idx + 1}`);
            }
          });

          // Extension tie beams
          if (removeCenterColumns) {
            createBeam(extColumns[0][0], extColumns[0][1], extColumns[1][0], extColumns[1][1], tieY, tieW, tieD, 'TIE-EXT-FRONT');
            createBeam(extColumns[0][0], extColumns[0][1], columnGridRows[0].left[0], columnGridRows[0].left[1], tieY, tieW, tieD, 'TIE-EXT-L');
            createBeam(extColumns[1][0], extColumns[1][1], columnGridRows[0].right[0], columnGridRows[0].right[1], tieY, tieW, tieD, 'TIE-EXT-R');
          } else {
            createBeam(extColumns[0][0], extColumns[0][1], extColumns[1][0], extColumns[1][1], tieY, tieW, tieD);
            createBeam(extColumns[1][0], extColumns[1][1], extColumns[2][0], extColumns[2][1], tieY, tieW, tieD);
            createBeam(extColumns[2][0], extColumns[2][1], extColumns[3][0], extColumns[3][1], tieY, tieW, tieD);
            createBeam(extColumns[0][0], extColumns[0][1], columnGridRows[0].left[0], columnGridRows[0].left[1], tieY, tieW, tieD);
            createBeam(extColumns[3][0], extColumns[3][1], columnGridRows[0].right[0], columnGridRows[0].right[1], tieY, tieW, tieD);
          }
        }

        // Main Beams (450mm width x 900mm height) resting on Outer Columns at 5761 mm from ground level
        if (mCfg.showMainBeams !== false) {
          // Longitudinal main roof beams connecting outer columns along West and East walls
          for (let r = 0; r < numRows - 1; r++) {
            const curr = columnGridRows[r];
            const next = columnGridRows[r + 1];
            createBeam(curr.left[0], curr.left[1], next.left[0], next.left[1], mainY, mainW, mainD, `B-L${r + 1}`);
            createBeam(curr.right[0], curr.right[1], next.right[0], next.right[1], mainY, mainW, mainD, `B-R${r + 1}`);
            if (curr.midLeft && next.midLeft) {
              createBeam(curr.midLeft[0], curr.midLeft[1], next.midLeft[0], next.midLeft[1], mainY, mainW, mainD);
            }
            if (curr.midRight && next.midRight) {
              createBeam(curr.midRight[0], curr.midRight[1], next.midRight[0], next.midRight[1], mainY, mainW, mainD);
            }
          }

          // Transverse main roof beams:
          // Spans completely clear across the hall and rests directly on top of the outer columns at 5761 mm!
          columnGridRows.forEach((row, idx) => {
            if (row.midLeft && row.midRight) {
              createBeam(row.left[0], row.left[1], row.midLeft[0], row.midLeft[1], mainY, mainW, mainD);
              createBeam(row.midLeft[0], row.midLeft[1], row.midRight[0], row.midRight[1], mainY, mainW, mainD);
              createBeam(row.midRight[0], row.midRight[1], row.right[0], row.right[1], mainY, mainW, mainD);
            } else {
              // CLEAR SPAN BEAM (450mm x 900mm) resting on outer left and right columns at 5761mm
              createBeam(row.left[0], row.left[1], row.right[0], row.right[1], mainY, mainW, mainD, `B${idx + 1}`);
            }
          });

          // Extension main beams (450mm x 900mm at 5761 mm)
          if (removeCenterColumns) {
            createBeam(extColumns[0][0], extColumns[0][1], extColumns[1][0], extColumns[1][1], mainY, mainW, mainD, 'B-EXT-FRONT');
            createBeam(extColumns[0][0], extColumns[0][1], columnGridRows[0].left[0], columnGridRows[0].left[1], mainY, mainW, mainD, 'B-EXT-L');
            createBeam(extColumns[1][0], extColumns[1][1], columnGridRows[0].right[0], columnGridRows[0].right[1], mainY, mainW, mainD, 'B-EXT-R');
          } else {
            createBeam(extColumns[0][0], extColumns[0][1], extColumns[1][0], extColumns[1][1], mainY, mainW, mainD);
            createBeam(extColumns[1][0], extColumns[1][1], extColumns[2][0], extColumns[2][1], mainY, mainW, mainD);
            createBeam(extColumns[2][0], extColumns[2][1], extColumns[3][0], extColumns[3][1], mainY, mainW, mainD);
            createBeam(extColumns[0][0], extColumns[0][1], columnGridRows[0].left[0], columnGridRows[0].left[1], mainY, mainW, mainD);
            createBeam(extColumns[3][0], extColumns[3][1], columnGridRows[0].right[0], columnGridRows[0].right[1], mainY, mainW, mainD);
          }

          // -------------------------------------------------------------
          // TWO LONGITUDINAL BEAMS (450mm width x 900mm height @ 5761mm)
          // 20 FEET APART:
          // 1. Right Longitudinal Beam: Rests on Right Door Column & Right Qibla Column, tying all B1-B6 beams
          // 2. Left Longitudinal Beam: Rests on Left Door Column & Left Qibla Column, tying all B1-B6 beams
          // -------------------------------------------------------------
          // Main Gate Portal Header Beam (450mm width x 900mm height @ 5761mm)
          if (isDiagonalGate) {
            // Main Diagonal Header Beam (450mm x 900mm @ 5761mm)
            createBeam(P_gate_south.x, P_gate_south.z, P_gate_east.x, P_gate_east.z, mainY, mainW, mainD, 'B-GATE-DIAG');
            if (mCfg.hasExtraGateRightColumn !== false) {
              // Boundary beams connecting to extra corner column
              createBeam(P_gate_south.x, P_gate_south.z, P_corner_boundary.x, P_corner_boundary.z, mainY, mainW, mainD, 'B-GATE-SOUTH');
              createBeam(P_gate_east.x, P_gate_east.z, P_corner_boundary.x, P_corner_boundary.z, mainY, mainW, mainD, 'B-GATE-EAST');
            } else if (mCfg.hasUmbrellaCornerCanopy !== false) {
              // -------------------------------------------------------------
              // UMBRELLA CORNER CANOPY (Door columns go up and rake to outer corner in umbrella shape)
              // -------------------------------------------------------------
              const uBeamW = (mCfg.umbrellaRakingBeamWidthMm || 350) / 1000;
              const uBeamD = (mCfg.umbrellaRakingBeamDepthMm || 450) / 1000;
              // Raking cantilever beam 1: from South Gate Column top to Outer Boundary Corner
              createBeam(P_gate_south.x, P_gate_south.z, P_corner_boundary.x, P_corner_boundary.z, mainY, uBeamW, uBeamD, 'B-UMBRELLA-SOUTH');
              // Raking cantilever beam 2: from East Gate Column top to Outer Boundary Corner
              createBeam(P_gate_east.x, P_gate_east.z, P_corner_boundary.x, P_corner_boundary.z, mainY, uBeamW, uBeamD, 'B-UMBRELLA-EAST');

              // Umbrella Canopy Triangular Overhead Slab at main roof level (y = wallHeight)
              const canopyShape = new THREE.Shape();
              canopyShape.moveTo(P_gate_south.x, P_gate_south.z);
              canopyShape.lineTo(P_gate_east.x, P_gate_east.z);
              canopyShape.lineTo(P_corner_boundary.x, P_corner_boundary.z);
              canopyShape.closePath();

              const canopyExtrudeGeo = new THREE.ExtrudeGeometry(canopyShape, {
                depth: 0.18,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.03,
                bevelSegments: 2,
              });
              const canopyMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color('#faf8f5'),
                roughness: 0.35,
                metalness: 0.05,
              });
              const canopyMesh = new THREE.Mesh(canopyExtrudeGeo, canopyMat);
              canopyMesh.rotation.x = Math.PI / 2;
              canopyMesh.position.y = wallHeight + 0.18;
              canopyMesh.castShadow = true;
              canopyMesh.receiveShadow = true;
              this.scene.add(canopyMesh);
              this.extraMasjidMeshes.push(canopyMesh);

              // Recessed architectural warm spotlight in umbrella soffit
              const umbrellaSpot = new THREE.SpotLight(0xfff1d6, 3.8, 12, Math.PI / 3, 0.4);
              umbrellaSpot.position.set(
                (P_gate_south.x + P_gate_east.x + P_corner_boundary.x) / 3,
                wallHeight - 0.1,
                (P_gate_south.z + P_gate_east.z + P_corner_boundary.z) / 3
              );
              const umbrellaTarget = new THREE.Object3D();
              umbrellaTarget.position.set(umbrellaSpot.position.x, 0, umbrellaSpot.position.z);
              this.scene.add(umbrellaTarget);
              umbrellaSpot.target = umbrellaTarget;
              this.scene.add(umbrellaSpot);
              this.extraMasjidMeshes.push(umbrellaSpot, umbrellaTarget);
            }
            // Header tie from Left Gate Column into Right Longitudinal Beam
            createBeam(P_gate_south.x, zGate, xColR, zGate, mainY, mainW, mainD, 'B-GATE-TIE');
          } else if (isRightCornerGate && mCfg.hasExtraGateRightColumn !== false) {
            createBeam(xGateColL_flat, zGate, xGateColR_flat, zGate, mainY, mainW, mainD, 'B-GATE');
            createBeam(xGateColR_flat, zGate, xGateExtraR_flat, zGate, mainY, mainW, mainD, 'B-GATE-CORNER');
            createBeam(xGateColL_flat, zGate, xColR, zGate, mainY, mainW, mainD, 'B-GATE-TIE');
          } else {
            createBeam(xGateColL_flat, zGate, xGateColR_flat, zGate, mainY, mainW, mainD, 'B-GATE');
            if (isRightCornerGate) {
              createBeam(xGateColL_flat, zGate, xColR, zGate, mainY, mainW, mainD, 'B-GATE-TIE');
            }
          }
        }
      }

      // Saff Prayer Lines (if enabled)
      if (mCfg.showSaffLines) {
        const saffGroup = new THREE.Group();
        const spacing = mCfg.saffSpacingMeters || 1.2;
        const lineMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(mCfg.saffColor || '#d4af37'),
          roughness: 0.3,
          metalness: 0.7,
        });

        for (let z = zNorth + spacing; z < zSouth - 0.8; z += spacing) {
          const t = (z - zNorth) / (zSouth - zNorth);
          const rowW = wQ + (wB - wQ) * t;

          const rowLine = new THREE.Mesh(new THREE.BoxGeometry(rowW - 0.4, 0.006, 0.045), lineMat);
          rowLine.position.set(0, 0.004, z);
          saffGroup.add(rowLine);
        }
        this.scene.add(saffGroup);
        this.extraMasjidMeshes.push(saffGroup);
      }

      this.updateWallVisibility();
      return;
    }

    // Default Standard Rectangular Room
    // Floor Mesh with Procedural Texture
    const floorGeo = new THREE.PlaneGeometry(rw, rl, 1, 1);
    const floorData = getProceduralFlooringTexture(flooring, rw, rl);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorData.map,
      roughness: floorData.roughness,
      metalness: floorData.metalness,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Invisible Floor Plane for Raycasting
    const floorTargetGeo = new THREE.PlaneGeometry(rw, rl);
    const floorTargetMat = new THREE.MeshBasicMaterial({ visible: false });
    this.floorPlaneTarget = new THREE.Mesh(floorTargetGeo, floorTargetMat);
    this.floorPlaneTarget.rotation.x = -Math.PI / 2;
    this.floorPlaneTarget.position.y = 0;
    this.scene.add(this.floorPlaneTarget);

    // Architectural Grid Lines
    const gridDivisions = Math.round(Math.max(rw, rl) * 2); // 0.5m grid
    this.gridHelper = new THREE.GridHelper(Math.max(rw, rl), gridDivisions, 0x94a3b8, 0xcfd8dc);
    this.gridHelper.position.y = 0.005;
    this.scene.add(this.gridHelper);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(rw, rl);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xfcfbf9,
      roughness: 0.9,
      side: THREE.BackSide,
    });
    this.ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    this.ceilingMesh.rotation.x = Math.PI / 2;
    this.ceilingMesh.position.y = rh;
    this.ceilingMesh.visible = this.cameraMode === 'walkthrough' && this.roomConfig.showCeiling;
    this.scene.add(this.ceilingMesh);

    // 4 Room Walls (North, South, East, West)
    const wallThickness = 0.12;

    const createWall = (
      dir: WallDirection,
      w: number,
      pos: [number, number, number],
      rotY: number
    ) => {
      const accent = accentWalls[dir];
      let wallMat: THREE.MeshStandardMaterial;

      if (accent && accent.enabled) {
        if (accent.finish === 'wood-slats') {
          const slatTex = getWoodSlatsTexture();
          wallMat = new THREE.MeshStandardMaterial({
            map: slatTex,
            roughness: 0.6,
          });
        } else {
          wallMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(accent.color),
            roughness: 0.85,
          });
        }
      } else {
        wallMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(baseWallColor),
          roughness: 0.85,
        });
      }

      const wallGeo = new THREE.BoxGeometry(w, rh, wallThickness);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(...pos);
      wallMesh.rotation.y = rotY;
      wallMesh.receiveShadow = true;
      wallMesh.castShadow = true;
      this.scene.add(wallMesh);
      return wallMesh;
    };

    // North wall (Z = -rl/2)
    this.wallMeshes.north = createWall('north', rw, [0, rh / 2, -rl / 2 - wallThickness / 2], 0);
    // South wall (Z = +rl/2)
    this.wallMeshes.south = createWall('south', rw, [0, rh / 2, rl / 2 + wallThickness / 2], 0);
    // West wall (X = -rw/2)
    this.wallMeshes.west = createWall('west', rl, [-rw / 2 - wallThickness / 2, rh / 2, 0], Math.PI / 2);
    // East wall (X = +rw/2)
    this.wallMeshes.east = createWall('east', rl, [rw / 2 + wallThickness / 2, rh / 2, 0], Math.PI / 2);

    // Baseboard Moldings
    const bHeight = this.roomConfig.baseboardHeight || 0.12;
    const bThick = 0.02;
    const bColor = new THREE.Color(this.roomConfig.baseboardColor || '#ece8e1');
    const bMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.5 });

    const addBaseboard = (len: number, pos: [number, number, number], rotY: number) => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(len, bHeight, bThick), bMat);
      bMesh.position.set(...pos);
      bMesh.rotation.y = rotY;
      bMesh.receiveShadow = true;
      this.scene.add(bMesh);
      this.baseboardMeshes.push(bMesh);
    };

    addBaseboard(rw, [0, bHeight / 2, -rl / 2 + bThick / 2], 0);
    addBaseboard(rw, [0, bHeight / 2, rl / 2 - bThick / 2], 0);
    addBaseboard(rl, [-rw / 2 + bThick / 2, bHeight / 2, 0], Math.PI / 2);
    addBaseboard(rl, [rw / 2 - bThick / 2, bHeight / 2, 0], Math.PI / 2);

    this.updateWallVisibility();
  }

  // Adjust walls in 3D orbit mode so user can see inside easily
  private updateWallVisibility() {
    const wallVis = this.roomConfig.wallVisibility || {
      north: true,
      south: true,
      east: true,
      west: true,
      extension: true,
    };

    const isWallAllowed = (k: string) => {
      if (k === 'south' || k === 'south_left' || k === 'south_right') return wallVis.south;
      if (k === 'east') return wallVis.east;
      if (k === 'west') return wallVis.west;
      if (k === 'north' || k === 'qibla_left' || k === 'qibla_right' || k.startsWith('mehrab_')) return wallVis.north;
      if (k.startsWith('ext_')) return wallVis.extension;
      return true;
    };

    if (this.cameraMode === '2d-plan') {
      this.ceilingMesh.visible = false;
      if (this.gridHelper) this.gridHelper.visible = !this.roomConfig.masjidConfig?.isMasjid;
      Object.entries(this.wallMeshes).forEach(([k, w]) => {
        w.visible = isWallAllowed(k);
        (w.material as THREE.MeshStandardMaterial).opacity = 1.0;
        (w.material as THREE.MeshStandardMaterial).transparent = false;
      });
    } else if (this.cameraMode === 'walkthrough') {
      this.ceilingMesh.visible = this.roomConfig.showCeiling;
      if (this.gridHelper) this.gridHelper.visible = false;
      Object.entries(this.wallMeshes).forEach(([k, w]) => {
        w.visible = isWallAllowed(k);
        (w.material as THREE.MeshStandardMaterial).opacity = 1.0;
        (w.material as THREE.MeshStandardMaterial).transparent = false;
      });
    } else {
      this.ceilingMesh.visible = this.roomConfig.showCeiling;
      if (this.gridHelper) this.gridHelper.visible = !this.roomConfig.masjidConfig?.isMasjid;

      const camPos = this.orbitCamera.position;
      if (this.roomConfig.masjidConfig?.isMasjid) {
        if (this.wallMeshes['south']) this.wallMeshes['south'].visible = wallVis.south && camPos.z < 5;
        if (this.wallMeshes['south_left']) this.wallMeshes['south_left'].visible = wallVis.south && camPos.z < 5;
        if (this.wallMeshes['south_right']) this.wallMeshes['south_right'].visible = wallVis.south && camPos.z < 5;
        if (this.wallMeshes['east']) this.wallMeshes['east'].visible = wallVis.east && camPos.x < 5;
        if (this.wallMeshes['west']) this.wallMeshes['west'].visible = wallVis.west && camPos.x > -5;
        if (this.wallMeshes['ext_left']) this.wallMeshes['ext_left'].visible = wallVis.extension;
        if (this.wallMeshes['ext_right']) this.wallMeshes['ext_right'].visible = wallVis.extension;
        if (this.wallMeshes['ext_front_left']) this.wallMeshes['ext_front_left'].visible = wallVis.extension;
        if (this.wallMeshes['ext_front_right']) this.wallMeshes['ext_front_right'].visible = wallVis.extension;
        // Qibla wall and Mehrab alcove walls
        ['qibla_left', 'qibla_right', 'mehrab_west', 'mehrab_back', 'mehrab_east'].forEach((k) => {
          if (this.wallMeshes[k]) this.wallMeshes[k].visible = wallVis.north;
        });
      } else {
        if (this.wallMeshes['south']) this.wallMeshes['south'].visible = wallVis.south && camPos.z < this.roomConfig.length * 0.2;
        if (this.wallMeshes['east']) this.wallMeshes['east'].visible = wallVis.east && camPos.x < this.roomConfig.width * 0.2;
        if (this.wallMeshes['north']) this.wallMeshes['north'].visible = wallVis.north;
        if (this.wallMeshes['west']) this.wallMeshes['west'].visible = wallVis.west;
      }
    }
  }

  // -------------------------------------------------------------
  // Furniture Sync & Management
  // -------------------------------------------------------------
  public syncFurnitureItems(items: PlacedFurnitureItem[]) {
    this.items = items;

    // Clear old meshes
    this.itemMeshMap.forEach((mesh) => this.furnitureGroup.remove(mesh));
    this.itemMeshMap.clear();

    // Rebuild models
    items.forEach((item) => {
      const modelGroup = buildFurnitureModel(
        item.modelType,
        item.color,
        item.secondaryColor,
        item.customData,
        item.dimensions
      );
      modelGroup.position.set(...item.position);
      modelGroup.rotation.y = (item.rotationY * Math.PI) / 180;
      modelGroup.userData = { id: item.id };

      this.furnitureGroup.add(modelGroup);
      this.itemMeshMap.set(item.id, modelGroup);
    });

    this.updateSelectionVisuals();
  }

  public selectItem(id: string | null) {
    this.selectedItemId = id;
    const item = this.items.find((it) => it.id === id) || null;
    this.callbacks.onItemSelected(item);
    this.updateSelectionVisuals();
  }

  private updateSelectionVisuals() {
    if (this.selectionBoxHelper) {
      this.scene.remove(this.selectionBoxHelper);
      this.selectionBoxHelper = null;
    }
    if (this.selectionRing) {
      this.scene.remove(this.selectionRing);
      this.selectionRing = null;
    }

    if (!this.selectedItemId) return;
    const meshGroup = this.itemMeshMap.get(this.selectedItemId);
    if (!meshGroup) return;

    // Bounding Box outline
    this.selectionBoxHelper = new THREE.BoxHelper(meshGroup, 0x2563eb);
    this.scene.add(this.selectionBoxHelper);

    // Floor orientation ring with forward arrow notch
    const ringGeo = new THREE.RingGeometry(0.5, 0.55, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.set(meshGroup.position.x, 0.015, meshGroup.position.z);
    this.scene.add(this.selectionRing);
  }

  // -------------------------------------------------------------
  // Camera & Viewport Modes
  // -------------------------------------------------------------
  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;

    if (mode === '3d-orbit') {
      this.activeCamera = this.orbitCamera;
      this.updateOrbitCameraPosition();
    } else if (mode === '2d-plan') {
      this.activeCamera = this.planCamera;
      const aspect = this.container.clientWidth / this.container.clientHeight;
      const maxDim = this.roomConfig.masjidConfig?.isMasjid ? 28.0 : Math.max(this.roomConfig.width, this.roomConfig.length);
      const frustumSize = maxDim * 1.35;
      this.planCamera.left = (-frustumSize * aspect) / 2;
      this.planCamera.right = (frustumSize * aspect) / 2;
      this.planCamera.top = frustumSize / 2;
      this.planCamera.bottom = -frustumSize / 2;
      this.planCamera.updateProjectionMatrix();
    } else if (mode === 'walkthrough') {
      this.activeCamera = this.walkCamera;
      const walkZ = this.roomConfig.masjidConfig?.isMasjid ? 5.0 : Math.min(this.roomConfig.length * 0.35, 2.0);
      this.walkPosition.set(0, 1.65, walkZ);
      this.walkEuler.set(0, 0, 0);
      this.walkCamera.position.copy(this.walkPosition);
    }

    this.updateWallVisibility();
  }

  public setLightingEnv(env: LightingEnv) {
    this.lightingEnv = env;
    const rw = this.roomConfig.width;
    const rl = this.roomConfig.length;
    const rh = this.roomConfig.height;

    switch (env) {
      case 'daylight':
        this.scene.background = new THREE.Color('#f1f5f9');
        this.dirLight.color.setHex(0xfffbf0);
        this.dirLight.intensity = 1.3;
        this.dirLight.position.set(rw * 0.9, rh * 2.2, rl * 0.8);
        this.hemiLight.color.setHex(0xe0f2fe);
        this.hemiLight.groundColor.setHex(0xe2e8f0);
        this.hemiLight.intensity = 0.85;
        this.ambientLight.intensity = 0.35;
        this.eveningInteriorLight.intensity = 0;
        break;

      case 'golden-hour':
        this.scene.background = new THREE.Color('#fef3c7');
        this.dirLight.color.setHex(0xffa149);
        this.dirLight.intensity = 1.6;
        this.dirLight.position.set(rw * 1.3, rh * 1.1, rl * 0.4);
        this.hemiLight.color.setHex(0xfed7aa);
        this.hemiLight.groundColor.setHex(0x78350f);
        this.hemiLight.intensity = 0.75;
        this.ambientLight.intensity = 0.25;
        this.eveningInteriorLight.intensity = 0.3;
        break;

      case 'evening':
        this.scene.background = new THREE.Color('#0f172a');
        this.dirLight.color.setHex(0x38bdf8);
        this.dirLight.intensity = 0.2;
        this.dirLight.position.set(rw * 0.5, rh * 1.5, rl * 0.5);
        this.hemiLight.color.setHex(0x1e293b);
        this.hemiLight.groundColor.setHex(0x0f172a);
        this.hemiLight.intensity = 0.3;
        this.ambientLight.intensity = 0.15;
        this.eveningInteriorLight.intensity = 1.1;
        break;
    }
  }

  public updateRoomConfig(config: RoomConfig) {
    this.roomConfig = config;
    this.rebuildArchitecture();
    this.setLightingEnv(this.lightingEnv);
  }

  // -------------------------------------------------------------
  // Mouse & Keyboard Controls
  // -------------------------------------------------------------
  private bindEvents() {
    const dom = this.renderer.domElement;

    // Pointer down
    dom.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.previousMousePosition = { x: e.clientX, y: e.clientY };

      // Handle Live Cursor Placement click
      if (this.isPlacingWithCursor) {
        if (e.button === 0 && this.placementGhostGroup && this.placementSession) {
          const finalPos: [number, number, number] = [
            this.placementGhostGroup.position.x,
            this.placementGhostGroup.position.y,
            this.placementGhostGroup.position.z,
          ];
          const finalRot = this.placementSession.rotationY;
          const finalDims = { ...this.placementSession.dimensions };
          const cb = this.onPlacementCompleteCallback;
          this.cancelPlacementWithCursor(false);
          if (cb) {
            cb(finalPos, finalRot, finalDims);
          }
          return;
        } else if (e.button === 2) {
          // Right click cancels cursor placement
          this.cancelPlacementWithCursor(true);
          return;
        }
      }

      if (e.button === 0) {
        // Left click
        if (this.cameraMode === 'walkthrough') {
          this.isOrbiting = true; // Drag to look
        } else {
          // Check furniture raycast for selection or floor drag
          const rect = dom.getBoundingClientRect();
          this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          this.raycaster.setFromCamera(this.mouse, this.activeCamera);

          const intersects = this.raycaster.intersectObjects(
            this.furnitureGroup.children,
            true
          );

          if (intersects.length > 0) {
            // Find root item group
            let topGroup: THREE.Object3D | null = intersects[0].object;
            while (topGroup && topGroup.parent !== this.furnitureGroup) {
              topGroup = topGroup.parent;
            }

            if (topGroup && topGroup.userData?.id) {
              const clickedId = topGroup.userData.id;
              this.selectItem(clickedId);
              this.isDraggingItem = true;

              // Calculate floor drag offset
              const planeIntersects = this.raycaster.ray.intersectPlane(
                this.dragPlane,
                new THREE.Vector3()
              );
              if (planeIntersects) {
                this.dragOffset.copy(planeIntersects).sub(topGroup.position);
              }
              return;
            }
          }

          // Otherwise, start camera orbit
          this.isOrbiting = true;
          this.selectItem(null);
        }
      } else if (e.button === 2 || e.button === 1) {
        // Right click or middle mouse click pan
        this.isPanning = true;
      }
    });

    // Pointer move
    window.addEventListener('pointermove', (e) => {
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };

      // If active cursor placement mode, update ghost position smoothly
      if (this.isPlacingWithCursor && this.placementGhostGroup) {
        const domRect = dom.getBoundingClientRect();
        this.mouse.x = ((e.clientX - domRect.left) / domRect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - domRect.top) / domRect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.activeCamera);

        const planeIntersect = this.raycaster.ray.intersectPlane(
          this.dragPlane,
          new THREE.Vector3()
        );
        if (planeIntersect) {
          let newX = planeIntersect.x;
          let newZ = planeIntersect.z;

          if (this.roomConfig.gridSnap) {
            const snap = this.roomConfig.gridSnapSize || 0.25;
            newX = Math.round(newX / snap) * snap;
            newZ = Math.round(newZ / snap) * snap;
          }

          const halfW = (this.roomConfig.masjidConfig?.isMasjid
            ? (this.roomConfig.masjidConfig.backWallFeet * 0.3048) / 2
            : this.roomConfig.width / 2) - 0.2;
          const halfL = this.roomConfig.length / 2 - 0.2;
          newX = Math.max(-halfW, Math.min(halfW, newX));
          newZ = Math.max(-halfL, Math.min(halfL, newZ));

          const elev = this.placementSession?.elevation || 0;
          this.placementGhostGroup.position.set(newX, elev, newZ);
          if (this.placementFootprint) {
            this.placementFootprint.position.set(newX, 0.015, newZ);
          }

          if (this.onPlacementHoverCallback) {
            this.onPlacementHoverCallback({ x: newX, z: newZ });
          }
        }
        return;
      }

      if (this.isDraggingItem && this.selectedItemId) {
        // Handle furniture floor drag
        const domRect = dom.getBoundingClientRect();
        this.mouse.x = ((e.clientX - domRect.left) / domRect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - domRect.top) / domRect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.activeCamera);

        const planeIntersect = this.raycaster.ray.intersectPlane(
          this.dragPlane,
          new THREE.Vector3()
        );
        if (planeIntersect) {
          let newX = planeIntersect.x - this.dragOffset.x;
          let newZ = planeIntersect.z - this.dragOffset.z;

          // Grid Snap
          if (this.roomConfig.gridSnap) {
            const snap = this.roomConfig.gridSnapSize || 0.25;
            newX = Math.round(newX / snap) * snap;
            newZ = Math.round(newZ / snap) * snap;
          }

          // Room boundary clamp
          const halfW = this.roomConfig.width / 2 - 0.2;
          const halfL = this.roomConfig.length / 2 - 0.2;
          newX = Math.max(-halfW, Math.min(halfW, newX));
          newZ = Math.max(-halfL, Math.min(halfL, newZ));

          const meshGroup = this.itemMeshMap.get(this.selectedItemId);
          if (meshGroup) {
            meshGroup.position.x = newX;
            meshGroup.position.z = newZ;
            this.updateSelectionVisuals();

            // Update item in local list and trigger callback
            const currentItem = this.items.find((it) => it.id === this.selectedItemId);
            if (currentItem) {
              currentItem.position[0] = newX;
              currentItem.position[2] = newZ;
              this.callbacks.onItemMoved(currentItem);
            }
          }
        }
        return;
      }

      // Camera navigation
      if (this.isOrbiting) {
        if (this.cameraMode === 'walkthrough') {
          // Look around in first person
          this.walkEuler.y -= deltaX * 0.003;
          this.walkEuler.x -= deltaY * 0.003;
          this.walkEuler.x = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, this.walkEuler.x));
          this.walkCamera.quaternion.setFromEuler(this.walkEuler);
        } else if (this.cameraMode === '3d-orbit') {
          this.orbitSpherical.theta -= deltaX * 0.006;
          this.orbitSpherical.phi -= deltaY * 0.006;
          // Clamp phi so camera does not flip or go under floor
          this.orbitSpherical.phi = Math.max(0.08, Math.min(Math.PI * 0.48, this.orbitSpherical.phi));
          this.updateOrbitCameraPosition();
          this.updateWallVisibility();
        }
      } else if (this.isPanning) {
        if (this.cameraMode === '2d-plan') {
          const factor = (this.planCamera.top - this.planCamera.bottom) / dom.clientHeight;
          this.planCamera.position.x -= deltaX * factor;
          this.planCamera.position.z -= deltaY * factor;
        } else if (this.cameraMode === '3d-orbit') {
          const panSpeed = 0.008;
          const forward = new THREE.Vector3();
          this.orbitCamera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

          this.orbitTarget.addScaledVector(right, -deltaX * panSpeed);
          this.orbitTarget.addScaledVector(forward, deltaY * panSpeed);
          this.updateOrbitCameraPosition();
        }
      }
    });

    // Pointer up
    window.addEventListener('pointerup', () => {
      this.isOrbiting = false;
      this.isPanning = false;
      this.isDraggingItem = false;
    });

    // Wheel zoom
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.cameraMode === '3d-orbit') {
        this.orbitSpherical.radius += e.deltaY * 0.01;
        this.orbitSpherical.radius = Math.max(3.5, Math.min(25, this.orbitSpherical.radius));
        this.updateOrbitCameraPosition();
      } else if (this.cameraMode === '2d-plan') {
        const zoomDelta = e.deltaY > 0 ? 1.08 : 0.92;
        this.planCamera.left *= zoomDelta;
        this.planCamera.right *= zoomDelta;
        this.planCamera.top *= zoomDelta;
        this.planCamera.bottom *= zoomDelta;
        this.planCamera.updateProjectionMatrix();
      }
    });

    // Prevent right-click context menu on canvas
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard controls for walkthrough and cursor placement
    window.addEventListener('keydown', (e) => {
      if (this.isPlacingWithCursor) {
        if (e.code === 'KeyR') {
          e.preventDefault();
          this.rotatePlacementGhost(45);
          return;
        }
        if (e.code === 'Escape') {
          e.preventDefault();
          this.cancelPlacementWithCursor(true);
          return;
        }
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.walkKeys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.walkKeys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.walkKeys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.walkKeys.right = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.walkKeys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.walkKeys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.walkKeys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.walkKeys.right = false;
          break;
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => this.onResize());
    resizeObserver.observe(this.container);
  }

  private updateOrbitCameraPosition() {
    const { radius, theta, phi } = this.orbitSpherical;
    const x = this.orbitTarget.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = this.orbitTarget.y + radius * Math.cos(phi);
    const z = this.orbitTarget.z + radius * Math.sin(phi) * Math.cos(theta);

    this.orbitCamera.position.set(x, y, z);
    this.orbitCamera.lookAt(this.orbitTarget);
  }

  private onResize() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.renderer.setSize(width, height);

    // Update perspective cameras
    const aspect = width / height;
    this.orbitCamera.aspect = aspect;
    this.orbitCamera.updateProjectionMatrix();
    this.walkCamera.aspect = aspect;
    this.walkCamera.updateProjectionMatrix();

    // Update orthographic camera
    const frustumSize = Math.max(this.roomConfig.width, this.roomConfig.length) * 1.35;
    this.planCamera.left = (-frustumSize * aspect) / 2;
    this.planCamera.right = (frustumSize * aspect) / 2;
    this.planCamera.top = frustumSize / 2;
    this.planCamera.bottom = -frustumSize / 2;
    this.planCamera.updateProjectionMatrix();
  }

  // -------------------------------------------------------------
  // Render Loop
  // -------------------------------------------------------------
  private renderLoop = () => {
    this.animationFrameId = requestAnimationFrame(this.renderLoop);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Handle Walkthrough Movement
    if (this.cameraMode === 'walkthrough') {
      const walkSpeed = 3.2; // meters/sec
      this.walkVelocity.set(0, 0, 0);

      const moveDirection = new THREE.Vector3();
      if (this.walkKeys.forward) moveDirection.z -= 1;
      if (this.walkKeys.backward) moveDirection.z += 1;
      if (this.walkKeys.left) moveDirection.x -= 1;
      if (this.walkKeys.right) moveDirection.x += 1;

      if (moveDirection.lengthSq() > 0) {
        moveDirection.normalize();
        moveDirection.applyEuler(new THREE.Euler(0, this.walkEuler.y, 0));

        this.walkPosition.addScaledVector(moveDirection, walkSpeed * delta);

        // Clamp inside room perimeter
        const halfW = this.roomConfig.width / 2 - 0.45;
        const halfL = this.roomConfig.length / 2 - 0.45;
        this.walkPosition.x = Math.max(-halfW, Math.min(halfW, this.walkPosition.x));
        this.walkPosition.z = Math.max(-halfL, Math.min(halfL, this.walkPosition.z));
      }

      this.walkCamera.position.copy(this.walkPosition);
    }

    // Update selection ring orientation if present
    if (this.selectionRing && this.selectedItemId) {
      const currentItem = this.items.find((it) => it.id === this.selectedItemId);
      if (currentItem) {
        this.selectionRing.position.set(currentItem.position[0], 0.015, currentItem.position[2]);
      }
    }

    if (this.selectionBoxHelper) {
      this.selectionBoxHelper.update();
    }

    this.renderer.render(this.scene, this.activeCamera);
  };

  // High-Resolution Snapshot Export
  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.activeCamera);
    return this.renderer.domElement.toDataURL('image/png', 1.0);
  }

  // Convert screen coordinates to floor plane coordinates (x, z) in meters
  public getFloorCoordinates(clientX: number, clientY: number): { x: number; z: number } | null {
    const dom = this.renderer.domElement;
    const rect = dom.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, this.activeCamera);
    const planeIntersect = this.raycaster.ray.intersectPlane(this.dragPlane, new THREE.Vector3());
    if (planeIntersect) {
      return { x: planeIntersect.x, z: planeIntersect.z };
    }
    return null;
  }

  // Convert 3D floor coordinates (x, z) to screen pixels
  public projectFloorCoordinatesToScreen(x: number, z: number): { x: number; y: number } | null {
    const dom = this.renderer.domElement;
    const rect = dom.getBoundingClientRect();
    const vec = new THREE.Vector3(x, 0, z);
    vec.project(this.activeCamera);
    const screenX = ((vec.x + 1) / 2) * rect.width;
    const screenY = ((-vec.y + 1) / 2) * rect.height;
    return { x: screenX, y: screenY };
  }

  public resetOrbitView() {
    const maxDim = this.roomConfig.masjidConfig?.isMasjid ? 26.0 : Math.max(this.roomConfig.width, this.roomConfig.length);
    this.orbitSpherical = {
      radius: maxDim * 1.45,
      theta: Math.PI * 0.25,
      phi: Math.PI * 0.3,
    };
    this.orbitTarget.set(0, 0.8, 0);
    this.updateOrbitCameraPosition();
    this.updateWallVisibility();
  }

  public resetView() {
    if (this.cameraMode === '2d-plan') {
      this.fitPlanToScreen();
    } else {
      this.resetOrbitView();
    }
  }

  // -------------------------------------------------------------
  // 2D Plan View Controls (Zoom, Pan, Fit to Screen)
  // -------------------------------------------------------------
  public zoom2D(factor: number) {
    if (this.cameraMode !== '2d-plan') return;
    this.planCamera.left *= factor;
    this.planCamera.right *= factor;
    this.planCamera.top *= factor;
    this.planCamera.bottom *= factor;
    this.planCamera.updateProjectionMatrix();
  }

  public fitPlanToScreen(paddingMultiplier = 1.25) {
    if (this.cameraMode !== '2d-plan') return;
    const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
    const maxDim = this.roomConfig.masjidConfig?.isMasjid
      ? 26.0
      : Math.max(this.roomConfig.width, this.roomConfig.length);
    const frustumSize = maxDim * paddingMultiplier;
    this.planCamera.left = (-frustumSize * aspect) / 2;
    this.planCamera.right = (frustumSize * aspect) / 2;
    this.planCamera.top = frustumSize / 2;
    this.planCamera.bottom = -frustumSize / 2;
    this.planCamera.position.set(0, 20, 0);
    this.planCamera.lookAt(0, 0, 0);
    this.planCamera.updateProjectionMatrix();
  }

  public panPlan2D(deltaX: number, deltaZ: number) {
    if (this.cameraMode !== '2d-plan') return;
    this.planCamera.position.x += deltaX;
    this.planCamera.position.z += deltaZ;
  }

  // -------------------------------------------------------------
  // Live Cursor Placement Mode (Move with Cursor & Place)
  // -------------------------------------------------------------
  public startCursorPlacement(
    session: ActivePlacementSession,
    callbacks: {
      onComplete: (
        pos: [number, number, number],
        rot: number,
        dims: { width: number; depth: number; height: number }
      ) => void;
      onHover?: (coords: { x: number; z: number }) => void;
      onCancel?: () => void;
    }
  ) {
    this.cancelPlacementWithCursor(false);

    this.isPlacingWithCursor = true;
    this.placementSession = { ...session };
    this.onPlacementCompleteCallback = callbacks.onComplete;
    this.onPlacementHoverCallback = callbacks.onHover || null;
    this.onPlacementCancelCallback = callbacks.onCancel || null;

    // If moving existing placed item, hide its real mesh temporarily
    if (session.isExistingMove && session.originalItemId) {
      const origMesh = this.itemMeshMap.get(session.originalItemId);
      if (origMesh) origMesh.visible = false;
    }

    // Build the ghost model and footprint
    this.buildPlacementGhost();

    // Change cursor style on canvas
    this.renderer.domElement.style.cursor = 'crosshair';
  }

  public updatePlacementSession(updates: Partial<ActivePlacementSession>) {
    if (!this.placementSession) return;
    const prevPos = this.placementGhostGroup
      ? [this.placementGhostGroup.position.x, this.placementGhostGroup.position.z]
      : [0, 0];

    this.placementSession = {
      ...this.placementSession,
      ...updates,
    };

    this.buildPlacementGhost();

    if (this.placementGhostGroup) {
      this.placementGhostGroup.position.x = prevPos[0];
      this.placementGhostGroup.position.z = prevPos[1];
      this.placementGhostGroup.position.y = this.placementSession.elevation || 0;
      this.placementGhostGroup.rotation.y = (this.placementSession.rotationY * Math.PI) / 180;
    }
    if (this.placementFootprint) {
      this.placementFootprint.position.x = prevPos[0];
      this.placementFootprint.position.z = prevPos[1];
      this.placementFootprint.rotation.y = (this.placementSession.rotationY * Math.PI) / 180;
    }
  }

  public rotatePlacementGhost(deltaDeg: number) {
    if (!this.placementSession) return;
    let newRot = (this.placementSession.rotationY + deltaDeg) % 360;
    if (newRot < 0) newRot += 360;
    this.updatePlacementSession({ rotationY: Math.round(newRot) });
  }

  public cancelPlacementWithCursor(notify = true) {
    if (this.placementSession?.isExistingMove && this.placementSession.originalItemId) {
      const origMesh = this.itemMeshMap.get(this.placementSession.originalItemId);
      if (origMesh) origMesh.visible = true;
    }

    if (this.placementGhostGroup) {
      this.scene.remove(this.placementGhostGroup);
      this.placementGhostGroup = null;
    }
    if (this.placementFootprint) {
      this.scene.remove(this.placementFootprint);
      this.placementFootprint = null;
    }

    this.renderer.domElement.style.cursor = 'grab';
    this.isPlacingWithCursor = false;
    const cancelCb = this.onPlacementCancelCallback;
    this.placementSession = null;
    this.onPlacementCompleteCallback = null;
    this.onPlacementHoverCallback = null;
    this.onPlacementCancelCallback = null;

    if (notify && cancelCb) {
      cancelCb();
    }
  }

  public isCursorPlacementActive(): boolean {
    return this.isPlacingWithCursor;
  }

  private buildPlacementGhost() {
    if (this.placementGhostGroup) {
      this.scene.remove(this.placementGhostGroup);
      this.placementGhostGroup = null;
    }
    if (this.placementFootprint) {
      this.scene.remove(this.placementFootprint);
      this.placementFootprint = null;
    }

    if (!this.placementSession) return;

    const { item, dimensions, color, secondaryColor, rotationY, elevation } = this.placementSession;

    // 1. Ghost Group
    const ghost = buildFurnitureModel(
      item.modelType,
      color,
      secondaryColor,
      item.customData,
      dimensions
    );

    // Make all materials semi-transparent with a holographic effect
    ghost.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const makeHoloMat = (baseMat: THREE.Material) => {
            const m = (baseMat as THREE.MeshStandardMaterial).clone();
            m.transparent = true;
            m.opacity = 0.72;
            m.depthWrite = false;
            return m;
          };
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(makeHoloMat);
          } else {
            mesh.material = makeHoloMat(mesh.material);
          }
        }
      }
    });

    ghost.rotation.y = (rotationY * Math.PI) / 180;
    ghost.position.set(0, elevation, 0);
    this.scene.add(ghost);
    this.placementGhostGroup = ghost;

    // 2. Footprint Plane & Outline on the Floor
    const footprintGroup = new THREE.Group();
    const w = dimensions.width;
    const d = dimensions.depth;

    const planeGeo = new THREE.PlaneGeometry(w, d);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    footprintGroup.add(planeMesh);

    // Edges outline
    const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.02, d));
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const edgesMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    edgesMesh.position.y = 0.01;
    footprintGroup.add(edgesMesh);

    // Orientation arrow pointing forward
    const arrowDir = new THREE.Vector3(0, 0, -1);
    const arrowOrigin = new THREE.Vector3(0, 0.02, 0);
    const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, Math.min(d * 0.45, 0.8), 0xd97706, 0.15, 0.1);
    footprintGroup.add(arrowHelper);

    footprintGroup.rotation.y = (rotationY * Math.PI) / 180;
    footprintGroup.position.set(0, 0.012, 0);
    this.scene.add(footprintGroup);
    this.placementFootprint = footprintGroup;
  }

  public dispose() {
    this.cancelPlacementWithCursor(false);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
