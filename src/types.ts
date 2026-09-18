export type CameraMode = '3d-orbit' | '2d-plan' | 'walkthrough';

export type LightingEnv = 'daylight' | 'golden-hour' | 'evening';

export type FlooringType =
  | 'natural-oak'
  | 'herringbone'
  | 'dark-walnut'
  | 'carrara-marble'
  | 'polished-concrete'
  | 'wool-carpet'
  | 'terracotta'
  | 'mosque-carpet-emerald'
  | 'mosque-carpet-ruby'
  | 'mosque-carpet-sand';

export type WallDirection = 'north' | 'south' | 'east' | 'west';

export interface AccentWallConfig {
  enabled: boolean;
  color: string;
  finish: 'flat' | 'wood-slats' | 'brick' | 'fluted';
}

export interface WallVisibilityConfig {
  north: boolean; // Qibla / front wall (40.9')
  south: boolean; // Back wall (63.2')
  east: boolean; // Right wall (69.1')
  west: boolean; // Left wall (73.5')
  extension: boolean; // Front 40.9' x 8' extension walls
}

export interface MasjidConfig {
  isMasjid: boolean;
  qiblaWallFeet: number; // 40.9'
  leftWallFeet: number; // 73.5'
  rightWallFeet: number; // 69.1' (user grid: 69.1 ft)
  backWallFeet: number; // 63.2'
  mehrabWidthFeet: number; // 18.0'
  mehrabDepthFeet: number; // 7.0'
  mehrabHeightFeet: number; // 9.0'
  showSaffLines: boolean;
  saffSpacingMeters: number; // 1.2m (~4 ft)
  saffColor?: string;
  estimatedCapacity?: number;

  // Structural Grid, Clear Span Outer Columns & Beams Frame (Engineering CAD)
  showStructuralGrid: boolean; // Toggle overall columns & beam frame
  showColumns: boolean; // Toggle outer columns
  removeCenterColumns?: boolean; // When true, all columns removed from hall center; beams rest on outer columns
  showTieBeams: boolean; // Toggle 13ft tie beams (150mm x 450mm)
  showMainBeams: boolean; // Toggle main roof beams (450mm x 900mm)
  mainColumnWidthMm: number; // 650 mm (0.65 m)
  mainColumnDepthMm: number; // 900 mm (0.90 m)
  mainColumnCount: number; // Column count (12 outer perimeter columns when center cleared)
  tieBeamHeightFt: number; // 13 ft (3.96 m)
  tieBeamWidthMm: number; // 150 mm (0.15 m)
  tieBeamHeightMm: number; // 450 mm (0.45 m)
  mainBeamHeightFt: number; // ~18.9 ft (5.761 m)
  mainBeamElevationMm?: number; // 5761 mm from ground level
  mainBeamWidthMm: number; // 450 mm (0.45 m)
  mainBeamDepthMm: number; // 900 mm (0.90 m)
  // Gate & Qibla Columns and Two Longitudinal Beams (20 ft spacing)
  hasGateColumns?: boolean; // Two columns on main gate (450x450mm)
  gatePosition?: 'center' | 'right-corner' | 'diagonal-corner' | 'right'; // Position of main entrance gate
  isDiagonalGate?: boolean; // True if gate is diagonal in the inner making a triangular shape 6 ft deeper
  gateDepthFeet?: number; // 6 feet deeper from boundary wall into the inner (default: 6 ft)
  hasExtraGateRightColumn?: boolean; // Extra column added to the right side of the building of main gate
  extraGateRightColumnWidthMm?: number; // 450 mm
  extraGateRightColumnDepthMm?: number; // 450 mm
  hasUmbrellaCornerCanopy?: boolean; // Cantilever raking arches/columns from door columns meeting at outer corner creating umbrella shape
  umbrellaRakingBeamWidthMm?: number; // 350 mm
  umbrellaRakingBeamDepthMm?: number; // 450 mm
  gateWidthFeet?: number; // Portal width in feet (default: 12 ft)
  gateColumnWidthMm?: number; // 450 mm
  gateColumnDepthMm?: number; // 450 mm
  hasQiblaColumns?: boolean; // Two columns on Qibla wall (450x450mm, 20ft apart)
  hasQiblaCenterColumn?: boolean; // Backward compatibility
  qiblaColumnWidthMm?: number; // 450 mm
  qiblaColumnDepthMm?: number; // 450 mm
  qiblaCenterColumnWidthMm?: number; // 450 mm
  qiblaCenterColumnDepthMm?: number; // 450 mm
  columnSpacingFeet?: number; // 20 feet (6.096 m) between both center column lines
  hasTwoLongitudinalBeams?: boolean; // Two beams (450x900mm) resting on columns, 20 ft apart, tying all beams on the way
  hasCentralSpineBeam?: boolean; // Backward compatibility
  longitudinalBeamWidthMm?: number; // 450 mm
  longitudinalBeamDepthMm?: number; // 900 mm
  centralSpineBeamWidthMm?: number; // 450 mm
  centralSpineBeamDepthMm?: number; // 900 mm
  extensionFeet: number; // 8.0 ft (2.438 m)
  extensionColumnCount: number; // 4 columns
  extensionColumnWidthMm: number; // 150 mm (0.15 m)
  extensionColumnDepthMm: number; // 200 mm (0.20 m)

