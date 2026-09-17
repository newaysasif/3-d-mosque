import { SavedProject, RoomConfig, PlacedFurnitureItem, LightingEnv } from '../types';
import { DESIGNER_TEMPLATES } from './designerTemplates';

const STORAGE_KEY = 'interior_studio_projects_v2';
const ACTIVE_PROJECT_KEY = 'interior_studio_active_project_id';

const DEFAULT_ROOM_CONFIG: RoomConfig = {
  width: 7.0,
  length: 6.0,
  height: 2.8,
  flooring: 'natural-oak',
  baseWallColor: '#f7f6f2',
  baseboardColor: '#ece9e2',
  baseboardHeight: 0.12,
  accentWalls: {
    north: { enabled: true, color: '#3d4b41', finish: 'flat' },
    south: { enabled: false, color: '#f7f6f2', finish: 'flat' },
    east: { enabled: false, color: '#f7f6f2', finish: 'flat' },
    west: { enabled: false, color: '#f7f6f2', finish: 'flat' },
  },
  showCeiling: false,
  gridSnap: true,
  gridSnapSize: 0.25,
};

// Seed sample projects if localStorage is completely fresh
function getInitialSeedProjects(): SavedProject[] {
  const now = new Date().toISOString();

  // 1. Grand Islamic Masjid Musalla (from template 0)
  const masjidTemplate = DESIGNER_TEMPLATES[0];
  const p1Items: PlacedFurnitureItem[] = masjidTemplate.items.map((it, idx) => ({
    ...it,
    id: `masjid-item-${idx}-${Date.now()}`,
  }));

  const project1: SavedProject = {
    id: 'project-masjid-musalla',
    name: 'Grand Islamic Masjid Musalla',
    description: 'Authentic Islamic mosque floor plan with 40.9\' Qibla wall, 18\' × 7\' protruding Mehrab niche, carved Minbar, and Turkish emerald carpet.',
    createdAt: now,
    updatedAt: now,
    roomConfig: {
      ...DEFAULT_ROOM_CONFIG,
      ...masjidTemplate.roomConfig,
    } as RoomConfig,
    items: p1Items,
    lightingEnv: 'daylight',
  };

  // 2. Nordic Living Room (from template 1)
  const nordicTemplate = DESIGNER_TEMPLATES[1];
  const p2Items: PlacedFurnitureItem[] = (nordicTemplate?.items || []).map((it, idx) => ({
    ...it,
    id: `nordic-item-${idx}-${Date.now()}`,
  }));

  const project2: SavedProject = {
    id: 'project-nordic-living',
    name: 'Nordic Sunlit Living Room',
    description: 'Scandinavian minimalist living sanctuary with bouclé seating, natural oak, and sage accent wall.',
    createdAt: now,
    updatedAt: now,
    roomConfig: {
      ...DEFAULT_ROOM_CONFIG,
      ...(nordicTemplate?.roomConfig || {}),
    } as RoomConfig,
    items: p2Items,
    lightingEnv: 'daylight',
  };

  // 3. Clean Blank Drawing Canvas
  const project3: SavedProject = {
    id: 'project-empty-canvas',
    name: 'Custom Architectural Canvas',
    description: 'Fresh architectural floor plan ready for drawing walls, doors, windows, and furnishing.',
    createdAt: now,
    updatedAt: now,
    roomConfig: {
      ...DEFAULT_ROOM_CONFIG,
      width: 6.0,
      length: 5.0,
      baseWallColor: '#ffffff',
    },
    items: [
      {
        id: 'door-init-1',
        modelType: 'interior-door',
        name: 'Single Flush Interior Door',
        category: 'architectural',
        position: [0, 0, -2.44],
        rotationY: 0,
        dimensions: { width: 0.95, depth: 0.12, height: 2.15 },
        color: '#f8fafc',
        secondaryColor: '#334155',
        price: 320,
        customData: {
          architecturalType: 'door',
          doorStyle: 'single',
          wallAttachment: 'north',
          openAngle: 30,
        },
      },
      {
        id: 'win-init-1',
        modelType: 'picture-window',
        name: 'Large Picture Glazed Window',
        category: 'architectural',
        position: [-2.94, 0.9, 0],
        rotationY: 90,
        dimensions: { width: 2.2, depth: 0.12, height: 1.8 },
        color: '#1e293b',
        secondaryColor: '#ffffff',
        price: 780,
        customData: {
          architecturalType: 'window',
          windowStyle: 'picture',
          wallAttachment: 'west',
          glassTint: 'clear',
        },
      },
    ],
    lightingEnv: 'daylight',
  };

  return [project1, project2, project3];
}

