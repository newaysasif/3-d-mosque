import * as THREE from 'three';
import { FlooringType } from '../types';

// Cache generated textures to avoid repetitive canvas operations
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getProceduralFlooringTexture(
  type: FlooringType,
  roomWidth: number,
  roomLength: number
): { map: THREE.CanvasTexture; roughness: number; metalness: number } {
  const cacheKey = `${type}_${Math.round(roomWidth)}_${Math.round(roomLength)}`;
  if (textureCache.has(cacheKey)) {
    const cached = textureCache.get(cacheKey)!;
    return {
      map: cached,
      roughness: getFlooringRoughness(type),
      metalness: getFlooringMetalness(type),
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  switch (type) {
    case 'natural-oak':
      renderOakPlanks(ctx, canvas.width, canvas.height);
      break;
    case 'herringbone':
      renderHerringboneParquet(ctx, canvas.width, canvas.height);
      break;
    case 'dark-walnut':
      renderWalnutHardwood(ctx, canvas.width, canvas.height);
      break;
    case 'carrara-marble':
      renderCarraraMarble(ctx, canvas.width, canvas.height);
      break;
    case 'polished-concrete':
      renderPolishedConcrete(ctx, canvas.width, canvas.height);
      break;
    case 'wool-carpet':
      renderWoolCarpet(ctx, canvas.width, canvas.height);
      break;
    case 'terracotta':
      renderTerracottaTile(ctx, canvas.width, canvas.height);
      break;
    case 'mosque-carpet-emerald':
      renderMosqueCarpetEmerald(ctx, canvas.width, canvas.height);
      break;
    case 'mosque-carpet-ruby':
      renderMosqueCarpetRuby(ctx, canvas.width, canvas.height);
      break;
    case 'mosque-carpet-sand':
      renderMosqueCarpetSand(ctx, canvas.width, canvas.height);
      break;
    default:
      renderOakPlanks(ctx, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // Scale repeat appropriately relative to meters (Mosque carpets repeat per Saff row ~1.2m)
  const isMosqueCarpet =
    type === 'mosque-carpet-emerald' ||
    type === 'mosque-carpet-ruby' ||
    type === 'mosque-carpet-sand';

  const repeatX = isMosqueCarpet
    ? Math.max(1, Math.round(roomWidth / 0.9))
    : Math.max(1, Math.round(roomWidth / 2.2));
  const repeatY = isMosqueCarpet
    ? Math.max(1, Math.round(roomLength / 1.2))
    : Math.max(1, Math.round(roomLength / 2.2));
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);

  return {
    map: texture,
    roughness: getFlooringRoughness(type),
    metalness: getFlooringMetalness(type),
  };
}

// Procedural Islamic Textures for Qibla Wall, Mehrab, and Medallions
export function getIslamicCalligraphyFriezeTexture(
  theme: 'emerald' | 'marble' | 'lapis' = 'emerald'
): THREE.CanvasTexture {
  const cacheKey = `islamic_calligraphy_frieze_${theme}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const w = canvas.width;
  const h = canvas.height;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (theme === 'emerald') {
    bgGrad.addColorStop(0, '#04281c');
    bgGrad.addColorStop(0.5, '#0a3d2c');
    bgGrad.addColorStop(1, '#031f16');
  } else if (theme === 'lapis') {
    bgGrad.addColorStop(0, '#081e3d');
    bgGrad.addColorStop(0.5, '#0f3160');
    bgGrad.addColorStop(1, '#061730');
  } else {
    bgGrad.addColorStop(0, '#ece8df');
    bgGrad.addColorStop(0.5, '#f7f5f0');
    bgGrad.addColorStop(1, '#e3dfd5');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Outer gold borders with beveled sheen
  const goldGrad = ctx.createLinearGradient(0, 0, w, 0);
  goldGrad.addColorStop(0, '#cda137');
  goldGrad.addColorStop(0.25, '#ffe58f');
  goldGrad.addColorStop(0.5, '#d4af37');
  goldGrad.addColorStop(0.75, '#fff1a8');
  goldGrad.addColorStop(1, '#b58b22');

  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  // Geometric guilloche / interlaced star corners
  const drawCornerRosette = (cx: number, cy: number, r: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#ffe27d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-r / 2, -r / 2, r, r);
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#f8d053';
    ctx.fill();
    ctx.restore();
  };

  drawCornerRosette(48, 48, 28);
  drawCornerRosette(w - 48, 48, 28);
  drawCornerRosette(48, h - 48, 28);
  drawCornerRosette(w - 48, h - 48, 28);

  // Geometric top/bottom chain ribbon
  ctx.fillStyle = '#f3cf5e';
  const ribbonStep = 32;
  for (let x = 70; x < w - 70; x += ribbonStep) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x + 8, 22);
    ctx.lineTo(x + 16, 18);
    ctx.lineTo(x + 8, 14);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, h - 18);
    ctx.lineTo(x + 8, h - 14);
    ctx.lineTo(x + 16, h - 18);
    ctx.lineTo(x + 8, h - 22);
    ctx.closePath();
    ctx.fill();
  }

  // Illuminated central cartouche outline
  ctx.strokeStyle = '#e6c35c';
  ctx.lineWidth = 4;
  ctx.strokeRect(80, 42, w - 160, h - 84);

  // Inscription text in gold with soft glow
  ctx.shadowColor = 'rgba(255, 235, 130, 0.6)';
  ctx.shadowBlur = 12;

  ctx.fillStyle = goldGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Primary Quranic Verse: Surah Al-Baqarah (2:144)
  // "فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ" - "Turn your face toward the Sacred Mosque"
  ctx.font = 'bold 72px "Amiri", "Scheherazade New", "Traditional Arabic", "Noto Naskh Arabic", "Times New Roman", serif';
  ctx.fillText('فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ', w / 2, h / 2 - 18);

  // Subtitle / Bismillah & Dhikr in fine Thuluth
  ctx.shadowBlur = 6;
  ctx.font = '500 36px "Amiri", "Traditional Arabic", serif';
  ctx.fillStyle = '#ffe9a0';
  ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ  •  قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ', w / 2, h / 2 + 54);

  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 8-Point & 12-Point Islamic Geometric Zellij Tile Texture for Qibla Wall Panels
export function getIslamicGeometricTileTexture(): THREE.CanvasTexture {
  const cacheKey = 'islamic_geometric_wall_tiles';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Deep Moroccan Emerald Base
  ctx.fillStyle = '#0a3627';
  ctx.fillRect(0, 0, w, h);

  const cellSize = 128;
  const rows = h / cellSize;
  const cols = w / cellSize;

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const cx = c * cellSize;
      const cy = r * cellSize;

      ctx.save();
      ctx.translate(cx, cy);

      // Outer diamond (45 deg)
      ctx.fillStyle = '#07261b';
      ctx.beginPath();
      ctx.moveTo(0, -cellSize * 0.45);
      ctx.lineTo(cellSize * 0.45, 0);
      ctx.lineTo(0, cellSize * 0.45);
      ctx.lineTo(-cellSize * 0.45, 0);
      ctx.closePath();
      ctx.fill();

      // Gold strapwork outlines
      ctx.strokeStyle = '#c9a239';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 8-Point Khatam Star
      const starR = cellSize * 0.32;
      ctx.fillStyle = '#10523c';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8;
        const radius = i % 2 === 0 ? starR : starR * 0.52;
        const sx = Math.cos(angle) * radius;
        const sy = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f4d160';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner marble star rosette
      ctx.fillStyle = '#f8f6f0';
      ctx.beginPath();
      ctx.arc(0, 0, cellSize * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(0, 0, cellSize * 0.04, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Add subtle gold interlacing grid
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Gilded Arabic Calligraphy Medallions ("Allah", "Muhammad", "SubhanAllah", etc.)
export function getCalligraphyMedallionTexture(
  type:
    | 'allah'
    | 'muhammad'
    | 'bismillah'
    | 'subhanallah'
    | 'alhamdulillah'
    | 'allahuakbar'
    | 'lailahaillallah'
    | 'astaghfirullah'
    | 'mashallah' = 'allah'
): THREE.CanvasTexture {
  const cacheKey = `calligraphy_medallion_${type}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const cx = 512;
  const cy = 512;
  const r = 480;

  // Clear background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Disc background: deep emerald to obsidian velvet
  const discGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, r);
  discGrad.addColorStop(0, '#0d4a36');
  discGrad.addColorStop(0.7, '#083325');
  discGrad.addColorStop(1, '#041d15');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = discGrad;
  ctx.fill();

  // Multi-layered 24K Gold Beveled Borders
  const goldGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  goldGrad.addColorStop(0, '#fff3b0');
  goldGrad.addColorStop(0.2, '#d4af37');
  goldGrad.addColorStop(0.5, '#ffeaa7');
  goldGrad.addColorStop(0.8, '#b88918');
  goldGrad.addColorStop(1, '#ffd700');

  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 36, 0, Math.PI * 2);
  ctx.stroke();

  // Arabesque Sunburst / Petals surrounding medallion
  ctx.save();
  ctx.translate(cx, cy);
  const petals = 32;
  for (let i = 0; i < petals; i++) {
    ctx.rotate((Math.PI * 2) / petals);
    ctx.fillStyle = '#f5d369';
    ctx.beginPath();
    ctx.moveTo(0, r - 34);
    ctx.lineTo(8, r - 20);
    ctx.lineTo(0, r - 6);
    ctx.lineTo(-8, r - 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Calligraphy Text rendering with glow
  ctx.shadowColor = 'rgba(255, 230, 110, 0.75)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = goldGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (type === 'allah') {
    ctx.font = 'bold 270px "Amiri", "Traditional Arabic", "Noto Naskh Arabic", serif';
    ctx.fillText('الله', cx, cy - 10);
    ctx.font = 'bold 80px "Amiri", serif';
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText('ﷻ', cx + 160, cy - 140);
  } else if (type === 'muhammad') {
    ctx.font = 'bold 220px "Amiri", "Traditional Arabic", "Noto Naskh Arabic", serif';
    ctx.fillText('محمد', cx, cy - 10);
    ctx.font = 'bold 70px "Amiri", serif';
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText('ﷺ', cx + 160, cy - 120);
  } else if (type === 'subhanallah') {
    ctx.font = 'bold 155px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('سُبْحَانَ اللهِ', cx, cy);
  } else if (type === 'alhamdulillah') {
    ctx.font = 'bold 160px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('الْحَمْدُ للهِ', cx, cy);
  } else if (type === 'allahuakbar') {
    ctx.font = 'bold 165px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('اللهُ أَكْبَرُ', cx, cy);
  } else if (type === 'lailahaillallah') {
    ctx.font = 'bold 120px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('لَا إِلَٰهَ إِلَّا اللهُ', cx, cy);
  } else if (type === 'astaghfirullah') {
    ctx.font = 'bold 135px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('أَسْتَغْفِرُ اللهَ', cx, cy);
  } else if (type === 'mashallah') {
    ctx.font = 'bold 150px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('مَا شَاءَ اللهُ', cx, cy);
  } else {
    ctx.font = 'bold 150px "Amiri", "Traditional Arabic", "Noto Naskh Arabic", serif';
    ctx.fillText('بِسْمِ اللهِ', cx, cy - 30);
    ctx.font = 'bold 100px "Amiri", serif';
    ctx.fillText('الرَّحْمَٰنِ الرَّحِيمِ', cx, cy + 90);
  }

  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Ornate Mehrab Arch Tile Panel with radiating pointed voussoirs
export function getMihrabArchPanelTexture(): THREE.CanvasTexture {
  const cacheKey = 'mihrab_arch_panel_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Deep rich emerald base
  ctx.fillStyle = '#06261b';
  ctx.fillRect(0, 0, w, h);

  // Gold outer framing
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, w - 64, h - 64);

  // Central pointed arch outline
  const archW = w * 0.76;
  const archTop = h * 0.08;
  const archSpring = h * 0.48;
  const archX = (w - archW) / 2;

  // Horseshoe Arch Path
  ctx.beginPath();
  ctx.moveTo(archX, h - 40);
  ctx.lineTo(archX, archSpring);
  // Pointed curve
  ctx.bezierCurveTo(archX - 20, archTop + 140, w / 2 - 40, archTop, w / 2, archTop);
  ctx.bezierCurveTo(w / 2 + 40, archTop, archX + archW + 20, archTop + 140, archX + archW, archSpring);
  ctx.lineTo(archX + archW, h - 40);

  ctx.fillStyle = '#0d4a36';
  ctx.fill();
  ctx.strokeStyle = '#f3d368';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Radiating voussoirs along arch rim
  const voussoirCount = 21;
  for (let i = 0; i <= voussoirCount; i++) {
    const t = i / voussoirCount;
    const angle = Math.PI - t * Math.PI;
    const rOuter = archW * 0.54;
    const rInner = archW * 0.48;
    const vxCenter = w / 2;
    const vyCenter = archSpring;

    const x1 = vxCenter + Math.cos(angle) * rInner;
    const y1 = vyCenter - Math.sin(angle) * rInner * 0.85;
    const x2 = vxCenter + Math.cos(angle) * rOuter;
    const y2 = vyCenter - Math.sin(angle) * rOuter * 0.85;

    ctx.strokeStyle = i % 2 === 0 ? '#d4af37' : '#f8f6f0';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Inner calligraphy inscription: "Ayat Al-Kursi" or "Allahu Nurus-Samawati wal-Ard"
  ctx.fillStyle = '#ffeaa7';
  ctx.shadowColor = 'rgba(255, 234, 167, 0.7)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px "Amiri", "Traditional Arabic", serif';
  ctx.fillText('اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', w / 2, archSpring - 40);

  ctx.font = '32px "Amiri", serif';
  ctx.fillText('مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ', w / 2, archSpring + 30);

  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

function getFlooringRoughness(type: FlooringType): number {
  switch (type) {
    case 'carrara-marble':
      return 0.18;
    case 'polished-concrete':
      return 0.35;
    case 'natural-oak':
    case 'herringbone':
    case 'dark-walnut':
      return 0.45;
    case 'terracotta':
      return 0.65;
    case 'wool-carpet':
    case 'mosque-carpet-emerald':
    case 'mosque-carpet-ruby':
    case 'mosque-carpet-sand':
      return 0.95;
    default:
      return 0.5;
  }
}

function getFlooringMetalness(type: FlooringType): number {
  switch (type) {
    case 'carrara-marble':
      return 0.05;
    case 'polished-concrete':
      return 0.08;
    case 'mosque-carpet-emerald':
    case 'mosque-carpet-ruby':
      return 0.06; // subtle golden silk sheen
    default:
      return 0.0;
  }
}

// 1. Natural Oak Planks
function renderOakPlanks(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const planks = 8;
  const plankH = h / planks;

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    // Slight tone variance per plank
    const toneVariation = (Math.sin(i * 3.7) + 1) * 6;
    const r = Math.min(255, Math.floor(212 + toneVariation));
    const g = Math.min(255, Math.floor(184 + toneVariation * 0.8));
    const b = Math.min(255, Math.floor(148 + toneVariation * 0.6));

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, w, plankH);

    // Subtle grain lines
    ctx.strokeStyle = `rgba(160, 125, 85, 0.25)`;
    ctx.lineWidth = 1;
    for (let gIdx = 0; gIdx < 14; gIdx++) {
      const lineY = y + (plankH / 14) * gIdx + (Math.sin(gIdx + i) * 2);
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.bezierCurveTo(w * 0.3, lineY + 3, w * 0.7, lineY - 3, w, lineY + 1);
      ctx.stroke();
    }

    // Horizontal plank seam (beveled shadow)
    ctx.strokeStyle = '#5a4128';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + plankH);
    ctx.lineTo(w, y + plankH);
    ctx.stroke();

    // Staggered vertical seams
    const staggerX = ((i * 380) % w);
    ctx.beginPath();
    ctx.moveTo(staggerX, y);
    ctx.lineTo(staggerX, y + plankH);
    ctx.stroke();
  }
}

// 2. European Herringbone Parquet
function renderHerringboneParquet(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#dfcfb8';
  ctx.fillRect(0, 0, w, h);

  const blockW = 64;
  const blockH = 160;

  for (let x = -blockH; x < w + blockH; x += blockW * 2) {
    for (let y = -blockH; y < h + blockH; y += blockH) {
      // Left angled plank
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      const tone1 = 200 + ((x + y) % 25);
      ctx.fillStyle = `rgb(${tone1}, ${Math.floor(tone1 * 0.88)}, ${Math.floor(tone1 * 0.72)})`;
      ctx.fillRect(0, 0, blockW, blockH);
      ctx.strokeStyle = '#7a6042';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, blockW, blockH);
      ctx.restore();

      // Right angled plank
      ctx.save();
      ctx.translate(x + blockW, y);
      ctx.rotate(-Math.PI / 4);
      const tone2 = 190 + ((x * 2 + y) % 30);
      ctx.fillStyle = `rgb(${tone2}, ${Math.floor(tone2 * 0.88)}, ${Math.floor(tone2 * 0.72)})`;
      ctx.fillRect(0, 0, blockW, blockH);
      ctx.strokeStyle = '#7a6042';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, blockW, blockH);
      ctx.restore();
    }
  }
}

