import {
  AIStyle,
  FlooringType,
  PlacedFurnitureItem,
  RoomConfig,
  SpatialAuditReport,
} from '../types';

export interface StyleHarmonizerPreset {
  id: AIStyle;
  name: string;
  tagline: string;
  flooring: FlooringType;
  baseWallColor: string;
  baseboardColor: string;
  accentWallColor: string;
  accentFinish: 'flat' | 'wood-slats' | 'brick' | 'fluted';
  recommendedLighting: 'daylight' | 'golden-hour' | 'evening';
  palette: {
    primaryUpholstery: string;
    leatherOrSecondary: string;
    woodCasegoods: string;
    metalHardware: string;
  };
  description: string;
}

export const STYLE_PRESETS: Record<AIStyle, StyleHarmonizerPreset> = {
  scandinavian: {
    id: 'scandinavian',
    name: 'Scandinavian Modern',
    tagline: 'Airy brightness, clean geometries, tactile bouclé & natural oak',
    flooring: 'natural-oak',
    baseWallColor: '#f7f6f2',
    baseboardColor: '#ece8e1',
    accentWallColor: '#4a5b52', // Muted pine / sage
    accentFinish: 'flat',
    recommendedLighting: 'daylight',
    palette: {
      primaryUpholstery: '#e5e2dc',
      leatherOrSecondary: '#b08a60',
      woodCasegoods: '#cbb092',
      metalHardware: '#1f2421',
    },
    description: 'Emphasizes maximizing natural light, organic materials, neutral warmth, and decluttered spatial circulation.',
  },
  japandi: {
    id: 'japandi',
    name: 'Japandi Zen',
    tagline: 'Wabi-sabi simplicity, acoustic timber slats, earth ceramics & low horizons',
    flooring: 'herringbone',
    baseWallColor: '#f2ede4',
    baseboardColor: '#dfd7ca',
    accentWallColor: '#8a623e',
    accentFinish: 'wood-slats',
    recommendedLighting: 'evening',
    palette: {
      primaryUpholstery: '#ded8cf',
      leatherOrSecondary: '#5a4632',
      woodCasegoods: '#9b7653',
      metalHardware: '#332b24',
    },
    description: 'A serene fusion of Scandinavian functionality and Japanese rustic minimalism with tranquil earth tones.',
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial Urban Loft',
    tagline: 'Polished concrete, raw architectural steel, aged cognac leather & dark mood',
    flooring: 'polished-concrete',
    baseWallColor: '#3d444d',
    baseboardColor: '#282d33',
    accentWallColor: '#22262c',
    accentFinish: 'flat',
    recommendedLighting: 'golden-hour',
    palette: {
      primaryUpholstery: '#363d47',
      leatherOrSecondary: '#9b5329',
      woodCasegoods: '#422f22',
      metalHardware: '#14171a',
    },
    description: 'Bold architectural warehouse aesthetic celebrating honest structural elements, deep charcoal, and patinated leather.',
  },
  'mid-century': {
    id: 'mid-century',
    name: 'Mid-Century Modern',
    tagline: 'Iconic silhouettes, dark walnut grains, mustard velvets & warm brass',
    flooring: 'dark-walnut',
    baseWallColor: '#f5f3ec',
    baseboardColor: '#ded8cb',
    accentWallColor: '#b86536', // Terracotta ochre
    accentFinish: 'flat',
    recommendedLighting: 'golden-hour',
    palette: {
      primaryUpholstery: '#b59a7a',
      leatherOrSecondary: '#b86536',
      woodCasegoods: '#5c4033',
      metalHardware: '#c5a059',
    },
    description: 'Post-war timeless forms pairing sculptural wood joints, playful organic curves, and rich metallic accents.',
  },
  coastal: {
    id: 'coastal',
    name: 'Coastal Serene',
    tagline: 'Bleached sands, sun-washed linen, deep ocean navy & airy breeze',
    flooring: 'wool-carpet',
    baseWallColor: '#faf8f5',
    baseboardColor: '#ede8e1',
    accentWallColor: '#273c4d', // Deep marine navy
    accentFinish: 'flat',
    recommendedLighting: 'daylight',
    palette: {
      primaryUpholstery: '#f3f0e8',
      leatherOrSecondary: '#7b98aa',
      woodCasegoods: '#d6c4aa',
      metalHardware: '#8a929a',
    },
    description: 'Breezy light-drenched atmosphere inspired by coastal shores with soft wool underfoot and oceanic accents.',
  },
  'minimalist-luxury': {
    id: 'minimalist-luxury',
    name: 'Monolithic Minimalist Luxury',
    tagline: 'Seamless Italian Carrara marble, museum-grade plaster & champagne brass',
    flooring: 'carrara-marble',
    baseWallColor: '#f8f9fa',
    baseboardColor: '#e9ecef',
    accentWallColor: '#1e2229',
    accentFinish: 'fluted',
    recommendedLighting: 'evening',
    palette: {
      primaryUpholstery: '#ffffff',
      leatherOrSecondary: '#6c757d',
      woodCasegoods: '#2b2d42',
      metalHardware: '#d4af37',
    },
    description: 'High-end architectural minimalism utilizing continuous stone surfaces, subtle fluting, and warm cove illumination.',
  },
};