  // Traditional Islamic Perimeter Wall Architecture (West, East & South walls)
  traditionalIslamicWalls?: boolean; // Default true - traditional Islamic architectural ornamentation on all 3 perimeter walls
  islamicWallStyle?:
    | 'contemporary-mashrabiya-timber'
    | 'persian-iwan'
    | 'andalusian-moroccan'
    | 'ottoman-imperial'
    | 'mamluk-cairo';
  showPerimeterCalligraphyFrieze?: boolean; // Continuous upper Quranic calligraphy frieze
  showPerimeterArchedBays?: boolean; // Pointed horseshoe / Persian 4-centered arches
  showPerimeterZelligeWainscot?: boolean; // Lower wainscot (Persian Izareh or Moroccan Zellige)
  showPerimeterQuranAlcoves?: boolean; // Recessed Holy Quran bookshelf niches (Taqcheh)
  showPerimeterMishkatLamps?: boolean; // Brass wall-mounted/hanging Islamic lanterns
  showPrayerTimeBoard?: boolean; // Traditional arched prayer times clock board on rear wall
  showShoeStorageAlcoves?: boolean; // Arched footwear pigeonholes on rear wall

  // Contemporary Luxury Travertine & Walnut Mashrabiya (User Uploaded Reference Theme)
  // Featuring 5 spaces between columns on both long walls
  contemporaryMashrabiyaConfig?: {
    showTimberPostAndBeamPortals?: boolean; // Rich walnut/oak post-and-beam portal casings
    showArchedMashrabiyaWindows?: boolean; // Towering round-arched 12-point star geometric jali screens with daylight glow
    showAshlarTravertineWalls?: boolean; // Honed cream travertine stone blocks with recessed ashlar joints
    showFloatingBronzeCalligraphy?: boolean; // Sculpted 3D bronze Thuluth Quranic calligraphy with linear LED cove wash
    showModernBrassSconces?: boolean; // Pierced geometric star brass wall sconces casting light patterns
    showLowQuranBookshelves?: boolean; // Built-in floor-level timber bookshelves for Holy Qurans
    showCoveLighting?: boolean; // Continuous warm LED cove wash lighting along upper timber header
    fiveBaysBetweenColumns?: boolean; // 5 spaces between columns along long walls (default true)
    woodFinishColor?: string; // e.g. '#3b2416' or '#4a2f1c'
  };

  // Persian Iwan Specific Architectural Details for the Three Side Walls
  persianIwanConfig?: {
    showMuqarnasVaulting?: boolean; // 3-tiered corbeled stalactite muqarnas in iwan vaults
    showHaftRangiTiles?: boolean; // Persian 7-color cobalt & turquoise floral mosaic tiles
    showPersianKatibehFrieze?: boolean; // Continuous upper Thuluth calligraphy ribbon on lapis field
    showOrosiStainedGlass?: boolean; // Jewel-toned Persian stained glass & 12-point star Girih lattice
    showTaqchehQuranAlcoves?: boolean; // Recessed Quran niches with illuminated Mushaf & Rehal
    showPersianLamps?: boolean; // Pierced brass filigree lanterns with warm ambient glow
    showMarbleIzareh?: boolean; // Polished alabaster/marble lower wainscot with turquoise relief
    iwanNicheDepthM?: number; // Depth of iwan recess (default 0.38m)
    accentColor?: string; // Persian turquoise / cobalt accent
  };
}

export interface RoomConfig {
  width: number; // in meters
  length: number; // in meters
  height: number; // in meters
  baseWallColor: string;
  baseboardColor: string;
  baseboardHeight: number; // in meters, e.g. 0.12
  flooring: FlooringType;
  accentWalls: Record<WallDirection, AccentWallConfig>;
  wallVisibility?: WallVisibilityConfig; // Allows making and removing individual walls
  wallThicknessMeters?: number; // Wall thickness, e.g. 0.23m (9") or 0.15m (6")
  wallHeightMeters?: number; // Wall height, default 5.79m (19 ft)
  showCeiling: boolean;
  gridSnap: boolean;
  gridSnapSize: number; // default 0.25m
  unitSystem?: 'imperial' | 'metric';
  masjidConfig?: MasjidConfig;
  traditionalIslamicWalls?: boolean; // Toggle for traditional Islamic styling on three walls
  structuralGrid?: StructuralGridConfig;
}