// 3. Dark Walnut Hardwood
function renderWalnutHardwood(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const planks = 7;
  const plankH = h / planks;

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const tone = (Math.sin(i * 4.1) + 1) * 8;
    const r = Math.floor(65 + tone);
    const g = Math.floor(45 + tone * 0.8);
    const b = Math.floor(32 + tone * 0.6);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, w, plankH);

    // Deep walnut grain rings
    ctx.strokeStyle = 'rgba(35, 20, 12, 0.4)';
    ctx.lineWidth = 1.2;
    for (let gIdx = 0; gIdx < 16; gIdx++) {
      const lineY = y + (plankH / 16) * gIdx;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.bezierCurveTo(w * 0.35, lineY + (gIdx % 3) * 4, w * 0.65, lineY - (gIdx % 3) * 4, w, lineY);
      ctx.stroke();
    }

    // Plank border
    ctx.strokeStyle = '#1d120a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y + plankH);
    ctx.lineTo(w, y + plankH);
    ctx.stroke();

    const staggerX = ((i * 440) % w);
    ctx.beginPath();
    ctx.moveTo(staggerX, y);
    ctx.lineTo(staggerX, y + plankH);
    ctx.stroke();
  }
}

// 4. Carrara Italian Marble
function renderCarraraMarble(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Soft marble base
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(0.5, '#f1f5f9');
  grad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft cloudy shadows
  for (let i = 0; i < 20; i++) {
    const cx = (Math.sin(i * 1.7) * 0.5 + 0.5) * w;
    const cy = (Math.cos(i * 2.3) * 0.5 + 0.5) * h;
    const rad = 100 + (i % 5) * 40;
    const cloudGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    cloudGrad.addColorStop(0, 'rgba(203, 213, 225, 0.35)');
    cloudGrad.addColorStop(1, 'rgba(241, 245, 249, 0)');
    ctx.fillStyle = cloudGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Branching delicate marble veins
  const drawVein = (startX: number, startY: number, length: number, angle: number) => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
    ctx.lineWidth = 2.0;
    let currX = startX;
    let currY = startY;
    ctx.moveTo(currX, currY);

    const steps = 30;
    for (let s = 0; s < steps; s++) {
      const stepLen = length / steps;
      const deviation = (Math.random() - 0.5) * 0.8;
      const currentAngle = angle + deviation;
      currX += Math.cos(currentAngle) * stepLen;
      currY += Math.sin(currentAngle) * stepLen;
      ctx.lineTo(currX, currY);
    }
    ctx.stroke();
  };

  drawVein(w * 0.1, h * 0.2, 500, Math.PI * 0.25);
  drawVein(w * 0.4, h * 0.1, 600, Math.PI * 0.35);
  drawVein(w * 0.6, h * 0.5, 450, -Math.PI * 0.2);
  drawVein(w * 0.2, h * 0.7, 520, Math.PI * 0.18);
}