export function applyStyleHarmonizer(
  styleKey: AIStyle,
  currentConfig: RoomConfig,
  items: PlacedFurnitureItem[]
): {
  newRoomConfig: RoomConfig;
  newItems: PlacedFurnitureItem[];
  recommendedLighting: 'daylight' | 'golden-hour' | 'evening';
} {
  const preset = STYLE_PRESETS[styleKey];

  const newRoomConfig: RoomConfig = {
    ...currentConfig,
    flooring: preset.flooring,
    baseWallColor: preset.baseWallColor,
    baseboardColor: preset.baseboardColor,
    accentWalls: {
      ...currentConfig.accentWalls,
      north: {
        enabled: true,
        color: preset.accentWallColor,
        finish: preset.accentFinish,
      },
    },
  };

  const newItems: PlacedFurnitureItem[] = items.map((item) => {
    let color = item.color;
    let secColor = item.secondaryColor;

    if (item.category === 'living') {
      if (item.modelType.includes('sofa') || item.modelType.includes('couch')) {
        color = preset.palette.primaryUpholstery;
        secColor = preset.palette.woodCasegoods;
      } else if (item.modelType.includes('armchair')) {
        color = preset.palette.leatherOrSecondary;
        secColor = preset.palette.metalHardware;
      } else if (item.modelType.includes('credenza') || item.modelType.includes('bookshelf')) {
        color = preset.palette.woodCasegoods;
        secColor = preset.palette.metalHardware;
      } else if (item.modelType.includes('lamp') || item.modelType.includes('table')) {
        secColor = preset.palette.metalHardware;
      }
    } else if (item.category === 'bedroom') {
      if (item.modelType.includes('bed')) {
        color = preset.palette.primaryUpholstery;
        secColor = preset.palette.woodCasegoods;
      } else if (item.modelType.includes('nightstand') || item.modelType.includes('wardrobe')) {
        color = preset.palette.woodCasegoods;
        secColor = preset.palette.metalHardware;
      }
    } else if (item.category === 'dining') {
      if (item.modelType.includes('dining')) {
        color = preset.palette.woodCasegoods;
        secColor = preset.palette.primaryUpholstery;
      } else if (item.modelType.includes('island')) {
        secColor = preset.palette.woodCasegoods;
      }
    } else if (item.category === 'office') {
      if (item.modelType.includes('desk')) {
        color = preset.palette.woodCasegoods;
      }
    }

    return {
      ...item,
      color,
      secondaryColor: secColor,
    };
  });

  return {
    newRoomConfig,
    newItems,
    recommendedLighting: preset.recommendedLighting,
  };
}