export function loadAllProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedProjects();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Migrate and normalize projects to ensure Masjid clear span configuration is active
      const baseMasjidConfig = DESIGNER_TEMPLATES[0].roomConfig?.masjidConfig;
      const migrated: SavedProject[] = parsed.map((p: SavedProject) => {
        if (p.id === 'project-masjid-musalla' || p.roomConfig?.masjidConfig?.isMasjid) {
          const mCfg = p.roomConfig?.masjidConfig;
          const updatedMCfg = {
            ...(baseMasjidConfig || {}),
            ...(mCfg || {}),
            removeCenterColumns: true, // Center columns removed for open clear span hall
            mainColumnCount: 12, // 12 outer perimeter columns
            mainBeamElevationMm: 5761, // 5761 mm from ground level
            mainBeamWidthMm: 450, // 450 mm width
            mainBeamDepthMm: 900, // 900 mm height
            mainBeamHeightFt: 18.9,
            hasGateColumns: true, // Two columns on main gate/door (450x450mm)
            gateColumnWidthMm: 450,
            gateColumnDepthMm: 450,
            hasQiblaColumns: true, // Two columns on Qibla wall (450x450mm)
            hasQiblaCenterColumn: true,
            qiblaColumnWidthMm: 450,
            qiblaColumnDepthMm: 450,
            qiblaCenterColumnWidthMm: 450,
            qiblaCenterColumnDepthMm: 450,
            columnSpacingFeet: 20, // 20 feet (6.096 m) between both center column lines
            hasTwoLongitudinalBeams: true, // Two longitudinal beams (450x900mm) resting on door & qibla columns, 20 ft apart
            hasCentralSpineBeam: true,
            longitudinalBeamWidthMm: 450,
            longitudinalBeamDepthMm: 900,
            centralSpineBeamWidthMm: 450,
            centralSpineBeamDepthMm: 900,
          } as NonNullable<RoomConfig['masjidConfig']>;
          // Filter out center pillars from items so hall center is 100% open
          const cleanItems = (p.items || []).filter(
            (it) => it.modelType !== 'masjid-pillar'
          );
          return {
            ...p,
            roomConfig: {
              ...p.roomConfig,
              wallHeightMeters: 5.761,
              masjidConfig: updatedMCfg,
            },
            items: cleanItems,
          };
        }
        return p;
      });

      // Ensure Masjid Musalla project is present at the front
      if (!migrated.some((p) => p.id === 'project-masjid-musalla')) {
        const seed = getInitialSeedProjects();
        const updated = [seed[0], ...migrated];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
      return migrated;
    }
  } catch (err) {
    console.error('Error reading projects from localStorage:', err);
  }
  const initial = getInitialSeedProjects();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveAllProjects(projects: SavedProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Error saving projects to localStorage:', err);
  }
}

export function getActiveProjectId(projects: SavedProject[]): string {
  try {
    const active = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (active && projects.some((p) => p.id === active)) {
      return active;
    }
  } catch (e) {
    // Ignore error
  }
  return projects[0]?.id || 'project-masjid-musalla';
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch (e) {
    // Ignore error
  }
}

export function createNewProject(
  name: string,
  presetId: 'empty' | 'nordic' | 'loft' | 'bedroom',
  customDim?: { width: number; length: number; height: number }
): SavedProject {
  const now = new Date().toISOString();
  const id = `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  let roomCfg: RoomConfig = {
    ...DEFAULT_ROOM_CONFIG,
    width: customDim?.width || 6.5,
    length: customDim?.length || 5.5,
    height: customDim?.height || 2.8,
  };
  let items: PlacedFurnitureItem[] = [];
  let lightingEnv: LightingEnv = 'daylight';

  if (presetId === 'nordic') {
    const t = DESIGNER_TEMPLATES[0];
    roomCfg = { ...roomCfg, ...t.roomConfig } as RoomConfig;
    items = t.items.map((it, idx) => ({ ...it, id: `item-${Date.now()}-${idx}` }));
  } else if (presetId === 'loft') {
    const t = DESIGNER_TEMPLATES[2];
    if (t) {
      roomCfg = { ...roomCfg, ...t.roomConfig } as RoomConfig;
      items = t.items.map((it, idx) => ({ ...it, id: `item-${Date.now()}-${idx}` }));
      lightingEnv = 'golden-hour';
    }
  } else if (presetId === 'bedroom') {
    const t = DESIGNER_TEMPLATES[1];
    if (t) {
      roomCfg = { ...roomCfg, ...t.roomConfig } as RoomConfig;
      items = t.items.map((it, idx) => ({ ...it, id: `item-${Date.now()}-${idx}` }));
    }
  }

  return {
    id,
    name: name.trim() || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
    roomConfig: roomCfg,
    items,
    lightingEnv,
  };
}

export function duplicateProject(source: SavedProject): SavedProject {
  const now = new Date().toISOString();
  const newId = `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    ...source,
    id: newId,
    name: `${source.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    items: source.items.map((it) => ({
      ...it,
      id: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    })),
  };
}

export function exportProjectAsJSON(project: SavedProject): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  link.href = url;
  link.download = `${safeName}_project.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