// 5. Polished Concrete
function renderPolishedConcrete(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#b8bec7';
  ctx.fillRect(0, 0, w, h);

  // Micro grit noise & speckles
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle concrete panel grid (expansion joints)
  ctx.strokeStyle = 'rgba(70, 75, 85, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

// 6. Wool Carpet (Bouclé Loop)
function renderWoolCarpet(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ebe6df';
  ctx.fillRect(0, 0, w, h);

  // Crosshatch loop dots
  const step = 8;
  for (let x = 0; x < w; x += step) {
    for (let y = 0; y < h; y += step) {
      const jitter = (Math.random() - 0.5) * 2;
      const shade = 210 + Math.random() * 30;
      ctx.fillStyle = `rgb(${shade}, ${shade * 0.98}, ${shade * 0.94})`;
      ctx.beginPath();
      ctx.arc(x + jitter, y + jitter, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Woven border fringe
  ctx.strokeStyle = 'rgba(180, 170, 160, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
}

// 7. Tuscan Terracotta Tile
function renderTerracottaTile(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Grout mortar base
  ctx.fillStyle = '#c7bcab';
  ctx.fillRect(0, 0, w, h);

  const tiles = 4;
  const tileDim = w / tiles;
  const mortar = 8;

  for (let x = 0; x < tiles; x++) {
    for (let y = 0; y < tiles; y++) {
      const tileX = x * tileDim + mortar / 2;
      const tileY = y * tileDim + mortar / 2;
      const innerW = tileDim - mortar;

      // Clay gradient per tile
      const tone = (x * 7 + y * 13) % 20;
      const r = 195 + tone;
      const g = 100 + tone * 0.7;
      const b = 70 + tone * 0.5;

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(tileX, tileY, innerW, innerW);

      // Organic clay surface variation
      ctx.fillStyle = 'rgba(150, 70, 45, 0.15)';
      ctx.fillRect(tileX + 10, tileY + 10, innerW - 20, innerW - 20);
    }
  }
}

// Accent Wall Feature textures (e.g. vertical wood slats)
export function getWoodSlatsTexture(): THREE.CanvasTexture {
  const cacheKey = 'wood_slats';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark backing gap
  ctx.fillStyle = '#1e1b18';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical slats
  const slatCount = 16;
  const slatW = 512 / slatCount;
  const slatPadding = 6;

  for (let i = 0; i < slatCount; i++) {
    const x = i * slatW;
    ctx.fillStyle = '#a67c52'; // Oak slat
    ctx.fillRect(x + slatPadding, 0, slatW - slatPadding * 2, 512);

    // Bevel shadow on slat
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + slatPadding, 0, 2, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

// 8. Mosque Musalla Carpet - Turkish Emerald Green with Gold Saff lines & Mihrab Arches
function renderMosqueCarpetEmerald(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Rich emerald green velvet base
  ctx.fillStyle = '#0d4a36';
  ctx.fillRect(0, 0, w, h);

  // Micro velvet pile texture
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise * 0.4));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Prayer Arch (Mihrab pointed arch) motif in golden thread
  const archW = w * 0.78;
  const archH = h * 0.48;
  const archX = (w - archW) / 2;
  const archY = h * 0.1;

  ctx.strokeStyle = '#d4af37'; // Antique Gold
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(archX, archY + archH);
  ctx.lineTo(archX, archY + archH * 0.42);
  ctx.quadraticCurveTo(archX, archY, archX + archW * 0.5, archY);
  ctx.quadraticCurveTo(archX + archW, archY, archX + archW, archY + archH * 0.42);
  ctx.lineTo(archX + archW, archY + archH);
  ctx.stroke();

  // Inner gold decorative line
  ctx.strokeStyle = 'rgba(245, 215, 120, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Ornate Arabesque apex finial
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(archX + archW * 0.5, archY - 10, 8, 0, Math.PI * 2);
  ctx.fill();

  // Continuous Saff divider band (at bottom of row where feet align)
  const saffY = h * 0.88;
  const saffHeight = 44;

  // Gold ribbon background
  ctx.fillStyle = '#b89028';
  ctx.fillRect(0, saffY, w, saffHeight);

  // Geometric diamond pattern along Saff line
  ctx.fillStyle = '#0d4a36';
  const diamondStep = 32;
  for (let x = 0; x < w; x += diamondStep) {
    ctx.beginPath();
    ctx.moveTo(x, saffY + saffHeight / 2);
    ctx.lineTo(x + diamondStep / 2, saffY + 4);
    ctx.lineTo(x + diamondStep, saffY + saffHeight / 2);
    ctx.lineTo(x + diamondStep / 2, saffY + saffHeight - 4);
    ctx.closePath();
    ctx.fill();
  }

  // Pure white/gold toe alignment stripe
  ctx.fillStyle = '#fff4db';
  ctx.fillRect(0, saffY + saffHeight - 5, w, 5);
}

// 9. Mosque Musalla Carpet - Ottoman Royal Ruby Red
function renderMosqueCarpetRuby(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Rich royal ruby/burgundy red velvet base
  ctx.fillStyle = '#7a1420';
  ctx.fillRect(0, 0, w, h);

  // Velvet pile variation
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.3));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.4));
  }
  ctx.putImageData(imgData, 0, 0);

  // Pointed Islamic arch
  const archW = w * 0.8;
  const archH = h * 0.46;
  const archX = (w - archW) / 2;
  const archY = h * 0.12;

  ctx.strokeStyle = '#e5b842';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(archX, archY + archH);
  ctx.lineTo(archX, archY + archH * 0.45);
  ctx.quadraticCurveTo(archX, archY, archX + archW * 0.5, archY);
  ctx.quadraticCurveTo(archX + archW, archY, archX + archW, archY + archH * 0.45);
  ctx.lineTo(archX + archW, archY + archH);
  ctx.stroke();

  // Saff divider band
  const saffY = h * 0.88;
  const saffHeight = 44;
  ctx.fillStyle = '#c59a2f';
  ctx.fillRect(0, saffY, w, saffHeight);

  // Deep burgundy inner geometric chain
  ctx.fillStyle = '#500c14';
  const step = 28;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.arc(x + step / 2, saffY + saffHeight / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Alignment stripe
  ctx.fillStyle = '#fff6de';
  ctx.fillRect(0, saffY + saffHeight - 6, w, 6);
}

// 10. Mosque Musalla Carpet - Contemporary Sand & Sage
function renderMosqueCarpetSand(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Warm sand/cream base
  ctx.fillStyle = '#ded5c5';
  ctx.fillRect(0, 0, w, h);

  // Subtle arch outline in sage green
  const archW = w * 0.8;
  const archH = h * 0.42;
  const archX = (w - archW) / 2;
  const archY = h * 0.14;

  ctx.strokeStyle = '#4a6756';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(archX, archY + archH);
  ctx.lineTo(archX, archY + archH * 0.4);
  ctx.quadraticCurveTo(archX, archY, archX + archW * 0.5, archY);
  ctx.quadraticCurveTo(archX + archW, archY, archX + archW, archY + archH * 0.4);
  ctx.lineTo(archX + archW, archY + archH);
  ctx.stroke();

  // Saff line in sage & gold
  const saffY = h * 0.88;
  ctx.fillStyle = '#4a6756';
  ctx.fillRect(0, saffY, w, 36);
  ctx.fillStyle = '#bfa15f';
  ctx.fillRect(0, saffY + 30, w, 6);
}