export function auditSpatialDesign(
  roomConfig: RoomConfig,
  items: PlacedFurnitureItem[]
): SpatialAuditReport {
  const clearanceWarnings: string[] = [];
  const lightingTips: string[] = [];
  const recommendations: string[] = [];

  let score = 95;
  const halfW = roomConfig.width / 2;
  const halfL = roomConfig.length / 2;

  // 1. Boundary & Wall clipping checks
  items.forEach((item) => {
    const minX = item.position[0] - item.dimensions.width / 2;
    const maxX = item.position[0] + item.dimensions.width / 2;
    const minZ = item.position[2] - item.dimensions.depth / 2;
    const maxZ = item.position[2] + item.dimensions.depth / 2;

    if (minX < -halfW || maxX > halfW || minZ < -halfL || maxZ > halfL) {
      clearanceWarnings.push(
        `"${item.name}" extends beyond the wall boundary. Move it closer to room center.`
      );
      score -= 5;
    }
  });

  // 2. Inter-item spacing / clearances
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // Ignore rugs or ceiling fixtures for collision checks
      if (
        a.modelType.includes('rug') ||
        b.modelType.includes('rug') ||
        a.modelType.includes('chandelier') ||
        b.modelType.includes('chandelier') ||
        a.modelType.includes('canvas') ||
        b.modelType.includes('canvas')
      ) {
        continue;
      }

      const dx = Math.abs(a.position[0] - b.position[0]);
      const dz = Math.abs(a.position[2] - b.position[2]);
      const minWalkwayX = (a.dimensions.width + b.dimensions.width) / 2 + 0.35;
      const minWalkwayZ = (a.dimensions.depth + b.dimensions.depth) / 2 + 0.35;

      if (dx < minWalkwayX && dz < minWalkwayZ) {
        // Tight clearance warning
        if (
          !(a.modelType.includes('table') && b.modelType.includes('sofa')) &&
          !(a.modelType.includes('bed') && b.modelType.includes('nightstand')) &&
          !(a.modelType.includes('desk') && b.modelType.includes('chair'))
        ) {
          clearanceWarnings.push(
            `Tight walkway (${(Math.min(dx, dz)).toFixed(2)}m) between "${a.name}" and "${b.name}". Minimum 0.70m recommended for circulation.`
          );
          score -= 4;
        }
      }
    }
  }

  // 3. Lighting coverage
  const hasCeilingLight = items.some((it) => it.modelType.includes('chandelier'));
  const hasLamps = items.some(
    (it) => it.modelType.includes('lamp') || it.modelType.includes('nightstand')
  );

  if (!hasCeilingLight && !hasLamps) {
    lightingTips.push(
      'No ambient light fixtures detected. Add a ceiling chandelier or floor lamp for balanced illumination.'
    );
    score -= 6;
  } else if (!hasLamps) {
    lightingTips.push(
      'Layered task lighting recommendation: consider adding an arc floor lamp or bedside glow lamps.'
    );
  } else {
    lightingTips.push('Excellent lighting layering with balanced ambient and task fixtures.');
  }

  // 4. Area rug anchor recommendation for living rooms
  const hasSofa = items.some((it) => it.modelType.includes('sofa') || it.modelType.includes('couch'));
  const hasRug = items.some((it) => it.modelType.includes('rug'));
  if (hasSofa && !hasRug) {
    recommendations.push(
      'Visual Grounding: Anchor your seating arrangement with a 3.0m x 2.4m woven area rug.'
    );
  }

  // 5. Plants / Biophilic elements
  const hasPlants = items.some(
    (it) => it.modelType.includes('monstera') || it.modelType.includes('fig')
  );
  if (!hasPlants) {
    recommendations.push(
      'Biophilic Wellness: Introduce a potted Monstera or Fiddle Leaf Fig to soften corners and add organic vibrancy.'
    );
  }

  // Total furniture budget
  const totalBudget = items.reduce((acc, item) => acc + item.price, 0);

  // Circulation rating
  score = Math.max(40, Math.min(100, score));
  let circulationRating: 'Optimal' | 'Acceptable' | 'Tight' = 'Optimal';
  if (score < 70) circulationRating = 'Tight';
  else if (score < 85) circulationRating = 'Acceptable';

  return {
    score,
    clearanceWarnings,
    lightingTips,
    aestheticScore: Math.min(98, Math.max(75, 80 + items.length * 2)),
    circulationRating,
    itemCount: items.length,
    totalBudget,
    recommendations,
  };
}