export interface StructuralGridConfig {
  enabled: boolean;
  gridName?: string;
  gridType?: 'office' | 'masjid' | 'custom';
  baysX: number; // Number of bays in X (e.g. 3 bays = 4 grid lines A, B, C, D)
  baysY: number; // Number of bays in Y (e.g. 3 bays = 4 grid lines 1, 2, 3, 4)
  spacingX: number; // Bay span in meters (e.g. 6.0m = ~20ft)
  spacingY: number; // Bay span in meters (e.g. 6.0m)
  columnHeight: number; // Column height in meters (e.g. 3.5m)
  columnProfile: 'square-concrete' | 'rect-concrete' | 'steel-h' | 'round-concrete';
  columnWidth: number; // Width in meters (e.g. 0.45)
  columnDepth: number; // Depth in meters (e.g. 0.45)
  beamProfile: 'concrete' | 'steel' | 'timber';
  beamWidth: number; // Beam width in meters (e.g. 0.30)
  beamDepth: number; // Beam depth in meters (e.g. 0.60)
  beamElevation: number; // Beam elevation in meters (e.g. 3.50)
  includeBeams: boolean;
  showGridBubbles: boolean;
  showGridLines: boolean;
  showLabels: boolean;
}

export type FurnitureCategory =
  | 'living'
  | 'bedroom'
  | 'dining'
  | 'office'
  | 'decor'
  | 'architectural'
  | 'custom'
  | 'masjid';

export interface ArchitecturalCustomData {
  architecturalType?: 'door' | 'window' | 'partition' | 'column' | 'beam' | 'fireplace' | 'opening';
  doorStyle?: 'single' | 'double-french' | 'sliding-barn' | 'pivot' | 'bifold' | string;
  windowStyle?: 'picture' | 'casement' | 'panoramic' | 'arched' | 'clerestory' | string;
  partitionStyle?: 'fluted-slats' | 'glass-steel' | 'pony-wall' | 'archway' | string;
  columnStyle?: string;
  isSketchedWall?: boolean;
  startPoint?: [number, number];
  endPoint?: [number, number];
  wallAttachment?: WallDirection | 'freestanding';
  openAngle?: number; // 0 (closed) to 90 (open)
  mullionGrid?: 'none' | '2x2' | '3x3' | '4x2';
  glassTint?: 'clear' | 'frosted' | 'warm' | 'cool';
  handleFinish?: 'brass' | 'black' | 'chrome';
  outdoorBackdrop?: 'garden' | 'city' | 'sky' | 'mountains';
  flameActive?: boolean;
  // Structural Grid & Framing (C1, C2... and B1, B2...)
  structuralId?: string; // e.g. 'C1', 'C2', 'B1', 'B2'
  gridCoordinate?: string; // e.g. 'A-1', 'B-3'
  connectedColumns?: [string, string]; // [startColId, endColId] for beams
  beamProfile?: 'concrete' | 'steel' | 'timber';
  beamElevationFt?: number;
  // For products picked from user's computer folders
  isImportedProduct?: boolean;
  imageUrl?: string;
  sourceFileName?: string;
  modelFormat?: 'image-cutout' | 'obj' | 'parametric';
  objData?: string;
  // For images and decals pasted onto interior walls
  isPastedImage?: boolean;
  frameStyle?: 'frameless' | 'walnut-frame' | 'gold-frame' | 'black-frame' | 'backlit-floating';
  attachedWall?: WallDirection | 'custom-wall' | 'custom-partition' | 'freestanding';
  elevationOffFloor?: number;
}

export interface FurnitureCatalogItem {
  id: string;
  modelType: string;
  name: string;
  category: FurnitureCategory;
  description: string;
  dimensions: {
    width: number; // X axis
    depth: number; // Z axis
    height: number; // Y axis
  };
  defaultColor: string;
  secondaryColor?: string;
  colorOptions: string[];
  price: number;
  elevationOffset?: number; // default Y offset (e.g. chandeliers = ceiling height, wall art = 1.4m)
  isCeilingMounted?: boolean;
  isWallMounted?: boolean;
  customData?: ArchitecturalCustomData;
}