// 11. Carved White Marble Islamic Mashrabiya / Jali Fretwork (matching image.png)
export function getCarvedWhiteJaliTexture(): THREE.CanvasTexture {
  const cacheKey = 'carved_white_jali_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Creamy white marble base with delicate subtle marbling
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft marble veining
  ctx.strokeStyle = '#eae5d9';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, 0);
    ctx.bezierCurveTo(
      Math.random() * canvas.width,
      canvas.height * 0.35,
      Math.random() * canvas.width,
      canvas.height * 0.65,
      Math.random() * canvas.width,
      canvas.height
    );
    ctx.stroke();
  }

  // Draw intricate Islamic 8-point geometric star lattice (Girih pattern)
  const tileSize = 128;
  const rows = canvas.height / tileSize;
  const cols = canvas.width / tileSize;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * tileSize + tileSize / 2;
      const cy = r * tileSize + tileSize / 2;
      const radius = tileSize * 0.42;

      // Outer recessed square frame
      ctx.strokeStyle = '#ded8cb';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(c * tileSize + 4, r * tileSize + 4, tileSize - 8, tileSize - 8);

      // Carved drop shadow for 3D depth
      ctx.strokeStyle = '#c8c1b2';
      ctx.lineWidth = 3;
      drawEightPointStar(ctx, cx + 1, cy + 1, radius * 0.95, radius * 0.52);

      // Highlight white rim for embossed stone relief
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      drawEightPointStar(ctx, cx - 1, cy - 1, radius * 0.95, radius * 0.52);

      // Main crisp carved star rim
      ctx.strokeStyle = '#dfd8cc';
      ctx.lineWidth = 2;
      drawEightPointStar(ctx, cx, cy, radius * 0.95, radius * 0.52);

      // Central floral rosette medallion
      ctx.fillStyle = '#ece5d8';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c4bcae';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Delicate center gold/brass pip
      ctx.fillStyle = '#c5a059';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Intersecting diagonals
      ctx.strokeStyle = '#e2dbce';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c * tileSize, r * tileSize);
      ctx.lineTo((c + 1) * tileSize, (r + 1) * tileSize);
      ctx.moveTo((c + 1) * tileSize, r * tileSize);
      ctx.lineTo(c * tileSize, (r + 1) * tileSize);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 12. Islamic Door Star Lattice Texture (Dark Architectural Bronze/Wrought Iron with Girih Stars)
