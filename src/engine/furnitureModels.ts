import * as THREE from 'three';
import { FURNITURE_CATALOG } from './catalogData';
import {
  getIslamicCalligraphyFriezeTexture,
  getIslamicGeometricTileTexture,
  getCalligraphyMedallionTexture,
  getMihrabArchPanelTexture,
  getFloatingBronzeCalligraphyTexture,
} from './proceduralTextures';

// Helper to create a Mesh with shadows enabled
function createMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildFurnitureModel(
  modelType: string,
  primaryColor: string,
  secondaryColor?: string,
  customData?: any,
  dimensions?: { width: number; depth: number; height: number }
): THREE.Group {
  const group = new THREE.Group();
  group.name = modelType;

  const primCol = new THREE.Color(primaryColor);
  const secCol = secondaryColor ? new THREE.Color(secondaryColor) : new THREE.Color('#333333');

  const mainMat = new THREE.MeshStandardMaterial({
    color: primCol,
    roughness: 0.65,
    metalness: 0.05,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: secCol,
    roughness: 0.4,
    metalness: 0.2,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.5,
    metalness: 0.05,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    roughness: 0.45,
    metalness: 0.6,
  });

  // Glass material customized by glassTint
  let glassColor = 0xffffff;
  let glassOpacity = 0.45;
  if (customData?.glassTint === 'warm') glassColor = 0xfff2df;
  if (customData?.glassTint === 'cool') glassColor = 0xdff4ff;
  if (customData?.glassTint === 'frosted') {
    glassOpacity = 0.82;
    glassColor = 0xedf3f8;
  }

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    transparent: true,
    opacity: glassOpacity,
    roughness: customData?.glassTint === 'frosted' ? 0.4 : 0.1,
    metalness: 0.1,
    transmission: 0.6,
  });

  switch (modelType) {
    // ----------------------------------------------------
    // LIVING ROOM
    // ----------------------------------------------------
    case 'sectional-l-sofa': {
      // Main linear bench
      const baseMesh = createMesh(new THREE.BoxGeometry(2.8, 0.22, 1.0), mainMat);
      baseMesh.position.set(0, 0.23, 0);
      group.add(baseMesh);

      // Chaise lounge section extending forward
      const chaiseMesh = createMesh(new THREE.BoxGeometry(1.0, 0.22, 0.8), mainMat);
      chaiseMesh.position.set(0.9, 0.23, 0.8);
      group.add(chaiseMesh);

      // Cushions - main
      for (let i = 0; i < 3; i++) {
        const cushion = createMesh(new THREE.BoxGeometry(0.88, 0.18, 0.94), mainMat);
        cushion.position.set(-0.9 + i * 0.9, 0.42, 0.02);
        group.add(cushion);
      }
      // Chaise cushion
      const chaiseCushion = createMesh(new THREE.BoxGeometry(0.96, 0.18, 0.82), mainMat);
      chaiseCushion.position.set(0.9, 0.42, 0.85);
      group.add(chaiseCushion);

      // Backrest
      const backrest = createMesh(new THREE.BoxGeometry(2.8, 0.52, 0.24), mainMat);
      backrest.position.set(0, 0.55, -0.42);
      group.add(backrest);

      // Chaise side armrest / back
      const chaiseArm = createMesh(new THREE.BoxGeometry(0.24, 0.52, 1.8), mainMat);
      chaiseArm.position.set(1.3, 0.55, 0.4);
      group.add(chaiseArm);

      // Left Armrest
      const leftArm = createMesh(new THREE.BoxGeometry(0.24, 0.45, 1.05), mainMat);
      leftArm.position.set(-1.3, 0.5, 0);
      group.add(leftArm);

      // Pillows
      for (let i = 0; i < 3; i++) {
        const pillow = createMesh(new THREE.BoxGeometry(0.65, 0.35, 0.16), secondaryMat);
        pillow.position.set(-0.8 + i * 0.8, 0.55, -0.26);
        pillow.rotation.x = 0.12;
        group.add(pillow);
      }

      // Wooden Legs
      const legPositions = [
        [-1.3, -0.4], [-1.3, 0.4], [0.35, -0.4], [0.35, 0.4],
        [1.3, -0.4], [1.3, 1.15], [0.45, 1.15]
      ];
      legPositions.forEach(([lx, lz]) => {
        const leg = createMesh(new THREE.CylinderGeometry(0.035, 0.02, 0.14, 12), darkWoodMat);
        leg.position.set(lx, 0.07, lz);
        group.add(leg);
      });
      break;
    }

    case 'linear-couch-3seat': {
      // Base
      const base = createMesh(new THREE.BoxGeometry(2.2, 0.22, 0.9), mainMat);
      base.position.set(0, 0.23, 0);
      group.add(base);

      // Seat cushions
      for (let i = 0; i < 3; i++) {
        const seat = createMesh(new THREE.BoxGeometry(0.68, 0.16, 0.84), mainMat);
        seat.position.set(-0.7 + i * 0.7, 0.41, 0.02);
        group.add(seat);
      }

      // Backrest
      const back = createMesh(new THREE.BoxGeometry(2.2, 0.5, 0.22), mainMat);
      back.position.set(0, 0.56, -0.36);
      group.add(back);

      // Armrests
      const armL = createMesh(new THREE.BoxGeometry(0.2, 0.42, 0.92), mainMat);
      armL.position.set(-1.02, 0.48, 0);
      const armR = createMesh(new THREE.BoxGeometry(0.2, 0.42, 0.92), mainMat);
      armR.position.set(1.02, 0.48, 0);
      group.add(armL, armR);

      // Back cushions
      for (let i = 0; i < 3; i++) {
        const backCushion = createMesh(new THREE.BoxGeometry(0.64, 0.36, 0.16), secondaryMat);
        backCushion.position.set(-0.7 + i * 0.7, 0.58, -0.22);
        backCushion.rotation.x = 0.1;
        group.add(backCushion);
      }

      // Legs
      [[-0.95, -0.35], [-0.95, 0.35], [0.95, -0.35], [0.95, 0.35]].forEach(([lx, lz]) => {
        const leg = createMesh(new THREE.CylinderGeometry(0.03, 0.018, 0.14, 12), darkWoodMat);
        leg.position.set(lx, 0.07, lz);
        group.add(leg);
      });
      break;
    }

    case 'lounge-armchair': {
      // Shell
      const seat = createMesh(new THREE.BoxGeometry(0.82, 0.18, 0.8), mainMat);
      seat.position.set(0, 0.28, 0);
      group.add(seat);

      // Curved Backrest
      const back = createMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 24, 1, false, 0, Math.PI), mainMat);
      back.position.set(0, 0.55, -0.05);
      back.rotation.y = Math.PI / 2;
      group.add(back);

      // Plush seat cushion
      const cushion = createMesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24), secondaryMat);
      cushion.position.set(0, 0.42, 0.05);
      group.add(cushion);

      // 4 splayed angled metal legs
      const legAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
      legAngles.forEach((ang) => {
        const lx = Math.cos(ang) * 0.32;
        const lz = Math.sin(ang) * 0.32;
        const leg = createMesh(new THREE.CylinderGeometry(0.02, 0.015, 0.22, 12), blackMetalMat);
        leg.position.set(lx, 0.11, lz);
        leg.rotation.z = Math.cos(ang) * 0.18;
        leg.rotation.x = Math.sin(ang) * 0.18;
        group.add(leg);
      });
      break;
    }

    case 'coffee-table-minimal': {
      // Oval marble top
      const top = createMesh(new THREE.CylinderGeometry(0.65, 0.65, 0.04, 32), mainMat);
      top.scale.set(1.0, 1.0, 0.55);
      top.position.set(0, 0.4, 0);
      group.add(top);

      // Fluted pedestal base
      const pedestal = createMesh(new THREE.CylinderGeometry(0.24, 0.28, 0.36, 24), secondaryMat);
      pedestal.position.set(0, 0.19, 0);
      group.add(pedestal);

      // Base ring
      const basePlate = createMesh(new THREE.CylinderGeometry(0.35, 0.36, 0.02, 32), brassMat);
      basePlate.position.set(0, 0.01, 0);
      group.add(basePlate);
      break;
    }

    case 'media-credenza-tv': {
      // Credenza carcass
      const credenza = createMesh(new THREE.BoxGeometry(2.1, 0.46, 0.45), mainMat);
      credenza.position.set(0, 0.36, 0);
      group.add(credenza);

      // Slatted door panels detail
      for (let i = 0; i < 18; i++) {
        const slat = createMesh(new THREE.BoxGeometry(0.03, 0.4, 0.015), darkWoodMat);
        slat.position.set(-0.95 + i * 0.11, 0.36, 0.23);
        group.add(slat);
      }

      // Credenza brass legs
      [[-0.95, -0.16], [-0.95, 0.16], [0.95, -0.16], [0.95, 0.16], [0, -0.16], [0, 0.16]].forEach(([lx, lz]) => {
        const leg = createMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12), brassMat);
        leg.position.set(lx, 0.07, lz);
        group.add(leg);
      });

      // Floating OLED TV on Wall
      const tvFrame = createMesh(new THREE.BoxGeometry(1.5, 0.88, 0.04), blackMetalMat);
      tvFrame.position.set(0, 1.35, -0.1);
      group.add(tvFrame);

      const tvScreen = createMesh(
        new THREE.PlaneGeometry(1.44, 0.82),
        new THREE.MeshStandardMaterial({
          color: 0x18202e,
          roughness: 0.1,
          metalness: 0.8,
          emissive: 0x050c18,
        })
      );
      tvScreen.position.set(0, 1.35, -0.075);
      group.add(tvScreen);

      // Soundbar
      const soundbar = createMesh(new THREE.BoxGeometry(1.1, 0.06, 0.09), blackMetalMat);
      soundbar.position.set(0, 0.62, 0.05);
      group.add(soundbar);
      break;
    }

    case 'open-bookshelf': {
      // Outer vertical frame
      const frameMat = blackMetalMat;
      const leftPost = createMesh(new THREE.BoxGeometry(0.04, 2.0, 0.36), frameMat);
      leftPost.position.set(-0.58, 1.0, 0);
      const rightPost = createMesh(new THREE.BoxGeometry(0.04, 2.0, 0.36), frameMat);
      rightPost.position.set(0.58, 1.0, 0);
      group.add(leftPost, rightPost);

      // 5 horizontal wooden shelves
      for (let s = 0; s < 5; s++) {
        const shelf = createMesh(new THREE.BoxGeometry(1.18, 0.035, 0.36), mainMat);
        shelf.position.set(0, 0.15 + s * 0.44, 0);
        group.add(shelf);

        // Books on shelf
        const bookGroup = createMesh(
          new THREE.BoxGeometry(0.24, 0.24, 0.2),
          new THREE.MeshStandardMaterial({ color: (s % 2 === 0 ? 0x8b5a2b : 0x2e4057) })
        );
        bookGroup.position.set(-0.35 + (s % 3) * 0.35, 0.15 + s * 0.44 + 0.13, 0);
        group.add(bookGroup);

        // Vase / sculptural object
        if (s % 2 === 1) {
          const vase = createMesh(new THREE.CylinderGeometry(0.05, 0.08, 0.22, 16), brassMat);
          vase.position.set(0.38, 0.15 + s * 0.44 + 0.12, 0);
          group.add(vase);
        }
      }
      break;
    }

    case 'arc-floor-lamp': {
      // Marble base disc
      const base = createMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32), secondaryMat);
      base.position.set(0, 0.02, 0);
      group.add(base);

      // Curved tubular stem (using Torus or curved path)
      const stemArc = createMesh(
        new THREE.TorusGeometry(0.95, 0.018, 16, 48, Math.PI * 0.7),
        brassMat
      );
      stemArc.position.set(0.6, 1.3, 0);
      stemArc.rotation.z = -Math.PI * 0.35;
      group.add(stemArc);

      // Vertical lower stem
      const lowerStem = createMesh(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 12), brassMat);
      lowerStem.position.set(0, 0.65, 0);
      group.add(lowerStem);

      // Hanging dome shade
      const shade = createMesh(
        new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
        brassMat
      );
      shade.position.set(1.25, 1.9, 0);
      shade.rotation.x = Math.PI;
      group.add(shade);

      // Real point light
      const lampLight = new THREE.PointLight(0xffecd1, 0.9, 5);
      lampLight.position.set(1.25, 1.82, 0);
      lampLight.castShadow = true;
      group.add(lampLight);
      break;
    }

    case 'area-rug-woven': {
      // Ground plane rug
      const rug = createMesh(new THREE.BoxGeometry(3.0, 0.02, 2.4), mainMat);
      rug.position.set(0, 0.01, 0);
      group.add(rug);

      // Decorative border frame
      const border = createMesh(new THREE.BoxGeometry(2.8, 0.022, 2.2), secondaryMat);
      border.position.set(0, 0.011, 0);
      group.add(border);
      break;
    }

    // ----------------------------------------------------
    // BEDROOM
    // ----------------------------------------------------
    case 'king-upholstered-bed': {
      // Bed base / platform
      const base = createMesh(new THREE.BoxGeometry(2.05, 0.28, 2.2), darkWoodMat);
      base.position.set(0, 0.14, 0);
      group.add(base);

      // Plush King Mattress
      const mattress = createMesh(new THREE.BoxGeometry(1.95, 0.28, 2.1), mainMat);
      mattress.position.set(0, 0.42, 0.02);
      group.add(mattress);

      // Channel tufted tall headboard
      const headboard = createMesh(new THREE.BoxGeometry(2.15, 1.2, 0.18), mainMat);
      headboard.position.set(0, 0.72, -1.05);
      group.add(headboard);

      // Headboard vertical channels
      for (let i = 0; i < 5; i++) {
        const seam = createMesh(new THREE.BoxGeometry(0.02, 1.15, 0.02), secondaryMat);
        seam.position.set(-0.8 + i * 0.4, 0.72, -0.95);
        group.add(seam);
      }

      // Duvet blanket folded
      const duvet = createMesh(new THREE.BoxGeometry(1.96, 0.08, 1.4), secondaryMat);
      duvet.position.set(0, 0.58, 0.35);
      group.add(duvet);

      // 4 Pillows
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
      [-0.55, 0.55].forEach((px) => {
        const pillow1 = createMesh(new THREE.BoxGeometry(0.68, 0.14, 0.42), pillowMat);
        pillow1.position.set(px, 0.62, -0.75);
        pillow1.rotation.x = 0.2;

        const pillow2 = createMesh(new THREE.BoxGeometry(0.55, 0.12, 0.35), secondaryMat);
        pillow2.position.set(px, 0.65, -0.58);
        pillow2.rotation.x = 0.28;
        group.add(pillow1, pillow2);
      });
      break;
    }

    case 'queen-platform-bed': {
      // Low Japanese oak platform
      const platform = createMesh(new THREE.BoxGeometry(1.85, 0.16, 2.15), mainMat);
      platform.position.set(0, 0.08, 0);
      group.add(platform);

      // Extended side ledges
      const leftLedge = createMesh(new THREE.BoxGeometry(0.25, 0.12, 2.15), mainMat);
      leftLedge.position.set(-1.0, 0.06, 0);
      const rightLedge = createMesh(new THREE.BoxGeometry(0.25, 0.12, 2.15), mainMat);
      rightLedge.position.set(1.0, 0.06, 0);
      group.add(leftLedge, rightLedge);

      // Low minimal headboard
      const headboard = createMesh(new THREE.BoxGeometry(2.1, 0.65, 0.08), mainMat);
      headboard.position.set(0, 0.4, -1.05);
      group.add(headboard);

      // Mattress
      const mattress = createMesh(new THREE.BoxGeometry(1.6, 0.24, 1.95), secondaryMat);
      mattress.position.set(0, 0.26, 0.05);
      group.add(mattress);

      // Minimal white pillows
      const pMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.7 });
      [-0.42, 0.42].forEach((px) => {
        const pillow = createMesh(new THREE.BoxGeometry(0.6, 0.12, 0.38), pMat);
        pillow.position.set(px, 0.44, -0.68);
        pillow.rotation.x = 0.18;
        group.add(pillow);
      });
      break;
    }

    case 'nightstand-lamp': {
      // Nightstand carcass
      const carcass = createMesh(new THREE.BoxGeometry(0.55, 0.45, 0.42), mainMat);
      carcass.position.set(0, 0.38, 0);
      group.add(carcass);

      // Drawer front seam & brass knob
      const drawerLine = createMesh(new THREE.BoxGeometry(0.51, 0.015, 0.02), darkWoodMat);
      drawerLine.position.set(0, 0.38, 0.215);
      const knob = createMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12), brassMat);
      knob.position.set(0, 0.48, 0.22);
      knob.rotation.x = Math.PI / 2;
      group.add(drawerLine, knob);

      // Legs
      [[-0.22, -0.16], [-0.22, 0.16], [0.22, -0.16], [0.22, 0.16]].forEach(([lx, lz]) => {
        const leg = createMesh(new THREE.CylinderGeometry(0.02, 0.015, 0.16, 12), brassMat);
        leg.position.set(lx, 0.08, lz);
        group.add(leg);
      });

      // Globe Reading Lamp
      const lampBase = createMesh(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 16), brassMat);
      lampBase.position.set(0, 0.62, 0);
      const globe = createMesh(
        new THREE.SphereGeometry(0.09, 24, 24),
        new THREE.MeshStandardMaterial({
          color: 0xfffae8,
          emissive: 0xffdf88,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        })
      );
      globe.position.set(0, 0.74, 0);
      group.add(lampBase, globe);

      // Warm local pointlight
      const lampLight = new THREE.PointLight(0xffe6a8, 0.8, 3.5);
      lampLight.position.set(0, 0.75, 0);
      group.add(lampLight);
      break;
    }

    case 'modern-wardrobe': {
      // Main wardrobe body
      const body = createMesh(new THREE.BoxGeometry(1.6, 2.2, 0.62), mainMat);
      body.position.set(0, 1.13, 0);
      group.add(body);

      // 3 Door divisions (vertical recesses)
      for (let d = 0; d < 3; d++) {
        const doorX = -0.53 + d * 0.53;
        const handle = createMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 12), brassMat);
        handle.position.set(doorX + 0.2, 1.1, 0.315);
        group.add(handle);

        if (d < 2) {
          const seam = createMesh(new THREE.BoxGeometry(0.01, 2.18, 0.02), darkWoodMat);
          seam.position.set(doorX + 0.265, 1.13, 0.312);
          group.add(seam);
        }
      }
      break;
    }

    case 'vanity-mirror': {
      // Table top and legs
      const top = createMesh(new THREE.BoxGeometry(1.1, 0.08, 0.48), mainMat);
      top.position.set(0, 0.74, 0);
      group.add(top);

      // 4 Brass legs
      [[-0.5, -0.2], [-0.5, 0.2], [0.5, -0.2], [0.5, 0.2]].forEach(([lx, lz]) => {
        const leg = createMesh(new THREE.CylinderGeometry(0.018, 0.012, 0.7, 12), brassMat);
        leg.position.set(lx, 0.35, lz);
        group.add(leg);
      });

      // Circular LED Halo Mirror
      const mirrorRing = createMesh(new THREE.TorusGeometry(0.34, 0.02, 16, 32), brassMat);
      mirrorRing.position.set(0, 1.18, -0.18);
      const mirrorGlass = createMesh(
        new THREE.CircleGeometry(0.33, 32),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.95,
          roughness: 0.05,
          emissive: 0x333333,
        })
      );
      mirrorGlass.position.set(0, 1.18, -0.178);
      group.add(mirrorRing, mirrorGlass);

      // Velvet Stool
      const stoolSeat = createMesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 24), secondaryMat);
      stoolSeat.position.set(0, 0.44, 0.12);
      const stoolBase = createMesh(new THREE.CylinderGeometry(0.16, 0.18, 0.39, 16), brassMat);
      stoolBase.position.set(0, 0.2, 0.12);
      group.add(stoolSeat, stoolBase);
      break;
    }

    // ----------------------------------------------------
    // DINING & KITCHEN
    // ----------------------------------------------------
    case 'dining-table-wishbone': {
      // Oval live-edge table top
      const tableTop = createMesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 32), mainMat);
      tableTop.scale.set(2.0, 1.0, 1.0);
      tableTop.position.set(0, 0.74, 0);
      group.add(tableTop);

      // Sculptural timber table trestle legs
      [-0.65, 0.65].forEach((tx) => {
        const trestle = createMesh(new THREE.BoxGeometry(0.08, 0.71, 0.65), mainMat);
        trestle.position.set(tx, 0.36, 0);
        group.add(trestle);
      });

      // Centerpiece ceramic bowl
      const bowl = createMesh(new THREE.CylinderGeometry(0.16, 0.08, 0.08, 24), secondaryMat);
      bowl.position.set(0, 0.8, 0);
      group.add(bowl);

      // 4 Wishbone Chairs surrounding table
      const chairPositions = [
        [-0.55, -0.65, 0],
        [0.55, -0.65, 0],
        [-0.55, 0.65, Math.PI],
        [0.55, 0.65, Math.PI],
      ];
      chairPositions.forEach(([cx, cz, crot]) => {
        const chair = new THREE.Group();
        // Woven paper cord seat
        const seat = createMesh(new THREE.BoxGeometry(0.44, 0.04, 0.42), secondaryMat);
        seat.position.set(0, 0.44, 0);
        chair.add(seat);

        // Curved Wishbone backrest rail
        const backRail = createMesh(new THREE.TorusGeometry(0.24, 0.02, 12, 24, Math.PI), mainMat);
        backRail.position.set(0, 0.68, -0.15);
        backRail.rotation.x = Math.PI / 2;
        chair.add(backRail);

        // Legs
        [[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]].forEach(([lx, lz]) => {
          const leg = createMesh(new THREE.CylinderGeometry(0.016, 0.014, 0.44, 12), mainMat);
          leg.position.set(lx, 0.22, lz);
          chair.add(leg);
        });

        chair.position.set(cx, 0, cz);
        chair.rotation.y = crot;
        group.add(chair);
      });
      break;
    }

    case 'kitchen-island-stools': {
      // Marble waterfall top & ends
      const islandTop = createMesh(new THREE.BoxGeometry(2.4, 0.08, 1.0), mainMat);
      islandTop.position.set(0, 0.88, 0);
      const waterfallL = createMesh(new THREE.BoxGeometry(0.08, 0.88, 1.0), mainMat);
      waterfallL.position.set(-1.16, 0.44, 0);
      const waterfallR = createMesh(new THREE.BoxGeometry(0.08, 0.88, 1.0), mainMat);
      waterfallR.position.set(1.16, 0.44, 0);
      group.add(islandTop, waterfallL, waterfallR);

      // Cabinetry recessed carcass inside
      const carcass = createMesh(new THREE.BoxGeometry(2.2, 0.82, 0.65), darkWoodMat);
      carcass.position.set(0, 0.42, -0.14);
      group.add(carcass);

      // Prep undermount sink & faucet on island
      const sink = createMesh(new THREE.BoxGeometry(0.5, 0.02, 0.38), secondaryMat);
      sink.position.set(-0.5, 0.925, -0.1);
      const faucet = createMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.26, 12), brassMat);
      faucet.position.set(-0.5, 1.05, -0.25);
      group.add(sink, faucet);

      // 2 Counter barstools tucked under overhang
      [-0.45, 0.45].forEach((bx) => {
        const stool = new THREE.Group();
        const stoolSeat = createMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24), darkWoodMat);
        stoolSeat.position.set(0, 0.65, 0);
        stool.add(stoolSeat);

        // Slim steel legs
        const sLegAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
        sLegAngles.forEach((ang) => {
          const leg = createMesh(new THREE.CylinderGeometry(0.012, 0.01, 0.64, 8), blackMetalMat);
          leg.position.set(Math.cos(ang) * 0.14, 0.32, Math.sin(ang) * 0.14);
          stool.add(leg);
        });

        stool.position.set(bx, 0, 0.38);
        group.add(stool);
      });
      break;
    }

    case 'sink-cabinet': {
      // Cabinet box
      const cabinet = createMesh(new THREE.BoxGeometry(1.6, 0.88, 0.65), mainMat);
      cabinet.position.set(0, 0.44, 0);
      group.add(cabinet);

      // Countertop
      const counter = createMesh(new THREE.BoxGeometry(1.64, 0.05, 0.68), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 }));
      counter.position.set(0, 0.89, 0);
      group.add(counter);

      // Stainless sink basin
      const sinkBasin = createMesh(new THREE.BoxGeometry(0.7, 0.01, 0.45), secondaryMat);
      sinkBasin.position.set(0, 0.92, 0);
      group.add(sinkBasin);

      // High-arch gooseneck faucet
      const faucetBase = createMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12), brassMat);
      faucetBase.position.set(0, 1.02, -0.16);
      const faucetArch = createMesh(new THREE.TorusGeometry(0.08, 0.015, 12, 24, Math.PI), brassMat);
      faucetArch.position.set(0, 1.13, -0.16);
      group.add(faucetBase, faucetArch);

      // Brass door pulls
      [-0.38, 0.38].forEach((px) => {
        const pull = createMesh(new THREE.BoxGeometry(0.015, 0.18, 0.02), brassMat);
        pull.position.set(px, 0.55, 0.33);
        group.add(pull);
      });
      break;
    }

    case 'refrigerator-french': {
      // Fridge body
      const fridge = createMesh(new THREE.BoxGeometry(0.95, 1.85, 0.75), mainMat);
      fridge.position.set(0, 0.925, 0);
      group.add(fridge);

      // Door seam
      const doorSeam = createMesh(new THREE.BoxGeometry(0.008, 1.1, 0.02), blackMetalMat);
      doorSeam.position.set(0, 1.25, 0.38);
      group.add(doorSeam);

      // Lower freezer drawer seam
      const freezerSeam = createMesh(new THREE.BoxGeometry(0.93, 0.01, 0.02), blackMetalMat);
      freezerSeam.position.set(0, 0.68, 0.38);
      group.add(freezerSeam);

      // Vertical handles
      [-0.06, 0.06].forEach((hx) => {
        const handle = createMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 12), secondaryMat);
        handle.position.set(hx, 1.25, 0.41);
        group.add(handle);
      });
      break;
    }

    // ----------------------------------------------------
    // OFFICE & STUDY
    // ----------------------------------------------------
    case 'executive-desk-laptop': {
      // Thick executive desktop
      const deskTop = createMesh(new THREE.BoxGeometry(1.7, 0.06, 0.8), mainMat);
      deskTop.position.set(0, 0.72, 0);
      group.add(deskTop);

      // Side waterfall / leg panels
      [-0.78, 0.78].forEach((lx) => {
        const leg = createMesh(new THREE.BoxGeometry(0.06, 0.69, 0.78), mainMat);
        leg.position.set(lx, 0.345, 0);
        group.add(leg);
      });

      // Modesty modesty panel
      const modesty = createMesh(new THREE.BoxGeometry(1.5, 0.45, 0.02), mainMat);
      modesty.position.set(0, 0.45, -0.32);
      group.add(modesty);

      // Leather blotter desk pad
      const pad = createMesh(
        new THREE.BoxGeometry(0.75, 0.008, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
      );
      pad.position.set(0, 0.754, 0.08);
      group.add(pad);

      // Modern slim laptop
      const laptopBase = createMesh(new THREE.BoxGeometry(0.32, 0.01, 0.22), secondaryMat);
      laptopBase.position.set(0, 0.76, 0.08);
      const laptopScreen = createMesh(new THREE.BoxGeometry(0.32, 0.2, 0.008), secondaryMat);
      laptopScreen.position.set(0, 0.86, -0.02);
      laptopScreen.rotation.x = -0.15;
      group.add(laptopBase, laptopScreen);
      break;
    }

    case 'swivel-chair-mesh': {
      // 5-Star castor base
      const baseHub = createMesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 16), blackMetalMat);
      baseHub.position.set(0, 0.08, 0);
      group.add(baseHub);

      // 5 Base prongs with castors
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const arm = createMesh(new THREE.BoxGeometry(0.3, 0.02, 0.04), blackMetalMat);
        arm.position.set(Math.cos(ang) * 0.16, 0.06, Math.sin(ang) * 0.16);
        arm.rotation.y = -ang;
        group.add(arm);
      }

      // Gas lift cylinder
      const cylinder = createMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12), secondaryMat);
      cylinder.position.set(0, 0.26, 0);
      group.add(cylinder);

      // Contoured seat cushion
      const seat = createMesh(new THREE.BoxGeometry(0.5, 0.08, 0.48), mainMat);
      seat.position.set(0, 0.46, 0);
      group.add(seat);

      // Mesh Backrest
      const back = createMesh(new THREE.BoxGeometry(0.46, 0.54, 0.04), mainMat);
      back.position.set(0, 0.75, -0.22);
      back.rotation.x = 0.08;
      group.add(back);

      // Adjustable Armrests
      [-0.26, 0.26].forEach((ax) => {
        const armrest = createMesh(new THREE.BoxGeometry(0.06, 0.025, 0.24), blackMetalMat);
        armrest.position.set(ax, 0.65, 0.02);
        const armPillar = createMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), blackMetalMat);
        armPillar.position.set(ax, 0.54, 0.02);
        group.add(armrest, armPillar);
      });
      break;
    }

    case 'low-credenza': {
      // Credenza box
      const box = createMesh(new THREE.BoxGeometry(1.5, 0.55, 0.45), mainMat);
      box.position.set(0, 0.39, 0);
      group.add(box);

      // Legs
      [[-0.68, -0.18], [-0.68, 0.18], [0.68, -0.18], [0.68, 0.18]].forEach(([lx, lz]) => {
        const leg = createMesh(new THREE.CylinderGeometry(0.02, 0.015, 0.12, 12), blackMetalMat);
        leg.position.set(lx, 0.06, lz);
        group.add(leg);
      });

      // 3 Door panels
      for (let i = 0; i < 3; i++) {
        const panel = createMesh(new THREE.BoxGeometry(0.46, 0.5, 0.015), secondaryMat);
        panel.position.set(-0.48 + i * 0.48, 0.39, 0.23);
        group.add(panel);
      }
      break;
    }

    // ----------------------------------------------------
    // DECOR & ARCHITECTURAL
    // ----------------------------------------------------
    case 'potted-monstera': {
      // Ribbed ceramic pot
      const pot = createMesh(new THREE.CylinderGeometry(0.2, 0.16, 0.38, 24), secondaryMat);
      pot.position.set(0, 0.19, 0);
      group.add(pot);

      // Soil
      const soil = createMesh(
        new THREE.CylinderGeometry(0.19, 0.19, 0.03, 24),
        new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
      );
      soil.position.set(0, 0.36, 0);
      group.add(soil);

      // Foliage stems and monstera leaves
      const foliageMat = mainMat;
      const leafAngles = [0, 1.2, 2.3, 3.5, 4.7, 5.8];
      leafAngles.forEach((ang, idx) => {
        const leafStem = createMesh(new THREE.CylinderGeometry(0.008, 0.01, 0.65, 8), foliageMat);
        const lx = Math.cos(ang) * 0.12;
        const lz = Math.sin(ang) * 0.12;
        leafStem.position.set(lx, 0.65 + idx * 0.04, lz);
        leafStem.rotation.z = Math.cos(ang) * 0.4;
        leafStem.rotation.x = Math.sin(ang) * 0.4;
        group.add(leafStem);

        // Broad heart/split leaf blade
        const leafBlade = createMesh(new THREE.CircleGeometry(0.18, 16), foliageMat);
        leafBlade.position.set(Math.cos(ang) * 0.32, 0.92 + idx * 0.04, Math.sin(ang) * 0.32);
        leafBlade.rotation.x = -Math.PI * 0.35;
        leafBlade.rotation.y = ang;
        group.add(leafBlade);
      });
      break;
    }

    case 'fiddle-leaf-fig': {
      // Seagrass basket
      const basket = createMesh(new THREE.CylinderGeometry(0.24, 0.22, 0.46, 20), secondaryMat);
      basket.position.set(0, 0.23, 0);
      group.add(basket);

      // Trunk
      const trunk = createMesh(new THREE.CylinderGeometry(0.03, 0.04, 1.4, 12), darkWoodMat);
      trunk.position.set(0, 0.9, 0);
      group.add(trunk);

      // Tiered large violin leaves
      const fMat = mainMat;
      for (let i = 0; i < 12; i++) {
        const ang = i * 1.9;
        const yPos = 0.7 + i * 0.09;
        const leaf = createMesh(new THREE.BoxGeometry(0.26, 0.01, 0.38), fMat);
        leaf.position.set(Math.cos(ang) * 0.25, yPos, Math.sin(ang) * 0.25);
        leaf.rotation.y = -ang;
        leaf.rotation.x = 0.25;
        group.add(leaf);
      }
      break;
    }

    case 'abstract-gallery-canvas': {
      // Natural oak floating frame
      const frame = createMesh(new THREE.BoxGeometry(1.4, 1.0, 0.06), secondaryMat);
      group.add(frame);

      // Canvas surface with subtle procedural art texture
      const canvasMesh = createMesh(
        new THREE.PlaneGeometry(1.32, 0.92),
        new THREE.MeshStandardMaterial({
          color: primCol,
          roughness: 0.8,
          metalness: 0.0,
        })
      );
      canvasMesh.position.set(0, 0, 0.032);
      group.add(canvasMesh);
      break;
    }

    case 'halo-ring-chandelier': {
      // Ceiling canopy plate
      const canopy = createMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24), brassMat);
      canopy.position.set(0, 0.3, 0);
      group.add(canopy);

      // Suspension wire cords
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        const wire = createMesh(new THREE.CylinderGeometry(0.003, 0.003, 0.6, 6), blackMetalMat);
        wire.position.set(Math.cos(ang) * 0.25, 0.0, Math.sin(ang) * 0.25);
        group.add(wire);
      }

      // Large illuminated brass halo ring
      const outerRing = createMesh(new THREE.TorusGeometry(0.48, 0.025, 16, 48), brassMat);
      outerRing.rotation.x = Math.PI / 2;
      outerRing.position.set(0, -0.3, 0);
      group.add(outerRing);

      // Inner glowing ring
      const innerRing = createMesh(
        new THREE.TorusGeometry(0.32, 0.02, 16, 48),
        new THREE.MeshStandardMaterial({
          color: 0xfffae0,
          emissive: 0xffdf80,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        })
      );
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.set(0, -0.22, 0);
      group.add(innerRing);

      // Soft downward pointlight
      const chandelierLight = new THREE.PointLight(0xfff1d6, 1.2, 7);
      chandelierLight.position.set(0, -0.35, 0);
      chandelierLight.castShadow = true;
      group.add(chandelierLight);
      break;
    }

    case 'soaking-bathtub': {
      // Outer oval sculptural tub
      const tub = createMesh(new THREE.CylinderGeometry(0.85, 0.72, 0.58, 32), mainMat);
      tub.scale.set(1.0, 1.0, 0.52);
      tub.position.set(0, 0.29, 0);
      group.add(tub);

      // Chrome floor-mounted faucet pillar
      const faucetPillar = createMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 12), secondaryMat);
      faucetPillar.position.set(0, 0.42, 0.52);
      const faucetSpout = createMesh(new THREE.BoxGeometry(0.03, 0.03, 0.2), secondaryMat);
      faucetSpout.position.set(0, 0.82, 0.44);
      group.add(faucetPillar, faucetSpout);
      break;
    }

    case 'picture-window': {
      const w = dimensions?.width || 2.2;
      const h = dimensions?.height || 2.0;
      const frameThick = 0.08;
      const depth = 0.12;

      // Outer Frame
      const frame = createMesh(new THREE.BoxGeometry(w, h, depth), mainMat);
      group.add(frame);

      // Glass Pane
      const glass = createMesh(new THREE.BoxGeometry(w - frameThick * 2, h - frameThick * 2, 0.02), glassMat);
      glass.position.set(0, 0, 0);
      group.add(glass);

      // Mullions
      const grid = customData?.mullionGrid || '2x2';
      if (grid === '2x2' || grid === '4x2') {
        const vBar = createMesh(new THREE.BoxGeometry(0.025, h - frameThick * 2, 0.035), mainMat);
        group.add(vBar);
      }
      if (grid === '4x2') {
        const vBarL = createMesh(new THREE.BoxGeometry(0.025, h - frameThick * 2, 0.035), mainMat);
        vBarL.position.x = -w * 0.25;
        const vBarR = createMesh(new THREE.BoxGeometry(0.025, h - frameThick * 2, 0.035), mainMat);
        vBarR.position.x = w * 0.25;
        group.add(vBarL, vBarR);
      }
      if (grid === '3x3') {
        for (let i = -1; i <= 1; i += 2) {
          const v = createMesh(new THREE.BoxGeometry(0.025, h - frameThick * 2, 0.035), mainMat);
          v.position.x = i * (w * 0.28);
          const horiz = createMesh(new THREE.BoxGeometry(w - frameThick * 2, 0.025, 0.035), mainMat);
          horiz.position.y = i * (h * 0.28);
          group.add(v, horiz);
        }
      } else if (grid !== 'none') {
        const hBar = createMesh(new THREE.BoxGeometry(w - frameThick * 2, 0.025, 0.035), mainMat);
        group.add(hBar);
      }

      // Outdoor scenery backdrop plane
      let backdropColor = 0x90c4e8;
      if (customData?.outdoorBackdrop === 'garden') backdropColor = 0x5a8a5b;
      if (customData?.outdoorBackdrop === 'city') backdropColor = 0xb3cbe0;
      if (customData?.outdoorBackdrop === 'mountains') backdropColor = 0x768fa5;

      const backdrop = createMesh(
        new THREE.PlaneGeometry(w * 1.3, h * 1.3),
        new THREE.MeshBasicMaterial({
          color: backdropColor,
          side: THREE.DoubleSide,
        })
      );
      backdrop.position.set(0, 0, -0.22);
      group.add(backdrop);
      break;
    }

    case 'casement-window': {
      const w = dimensions?.width || 1.6;
      const h = dimensions?.height || 1.4;
      const halfW = (w - 0.12) / 2;

      // Outer window box & sill
      const outerFrame = createMesh(new THREE.BoxGeometry(w, h, 0.1), secondaryMat);
      const sill = createMesh(new THREE.BoxGeometry(w + 0.12, 0.05, 0.18), secondaryMat);
      sill.position.set(0, -h / 2, 0.04);
      group.add(outerFrame, sill);

      // Two casement sashes (left & right)
      [-1, 1].forEach((dir) => {
        const sash = new THREE.Group();
        sash.position.set(dir * (halfW / 2 + 0.02), 0, 0);

        const sashFrame = createMesh(new THREE.BoxGeometry(halfW - 0.02, h - 0.1, 0.04), mainMat);
        const sashGlass = createMesh(new THREE.BoxGeometry(halfW - 0.1, h - 0.18, 0.015), glassMat);
        const sashHBar = createMesh(new THREE.BoxGeometry(halfW - 0.1, 0.02, 0.02), mainMat);
        const sashVBar = createMesh(new THREE.BoxGeometry(0.02, h - 0.18, 0.02), mainMat);

        const latch = createMesh(new THREE.BoxGeometry(0.02, 0.06, 0.04), brassMat);
        latch.position.set(-dir * (halfW * 0.35), 0, 0.03);

        sash.add(sashFrame, sashGlass, sashHBar, sashVBar, latch);
        group.add(sash);
      });
      break;
    }

    case 'panoramic-glass-window': {
      const w = dimensions?.width || 3.6;
      const h = dimensions?.height || 2.6;

      const topRail = createMesh(new THREE.BoxGeometry(w, 0.05, 0.08), blackMetalMat);
      topRail.position.y = h / 2;
      const botRail = createMesh(new THREE.BoxGeometry(w, 0.05, 0.08), blackMetalMat);
      botRail.position.y = -h / 2;
      const lRail = createMesh(new THREE.BoxGeometry(0.05, h, 0.08), blackMetalMat);
      lRail.position.x = -w / 2;
      const rRail = createMesh(new THREE.BoxGeometry(0.05, h, 0.08), blackMetalMat);
      rRail.position.x = w / 2;
      group.add(topRail, botRail, lRail, rRail);

      // Giant architectural glass wall
      const glass = createMesh(new THREE.BoxGeometry(w - 0.06, h - 0.06, 0.02), glassMat);
      group.add(glass);

      // Two subtle vertical division joints
      [-w * 0.28, w * 0.28].forEach((x) => {
        const mullion = createMesh(new THREE.BoxGeometry(0.03, h, 0.04), blackMetalMat);
        mullion.position.x = x;
        group.add(mullion);
      });

      // Horizon backdrop
      const backdrop = createMesh(
        new THREE.PlaneGeometry(w * 1.25, h * 1.25),
        new THREE.MeshBasicMaterial({ color: 0x82b8dd, side: THREE.DoubleSide })
      );
      backdrop.position.set(0, 0, -0.2);
      group.add(backdrop);
      break;
    }

    case 'arched-window': {
      const w = dimensions?.width || 1.4;
      const h = dimensions?.height || 2.2;
      const rectH = h - w / 2;

      // Lower rectangular frame
      const lowerFrame = createMesh(new THREE.BoxGeometry(w, rectH, 0.1), mainMat);
      lowerFrame.position.y = -w / 4;
      const lowerGlass = createMesh(new THREE.BoxGeometry(w - 0.1, rectH - 0.08, 0.02), glassMat);
      lowerGlass.position.y = -w / 4;
      group.add(lowerFrame, lowerGlass);

      // Semi-circular arch top
      const archGlass = createMesh(new THREE.CylinderGeometry(w / 2 - 0.05, w / 2 - 0.05, 0.02, 32, 1, false, 0, Math.PI), glassMat);
      archGlass.rotation.z = Math.PI / 2;
      archGlass.rotation.y = Math.PI / 2;
      archGlass.position.y = rectH / 2;
      group.add(archGlass);

      // Fanlight mullions
      const hDivider = createMesh(new THREE.BoxGeometry(w - 0.08, 0.03, 0.03), mainMat);
      hDivider.position.y = rectH / 2;
      const vDivider = createMesh(new THREE.BoxGeometry(0.025, rectH - 0.08, 0.03), mainMat);
      vDivider.position.y = -w / 4;
      group.add(hDivider, vDivider);
      break;
    }

    case 'clerestory-window': {
      const w = dimensions?.width || 3.0;
      const h = dimensions?.height || 0.65;
      const frame = createMesh(new THREE.BoxGeometry(w, h, 0.08), blackMetalMat);
      const glass = createMesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.02), glassMat);
      group.add(frame, glass);

      // Triple horizontal panes
      [-w * 0.28, w * 0.28].forEach((x) => {
        const v = createMesh(new THREE.BoxGeometry(0.025, h - 0.08, 0.03), blackMetalMat);
        v.position.x = x;
        group.add(v);
      });
      break;
    }

    case 'interior-door': {
      const w = dimensions?.width || 0.95;
      const h = dimensions?.height || 2.15;
      const frameThick = 0.06;

      // Door Jamb Casing
      const frameL = createMesh(new THREE.BoxGeometry(frameThick, h, 0.12), secondaryMat);
      frameL.position.set(-w / 2 + frameThick / 2, h / 2, 0);
      const frameR = createMesh(new THREE.BoxGeometry(frameThick, h, 0.12), secondaryMat);
      frameR.position.set(w / 2 - frameThick / 2, h / 2, 0);
      const frameTop = createMesh(new THREE.BoxGeometry(w, frameThick, 0.12), secondaryMat);
      frameTop.position.set(0, h - frameThick / 2, 0);
      group.add(frameL, frameR, frameTop);

      // Hinged Door Leaf (rotates around hinge)
      const doorPivot = new THREE.Group();
      doorPivot.position.set(-w / 2 + frameThick, 0, 0);

      const leafW = w - frameThick * 2;
      const leafH = h - frameThick - 0.02;
      const doorLeaf = createMesh(new THREE.BoxGeometry(leafW, leafH, 0.045), mainMat);
      doorLeaf.position.set(leafW / 2, leafH / 2, 0);
      doorPivot.add(doorLeaf);

      // Handle hardware (brass, black, or chrome)
      const handleMat = customData?.handleFinish === 'black' ? blackMetalMat : brassMat;
      const rosette = createMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16), handleMat);
      rosette.rotation.x = Math.PI / 2;
      rosette.position.set(leafW - 0.08, 1.0, 0.03);
      const lever = createMesh(new THREE.BoxGeometry(0.12, 0.02, 0.025), handleMat);
      lever.position.set(leafW - 0.04, 1.0, 0.045);
      doorPivot.add(rosette, lever);

      // Swing angle (0 closed, up to 90 degrees open)
      const openAngleDeg = customData?.openAngle !== undefined ? customData.openAngle : 20;
      doorPivot.rotation.y = (openAngleDeg * Math.PI) / 180;

      group.add(doorPivot);
      break;
    }

    case 'french-double-door': {
      const w = dimensions?.width || 1.8;
      const h = dimensions?.height || 2.2;
      const frameThick = 0.06;
      const leafW = (w - frameThick * 2) / 2;
      const leafH = h - frameThick;

      // Outer frame
      const frameL = createMesh(new THREE.BoxGeometry(frameThick, h, 0.12), secondaryMat);
      frameL.position.set(-w / 2 + frameThick / 2, h / 2, 0);
      const frameR = createMesh(new THREE.BoxGeometry(frameThick, h, 0.12), secondaryMat);
      frameR.position.set(w / 2 - frameThick / 2, h / 2, 0);
      const frameTop = createMesh(new THREE.BoxGeometry(w, frameThick, 0.12), secondaryMat);
      frameTop.position.set(0, h - frameThick / 2, 0);
      group.add(frameL, frameR, frameTop);

      // Left & Right French Doors with Glass Panes
      const openAngle = ((customData?.openAngle || 15) * Math.PI) / 180;

      // Left leaf
      const pLeft = new THREE.Group();
      pLeft.position.set(-w / 2 + frameThick, 0, 0);
      pLeft.rotation.y = openAngle;

      const lDoor = createMesh(new THREE.BoxGeometry(leafW, leafH, 0.045), mainMat);
      lDoor.position.set(leafW / 2, leafH / 2, 0);
      const lGlass = createMesh(new THREE.BoxGeometry(leafW - 0.14, leafH - 0.2, 0.015), glassMat);
      lGlass.position.set(leafW / 2, leafH / 2, 0);
      const lHandle = createMesh(new THREE.BoxGeometry(0.02, 0.16, 0.03), brassMat);
      lHandle.position.set(leafW - 0.06, 1.0, 0.035);
      pLeft.add(lDoor, lGlass, lHandle);

      // Right leaf
      const pRight = new THREE.Group();
      pRight.position.set(w / 2 - frameThick, 0, 0);
      pRight.rotation.y = -openAngle;

      const rDoor = createMesh(new THREE.BoxGeometry(leafW, leafH, 0.045), mainMat);
      rDoor.position.set(-leafW / 2, leafH / 2, 0);
      const rGlass = createMesh(new THREE.BoxGeometry(leafW - 0.14, leafH - 0.2, 0.015), glassMat);
      rGlass.position.set(-leafW / 2, leafH / 2, 0);
      const rHandle = createMesh(new THREE.BoxGeometry(0.02, 0.16, 0.03), brassMat);
      rHandle.position.set(-leafW + 0.06, 1.0, 0.035);
      pRight.add(rDoor, rGlass, rHandle);

      group.add(pLeft, pRight);
      break;
    }

    case 'sliding-barn-door': {
      const w = dimensions?.width || 1.1;
      const h = dimensions?.height || 2.2;

      // Heavy black steel top track rail
      const track = createMesh(new THREE.BoxGeometry(w * 1.9, 0.04, 0.03), blackMetalMat);
      track.position.set(w * 0.35, h + 0.08, 0.06);
      group.add(track);

      // Rollers / hangers
      [-0.35, 0.35].forEach((offset) => {
        const hanger = createMesh(new THREE.BoxGeometry(0.03, 0.18, 0.015), blackMetalMat);
        hanger.position.set(offset, h + 0.06, 0.075);
        const wheel = createMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), blackMetalMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(offset, h + 0.12, 0.075);
        group.add(hanger, wheel);
      });

      // Wooden door slab
      const slab = createMesh(new THREE.BoxGeometry(w, h, 0.045), mainMat);
      slab.position.set(0, h / 2, 0.045);
      group.add(slab);

      // Slanted Z or X barn door cross bracing
      const braceTop = createMesh(new THREE.BoxGeometry(w - 0.1, 0.12, 0.01), secondaryMat);
      braceTop.position.set(0, h - 0.15, 0.07);
      const braceBot = createMesh(new THREE.BoxGeometry(w - 0.1, 0.12, 0.01), secondaryMat);
      braceBot.position.set(0, 0.15, 0.07);
      const handle = createMesh(new THREE.BoxGeometry(0.03, 0.28, 0.04), blackMetalMat);
      handle.position.set(w * 0.38, 1.0, 0.08);
      group.add(braceTop, braceBot, handle);
      break;
    }

    case 'pivot-door': {
      const w = dimensions?.width || 1.4;
      const h = dimensions?.height || 2.4;

      // Outer pivot frame
      const frame = createMesh(new THREE.BoxGeometry(w, h, 0.14), blackMetalMat);
      frame.position.y = h / 2;
      group.add(frame);

      // Pivot door slab hinged at 20% offset
      const pivotAxis = new THREE.Group();
      pivotAxis.position.set(-w * 0.3, 0, 0);

      const slab = createMesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.06), mainMat);
      slab.position.set(w * 0.3, h / 2, 0);
      pivotAxis.add(slab);

      // Grand vertical bar handle
      const barHandle = createMesh(new THREE.CylinderGeometry(0.018, 0.018, 1.2, 16), brassMat);
      barHandle.position.set(w * 0.65, 1.1, 0.06);
      pivotAxis.add(barHandle);

      const openDeg = customData?.openAngle || 25;
      pivotAxis.rotation.y = (openDeg * Math.PI) / 180;

      group.add(pivotAxis);
      break;
    }

    case 'fluted-wood-divider': {
      const w = dimensions?.width || 1.6;
      const h = dimensions?.height || 2.6;
      const slatCount = 14;
      const slatW = 0.04;
      const slatD = 0.06;
      const spacing = w / (slatCount - 1);

      // Top and bottom mounting rails
      const topRail = createMesh(new THREE.BoxGeometry(w + 0.1, 0.04, 0.08), darkWoodMat);
      topRail.position.y = h;
      const botRail = createMesh(new THREE.BoxGeometry(w + 0.1, 0.04, 0.08), darkWoodMat);
      botRail.position.y = 0.02;
      group.add(topRail, botRail);

      // Vertical fluted slats
      for (let i = 0; i < slatCount; i++) {
        const slat = createMesh(new THREE.BoxGeometry(slatW, h - 0.04, slatD), mainMat);
        slat.position.set(-w / 2 + i * spacing, h / 2, 0);
        group.add(slat);
      }
      break;
    }

    case 'glass-steel-partition': {
      const w = dimensions?.width || 2.4;
      const h = dimensions?.height || 2.6;

      // Steel grid frame
      const frame = createMesh(new THREE.BoxGeometry(w, h, 0.06), blackMetalMat);
      frame.position.y = h / 2;
      group.add(frame);

      // Glass inserts
      const glass = createMesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.015), glassMat);
      glass.position.y = h / 2;
      group.add(glass);

      // Mullions (3 columns, 4 rows)
      [-w * 0.25, 0, w * 0.25].forEach((x) => {
        const vBar = createMesh(new THREE.BoxGeometry(0.025, h - 0.08, 0.03), blackMetalMat);
        vBar.position.set(x, h / 2, 0);
        group.add(vBar);
      });
      [0.6, 1.2, 1.8].forEach((y) => {
        const hBar = createMesh(new THREE.BoxGeometry(w - 0.08, 0.025, 0.03), blackMetalMat);
        hBar.position.set(0, y, 0);
        group.add(hBar);
      });
      break;
    }

    case 'pony-wall': {
      const w = dimensions?.width || 2.0;
      const h = dimensions?.height || 1.1;
      const d = dimensions?.depth || 0.16;

      const wall = createMesh(new THREE.BoxGeometry(w, h, d), mainMat);
      wall.position.y = h / 2;
      const woodCap = createMesh(new THREE.BoxGeometry(w + 0.06, 0.035, d + 0.04), secondaryMat);
      woodCap.position.y = h + 0.0175;
      group.add(wall, woodCap);
      break;
    }

    case 'drywall-partition': {
      const w = dimensions?.width || 2.0;
      const h = dimensions?.height || 2.6;
      const d = dimensions?.depth || 0.12;

      // Solid architectural drywall stud wall
      const wall = createMesh(new THREE.BoxGeometry(w, h, d), mainMat);
      wall.position.y = h / 2;

      // Baseboard trim on both sides
      const baseboard = createMesh(new THREE.BoxGeometry(w + 0.02, 0.08, d + 0.02), secondaryMat);
      baseboard.position.y = 0.04;

      group.add(wall, baseboard);
      break;
    }

    case 'custom-masonry-wall':
    case 'custom-wall': {
      const w = dimensions?.width || 3.0;
      const h = dimensions?.height || 5.79;
      const d = dimensions?.depth || 0.23;

      // Solid architectural masonry wall
      const wall = createMesh(new THREE.BoxGeometry(w, h, d), mainMat);
      wall.position.y = h / 2;

      // Baseboard trim at bottom
      const baseboard = createMesh(new THREE.BoxGeometry(w + 0.01, 0.12, d + 0.02), secondaryMat);
      baseboard.position.y = 0.06;

      // Wall top coping/trim
      const topCap = createMesh(new THREE.BoxGeometry(w + 0.02, 0.06, d + 0.03), secondaryMat);
      topCap.position.y = h - 0.03;

      group.add(wall, baseboard, topCap);
      break;
    }

    case 'modern-linear-fireplace': {
      const w = dimensions?.width || 2.2;
      const h = dimensions?.height || 1.2;
      const d = dimensions?.depth || 0.35;

      // Chimney breast structure
      const surround = createMesh(new THREE.BoxGeometry(w, h, d), mainMat);
      surround.position.y = h / 2;
      group.add(surround);

      // Recessed firebox cavity
      const cavity = createMesh(
        new THREE.BoxGeometry(w * 0.72, h * 0.38, d * 0.6),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
      );
      cavity.position.set(0, h * 0.42, d * 0.22);
      group.add(cavity);

      // Glowing flame bed
      const flameBed = createMesh(
        new THREE.BoxGeometry(w * 0.65, 0.06, d * 0.3),
        new THREE.MeshBasicMaterial({ color: 0xff6600 })
      );
      flameBed.position.set(0, h * 0.28, d * 0.25);
      group.add(flameBed);

      // Floating mantle shelf
      const mantle = createMesh(new THREE.BoxGeometry(w + 0.1, 0.08, d + 0.08), darkWoodMat);
      mantle.position.set(0, h * 0.72, 0.04);
      group.add(mantle);

      // Warm fireplace ambient glow light
      const fireLight = new THREE.PointLight(0xff7722, 1.8, 4.5);
      fireLight.position.set(0, h * 0.35, d * 0.4);
      group.add(fireLight);
      break;
    }

    case 'architectural-pillar': {
      const dia = dimensions?.width || 0.35;
      const h = dimensions?.height || 2.8;

      // Round structural column shaft
      const shaft = createMesh(new THREE.CylinderGeometry(dia / 2, dia / 2, h - 0.16, 32), mainMat);
      shaft.position.y = h / 2;

      // Base plinth
      const base = createMesh(new THREE.BoxGeometry(dia + 0.1, 0.08, dia + 0.1), secondaryMat);
      base.position.y = 0.04;

      // Capital header
      const capital = createMesh(new THREE.BoxGeometry(dia + 0.1, 0.08, dia + 0.1), secondaryMat);
      capital.position.y = h - 0.04;

      group.add(shaft, base, capital);
      break;
    }

    case 'architectural-ceiling-beam': {
      const len = dimensions?.width || 6.0;
      const beamW = 0.18;
      const beamH = 0.24;

      const beam = createMesh(new THREE.BoxGeometry(len, beamH, beamW), darkWoodMat);
      beam.position.y = 0;
      group.add(beam);
      break;
    }

    // ----------------------------------------------------
    // MASJID & ISLAMIC ARCHITECTURAL ELEMENTS
    // ----------------------------------------------------
    case 'masjid-minbar': {
      // Traditional stepped wooden Islamic pulpit with canopy & carved balustrades
      const w = dimensions?.width || 1.1;
      const d = dimensions?.depth || 2.2;
      const h = dimensions?.height || 3.4;

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2c16, roughness: 0.45 });
      const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.8 });
      const stepMat = new THREE.MeshStandardMaterial({ color: 0x5c381c, roughness: 0.4 });

      // Base plinth
      const plinth = createMesh(new THREE.BoxGeometry(w, 0.1, d), woodMat);
      plinth.position.set(0, 0.05, 0);
      group.add(plinth);

      // 5 ascending steps
      const numSteps = 5;
      const stepDepth = (d * 0.65) / numSteps;
      const stepRise = 0.22;
      for (let s = 0; s < numSteps; s++) {
        const sw = w * 0.82;
        const sh = (s + 1) * stepRise;
        const sz = -d * 0.3 + (s * stepDepth) + stepDepth / 2;
        const step = createMesh(new THREE.BoxGeometry(sw, sh, stepDepth), stepMat);
        step.position.set(0, sh / 2 + 0.1, sz);
        group.add(step);

        // Gold brass stair nosing
        const nosing = createMesh(new THREE.BoxGeometry(sw, 0.025, 0.035), goldTrimMat);
        nosing.position.set(0, sh + 0.1, sz + stepDepth / 2 - 0.015);
        group.add(nosing);
      }

      // Top Imam platform
      const platH = numSteps * stepRise + 0.1;
      const platD = d * 0.35;
      const platform = createMesh(new THREE.BoxGeometry(w * 0.88, 0.08, platD), woodMat);
      platform.position.set(0, platH, d * 0.3);
      group.add(platform);

      // Side balustrades (Mashrabiya carved railings)
      const railH = 0.85;
      const railThick = 0.06;
      [-w / 2 + railThick / 2, w / 2 - railThick / 2].forEach((xPos) => {
        const sidePanel = createMesh(new THREE.BoxGeometry(railThick, railH, d * 0.9), woodMat);
        sidePanel.position.set(xPos, platH * 0.6 + railH / 2, 0);
        group.add(sidePanel);

        // Gold handrail cap
        const handrail = createMesh(new THREE.BoxGeometry(railThick * 1.5, 0.05, d * 0.92), goldTrimMat);
        handrail.position.set(xPos, platH * 0.6 + railH, 0);
        group.add(handrail);
      });

      // 4 Slender posts supporting arched canopy
      const postH = h - platH;
      const postRadius = 0.045;
      const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postH, 16);
      const postOffsets = [
        [-w * 0.4, d * 0.15],
        [w * 0.4, d * 0.15],
        [-w * 0.4, d * 0.45],
        [w * 0.4, d * 0.45],
      ];
      postOffsets.forEach(([px, pz]) => {
        const post = createMesh(postGeo, woodMat);
        post.position.set(px, platH + postH / 2, pz);
        group.add(post);

        // Brass capital ring
        const cap = createMesh(new THREE.CylinderGeometry(postRadius * 1.4, postRadius, 0.06, 16), goldTrimMat);
        cap.position.set(px, platH + postH, pz);
        group.add(cap);
      });

      // Arched wooden canopy dome with crescent finial
      const canopyW = w * 0.92;
      const canopyD = d * 0.42;
      const canopyRoof = createMesh(new THREE.ConeGeometry(canopyW * 0.6, 0.65, 8), woodMat);
      canopyRoof.position.set(0, h + 0.32, d * 0.3);
      group.add(canopyRoof);

      // Crescent and Star Finial
      const finial = createMesh(new THREE.TorusGeometry(0.12, 0.025, 8, 24, Math.PI * 1.5), goldTrimMat);
      finial.position.set(0, h + 0.75, d * 0.3);
      finial.rotation.z = Math.PI * 0.25;
      group.add(finial);
      break;
    }

    case 'masjid-mehrab-niche': {
      // Monumental Islamic pointed arch alcove with carved marble, gold voussoirs, Quranic calligraphy, and illuminated sanctuary lamp
      const w = dimensions?.width || 4.8;
      const d = dimensions?.depth || 1.8;
      const h = dimensions?.height || 4.5;

      const marbleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor || '#f8f8f6'),
        roughness: 0.18,
        metalness: 0.08,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(secondaryColor || '#d4af37'),
        roughness: 0.22,
        metalness: 0.88,
      });
      const tileTex = getIslamicGeometricTileTexture();
      const tileMat = new THREE.MeshStandardMaterial({
        map: tileTex,
        roughness: 0.35,
      });
      const archPanelTex = getMihrabArchPanelTexture();
      const archPanelMat = new THREE.MeshStandardMaterial({
        map: archPanelTex,
        roughness: 0.25,
      });
      const friezeTex = getIslamicCalligraphyFriezeTexture('emerald');
      const friezeMat = new THREE.MeshStandardMaterial({
        map: friezeTex,
        roughness: 0.28,
      });

      // 1. Stepped Marble Base Plinth (2 tiers)
      const base1 = createMesh(new THREE.BoxGeometry(w * 1.06, 0.14, d * 1.15), marbleMat);
      base1.position.set(0, 0.07, 0);
      group.add(base1);

      const baseGoldNosing = createMesh(new THREE.BoxGeometry(w * 1.07, 0.03, d * 1.16), goldMat);
      baseGoldNosing.position.set(0, 0.13, 0);
      group.add(baseGoldNosing);

      const base2 = createMesh(new THREE.BoxGeometry(w * 0.94, 0.12, d * 1.05), marbleMat);
      base2.position.set(0, 0.19, 0);
      group.add(base2);

      // 2. Recessed Niche Back Wall with Radiating Mihrab Arch Panel
      const nicheW = w * 0.62;
      const nicheH = h - 0.7;
      const backWall = createMesh(new THREE.BoxGeometry(nicheW, nicheH, 0.14), archPanelMat);
      backWall.position.set(0, 0.25 + nicheH / 2, -d * 0.42);
      group.add(backWall);

      // Lower marble wainscoting on back niche wall
      const wainscotBack = createMesh(new THREE.BoxGeometry(nicheW, 0.9, 0.16), marbleMat);
      wainscotBack.position.set(0, 0.25 + 0.45, -d * 0.42);
      group.add(wainscotBack);

      const wainscotTrim = createMesh(new THREE.BoxGeometry(nicheW, 0.06, 0.18), goldMat);
      wainscotTrim.position.set(0, 0.25 + 0.9, -d * 0.42);
      group.add(wainscotTrim);

      // 3. Angled / Polygonal Return Walls of the Niche
      [-1, 1].forEach((dir) => {
        const sideWall = createMesh(new THREE.BoxGeometry(0.16, nicheH, d * 0.7), tileMat);
        sideWall.position.set(dir * (nicheW / 2 - 0.04), 0.25 + nicheH / 2, -d * 0.1);
        group.add(sideWall);

        // Side wainscot
        const sideWain = createMesh(new THREE.BoxGeometry(0.18, 0.9, d * 0.7), marbleMat);
        sideWain.position.set(dir * (nicheW / 2 - 0.04), 0.25 + 0.45, -d * 0.1);
        group.add(sideWain);

        const sideTrim = createMesh(new THREE.BoxGeometry(0.2, 0.06, d * 0.7), goldMat);
        sideTrim.position.set(dir * (nicheW / 2 - 0.04), 0.25 + 0.9, -d * 0.1);
        group.add(sideTrim);
      });

      // 4. Monumental Twin Flank Columns (4 columns total: 2 on each side of the portal)
      const colHeight = h * 0.72;
      const colRadius = 0.14;
      const colGeo = new THREE.CylinderGeometry(colRadius * 0.92, colRadius, colHeight, 32);

      [-1, 1].forEach((side) => {
        const innerX = side * (nicheW / 2 + 0.22);
        const outerX = side * (nicheW / 2 + 0.58);

        [innerX, outerX].forEach((xPos, idx) => {
          // Column plinth pedestal
          const plinth = createMesh(new THREE.BoxGeometry(0.42, 0.48, 0.42), marbleMat);
          plinth.position.set(xPos, 0.25 + 0.24, d * 0.3);
          group.add(plinth);

          const plinthCap = createMesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), goldMat);
          plinthCap.position.set(xPos, 0.25 + 0.48, d * 0.3);
          group.add(plinthCap);

          // Shaft (fluted column)
          const col = createMesh(colGeo, marbleMat);
          col.position.set(xPos, 0.25 + 0.48 + colHeight / 2, d * 0.3);
          group.add(col);

          // Gold Astragal ring
          const ring = createMesh(new THREE.TorusGeometry(colRadius + 0.02, 0.02, 12, 24), goldMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.set(xPos, 0.25 + 0.48 + colHeight * 0.85, d * 0.3);
          group.add(ring);

          // Ornate Muqarnas Capital (multi-stepped)
          const cap1 = createMesh(new THREE.BoxGeometry(0.38, 0.12, 0.38), goldMat);
          cap1.position.set(xPos, 0.25 + 0.48 + colHeight + 0.06, d * 0.3);
          group.add(cap1);

          const cap2 = createMesh(new THREE.BoxGeometry(0.48, 0.14, 0.48), goldMat);
          cap2.position.set(xPos, 0.25 + 0.48 + colHeight + 0.19, d * 0.3);
          group.add(cap2);
        });

        // Flanking wall pylon behind columns
        const pylon = createMesh(new THREE.BoxGeometry(0.88, h, 0.3), marbleMat);
        pylon.position.set(side * (w / 2 - 0.44), h / 2, d * 0.15);
        group.add(pylon);
      });

      // 5. Multi-layered Pointed Horseshoe Arch Portal
      const archOuterWidth = w * 0.88;
      const archHeight = 0.55;
      const archBeam = createMesh(new THREE.BoxGeometry(archOuterWidth, archHeight, 0.36), marbleMat);
      archBeam.position.set(0, h - 0.85, d * 0.3);
      group.add(archBeam);

      // Gold arch mouldings & voussoirs
      const archMoulding = createMesh(new THREE.BoxGeometry(archOuterWidth + 0.06, 0.1, 0.4), goldMat);
      archMoulding.position.set(0, h - 0.85 + archHeight / 2, d * 0.3);
      group.add(archMoulding);

      // 6. Grand Illuminated Quranic Calligraphy Frieze
      const friezeH = 0.52;
      const friezeMesh = createMesh(new THREE.BoxGeometry(w * 0.98, friezeH, 0.38), friezeMat);
      friezeMesh.position.set(0, h - 0.32, d * 0.3);
      group.add(friezeMesh);

      // Gold Cornice & Dentils
      const cornice = createMesh(new THREE.BoxGeometry(w * 1.04, 0.14, 0.44), goldMat);
      cornice.position.set(0, h - 0.02, d * 0.3);
      group.add(cornice);

      // Top Cresting (Decorative Islamic Merlons)
      const merlonCount = 9;
      const merlonW = (w * 0.96) / (merlonCount * 2 - 1);
      for (let i = 0; i < merlonCount; i++) {
        const mx = -((w * 0.96) / 2) + i * (merlonW * 2) + merlonW / 2;
        const merlon = createMesh(new THREE.ConeGeometry(merlonW * 0.6, 0.22, 4), goldMat);
        merlon.position.set(mx, h + 0.16, d * 0.3);
        merlon.rotation.y = Math.PI / 4;
        group.add(merlon);
      }

      // 7. Hanging Ornate Brass Filigree Sanctuary Lamp (Mishkat)
      const lampChain = createMesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 8), goldMat);
      lampChain.position.set(0, h - 0.8, -d * 0.1);
      group.add(lampChain);

      // Lamp brass canopy
      const lampCanopy = createMesh(new THREE.ConeGeometry(0.12, 0.08, 12), goldMat);
      lampCanopy.position.set(0, h - 0.14, -d * 0.1);
      group.add(lampCanopy);

      // Lamp glass/filigree body
      const lampBody = createMesh(new THREE.CylinderGeometry(0.16, 0.08, 0.32, 16), goldMat);
      lampBody.position.set(0, h - 1.6, -d * 0.1);
      group.add(lampBody);

      const lampDome = createMesh(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshStandardMaterial({
        color: 0xfffae0,
        emissive: 0xffdf80,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.92,
      }));
      lampDome.position.set(0, h - 1.56, -d * 0.1);
      group.add(lampDome);

      // Inner glowing pointlight from the sanctuary lamp
      const lampLight = new THREE.PointLight(0xffe899, 2.8, 7.5);
      lampLight.position.set(0, h - 1.6, -d * 0.1);
      group.add(lampLight);

      // 8. Luxury Embroidered Imam Prayer Rug inside Mehrab
      const rug = createMesh(
        new THREE.BoxGeometry(nicheW * 0.72, 0.03, d * 0.9),
        new THREE.MeshStandardMaterial({
          color: 0x0a402d,
          roughness: 0.92,
        })
      );
      rug.position.set(0, 0.25 + 0.015, -d * 0.05);
      group.add(rug);

      // Gold arch embroidery border on rug
      const rugBorder = createMesh(
        new THREE.BoxGeometry(nicheW * 0.64, 0.035, d * 0.8),
        new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          roughness: 0.6,
        })
      );
      rugBorder.position.set(0, 0.25 + 0.02, -d * 0.05);
      group.add(rugBorder);

      const rugInner = createMesh(
        new THREE.BoxGeometry(nicheW * 0.56, 0.04, d * 0.72),
        new THREE.MeshStandardMaterial({
          color: 0x063323,
          roughness: 0.95,
        })
      );
      rugInner.position.set(0, 0.25 + 0.025, -d * 0.05);
      group.add(rugInner);

      break;
    }

    case 'masjid-qibla-facade': {
      // Monumental Architectural Qibla Wall Facade with Islamic Zellij, twin pilasters, Quranic frieze, and medallions
      const w = dimensions?.width || 8.0;
      const d = dimensions?.depth || 0.45;
      const h = dimensions?.height || 5.2;

      const marbleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor || '#f8f8f6'),
        roughness: 0.18,
        metalness: 0.06,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(secondaryColor || '#d4af37'),
        roughness: 0.24,
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

      // 1. Full-width marble base plinth
      const plinth = createMesh(new THREE.BoxGeometry(w, 0.35, d * 1.2), marbleMat);
      plinth.position.set(0, 0.175, 0);
      group.add(plinth);

      const plinthTrim = createMesh(new THREE.BoxGeometry(w + 0.04, 0.06, d * 1.22), goldMat);
      plinthTrim.position.set(0, 0.35, 0);
      group.add(plinthTrim);

      // 2. Left & Right Geometric Zellij Tile Panels
      const sidePanelW = (w - 3.4) / 2;
      const panelH = h - 1.4;

      [-1, 1].forEach((dir) => {
        const px = dir * (1.7 + sidePanelW / 2);

        // Tile field
        const panel = createMesh(new THREE.BoxGeometry(sidePanelW, panelH, 0.12), tileMat);
        panel.position.set(px, 0.35 + panelH / 2, 0.04);
        group.add(panel);

        // Marble wainscoting on lower wall
        const wainscot = createMesh(new THREE.BoxGeometry(sidePanelW, 0.9, 0.15), marbleMat);
        wainscot.position.set(px, 0.35 + 0.45, 0.05);
        group.add(wainscot);

        const wainTrim = createMesh(new THREE.BoxGeometry(sidePanelW, 0.06, 0.18), goldMat);
        wainTrim.position.set(px, 0.35 + 0.9, 0.05);
        group.add(wainTrim);

        // Gold framing around tile field
        const frameTop = createMesh(new THREE.BoxGeometry(sidePanelW, 0.06, 0.16), goldMat);
        frameTop.position.set(px, 0.35 + panelH, 0.05);
        group.add(frameTop);

        // Calligraphy Medallions on both wings ("Allah" on Left, "Muhammad" on Right)
        const medTex = getCalligraphyMedallionTexture(dir === -1 ? 'allah' : 'muhammad');
        const medMat = new THREE.MeshStandardMaterial({
          map: medTex,
          roughness: 0.2,
          metalness: 0.3,
        });
        const medDisc = createMesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 36), medMat);
        medDisc.rotation.x = Math.PI / 2;
        medDisc.position.set(px, 0.35 + panelH * 0.65, 0.12);
        group.add(medDisc);

        const medGoldRim = createMesh(new THREE.TorusGeometry(0.56, 0.035, 12, 36), goldMat);
        medGoldRim.position.set(px, 0.35 + panelH * 0.65, 0.15);
        group.add(medGoldRim);
      });

      // 3. Central Arched Mihrab Feature
      const portalW = 3.2;
      const portalH = h - 1.1;
      const portalBack = createMesh(new THREE.BoxGeometry(portalW, portalH, 0.15), archMat);
      portalBack.position.set(0, 0.35 + portalH / 2, 0.02);
      group.add(portalBack);

      // Flanking portal pilasters
      [-portalW / 2 + 0.2, portalW / 2 - 0.2].forEach((xPos) => {
        const pilaster = createMesh(new THREE.BoxGeometry(0.36, portalH, 0.24), marbleMat);
        pilaster.position.set(xPos, 0.35 + portalH / 2, 0.08);
        group.add(pilaster);

        const pCap = createMesh(new THREE.BoxGeometry(0.44, 0.2, 0.3), goldMat);
        pCap.position.set(xPos, 0.35 + portalH - 0.1, 0.09);
        group.add(pCap);
      });

      // 4. Continuous Upper Quranic Calligraphy Frieze
      const friezeH = 0.58;
      const frieze = createMesh(new THREE.BoxGeometry(w * 0.98, friezeH, 0.22), friezeMat);
      frieze.position.set(0, h - 0.45, 0.1);
      group.add(frieze);

      // Top Cornice and Gold Dentil Trim
      const cornice = createMesh(new THREE.BoxGeometry(w * 1.02, 0.18, 0.3), goldMat);
      cornice.position.set(0, h - 0.09, 0.12);
      group.add(cornice);

      // Cresting finials
      for (let i = 0; i < 15; i++) {
        const cx = -w / 2 + 0.28 + (i * (w - 0.56)) / 14;
        const finial = createMesh(new THREE.ConeGeometry(0.09, 0.22, 4), goldMat);
        finial.position.set(cx, h + 0.11, 0.12);
        finial.rotation.y = Math.PI / 4;
        group.add(finial);
      }

      // 5. Floor Warm Cove Uplighting
      const coveLightLeft = new THREE.SpotLight(0xffe899, 4.0, 10, Math.PI / 3, 0.5);
      coveLightLeft.position.set(-2.2, 0.4, 0.8);
      const targetL = new THREE.Object3D();
      targetL.position.set(-2.2, 3.2, 0);
      group.add(coveLightLeft, targetL);
      coveLightLeft.target = targetL;

      const coveLightRight = new THREE.SpotLight(0xffe899, 4.0, 10, Math.PI / 3, 0.5);
      coveLightRight.position.set(2.2, 0.4, 0.8);
      const targetR = new THREE.Object3D();
      targetR.position.set(2.2, 3.2, 0);
      group.add(coveLightRight, targetR);
      coveLightRight.target = targetR;

      break;
    }

    case 'masjid-chandelier': {
      // Grand Ottoman/Andalusian mosque crystal & brass circular chandelier
      const diam = dimensions?.width || 3.0;
      const h = dimensions?.height || 2.4;

      const brassRingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
      const crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, opacity: 0.9, roughness: 0.1 });
      const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff4cc });

      // Multi-tier concentric brass rings
      const rings = [
        { radius: diam * 0.5, y: -0.6, count: 24 },
        { radius: diam * 0.35, y: -0.3, count: 16 },
        { radius: diam * 0.18, y: 0.0, count: 8 },
      ];

      rings.forEach(({ radius, y, count }) => {
        // Brass torus ring
        const ring = createMesh(new THREE.TorusGeometry(radius, 0.04, 12, 48), brassRingMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = y;
        group.add(ring);

        // Hanging warm lamps around ring
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const lx = Math.cos(angle) * radius;
          const lz = Math.sin(angle) * radius;

          const cup = createMesh(new THREE.CylinderGeometry(0.04, 0.025, 0.12, 12), crystalMat);
          cup.position.set(lx, y - 0.06, lz);
          group.add(cup);

          const bulb = createMesh(new THREE.SphereGeometry(0.025, 8, 8), lampGlowMat);
          bulb.position.set(lx, y - 0.04, lz);
          group.add(bulb);
        }
      });

      // Supporting suspension rods
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const rx = Math.cos(angle) * diam * 0.5;
        const rz = Math.sin(angle) * diam * 0.5;
        const rod = createMesh(new THREE.CylinderGeometry(0.015, 0.015, h * 0.8, 8), brassRingMat);
        rod.position.set(rx / 2, (h * 0.8) / 2 - 0.6, rz / 2);
        rod.lookAt(rx, -0.6, rz);
        group.add(rod);
      }
      break;
    }

    case 'masjid-quran-rihal': {
      // Folding carved walnut Quran bookstand with open holy Quran
      const w = dimensions?.width || 0.55;
      const d = dimensions?.depth || 0.45;
      const h = dimensions?.height || 0.42;

      const rihalWood = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.5 });
      const goldPageMat = new THREE.MeshStandardMaterial({ color: 0xfbf8ee, roughness: 0.7 });
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 });

      // Two interlocking crossed wooden planks (X-frame)
      const plankGeo = new THREE.BoxGeometry(w, 0.03, d);
      const plank1 = createMesh(plankGeo, rihalWood);
      plank1.rotation.z = Math.PI * 0.22;
      plank1.position.set(0, h * 0.45, 0);
      group.add(plank1);

      const plank2 = createMesh(plankGeo, rihalWood);
      plank2.rotation.z = -Math.PI * 0.22;
      plank2.position.set(0, h * 0.45, 0);
      group.add(plank2);

      // Open Quran book on top
      const pageW = w * 0.42;
      const pageD = d * 0.85;
      const page1 = createMesh(new THREE.BoxGeometry(pageW, 0.025, pageD), goldPageMat);
      page1.rotation.z = Math.PI * 0.2;
      page1.position.set(-pageW * 0.45, h * 0.68, 0);
      group.add(page1);

      const page2 = createMesh(new THREE.BoxGeometry(pageW, 0.025, pageD), goldPageMat);
      page2.rotation.z = -Math.PI * 0.2;
      page2.position.set(pageW * 0.45, h * 0.68, 0);
      group.add(page2);

      // Green satin bookmark ribbon
      const ribbon = createMesh(new THREE.BoxGeometry(0.04, 0.005, pageD * 1.1), ribbonMat);
      ribbon.position.set(0, h * 0.62, 0);
      group.add(ribbon);
      break;
    }

    case 'masjid-quran-shelf': {
      // Wall bookshelf for Quran copies in solid walnut with gold lettering
      const w = dimensions?.width || 1.8;
      const d = dimensions?.depth || 0.35;
      const h = dimensions?.height || 1.2;

      const shelfWood = new THREE.MeshStandardMaterial({ color: 0x422617, roughness: 0.5 });
      const quranSpineGreen = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.6 });
      const quranSpineGold = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.7 });

      // Outer frame
      const frame = createMesh(new THREE.BoxGeometry(w, h, d), shelfWood);
      frame.position.set(0, h / 2, 0);
      group.add(frame);

      // 3 Shelf compartments
      const numShelves = 3;
      for (let s = 0; s < numShelves; s++) {
        const sy = (s + 0.5) * (h / numShelves);
        // Quran book copies neatly aligned
        const numBooks = 12;
        const bookW = (w * 0.85) / numBooks;
        for (let b = 0; b < numBooks; b++) {
          const bx = -w * 0.4 + (b + 0.5) * bookW;
          const book = createMesh(new THREE.BoxGeometry(bookW * 0.85, (h / numShelves) * 0.75, d * 0.7), quranSpineGreen);
          book.position.set(bx, sy, 0);
          group.add(book);

          // Gold spine embossing
          const spine = createMesh(new THREE.BoxGeometry(bookW * 0.82, (h / numShelves) * 0.6, 0.01), quranSpineGold);
          spine.position.set(bx, sy, d * 0.35 + 0.005);
          group.add(spine);
        }
      }
      break;
    }

    case 'masjid-calligraphy-wall': {
      // Circular gilded Islamic calligraphy wall medallion with high-definition Arabic Thuluth script
      const diam = dimensions?.width || 1.2;
      const thick = 0.08;

      const goldMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor || '#d4af37'),
        roughness: 0.22,
        metalness: 0.9,
      });

      // Determine medallion type from customData or model properties
      let medType: 'allah' | 'muhammad' | 'bismillah' = 'allah';
      if (customData?.medallionType) {
        medType = customData.medallionType;
      }

      const medTex = getCalligraphyMedallionTexture(medType);
      const discMat = new THREE.MeshStandardMaterial({
        map: medTex,
        roughness: 0.25,
        metalness: 0.25,
      });

      // 1. Outer stepped gold decorative rim with beveled chamfer
      const outerRim = createMesh(new THREE.CylinderGeometry(diam / 2, diam / 2, thick * 0.8, 48), goldMat);
      outerRim.rotation.x = Math.PI / 2;
      outerRim.position.set(0, diam / 2, 0);
      group.add(outerRim);

      const goldTorus = createMesh(new THREE.TorusGeometry(diam / 2, 0.035, 16, 48), goldMat);
      goldTorus.position.set(0, diam / 2, thick * 0.4);
      group.add(goldTorus);

      // 2. High-definition Calligraphy Face Disc
      const disc = createMesh(new THREE.CylinderGeometry(diam * 0.47, diam * 0.47, thick * 0.85, 48), discMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(0, diam / 2, 0.015);
      group.add(disc);

      // 3. Radial Gold Filigree Rays / Sunburst surrounding the rim
      const rayCount = 32;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * Math.PI * 2) / rayCount;
        const rx = Math.cos(angle) * (diam * 0.51);
        const ry = Math.sin(angle) * (diam * 0.51) + diam / 2;
        const ray = createMesh(new THREE.ConeGeometry(0.024, 0.06, 4), goldMat);
        ray.position.set(rx, ry, thick * 0.25);
        ray.rotation.z = angle - Math.PI / 2;
        group.add(ray);
      }

      // 4. Subtle golden wall halo wash
      const haloLight = new THREE.PointLight(0xffe28a, 1.2, 2.5);
      haloLight.position.set(0, diam / 2, 0.2);
      group.add(haloLight);

      break;
    }

    case 'masjid-mashrabiya': {
      // Islamic geometric lattice (Jali) wooden screen partition
      const w = dimensions?.width || 1.5;
      const d = dimensions?.depth || 0.12;
      const h = dimensions?.height || 2.2;

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.6 });
      const goldAccent = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.7 });

      // Outer frame
      const frame = createMesh(new THREE.BoxGeometry(w, h, d), woodMat);
      frame.position.set(0, h / 2, 0);
      group.add(frame);

      // Lattice grid slats
      const rows = 8;
      const cols = 6;
      for (let r = 0; r < rows; r++) {
        const ry = (r + 0.5) * (h / rows);
        const slatH = createMesh(new THREE.BoxGeometry(w * 0.92, 0.025, 0.04), goldAccent);
        slatH.position.set(0, ry, 0);
        group.add(slatH);
      }
      for (let c = 0; c < cols; c++) {
        const cx = -w * 0.45 + (c + 0.5) * (w * 0.9 / cols);
        const slatV = createMesh(new THREE.BoxGeometry(0.025, h * 0.92, 0.04), goldAccent);
        slatV.position.set(cx, h / 2, 0);
        group.add(slatV);
      }
      break;
    }

    case 'masjid-adhan-clock': {
      // Mosque digital prayer schedule clock with glowing green LEDs
      const w = dimensions?.width || 0.95;
      const d = 0.06;
      const h = dimensions?.height || 0.65;

      const caseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.5 });
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Emerald digital LED
      const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.8 });

      const frame = createMesh(new THREE.BoxGeometry(w, h, d), goldFrameMat);
      frame.position.set(0, h / 2, 0);
      group.add(frame);

      const display = createMesh(new THREE.BoxGeometry(w * 0.94, h * 0.92, 0.01), caseMat);
      display.position.set(0, h / 2, d / 2 + 0.005);
      group.add(display);

      // Digital time rows (Fajr, Dhuhr, Asr, Maghrib, Isha)
      const prayers = 5;
      for (let p = 0; p < prayers; p++) {
        const py = (p + 0.5) * ((h * 0.8) / prayers);
        const ledLine = createMesh(new THREE.BoxGeometry(w * 0.35, 0.035, 0.005), ledMat);
        ledLine.position.set(w * 0.22, py + 0.05, d / 2 + 0.01);
        group.add(ledLine);
      }
      break;
    }

    case 'masjid-shoe-rack': {
      // Entrance shoe organizer cubbies in polished wood
      const w = dimensions?.width || 2.0;
      const d = dimensions?.depth || 0.45;
      const h = dimensions?.height || 1.1;

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3321, roughness: 0.5 });
      const cubbyMat = new THREE.MeshStandardMaterial({ color: 0x362416, roughness: 0.6 });

      const frame = createMesh(new THREE.BoxGeometry(w, h, d), woodMat);
      frame.position.set(0, h / 2, 0);
      group.add(frame);

      // Cubby grid (3 rows x 5 columns)
      const rows = 3;
      const cols = 5;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = -w * 0.45 + (c + 0.5) * (w * 0.9 / cols);
          const cy = (r + 0.5) * (h / rows);
          const cubbyHole = createMesh(new THREE.BoxGeometry((w * 0.85) / cols, (h * 0.8) / rows, d * 0.85), cubbyMat);
          cubbyHole.position.set(cx, cy, 0.02);
          group.add(cubbyHole);
        }
      }
      break;
    }

    case 'masjid-pillar': {
      // Monumental octagonal mosque column with muqarnas bracket capital
      const diam = dimensions?.width || 0.75;
      const h = dimensions?.height || 4.8;

      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.25 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.75 });

      // Octagonal column shaft
      const col = createMesh(new THREE.CylinderGeometry(diam / 2, diam / 2, h * 0.85, 8), marbleMat);
      col.position.set(0, (h * 0.85) / 2 + 0.25, 0);
      group.add(col);

      // Square plinth base
      const plinth = createMesh(new THREE.BoxGeometry(diam * 1.3, 0.25, diam * 1.3), marbleMat);
      plinth.position.set(0, 0.125, 0);
      group.add(plinth);

      // Muqarnas capital
      const capital = createMesh(new THREE.BoxGeometry(diam * 1.4, 0.45, diam * 1.4), goldMat);
      capital.position.set(0, h - 0.225, 0);
      group.add(capital);
      break;
    }

    case 'structural-column-square': {
      const w = dimensions?.width || 0.45;
      const d = dimensions?.depth || 0.45;
      const h = dimensions?.height || 3.5;

      const concreteMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.85,
        metalness: 0.1,
      });

      // Concrete shaft
      const shaft = createMesh(new THREE.BoxGeometry(w, h - 0.3, d), concreteMat);
      shaft.position.set(0, (h - 0.3) / 2 + 0.15, 0);
      group.add(shaft);

      // Base plinth
      const plinth = createMesh(new THREE.BoxGeometry(w + 0.08, 0.15, d + 0.08), concreteMat);
      plinth.position.set(0, 0.075, 0);
      group.add(plinth);

      // Capital bracket
      const cap = createMesh(new THREE.BoxGeometry(w + 0.06, 0.15, d + 0.06), concreteMat);
      cap.position.set(0, h - 0.075, 0);
      group.add(cap);
      break;
    }

    case 'structural-column-steel': {
      const w = dimensions?.width || 0.35;
      const d = dimensions?.depth || 0.35;
      const h = dimensions?.height || 3.5;

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.45,
        metalness: 0.75,
      });
      const boltMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.9,
      });

      const flangeThick = 0.025;
      const webThick = 0.02;

      // H-Beam Flanges
      const f1 = createMesh(new THREE.BoxGeometry(w, h - 0.1, flangeThick), steelMat);
      f1.position.set(0, h / 2, -d / 2 + flangeThick / 2);
      const f2 = createMesh(new THREE.BoxGeometry(w, h - 0.1, flangeThick), steelMat);
      f2.position.set(0, h / 2, d / 2 - flangeThick / 2);

      // Web
      const web = createMesh(new THREE.BoxGeometry(webThick, h - 0.1, d - flangeThick * 2), steelMat);
      web.position.set(0, h / 2, 0);

      // Base Plate
      const basePlate = createMesh(new THREE.BoxGeometry(w + 0.12, 0.04, d + 0.12), steelMat);
      basePlate.position.set(0, 0.02, 0);

      // 4 Anchor Bolts
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([bx, bz]) => {
        const bolt = createMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 12), boltMat);
        bolt.position.set(bx * (w / 2 + 0.03), 0.05, bz * (d / 2 + 0.03));
        group.add(bolt);
      });

      // Top Capital Plate
      const capPlate = createMesh(new THREE.BoxGeometry(w + 0.08, 0.03, d + 0.08), steelMat);
      capPlate.position.set(0, h - 0.015, 0);

      group.add(f1, f2, web, basePlate, capPlate);
      break;
    }

    case 'structural-beam-concrete': {
      const len = dimensions?.width || 6.0;
      const beamW = dimensions?.depth || 0.30;
      const beamH = dimensions?.height || 0.60;

      const concreteMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.85,
        metalness: 0.1,
      });

      // Concrete beam span along X axis
      const beam = createMesh(new THREE.BoxGeometry(len, beamH, beamW), concreteMat);
      beam.position.set(0, 0, 0);
      group.add(beam);

      // Chamfered underside accent
      const chamferMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.9,
      });
      const bevel = createMesh(new THREE.BoxGeometry(len - 0.1, 0.03, beamW - 0.04), chamferMat);
      bevel.position.set(0, -beamH / 2 + 0.015, 0);
      group.add(bevel);
      break;
    }

    case 'structural-beam-steel': {
      const len = dimensions?.width || 6.0;
      const beamW = dimensions?.depth || 0.25;
      const beamH = dimensions?.height || 0.45;

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.45,
        metalness: 0.75,
      });

      const flangeThick = 0.022;
      const webThick = 0.018;

      // Top flange
      const topFlange = createMesh(new THREE.BoxGeometry(len, flangeThick, beamW), steelMat);
      topFlange.position.set(0, beamH / 2 - flangeThick / 2, 0);

      // Bottom flange
      const bottomFlange = createMesh(new THREE.BoxGeometry(len, flangeThick, beamW), steelMat);
      bottomFlange.position.set(0, -beamH / 2 + flangeThick / 2, 0);

      // Center web
      const web = createMesh(new THREE.BoxGeometry(len, beamH - flangeThick * 2, webThick), steelMat);
      web.position.set(0, 0, 0);

      // End connection shear tabs
      const endMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      [-len / 2 + 0.02, len / 2 - 0.02].forEach((ex) => {
        const plate = createMesh(new THREE.BoxGeometry(0.03, beamH * 0.7, beamW * 0.8), endMat);
        plate.position.set(ex, 0, 0);
        group.add(plate);
      });

      group.add(topFlange, bottomFlange, web);
      break;
    }

    case 'structural-column-650x900':
    case 'structural-column-150x200': {
      const w = dimensions?.width || 0.65;
      const d = dimensions?.depth || 0.90;
      const h = dimensions?.height || 5.79; // 19 ft default

      const concreteMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.85,
        metalness: 0.1,
      });

      // Concrete shaft
      const shaft = createMesh(new THREE.BoxGeometry(w, h - 0.4, d), concreteMat);
      shaft.position.set(0, (h - 0.4) / 2 + 0.25, 0);
      group.add(shaft);

      // Plinth
      const plinth = createMesh(new THREE.BoxGeometry(w + 0.08, 0.25, d + 0.08), concreteMat);
      plinth.position.set(0, 0.125, 0);
      group.add(plinth);

      // Capital header
      const cap = createMesh(new THREE.BoxGeometry(w + 0.06, 0.18, d + 0.06), concreteMat);
      cap.position.set(0, h - 0.09, 0);
      group.add(cap);
      break;
    }

    case 'masjid-carpet-runner': {
      // Individual Saff prayer rug runner with ornate pointed Mihrab arch
      const w = dimensions?.width || 0.8;
      const d = dimensions?.depth || 1.25;

      const carpetMat = new THREE.MeshStandardMaterial({ color: 0x0f4c3a, roughness: 0.95 });
      const goldBorder = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.6 });

      const mat = createMesh(new THREE.BoxGeometry(w, 0.015, d), carpetMat);
      mat.position.set(0, 0.008, 0);
      group.add(mat);

      // Pointed arch border
      const arch = createMesh(new THREE.BoxGeometry(w * 0.82, 0.02, d * 0.85), goldBorder);
      arch.position.set(0, 0.012, 0);
      group.add(arch);
      break;
    }

    // ----------------------------------------------------
    // CUSTOM USER / FOLDER IMPORTED PRODUCT
    // ----------------------------------------------------
    case 'custom-imported-product': {
      const w = dimensions?.width || 1.0;
      const h = dimensions?.height || 0.9;
      const d = dimensions?.depth || 0.6;

      // If user uploaded a texture/image from their folder
      if (customData?.imageUrl) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(customData.imageUrl);
        texture.colorSpace = THREE.SRGBColorSpace;

        const frontMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.5,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });

        // Dimensional extruded standee with photo texture on front & back
        const standMat = [
          secondaryMat, // right
          secondaryMat, // left
          secondaryMat, // top
          secondaryMat, // bottom
          frontMat, // front (displays user's product photo!)
          frontMat, // back
        ];

        const productMesh = createMesh(new THREE.BoxGeometry(w, h, Math.max(d, 0.06)), standMat as any);
        productMesh.position.y = h / 2;
        group.add(productMesh);

        // Sleek minimal stand or pedestal foot
        const foot = createMesh(new THREE.BoxGeometry(w * 0.85, 0.03, Math.max(d * 0.9, 0.2)), secondaryMat);
        foot.position.y = 0.015;
        group.add(foot);
      } else {
        // Fallback parametric furniture shape
        const bodyMesh = createMesh(new THREE.BoxGeometry(w, h, d), mainMat);
        bodyMesh.position.y = h / 2;
        group.add(bodyMesh);

        const accent = createMesh(new THREE.BoxGeometry(w * 0.9, 0.04, d * 0.9), secondaryMat);
        accent.position.y = h;
        group.add(accent);
      }
      break;
    }

    // ----------------------------------------------------
    // INTERIOR WALL IMAGE & ARTWORK DECAL PASTER
    // Mounts photos, artwork, reference plans, and Islamic calligraphy onto interior walls
    // ----------------------------------------------------
    case 'wall-image-poster':
    case 'interior-image-decal': {
      const w = dimensions?.width || 2.0;
      const h = dimensions?.height || 1.4;
      const depth = Math.max(0.02, dimensions?.depth || 0.04);
      const frameStyle = customData?.frameStyle || 'walnut-frame';
      const imageUrl = customData?.imageUrl;

      let imageTexture: THREE.Texture;
      if (imageUrl && imageUrl.length > 5) {
        const textureLoader = new THREE.TextureLoader();
        imageTexture = textureLoader.load(imageUrl);
        imageTexture.colorSpace = THREE.SRGBColorSpace;
      } else {
        // Fallback to high-res procedural calligraphy
        imageTexture = getFloatingBronzeCalligraphyTexture();
      }

      const canvasFrontMat = new THREE.MeshStandardMaterial({
        map: imageTexture,
        roughness: 0.35,
        metalness: 0.08,
        side: THREE.DoubleSide,
      });

      // Frame materials
      let frameMat: THREE.Material = mainMat;
      if (frameStyle === 'walnut-frame') {
        frameMat = new THREE.MeshStandardMaterial({
          color: 0x362114,
          roughness: 0.6,
          metalness: 0.1,
        });
      } else if (frameStyle === 'gold-frame') {
        frameMat = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          roughness: 0.25,
          metalness: 0.85,
        });
      } else if (frameStyle === 'black-frame') {
        frameMat = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.4,
          metalness: 0.7,
        });
      } else {
        frameMat = new THREE.MeshStandardMaterial({
          color: 0xf4eee2,
          roughness: 0.7,
        });
      }

      // 6-sided box with photo on the front facing +Z
      const boxMaterials = [
        frameMat, // right (+X)
        frameMat, // left (-X)
        frameMat, // top (+Y)
        frameMat, // bottom (-Y)
        canvasFrontMat, // front (+Z - facing into the room)
        frameMat, // back (-Z - against the wall)
      ];

      const canvasMesh = createMesh(new THREE.BoxGeometry(w, h, depth), boxMaterials as any);
      canvasMesh.position.set(0, h / 2, 0);
      group.add(canvasMesh);

      // Add framed perimeter border if not frameless
      if (frameStyle !== 'frameless') {
        const borderThick = 0.045;
        const borderDepth = depth + 0.015;

        // Top rail
        const topRail = createMesh(new THREE.BoxGeometry(w + borderThick * 2, borderThick, borderDepth), frameMat);
        topRail.position.set(0, h + borderThick / 2, 0.005);
        // Bottom rail
        const btmRail = createMesh(new THREE.BoxGeometry(w + borderThick * 2, borderThick, borderDepth), frameMat);
        btmRail.position.set(0, -borderThick / 2, 0.005);
        // Left stile
        const leftStile = createMesh(new THREE.BoxGeometry(borderThick, h, borderDepth), frameMat);
        leftStile.position.set(-w / 2 - borderThick / 2, h / 2, 0.005);
        // Right stile
        const rightStile = createMesh(new THREE.BoxGeometry(borderThick, h, borderDepth), frameMat);
        rightStile.position.set(w / 2 + borderThick / 2, h / 2, 0.005);

        group.add(topRail, btmRail, leftStile, rightStile);
      }

      // Backlit floating LED halo glow effect
      if (frameStyle === 'backlit-floating') {
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xffe8ba,
          transparent: true,
          opacity: 0.65,
        });
        const haloMesh = createMesh(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.008), haloMat);
        haloMesh.position.set(0, h / 2, -depth / 2 - 0.01);
        group.add(haloMesh);

        const warmLight = new THREE.PointLight(0xffe2a0, 0.65, 3.5, 1.5);
        warmLight.position.set(0, h / 2, -0.05);
        group.add(warmLight);
      }
      break;
    }

    default: {
      const fallback = createMesh(new THREE.BoxGeometry(1, 1, 1), mainMat);
      fallback.position.set(0, 0.5, 0);
      group.add(fallback);
      break;
    }
  }

  // Rescale model if custom dimensions were supplied
  const isDirectParametric =
    modelType === 'custom-product-import' ||
    modelType.startsWith('architectural-') ||
    modelType.startsWith('structural-column-') ||
    modelType.startsWith('structural-beam') ||
    modelType === 'custom-masonry-wall' ||
    modelType === 'custom-wall' ||
    modelType === 'drywall-partition' ||
    modelType === 'pony-wall';

  if (dimensions && !isDirectParametric) {
    const catalogItem = FURNITURE_CATALOG.find((c) => c.modelType === modelType);
    if (catalogItem && catalogItem.dimensions) {
      const baseW = catalogItem.dimensions.width;
      const baseH = catalogItem.dimensions.height;
      const baseD = catalogItem.dimensions.depth;
      if (baseW > 0 && baseH > 0 && baseD > 0) {
        const sx = Math.max(0.05, dimensions.width / baseW);
        const sy = Math.max(0.05, dimensions.height / baseH);
        const sz = Math.max(0.05, dimensions.depth / baseD);
        if (Math.abs(sx - 1) > 0.005 || Math.abs(sy - 1) > 0.005 || Math.abs(sz - 1) > 0.005) {
          group.scale.set(sx, sy, sz);
        }
      }
    }
  }

  return group;
}