export interface ActivePlacementSession {
  item: FurnitureCatalogItem | PlacedFurnitureItem;
  dimensions: { width: number; depth: number; height: number };
  color: string;
  secondaryColor?: string;
  rotationY: number;
  elevation: number;
  mode: 'cursor' | 'coordinates';
  coordinatePos?: [number, number, number];
  isExistingMove?: boolean;
  originalItemId?: string;
}

export interface PlacedFurnitureItem {
  id: string;
  modelType: string;
  name: string;
  category: FurnitureCategory;
  position: [number, number, number]; // [x, y, z] in meters
  rotationY: number; // in degrees (0 - 360)
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  color: string;
  secondaryColor?: string;
  price: number;
  locked?: boolean;
  customData?: ArchitecturalCustomData;
}

export interface ImportedProduct {
  id: string;
  name: string;
  category: FurnitureCategory;
  imageUrl?: string;
  sourceFileName: string;
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  defaultColor?: string;
  color?: string;
  secondaryColor?: string;
  price?: number;
  modelType?: string;
  modelFormat?: 'image-cutout' | 'obj' | 'parametric';
  objData?: string;
  customData?: ArchitecturalCustomData;
  dateImported?: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  roomConfig: Partial<RoomConfig>;
  items: Omit<PlacedFurnitureItem, 'id'>[];
}

export type AIStyle =
  | 'scandinavian'
  | 'japandi'
  | 'industrial'
  | 'mid-century'
  | 'coastal'
  | 'minimalist-luxury';

export interface SpatialAuditReport {
  score: number; // 0 - 100
  clearanceWarnings: string[];
  lightingTips: string[];
  aestheticScore: number;
  circulationRating: 'Optimal' | 'Acceptable' | 'Tight';
  itemCount: number;
  totalBudget: number;
  recommendations: string[];
}

export type AIActionType =
  | 'ADD'
  | 'REMOVE'
  | 'UPDATE_ROOM'
  | 'CLEAR_ALL'
  | 'UPDATE_MASJID_STRUCTURAL'
  | 'OPEN_STRUCTURAL_MODAL';

export interface AIAction {
  type: AIActionType;
  catalogItemId?: string;
  name?: string;
  position?: [number, number, number];
  rotationY?: number;
  color?: string;
  targetItemId?: string;
  targetItemName?: string;
  roomUpdates?: {
    flooring?: FlooringType;
    baseWallColor?: string;
    accentColor?: string;
  };
  masjidUpdates?: Partial<MasjidConfig>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  image?: {
    url: string;
    name?: string;
  };
  actions?: AIAction[];
  detectedObjects?: string[];
}

// -------------------------------------------------------------
// Multi-Project Management Types
// -------------------------------------------------------------
export interface SavedProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  roomConfig: RoomConfig;
  items: PlacedFurnitureItem[];
  lightingEnv: LightingEnv;
  thumbnail?: string; // Data URL preview
}

// -------------------------------------------------------------
// 2D CAD Floor Plan Drawing Tool Types
// -------------------------------------------------------------
export type DrawingToolType =
  | 'select'
  | 'draw-wall'
  | 'draw-room'
  | 'split-area'
  | 'place-column'
  | 'place-beam'
  | 'draw-door'
  | 'draw-window'
  | 'measure';

export type DoorDrawStyle =
  | 'interior-door'
  | 'french-double-door'
  | 'sliding-barn-door'
  | 'pivot-door';

export type WindowDrawStyle =
  | 'picture-window'
  | 'casement-window'
  | 'panoramic-glass-window'
  | 'clerestory-window'
  | 'arched-window';

export type WallDrawStyle =
  | 'custom-masonry-wall'
  | 'travertine-ashlar-wall'
  | 'walnut-timber-wall'
  | 'drywall-partition'
  | 'glass-steel-partition'
  | 'fluted-wood-divider'
  | 'pony-wall';

export type ColumnDrawStyle =
  | 'structural-column-square'
  | 'structural-column-650x900'
  | 'structural-column-150x200'
  | 'structural-column-steel'
  | 'architectural-pillar'
  | 'masjid-pillar';

export type BeamDrawStyle =
  | 'structural-beam-concrete'
  | 'structural-beam-steel'
  | 'structural-beam-timber';

export interface CADMeasurement {
  id: string;
  start: [number, number]; // [x, z] in meters
  end: [number, number];
  distance: number;
}

export interface LiveDraftingState {
  active: boolean;
  tool: DrawingToolType;
  startPoint: { x: number; z: number } | null;
  currentPoint: { x: number; z: number } | null;
  lengthFeet: number;
  lengthMeters: number;
  angleDeg: number;
  snappedAngle: number | null;
  isLoopClosing: boolean;
}