export function getIslamicDoorStarLatticeTexture(): THREE.CanvasTexture {
  const cacheKey = 'islamic_door_star_lattice';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep architectural dark bronze/charcoal iron base
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle warm glowing interior amber back-lighting in the open lattice cells
  const tileSize = 128;
  const rows = canvas.height / tileSize;
  const cols = canvas.width / tileSize;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * tileSize + tileSize / 2;
      const cy = r * tileSize + tileSize / 2;
      const rad = tileSize * 0.44;

      // Backlit glass glow in star centers
      const glowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad * 0.6);
      glowGrad.addColorStop(0, 'rgba(255, 235, 170, 0.45)');
      glowGrad.addColorStop(0.7, 'rgba(200, 150, 60, 0.25)');
      glowGrad.addColorStop(1, 'rgba(24, 24, 27, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Wrought-iron star tracery (8-point star)
      ctx.strokeStyle = '#38383e';
      ctx.lineWidth = 4;
      drawEightPointStar(ctx, cx, cy, rad, rad * 0.55);

      // Golden brass inlay highlight on the outer tracery rim
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 1.8;
      drawEightPointStar(ctx, cx, cy, rad * 0.88, rad * 0.48);

      // Inner rosette ring
      ctx.strokeStyle = '#8a7238';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.32, 0, Math.PI * 2);
      ctx.stroke();

      // Center brass dome rivet
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Corner rosettes
      [-1, 1].forEach((dx) => {
        [-1, 1].forEach((dy) => {
          const cornerX = cx + (dx * tileSize) / 2;
          const cornerY = cy + (dy * tileSize) / 2;
          ctx.strokeStyle = '#52525b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cornerX, cornerY, 12, 0, Math.PI * 2);
          ctx.stroke();
        });
      });
    }
  }

  // Outer framing border
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Helper: draw 8-pointed Islamic Star
function drawEightPointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number
) {
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

// 13. Traditional Moroccan / Andalusian Zellige Star Dado Tilework (Lower 1.38m Wainscot)
export function getIslamicZelligeDadoTexture(): THREE.CanvasTexture {
  const cacheKey = 'islamic_zellige_dado_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Deep Moroccan glazed terracotta base (Rich Emerald & Sand)
  ctx.fillStyle = '#06261b';
  ctx.fillRect(0, 0, w, h);

  // Top decorative guilloche ribbon border (y: 0 to 90)
  const topBorderH = 90;
  ctx.fillStyle = '#0a3627';
  ctx.fillRect(0, 0, w, topBorderH);

  // Gold strapwork lines
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, w - 8, topBorderH - 8);

  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, w - 24, topBorderH - 24);

  // Top border chevron & star frets
  for (let x = 20; x < w; x += 40) {
    ctx.fillStyle = '#f5d369';
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x + 12, 45);
    ctx.lineTo(x + 24, 18);
    ctx.lineTo(x + 12, 32);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#10523c';
    ctx.beginPath();
    ctx.arc(x + 12, 64, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffeaa7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Main Field: Intricate Interlocking Moroccan Zellige (8-point & 16-point Girih stars)
  const fieldTop = topBorderH;
  const fieldBottom = h - 90;
  const cellSize = 128;

  for (let y = fieldTop; y < fieldBottom; y += cellSize) {
    for (let x = 0; x < w; x += cellSize) {
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      const r = cellSize * 0.44;

      // Outer 8-point star (Deep Lapis/Sapphire blue)
      ctx.fillStyle = '#0e2b45';
      drawEightPointStar(ctx, cx, cy, r, r * 0.52);
      ctx.fill();

      // Gold strapwork outline
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      drawEightPointStar(ctx, cx, cy, r, r * 0.52);

      // Inner 8-point star (Moroccan Emerald)
      ctx.fillStyle = '#0d4a36';
      drawEightPointStar(ctx, cx, cy, r * 0.72, r * 0.38);
      ctx.fill();
      ctx.strokeStyle = '#ffeaa7';
      ctx.lineWidth = 1.8;
      drawEightPointStar(ctx, cx, cy, r * 0.72, r * 0.38);

      // Central white marble rosette with amber gold core
      ctx.fillStyle = '#f8f6f0';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c4bcae';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Corner diamonds connecting neighboring stars
      const cornerR = cellSize * 0.22;
      [0, cellSize].forEach((dx) => {
        [0, cellSize].forEach((dy) => {
          const cornerX = x + dx;
          const cornerY = y + dy;
          ctx.fillStyle = '#c5a059';
          ctx.beginPath();
          ctx.moveTo(cornerX, cornerY - cornerR);
          ctx.lineTo(cornerX + cornerR, cornerY);
          ctx.lineTo(cornerX, cornerY + cornerR);
          ctx.lineTo(cornerX - cornerR, cornerY);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#fff1b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      });
    }
  }

  // Bottom border: Stepped marble skirting transition (y: h - 90 to h)
  ctx.fillStyle = '#0a3627';
  ctx.fillRect(0, fieldBottom, w, 90);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, fieldBottom + 4, w - 8, 82);

  ctx.lineWidth = 2;
  ctx.strokeRect(12, fieldBottom + 12, w - 24, 66);

  for (let x = 20; x < w; x += 36) {
    ctx.fillStyle = '#f5d369';
    ctx.beginPath();
    ctx.arc(x + 10, fieldBottom + 45, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffeaa7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 14. Continuous Perimeter Quranic Calligraphy Frieze (West, East & South Walls)
export function getIslamicPerimeterFriezeTexture(): THREE.CanvasTexture {
  const cacheKey = 'islamic_perimeter_frieze_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Rich emerald gradient matching the Qibla wall frieze
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#04281c');
  bgGrad.addColorStop(0.5, '#0a3d2c');
  bgGrad.addColorStop(1, '#031f16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Outer gold borders with beveled sheen
  const goldGrad = ctx.createLinearGradient(0, 0, w, 0);
  goldGrad.addColorStop(0, '#cda137');
  goldGrad.addColorStop(0.25, '#ffe58f');
  goldGrad.addColorStop(0.5, '#d4af37');
  goldGrad.addColorStop(0.75, '#fff1a8');
  goldGrad.addColorStop(1, '#b58b22');

  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  // Geometric guilloche ribbon
  ctx.fillStyle = '#f3cf5e';
  const ribbonStep = 32;
  for (let x = 40; x < w - 40; x += ribbonStep) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x + 8, 22);
    ctx.lineTo(x + 16, 18);
    ctx.lineTo(x + 8, 14);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, h - 18);
    ctx.lineTo(x + 8, h - 14);
    ctx.lineTo(x + 16, h - 18);
    ctx.lineTo(x + 8, h - 22);
    ctx.closePath();
    ctx.fill();
  }

  // Quranic Calligraphy (Surah Al-Baqarah 2:43 & An-Nisa 4:103 in Thuluth)
  ctx.shadowColor = 'rgba(255, 235, 130, 0.65)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = goldGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 64px "Amiri", "Traditional Arabic", "Noto Naskh Arabic", "Times New Roman", serif';
  ctx.fillText('وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ', w / 2, h / 2 - 18);

  ctx.shadowBlur = 5;
  ctx.font = '500 34px "Amiri", "Traditional Arabic", serif';
  ctx.fillStyle = '#ffe9a0';
  ctx.fillText('إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا  •  فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي', w / 2, h / 2 + 52);

  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 15. Traditional Islamic Pointed Horseshoe Arch Window with Ablaq Voussoirs & Mashrabiya Jali
export function getIslamicArchedWindowTexture(): THREE.CanvasTexture {
  const cacheKey = 'islamic_arched_window_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Background wall plaster (Soft warm alabaster cream)
  ctx.fillStyle = '#f7f5ef';
  ctx.fillRect(0, 0, w, h);

  // Outer recessed niche frame
  const nicheW = w * 0.88;
  const nicheH = h * 0.92;
  const nicheX = (w - nicheW) / 2;
  const nicheY = (h - nicheH) / 2;

  // Recessed alcove shadow
  ctx.fillStyle = '#e8e3d5';
  ctx.fillRect(nicheX, nicheY, nicheW, nicheH);

  // Pointed Horseshoe Arch Parameters
  const archW = nicheW * 0.82;
  const archX = (w - archW) / 2;
  const archSpringY = nicheY + nicheH * 0.42;
  const archApexY = nicheY + 40;

  // Dual-tone Ablaq Voussoirs (Alternating Ivory White Marble & Terracotta / Ochre stone)
  const voussoirs = 23;
  const cx = w / 2;
  const cy = archSpringY;
  const rOuter = archW * 0.58;
  const rInner = archW * 0.48;

  for (let i = 0; i < voussoirs; i++) {
    const t0 = i / voussoirs;
    const t1 = (i + 1) / voussoirs;
    const angle0 = Math.PI - t0 * Math.PI;
    const angle1 = Math.PI - t1 * Math.PI;

    // Ablaq alternating colors: warm terracotta ochre / ivory marble
    const isDark = i % 2 === 0;
    ctx.fillStyle = isDark ? '#b86d43' : '#f9f8f4';

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle0) * rInner, cy - Math.sin(angle0) * rInner * 0.95);
    ctx.lineTo(cx + Math.cos(angle0) * rOuter, cy - Math.sin(angle0) * rOuter * 0.95);
    ctx.lineTo(cx + Math.cos(angle1) * rOuter, cy - Math.sin(angle1) * rOuter * 0.95);
    ctx.lineTo(cx + Math.cos(angle1) * rInner, cy - Math.sin(angle1) * rInner * 0.95);
    ctx.closePath();
    ctx.fill();

    // Stone joints / mortar
    ctx.strokeStyle = '#8d502d';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Arch Inner Window Opening
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(archX, nicheY + nicheH - 30);
  ctx.lineTo(archX, archSpringY);
  ctx.bezierCurveTo(archX - 15, archApexY + 120, cx - 25, archApexY, cx, archApexY);
  ctx.bezierCurveTo(cx + 25, archApexY, archX + archW + 15, archApexY + 120, archX + archW, archSpringY);
  ctx.lineTo(archX + archW, nicheY + nicheH - 30);
  ctx.closePath();
  ctx.clip();

  // Warm Amber Sunlight Glow emanating from window
  const sunGrad = ctx.createRadialGradient(cx, archApexY + 200, 50, cx, cy, archW * 0.8);
  sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.95)');
  sunGrad.addColorStop(0.5, 'rgba(255, 223, 150, 0.7)');
  sunGrad.addColorStop(1, 'rgba(210, 160, 90, 0.45)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);

  // Pierced Mashrabiya / Jali Latticework tracery (8-point Girih stars)
  const jaliSize = 72;
  ctx.strokeStyle = '#2b231a';
  ctx.lineWidth = 3;

  for (let py = archApexY; py < nicheY + nicheH; py += jaliSize) {
    for (let px = archX - jaliSize; px < archX + archW + jaliSize; px += jaliSize) {
      const starCx = px + jaliSize / 2;
      const starCy = py + jaliSize / 2;
      const sRad = jaliSize * 0.42;

      ctx.strokeStyle = '#3e3428';
      ctx.lineWidth = 3.5;
      drawEightPointStar(ctx, starCx, starCy, sRad, sRad * 0.52);

      // Gold highlight bead
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(starCx, starCy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Window mullions (vertical timber division)
  ctx.fillStyle = '#3a2d20';
  ctx.fillRect(cx - 10, archApexY, 20, nicheY + nicheH - archApexY);

  ctx.restore();

  // Molded Arch Trim and Gold Beading
  ctx.beginPath();
  ctx.moveTo(archX, nicheY + nicheH - 30);
  ctx.lineTo(archX, archSpringY);
  ctx.bezierCurveTo(archX - 15, archApexY + 120, cx - 25, archApexY, cx, archApexY);
  ctx.bezierCurveTo(cx + 25, archApexY, archX + archW + 15, archApexY + 120, archX + archW, archSpringY);
  ctx.lineTo(archX + archW, nicheY + nicheH - 30);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Stone sill ledge at bottom
  ctx.fillStyle = '#e5ded0';
  ctx.fillRect(nicheX - 10, nicheY + nicheH - 45, nicheW + 20, 35);
  ctx.strokeStyle = '#b8af9c';
  ctx.lineWidth = 3;
  ctx.strokeRect(nicheX - 10, nicheY + nicheH - 45, nicheW + 20, 35);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 16. Recessed Holy Quran Bookshelf Alcove (Taqah / Mus-haf Wall Niche)
export function getQuranBookNicheTexture(): THREE.CanvasTexture {
  const cacheKey = 'quran_book_niche_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Dark polished walnut alcove interior
  ctx.fillStyle = '#1c140d';
  ctx.fillRect(0, 0, w, h);

  // Outer ornate carved arch frame
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, w - 60, h - 60);

  // Pointed horseshoe arch header
  const archW = w * 0.84;
  const archX = (w - archW) / 2;
  const archSpring = h * 0.38;
  const cx = w / 2;
  const apexY = 50;

  // Top fan with carved brass filigree openwork
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(archX, archSpring);
  ctx.bezierCurveTo(archX - 10, apexY + 90, cx - 20, apexY, cx, apexY);
  ctx.bezierCurveTo(cx + 20, apexY, archX + archW + 10, apexY + 90, archX + archW, archSpring);
  ctx.lineTo(archX + archW, archSpring);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = '#2c1e14';
  ctx.fillRect(0, 0, w, h);

  // Radiating rays in header
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 16; i++) {
    const angle = Math.PI - (i / 16) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, archSpring);
    ctx.lineTo(cx + Math.cos(angle) * archW * 0.55, archSpring - Math.sin(angle) * (archSpring - apexY));
    ctx.stroke();
  }

  // Header Calligraphy: "القرآن الكريم" (The Holy Quran)
  ctx.fillStyle = '#ffeaa7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px "Amiri", "Traditional Arabic", serif';
  ctx.shadowColor = 'rgba(255, 234, 167, 0.7)';
  ctx.shadowBlur = 10;
  ctx.fillText('الْقُرْآنُ الْكَرِيمُ', cx, archSpring - 65);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Gold arch trim
  ctx.beginPath();
  ctx.moveTo(archX, h - 40);
  ctx.lineTo(archX, archSpring);
  ctx.bezierCurveTo(archX - 10, apexY + 90, cx - 20, apexY, cx, apexY);
  ctx.bezierCurveTo(cx + 20, apexY, archX + archW + 10, apexY + 90, archX + archW, archSpring);
  ctx.lineTo(archX + archW, h - 40);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.stroke();

  // 2 Tiered Wooden Shelves with Aligned Holy Quran Volumes
  const shelfY1 = h * 0.65;
  const shelfY2 = h * 0.92;

  const renderBookRow = (shelfY: number, count: number) => {
    // Solid timber shelf plank
    ctx.fillStyle = '#3e2717';
    ctx.fillRect(archX + 10, shelfY, archW - 20, 24);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(archX + 10, shelfY, archW - 20, 24);

    // Shelf drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(archX + 10, shelfY + 24, archW - 20, 15);

    // Render row of gold-embossed Holy Quran volumes
    const bookWidth = (archW - 50) / count;
    const bookHeight = 160;

    const bookColors = ['#0c3b28', '#1a2f4c', '#5c1313', '#0d4a36', '#261b36'];

    for (let i = 0; i < count; i++) {
      const bx = archX + 25 + i * bookWidth;
      const by = shelfY - bookHeight;
      const bColor = bookColors[i % bookColors.length];

      // Book Spine
      ctx.fillStyle = bColor;
      ctx.fillRect(bx, by, bookWidth - 4, bookHeight);

      // Gold spine border & Islamic tooling
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 3, by + 6, bookWidth - 10, bookHeight - 12);

      // Gold embossed medallion on spine
      ctx.fillStyle = '#f5d369';
      ctx.beginPath();
      ctx.arc(bx + (bookWidth - 4) / 2, by + bookHeight * 0.45, 9, 0, Math.PI * 2);
      ctx.fill();

      // Arabic Calligraphy "القرآن" vertically along spine
      ctx.save();
      ctx.translate(bx + (bookWidth - 4) / 2, by + bookHeight * 0.65);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#ffeaa7';
      ctx.font = 'bold 16px "Amiri", serif';
      ctx.textAlign = 'center';
      ctx.fillText('القرآن', 0, 0);
      ctx.restore();
    }
  };

  renderBookRow(shelfY1, 10);
  renderBookRow(shelfY2, 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 17. Traditional Arched Islamic Mosque Prayer Times Clock Board (Mawaqit al-Salat)
export function getIslamicPrayerClockTexture(): THREE.CanvasTexture {
  const cacheKey = 'islamic_prayer_clock_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Dark obsidian/bronze casing
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Gilded multi-tiered frame
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, w - 52, h - 52);

  // Top Pointed Arch Crown with Calligraphy
  const cx = w / 2;
  const apexY = 50;
  const archSpring = 240;

  ctx.fillStyle = '#06261b';
  ctx.beginPath();
  ctx.moveTo(40, archSpring);
  ctx.bezierCurveTo(40, apexY + 60, cx - 30, apexY, cx, apexY);
  ctx.bezierCurveTo(cx + 30, apexY, w - 40, apexY + 60, w - 40, archSpring);
  ctx.lineTo(w - 40, 280);
  ctx.lineTo(40, 280);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inscriptions: "مَوَاقِيتُ الصَّلَاةِ" & Bismillah
  ctx.fillStyle = '#ffeaa7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 36px "Amiri", "Traditional Arabic", serif';
  ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', cx, 115);

  ctx.font = 'bold 56px "Amiri", serif';
  ctx.fillStyle = '#f5d369';
  ctx.shadowColor = 'rgba(245, 211, 105, 0.7)';
  ctx.shadowBlur = 10;
  ctx.fillText('مَوَاقِيتُ الصَّلَاةِ', cx, 190);
  ctx.shadowBlur = 0;

  // Current Time and Date Display Box
  ctx.fillStyle = '#021a12';
  ctx.fillRect(60, 300, w - 120, 100);
  ctx.strokeStyle = '#10523c';
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 300, w - 120, 100);

  // Glowing Green LED Clock
  ctx.font = 'bold 58px monospace';
  ctx.fillStyle = '#10b981';
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 15;
  ctx.fillText('12:45:00', cx - 140, 350);

  ctx.font = 'bold 28px "Amiri", sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.fillText('١٤٤٨ هـ  •  MAKKAH', cx + 180, 350);
  ctx.shadowBlur = 0;

  // Prayer Rows: Fajr, Shuruq, Zuhr, Asr, Maghrib, Isha, Jumu'ah
  const prayers = [
    { ar: 'الفَجْرُ', en: 'FAJR', time: '05:14' },
    { ar: 'الشُّرُوقُ', en: 'SUNRISE', time: '06:32' },
    { ar: 'الظُّهْرُ', en: 'DHUHR', time: '12:30' },
    { ar: 'العَصْرُ', en: 'ASR', time: '15:45' },
    { ar: 'المَغْرِبُ', en: 'MAGHRIB', time: '18:18' },
    { ar: 'العِشَاءُ', en: 'ISHA', time: '19:42' },
    { ar: 'الجُمُعَةُ', en: 'JUMU\'AH', time: '13:00' },
  ];

  const rowStartY = 430;
  const rowHeight = 105;

  prayers.forEach((p, idx) => {
    const ry = rowStartY + idx * rowHeight;

    // Row backdrop with subtle divider
    ctx.fillStyle = idx % 2 === 0 ? '#0b1329' : '#070d1e';
    ctx.fillRect(60, ry, w - 120, rowHeight - 8);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, ry, w - 120, rowHeight - 8);

    // Arabic Name
    ctx.textAlign = 'right';
    ctx.font = 'bold 42px "Amiri", "Traditional Arabic", serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(p.ar, w - 100, ry + 48);

    // English Name
    ctx.textAlign = 'left';
    ctx.font = '600 24px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(p.en, 100, ry + 48);

    // Digital LED Time Display Box
    const boxW = 200;
    const boxX = cx - boxW / 2;
    ctx.fillStyle = '#022c22';
    ctx.fillRect(boxX, ry + 12, boxW, rowHeight - 32);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, ry + 12, boxW, rowHeight - 32);

    // Glowing LED Numbers
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px monospace';
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.fillText(p.time, cx, ry + 56);
    ctx.shadowBlur = 0;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// =========================================================================
// PERSIAN IWAN ARCHITECTURAL TEXTURES (ISFAHAN / SHAH MOSQUE / SAMARKAND)
// =========================================================================

// Helper for 12-point Persian Girih Star (Shams-e Girih)
function drawTwelvePointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number
) {
  const points = 24;
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = (i * Math.PI) / 12;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// 18. Persian Haft-Rangi (Seven-Color) Mosaic Faience Tile (Isfahan Royal Cobalt & Turquoise)
export function getPersianIwanTileTexture(): THREE.CanvasTexture {
  const cacheKey = 'persian_iwan_haft_rangi_tile';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Deep royal Persian cobalt blue ground
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.72);
  bgGrad.addColorStop(0, '#103463');
  bgGrad.addColorStop(0.55, '#0c274c');
  bgGrad.addColorStop(1, '#071830');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Outer gold and turquoise interlaced fret borders
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.strokeStyle = '#00a896'; // Turquoise
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, w - 52, h - 52);

  ctx.strokeStyle = '#fff2a8';
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, w - 68, h - 68);

  // Corner Persian palmette brackets (Shah Abbasi motifs)
  const drawCornerPalmette = (cx: number, cy: number, rot: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Turquoise fan leaf
    ctx.fillStyle = '#00a896';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(80, 40, 110, 110);
    ctx.quadraticCurveTo(40, 80, 0, 0);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Saffron inner teardrop
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(60, 60, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8f6f0';
    ctx.beginPath();
    ctx.arc(60, 60, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawCornerPalmette(40, 40, 0);
  drawCornerPalmette(w - 40, 40, Math.PI / 2);
  drawCornerPalmette(w - 40, h - 40, Math.PI);
  drawCornerPalmette(40, h - 40, -Math.PI / 2);

  // Central Grand Shams-e Girih Medallion (12-pointed Sunburst Star)
  const cx = w / 2;
  const cy = h / 2;
  const outerStarR = 260;
  const innerStarR = 150;

  // Lapis backdrop ring
  ctx.fillStyle = '#0a1d38';
  ctx.beginPath();
  ctx.arc(cx, cy, outerStarR + 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Outer 12-point star in Persian Turquoise
  ctx.fillStyle = '#00a896';
  drawTwelvePointStar(ctx, cx, cy, outerStarR, innerStarR);
  ctx.fill();
  ctx.strokeStyle = '#ffeaa7';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Secondary 12-point star in Saffron Gold
  ctx.fillStyle = '#d4af37';
  drawTwelvePointStar(ctx, cx, cy, outerStarR * 0.72, innerStarR * 0.72);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner Persian Cobalt rosette
  ctx.fillStyle = '#0f2b5c';
  ctx.beginPath();
  ctx.arc(cx, cy, innerStarR * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 12 radiating floral lotus petals (Shah Abbasi petals)
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const px = cx + Math.cos(angle) * 78;
    const py = cy + Math.sin(angle) * 78;

    ctx.fillStyle = '#f8f6f0'; // Ivory petal
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#00a896';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Golden core
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Swirling Persian Islimi (arabesque) vine tracery between corners and medallion
  ctx.strokeStyle = '#02c39a';
  ctx.lineWidth = 3;
  const drawIslimiTendril = (x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.stroke();
  };

  drawIslimiTendril(120, 120, 240, 180, 200, 320, cx - 140, cy - 140);
  drawIslimiTendril(w - 120, 120, w - 240, 180, w - 200, 320, cx + 140, cy - 140);
  drawIslimiTendril(w - 120, h - 120, w - 240, h - 180, w - 200, h - 320, cx + 140, cy + 140);
  drawIslimiTendril(120, h - 120, 240, h - 180, 200, h - 320, cx - 140, cy + 140);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 19. Continuous Persian Katibeh Quranic Calligraphy Ribbon (West, East & South Walls)
export function getPersianKatibehFriezeTexture(): THREE.CanvasTexture {
  const cacheKey = 'persian_katibeh_frieze_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Royal Lapis Lazuli / Persian Cobalt Blue field
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#061730');
  bgGrad.addColorStop(0.3, '#0b264e');
  bgGrad.addColorStop(0.7, '#0f3265');
  bgGrad.addColorStop(1, '#061730');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Background subtle turquoise arabesque vine underlay
  ctx.strokeStyle = 'rgba(0, 168, 150, 0.28)';
  ctx.lineWidth = 2.5;
  for (let x = 0; x < w; x += 120) {
    ctx.beginPath();
    ctx.arc(x + 60, h / 2, 45, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 120, h / 2, 45, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // Gilded border mouldings with turquoise beaded rosettes
  const goldGrad = ctx.createLinearGradient(0, 0, w, 0);
  goldGrad.addColorStop(0, '#cda137');
  goldGrad.addColorStop(0.25, '#ffe58f');
  goldGrad.addColorStop(0.5, '#d4af37');
  goldGrad.addColorStop(0.75, '#fff1a8');
  goldGrad.addColorStop(1, '#b58b22');

  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.strokeStyle = '#00a896';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, w - 44, h - 44);

  // Repeating turquoise & gold jewel roundels along top and bottom borders
  for (let x = 40; x < w - 40; x += 36) {
    ctx.fillStyle = '#00a896';
    ctx.beginPath();
    ctx.arc(x, 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe58f';
    ctx.beginPath();
    ctx.arc(x, 16, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00a896';
    ctx.beginPath();
    ctx.arc(x, h - 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe58f';
    ctx.beginPath();
    ctx.arc(x, h - 16, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Persian Thuluth Calligraphy:
  // Ayat al-Kursi (2:255) & Surah An-Nur (24:35) in pristine illuminated white with gold halo
  ctx.shadowColor = 'rgba(255, 225, 120, 0.75)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 62px "Amiri", "Traditional Arabic", "Noto Naskh Arabic", "Times New Roman", serif';
  ctx.fillText('اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ  ۞  مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ', w / 2, h / 2 - 20);

  ctx.shadowBlur = 6;
  ctx.font = 'bold 36px "Amiri", "Traditional Arabic", serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('الْمِصْبَاحُ فِي زُجَاجَةٍ الزُّجَاجَةُ كَأَنَّهَا كَوْكَبٌ دُرِّيٌّ  •  نُورٌ عَلَى نُورٍ يَهْدِي اللَّهُ لِنُورِهِ مَن يَشَاءُ', w / 2, h / 2 + 52);

  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 20. Persian Muqarnas (Stalactite Vault Facet Texture)
export function getPersianMuqarnasFacetTexture(): THREE.CanvasTexture {
  const cacheKey = 'persian_muqarnas_facet_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Lapis to turquoise shaded alcove cell
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#00a896'); // Turquoise apex
  grad.addColorStop(0.35, '#0d3d63');
  grad.addColorStop(0.75, '#0a2542');
  grad.addColorStop(1, '#051224'); // Deep recessed shadow
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Stepped stalactite tier brackets
  ctx.strokeStyle = '#d4af37'; // Gold trim
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w / 2, h * 0.45);
  ctx.lineTo(w, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.15, 0);
  ctx.lineTo(w / 2, h * 0.7);
  ctx.lineTo(w * 0.85, 0);
  ctx.stroke();

  // Central golden rosette in niche apex
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.3, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 21. Traditional Persian Orosi Stained-Glass & Girih Lattice Arch Window (پنجره ارسی)
export function getPersianOrosiWindowTexture(): THREE.CanvasTexture {
  const cacheKey = 'persian_orosi_window_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Dark timber outer frame (Walnut)
  ctx.fillStyle = '#1c130c';
  ctx.fillRect(0, 0, w, h);

  // Persian pointed arch outline
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(60, h - 60);
  ctx.lineTo(60, h * 0.46);
  ctx.quadraticCurveTo(60, h * 0.12, w / 2, 40);
  ctx.quadraticCurveTo(w - 60, h * 0.12, w - 60, h * 0.46);
  ctx.lineTo(w - 60, h - 60);
  ctx.closePath();
  ctx.clip();

  // Background sunlight glow through stained glass
  const sunGlow = ctx.createRadialGradient(w / 2, h * 0.35, 60, w / 2, h / 2, w * 0.6);
  sunGlow.addColorStop(0, 'rgba(255, 252, 230, 0.95)');
  sunGlow.addColorStop(0.4, 'rgba(255, 220, 140, 0.7)');
  sunGlow.addColorStop(1, 'rgba(180, 210, 240, 0.5)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h);

  // Geometric 12-Point Girih Grid of Stained Glass Panes
  const cols = 6;
  const rows = 6;
  const cellW = (w - 120) / cols;
  const cellH = (h - 120) / rows;

  const jewelColors = [
    '#00a896', // Persian Turquoise
    '#0f4c81', // Royal Cobalt Blue
    '#c0392b', // Pomegranate Ruby Red
    '#f39c12', // Saffron Amber
    '#27ae60', // Persian Emerald Green
    '#8e44ad', // Lapis Amethyst
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 60 + c * cellW;
      const y = 60 + r * cellH;
      const colorIdx = (r * 3 + c * 2 + (r % 2)) % jewelColors.length;

      // Stained glass pane
      ctx.fillStyle = jewelColors[colorIdx];
      ctx.globalAlpha = 0.82;
      ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);

      // Inner bevel / glass gleam
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + cellW - 4, y + 4);
      ctx.lineTo(x + 4, y + cellH - 4);
      ctx.closePath();
      ctx.fill();

      // Delicate wood fretwork star within each pane
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#2b1b11'; // Dark wood mullion
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + cellW / 2, y);
      ctx.lineTo(x + cellW, y + cellH / 2);
      ctx.lineTo(x + cellW / 2, y + cellH);
      ctx.lineTo(x, y + cellH / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  ctx.restore();

  // Outer arch carved wood moulding
  ctx.strokeStyle = '#3e2716';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(60, h - 60);
  ctx.lineTo(60, h * 0.46);
  ctx.quadraticCurveTo(60, h * 0.12, w / 2, 40);
  ctx.quadraticCurveTo(w - 60, h * 0.12, w - 60, h * 0.46);
  ctx.lineTo(w - 60, h - 60);
  ctx.stroke();

  // Gold inlay bead along arch curve
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 5;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// 22. Persian Izareh (Lower Polished Alabaster/Marble Wainscot with Turquoise Tile Relief Border)
export function getPersianIzarehDadoTexture(): THREE.CanvasTexture {
  const cacheKey = 'persian_izareh_dado_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Polished Yazd cream marble plinth ground
  const marbleGrad = ctx.createLinearGradient(0, 0, w, h);
  marbleGrad.addColorStop(0, '#f9f7f2');
  marbleGrad.addColorStop(0.4, '#f2ede2');
  marbleGrad.addColorStop(0.7, '#ede7dc');
  marbleGrad.addColorStop(1, '#f7f4ed');
  ctx.fillStyle = marbleGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle marble veining
  ctx.strokeStyle = 'rgba(180, 168, 150, 0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.bezierCurveTo(300, 250, 600, 180, w, 350);
  ctx.bezierCurveTo(700, 550, 300, 680, 0, 800);
  ctx.stroke();

  // TOP CROWNING FRIEZE: Glazed Persian Turquoise & Gold Relief Band (y: 0 to 140)
  ctx.fillStyle = '#0a2342'; // Cobalt ground
  ctx.fillRect(0, 0, 140, 140);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, 132);

  // Continuous Turquoise floral cresting
  for (let x = 20; x < w; x += 50) {
    ctx.fillStyle = '#00a896';
    ctx.beginPath();
    ctx.arc(x + 25, 70, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(x + 25, 70, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // MIDDLE DADO FIELD: Incised Persian Lozenges with Relief Moldings
  const dadoTop = 160;
  const dadoBottom = h - 60;
  const lozengeW = 160;
  const lozengeH = 220;

  for (let y = dadoTop; y < dadoBottom - 100; y += lozengeH + 30) {
    for (let x = 30; x < w - lozengeW; x += lozengeW + 30) {
      ctx.fillStyle = '#faf8f4';
      ctx.strokeStyle = '#c5bbae';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, lozengeW, lozengeH);

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(x + 10, y + 10, lozengeW - 20, lozengeH - 20);

      ctx.strokeStyle = '#00a896';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x + lozengeW / 2, y + 20);
      ctx.lineTo(x + lozengeW - 20, y + lozengeH / 2);
      ctx.lineTo(x + lozengeW / 2, y + lozengeH - 20);
      ctx.lineTo(x + 20, y + lozengeH / 2);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(x + lozengeW / 2, y + lozengeH / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // BOTTOM BASE SKIRTING (y: h - 60 to h)
  ctx.fillStyle = '#dcd5c7';
  ctx.fillRect(0, h - 60, w, 60);
  ctx.strokeStyle = '#b8ad9b';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, h - 58, w - 4, 56);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// -------------------------------------------------------------
// CONTEMPORARY MASJID LUXURY PALETTE (TRAVERTINE & WALNUT MASHRABIYA)
// Matching user uploaded reference architecture:
// - Cream Honed Travertine Ashlar Masonry
// - Rich Architectural Walnut Timber
// - 12-Point Star Islamic Mashrabiya / Jali Fretwork Screen with Daylighting
// - Floating 3D Sculpted Bronze Arabic Calligraphy with LED Cove Wash
// - Low Recessed Timber Bookshelf Cubbies for Holy Qurans
// - Modern Star-Pierced Brass Wall Sconces
// -------------------------------------------------------------

export function getTravertineAshlarTexture(): THREE.CanvasTexture {
  const cacheKey = 'travertine_ashlar_honed_stone';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base warm limestone / travertine tone
  ctx.fillStyle = '#ece5d9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle organic mineral grain & tonal variation
  const rows = 8;
  const rowH = canvas.height / rows;
  const cols = 4;
  const blockW = canvas.width / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    const xOffset = (r % 2) * (blockW / 2); // Running bond ashlar

    for (let c = -1; c <= cols; c++) {
      const x = c * blockW + xOffset;

      // Slight tone per stone slab
      const shadeDiff = ((r * 17 + c * 29) % 15) - 7;
      const rVal = Math.min(255, Math.max(220, 238 + shadeDiff));
      const gVal = Math.min(255, Math.max(215, 230 + shadeDiff));
      const bVal = Math.min(255, Math.max(200, 218 + shadeDiff));
      ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
      ctx.fillRect(x + 2, y + 2, blockW - 4, rowH - 4);

      // Travertine horizontal micropores and linear bedding
      ctx.strokeStyle = `rgba(180, 168, 150, 0.25)`;
      ctx.lineWidth = 1;
      for (let p = 0; p < 6; p++) {
        const py = y + 10 + Math.random() * (rowH - 20);
        const px = x + 10 + Math.random() * (blockW - 40);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 15 + Math.random() * 30, py + (Math.random() - 0.5) * 2);
        ctx.stroke();
      }

      // Ashlar mortar shadow groove
      ctx.strokeStyle = '#c4baa9';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, blockW, rowH);

      ctx.strokeStyle = '#8f8475';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 1, y + 1, blockW - 2, rowH - 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getWalnutArchitecturalWoodTexture(): THREE.CanvasTexture {
  const cacheKey = 'walnut_architectural_wood';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm rich natural walnut base
  ctx.fillStyle = '#3a2416';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Linear timber grain lines
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * canvas.width;
    const alpha = 0.08 + Math.random() * 0.18;
    const isLight = i % 3 === 0;
    ctx.strokeStyle = isLight ? `rgba(95, 65, 42, ${alpha})` : `rgba(32, 18, 10, ${alpha})`;
    ctx.lineWidth = 1 + Math.random() * 4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(
      x + (Math.random() - 0.5) * 25,
      canvas.height * 0.33,
      x + (Math.random() - 0.5) * 25,
      canvas.height * 0.66,
      x + (Math.random() - 0.5) * 20,
      canvas.height
    );
    ctx.stroke();
  }

  // Subtle wood pores
  ctx.fillStyle = 'rgba(20, 10, 5, 0.12)';
  for (let p = 0; p < 800; p++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 3 + Math.random() * 5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getMashrabiyaScreenTexture(): THREE.CanvasTexture {
  const cacheKey = 'mashrabiya_arched_window_screen';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Translucent glowing daylight background (warm diffused sunlight from reference photo)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#fffbf2');
  bgGrad.addColorStop(0.4, '#faeed9');
  bgGrad.addColorStop(0.8, '#eed8bc');
  bgGrad.addColorStop(1.0, '#ffffff'); // Lower illuminated frosted panel band
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lower frosted window sill illuminated zone (height ~20% from bottom as in reference photo)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(0, canvas.height * 0.78, canvas.width, canvas.height * 0.22);
  ctx.strokeStyle = '#3a2416';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, canvas.height * 0.78, canvas.width, canvas.height * 0.22);

  // 12-Point Star Islamic Geometric Girih Lattice
  const step = 90;
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const draw12PointStar = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    const points = 12;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : r * 0.58;
      const angle = (i * Math.PI) / points;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Secondary inner star ring
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r * 0.45 : r * 0.22;
      const angle = (i * Math.PI) / points + Math.PI / points;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Connecting diagonal cross struts
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      ctx.lineTo(cx - r * Math.cos(angle), cy - r * Math.sin(angle));
      ctx.stroke();
    }
  };

  for (let y = 45; y < canvas.height * 0.78; y += step) {
    for (let x = 45; x < canvas.width; x += step) {
      draw12PointStar(x, y, step * 0.55);
    }
  }

  // Dark timber perimeter frame
  ctx.strokeStyle = '#24140a';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getFloatingBronzeCalligraphyTexture(): THREE.CanvasTexture {
  const cacheKey = 'floating_bronze_arabic_calligraphy_frieze';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Smooth cream honed limestone background
  ctx.fillStyle = '#ece5d9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle stone joint line running horizontally
  ctx.strokeStyle = 'rgba(160, 148, 130, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.85);
  ctx.lineTo(canvas.width, canvas.height * 0.85);
  ctx.stroke();

  // Warm LED cove wash lighting gradient along bottom edge
  const coveGlow = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.4);
  coveGlow.addColorStop(0, 'rgba(255, 230, 170, 0.45)');
  coveGlow.addColorStop(1, 'rgba(255, 230, 170, 0.0)');
  ctx.fillStyle = coveGlow;
  ctx.fillRect(0, canvas.height * 0.35, canvas.width, canvas.height * 0.65);

  // 3D Metallic Bronze Thuluth Arabic Script
  // With soft drop shadow to simulate floating off the wall (as in user's photo)
  ctx.shadowColor = 'rgba(20, 10, 5, 0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 8;

  ctx.font = 'bold 96px "Amiri", "Scheherazade New", "Traditional Arabic", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Metallic Bronze Gradient for the sculpted letters
  const bronzeGrad = ctx.createLinearGradient(0, 80, 0, 360);
  bronzeGrad.addColorStop(0, '#5e432c');
  bronzeGrad.addColorStop(0.3, '#8f6847');
  bronzeGrad.addColorStop(0.6, '#b8895b');
  bronzeGrad.addColorStop(0.85, '#6a4a2f');
  bronzeGrad.addColorStop(1, '#422c1b');
  ctx.fillStyle = bronzeGrad;

  // Text 1 (Long phrase inspired by Quranic Thuluth script from photo)
  const arabicText1 = 'وَمَن تَطَوَّعَ خَيْرًا فَإِنَّ اللَّهَ شَاكِرٌ عَلِيمٌ';
  ctx.fillText(arabicText1, canvas.width * 0.4, canvas.height * 0.45);

  // Text 2 (Divine Names on the right, as seen in user reference photo: "الْمُغْنِي", "الْمَانِعُ")
  ctx.font = 'bold 115px "Amiri", "Scheherazade New", "Traditional Arabic", serif';
  const name1 = 'الْمَانِعُ';
  const name2 = 'الْمُغْنِي';
  ctx.fillText(name1, canvas.width * 0.78, canvas.height * 0.45);
  ctx.fillText(name2, canvas.width * 0.91, canvas.height * 0.45);

  // High-contrast beveled edge highlights on letters
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 225, 175, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.font = 'bold 96px "Amiri", "Scheherazade New", "Traditional Arabic", serif';
  ctx.strokeText(arabicText1, canvas.width * 0.4, canvas.height * 0.45);
  ctx.font = 'bold 115px "Amiri", "Scheherazade New", "Traditional Arabic", serif';
  ctx.strokeText(name1, canvas.width * 0.78, canvas.height * 0.45);
  ctx.strokeText(name2, canvas.width * 0.91, canvas.height * 0.45);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getBookshelfCubbyTexture(): THREE.CanvasTexture {
  const cacheKey = 'quran_bookshelf_cubby_texture';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark walnut cubby background
  ctx.fillStyle = '#2b1b11';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bookshelf wood dividers
  ctx.fillStyle = '#3f281a';
  ctx.fillRect(0, canvas.height - 30, canvas.width, 30); // Bottom shelf
  ctx.fillRect(0, 0, canvas.width, 25); // Top shelf

  // Leather-bound Holy Quran books with gilded Arabic spines
  const bookColors = ['#133827', '#4a1515', '#1a2e40', '#184732', '#361b2b', '#103224'];
  let currentX = 25;

  while (currentX < canvas.width - 40) {
    const bookW = 28 + Math.floor(Math.random() * 18);
    const bookH = canvas.height - 70 - Math.floor(Math.random() * 25);
    const color = bookColors[Math.floor(Math.random() * bookColors.length)];

    ctx.fillStyle = color;
    ctx.fillRect(currentX, canvas.height - 30 - bookH, bookW, bookH);

    // Gold spine bands
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(currentX + 2, canvas.height - 30 - bookH + 20, bookW - 4, 4);
    ctx.fillRect(currentX + 2, canvas.height - 30 - bookH + 32, bookW - 4, 3);
    ctx.fillRect(currentX + 2, canvas.height - 30 - 30, bookW - 4, 4);

    // Gold Arabic medallion on spine
    ctx.beginPath();
    ctx.arc(currentX + bookW / 2, canvas.height - 30 - bookH / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Shadow between books
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(currentX + bookW - 2, canvas.height - 30 - bookH, 2, bookH);

    currentX += bookW + 2;
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getModernBrassSconceTexture(): THREE.CanvasTexture {
  const cacheKey = 'modern_brass_star_sconce';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Brushed brass face plate
  const brassGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  brassGrad.addColorStop(0, '#cda250');
  brassGrad.addColorStop(0.5, '#e4c478');
  brassGrad.addColorStop(1, '#b58b38');
  ctx.fillStyle = brassGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Laser-cut 8-point geometric star perforation
  const drawStar = (cx: number, cy: number, r: number) => {
    ctx.fillStyle = '#fffae8'; // Glowing light core
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const angle = (i * Math.PI) / 8;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4a3311';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  drawStar(canvas.width / 2, canvas.height / 2, 140);
  drawStar(canvas.width / 2, 60, 45);
  drawStar(canvas.width / 2, canvas.height - 60, 45);
  drawStar(60, canvas.height / 2, 45);
  drawStar(canvas.width - 60, canvas.height / 2, 45);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}


