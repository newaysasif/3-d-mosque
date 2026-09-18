import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AIAction,
  CameraMode,
  DesignTemplate,
  FurnitureCatalogItem,
  LightingEnv,
  PlacedFurnitureItem,
  RoomConfig,
  MasjidConfig,
  SavedProject,
  DrawingToolType,
  CADMeasurement,
  ActivePlacementSession,
  LiveDraftingState,
} from './types';
import { SceneManager } from './engine/SceneManager';
import { FURNITURE_CATALOG } from './engine/catalogData';
import { DESIGNER_TEMPLATES } from './engine/designerTemplates';
import { Header } from './components/Header';
import { Viewport3D } from './components/Viewport3D';
import { CatalogDrawer } from './components/CatalogDrawer';
import { AskingBar } from './components/AskingBar';
import { RoomSettingsModal } from './components/RoomSettingsModal';
import { TemplatesModal } from './components/TemplatesModal';
import { AIStylistModal } from './components/AIStylistModal';
import { BOMModal } from './components/BOMModal';
import { ArchitecturalToolsModal } from './components/ArchitecturalToolsModal';
import { FolderProductPickerModal } from './components/FolderProductPickerModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { WallManagerModal } from './components/WallManagerModal';
import { OfficeStructuralGridModal } from './components/OfficeStructuralGridModal';
import { ImagePasterModal } from './components/ImagePasterModal';
import { CADDrawingPalette } from './components/CADDrawingPalette';
import { CADFloorPlanOverlay } from './components/CADFloorPlanOverlay';
import { PlacementOptionsModal } from './components/PlacementOptionsModal';
import {
  loadAllProjects,
  saveAllProjects,
  getActiveProjectId,
  setActiveProjectId,
} from './engine/projectStorage';

const DEFAULT_TEMPLATE = DESIGNER_TEMPLATES[0]; // Nordic Living Room

const INITIAL_ROOM_CONFIG: RoomConfig = {
  width: 7.0,
  length: 6.0,
  height: 2.8,
  baseWallColor: '#f7f6f2',
  baseboardColor: '#ece9e2',
  baseboardHeight: 0.12,
  flooring: 'natural-oak',
  accentWalls: {
    north: { enabled: true, color: '#3d4b41', finish: 'flat' },
    south: { enabled: false, color: '#f7f6f2', finish: 'flat' },
    east: { enabled: false, color: '#f7f6f2', finish: 'flat' },
    west: { enabled: false, color: '#f7f6f2', finish: 'flat' },
  },
  showCeiling: true,
  gridSnap: true,
  gridSnapSize: 0.25,
};

export default function App() {
  // -------------------------------------------------------------
  // Multi-Project Management State
  // -------------------------------------------------------------
  const [projects, setProjects] = useState<SavedProject[]>(() => loadAllProjects());
  const [activeProjectId, setActiveProjectIdState] = useState<string>(() => {
    const all = loadAllProjects();
    return getActiveProjectId(all);
  });
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [projectManagerTab, setProjectManagerTab] = useState<'open' | 'new' | 'saveAs'>('open');
  const [isProjectSaved, setIsProjectSaved] = useState(false);

  // Active Project Reference
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Core Studio State (initialized from active project)
  const [roomConfig, setRoomConfig] = useState<RoomConfig>(() => {
    return activeProject?.roomConfig || INITIAL_ROOM_CONFIG;
  });

  const [items, setItems] = useState<PlacedFurnitureItem[]>(() => {
    return activeProject?.items && activeProject.items.length > 0
      ? activeProject.items
      : DEFAULT_TEMPLATE.items.map((it, idx) => ({
          ...it,
          id: `item-${Date.now()}-${idx}`,
        }));
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('3d-orbit');
  const [lightingEnv, setLightingEnv] = useState<LightingEnv>(
    () => activeProject?.lightingEnv || 'daylight'
  );

  // CAD Drawing Tools State
  const [isCADDrawingActive, setIsCADDrawingActive] = useState<boolean>(false);
  const [cadDrawingTool, setCadDrawingTool] = useState<DrawingToolType>('select');
  const [cadMeasurements, setCadMeasurements] = useState<CADMeasurement[]>([]);
  const [liveDraftingState, setLiveDraftingState] = useState<LiveDraftingState | null>(null);

  // Core Two-Function Switching Handlers (2D Sketch like Coohom <-> 3D Extruded Model)
  const [isBigger2DView, setIsBigger2DView] = useState<boolean>(false);

  const handleToggleBiggerView = useCallback(() => {
    setIsBigger2DView((prev) => {
      const next = !prev;
      if (next) {
        setIsCatalogOpen(false);
      }
      setTimeout(() => {
        sceneManagerRef.current?.fitPlanToScreen(next ? 1.15 : 1.3);
      }, 60);
      showToast(next ? '⛶ Bigger View active: Side panels minimized for clean drafting' : 'Normal view restored');
      return next;
    });
  }, []);

  const handleSwitchTo2DSketch = useCallback(() => {
    setCameraMode('2d-plan');
    sceneManagerRef.current?.setCameraMode('2d-plan');
    setIsCADDrawingActive(true);
    setCadDrawingTool('draw-wall');
    setIsCatalogOpen(false);
    setTimeout(() => {
      sceneManagerRef.current?.fitPlanToScreen(1.15);
    }, 60);
    showToast('📐 2D Sketch Mode: Click to draw walls or drop columns. Full drafting canvas ready.');
  }, []);

  const handleGenerate3D = useCallback(() => {
    setCameraMode('3d-orbit');
    sceneManagerRef.current?.setCameraMode('3d-orbit');
    setIsCADDrawingActive(false);
    setLiveDraftingState(null);
    sceneManagerRef.current?.syncFurnitureItems(items);
    sceneManagerRef.current?.resetView();
    showToast('✨ Function 2: 3D Architectural Model Generated from 2D Sketch!');
  }, [items]);

  // Modals & Drawers
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAIStylistOpen, setIsAIStylistOpen] = useState(false);
  const [isBOMOpen, setIsBOMOpen] = useState(false);
  const [isArchitecturalToolsOpen, setIsArchitecturalToolsOpen] = useState(false);
  const [isWallManagerOpen, setIsWallManagerOpen] = useState(false);
  const [isOfficeGridOpen, setIsOfficeGridOpen] = useState(false);
  const [isImagePasterOpen, setIsImagePasterOpen] = useState(false);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Cursor Placement & Size Customization State
  const [isPlacementOptionsOpen, setIsPlacementOptionsOpen] = useState(false);
  const [placementTargetItem, setPlacementTargetItem] = useState<FurnitureCatalogItem | PlacedFurnitureItem | null>(null);
  const [cursorPlacementInfo, setCursorPlacementInfo] = useState<{
    active: boolean;
    itemName: string;
    dimensions: { width: number; depth: number; height: number };
    hoverCoords: { x: number; z: number } | null;
    rotationY: number;
  } | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<{ roomConfig: RoomConfig; items: PlacedFurnitureItem[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Reference to 3D Scene Manager
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // Helper to show brief toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Push state to undo/redo history
  const pushHistory = useCallback(
    (newConfig: RoomConfig, newItems: PlacedFurnitureItem[]) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, { roomConfig: newConfig, items: newItems }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('interior_studio_room', JSON.stringify(roomConfig));
    localStorage.setItem('interior_studio_items', JSON.stringify(items));
  }, [roomConfig, items]);

  // Selected item object
  const selectedItem = items.find((it) => it.id === selectedItemId) || null;

  // -------------------------------------------------------------
  // Furniture Operations
  // -------------------------------------------------------------
  const handleAddItem = (item: FurnitureCatalogItem | PlacedFurnitureItem) => {
    let newItem: PlacedFurnitureItem;
    if ('position' in item) {
      newItem = item;
    } else {
      const offsetX = (Math.random() - 0.5) * 1.2;
      const offsetZ = (Math.random() - 0.5) * 1.2;
      const elevation = item.elevationOffset || 0;
      newItem = {
        id: `item-${Date.now()}`,
        modelType: item.modelType,
        name: item.name,
        category: item.category,
        position: [parseFloat(offsetX.toFixed(2)), elevation, parseFloat(offsetZ.toFixed(2))],
        rotationY: 0,
        dimensions: { ...item.dimensions },
        color: item.defaultColor,
        secondaryColor: item.secondaryColor,
        price: item.price,
      };
    }

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    setSelectedItemId(newItem.id);
    pushHistory(roomConfig, updatedItems);
    showToast(`Added "${newItem.name}"`);
  };

  const handleUpdateItem = (updated: PlacedFurnitureItem) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const handleDuplicateItem = (id: string) => {
    const orig = items.find((it) => it.id === id);
    if (!orig) return;

    const duplicated: PlacedFurnitureItem = {
      ...orig,
      id: `item-${Date.now()}`,
      position: [
        parseFloat((orig.position[0] + 0.35).toFixed(2)),
        orig.position[1],
        parseFloat((orig.position[2] + 0.35).toFixed(2)),
      ],
    };

    const updated = [...items, duplicated];
    setItems(updated);
    setSelectedItemId(duplicated.id);
    pushHistory(roomConfig, updated);
    showToast(`Duplicated "${orig.name}"`);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    if (selectedItemId === id) setSelectedItemId(null);
    pushHistory(roomConfig, updated);
    showToast(`Deleted ${target ? `"${target.name}"` : 'item'}`);
  };

  const handleCenterItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            position: [0, it.position[1], 0],
          };
        }
        return it;
      })
    );
    showToast('Centered in room');
  };

  // -------------------------------------------------------------
  // Live Cursor Placement & Size Operations
  // -------------------------------------------------------------
  const handleStartCursorPlacement = (
    targetItem: FurnitureCatalogItem | PlacedFurnitureItem,
    options?: {
      dimensions?: { width: number; depth: number; height: number };
      color?: string;
      secondaryColor?: string;
      rotationY?: number;
      elevation?: number;
    }
  ) => {
    const isExisting = 'id' in targetItem && items.some((it) => it.id === targetItem.id);
    const dims = options?.dimensions || targetItem.dimensions;
    const color = options?.color || ('defaultColor' in targetItem ? targetItem.defaultColor : targetItem.color);
    const secondaryColor = options?.secondaryColor || targetItem.secondaryColor;
    const rotationY = options?.rotationY ?? ('rotationY' in targetItem ? targetItem.rotationY : 0);
    const elevation = options?.elevation ?? ('elevationOffset' in targetItem ? (targetItem.elevationOffset || 0) : ('position' in targetItem ? targetItem.position[1] : 0));

    const session: ActivePlacementSession = {
      item: targetItem,
      dimensions: dims,
      color,
      secondaryColor,
      rotationY,
      elevation,
      mode: 'cursor',
      isExistingMove: isExisting,
      originalItemId: isExisting ? (targetItem as PlacedFurnitureItem).id : undefined,
    };

    setCursorPlacementInfo({
      active: true,
      itemName: targetItem.name,
      dimensions: dims,
      hoverCoords: null,
      rotationY,
    });

    sceneManagerRef.current?.startCursorPlacement(session, {
      onComplete: (pos, finalRot, finalDims) => {
        if (isExisting) {
          const origId = (targetItem as PlacedFurnitureItem).id;
          const updated = items.map((it) => {
            if (it.id === origId) {
              return {
                ...it,
                position: pos,
                rotationY: finalRot,
                dimensions: finalDims,
                color,
                secondaryColor,
              };
            }
            return it;
          });
          setItems(updated);
          setSelectedItemId(origId);
          pushHistory(roomConfig, updated);
          showToast(`Moved "${targetItem.name}" with cursor`);
        } else {
          const newItem: PlacedFurnitureItem = {
            id: `item-${Date.now()}`,
            modelType: targetItem.modelType,
            name: targetItem.name,
            category: targetItem.category,
            position: pos,
            rotationY: finalRot,
            dimensions: finalDims,
            color,
            secondaryColor,
            price: targetItem.price,
          };
          const updated = [...items, newItem];
          setItems(updated);
          setSelectedItemId(newItem.id);
          pushHistory(roomConfig, updated);
          showToast(`Placed "${newItem.name}"`);
        }
        setCursorPlacementInfo(null);
      },
      onHover: (coords) => {
        setCursorPlacementInfo((prev) => (prev ? { ...prev, hoverCoords: coords } : null));
      },
      onCancel: () => {
        setCursorPlacementInfo(null);
        showToast('Placement cancelled');
      },
    });
  };

  const handlePlaceAtCoordinates = (
    targetItem: FurnitureCatalogItem | PlacedFurnitureItem,
    options: {
      position: [number, number, number];
      dimensions: { width: number; depth: number; height: number };
      color: string;
      secondaryColor?: string;
      rotationY: number;
    }
  ) => {
    const isExisting = 'id' in targetItem && items.some((it) => it.id === targetItem.id);

    if (isExisting) {
      const origId = (targetItem as PlacedFurnitureItem).id;
      const updated = items.map((it) => {
        if (it.id === origId) {
          return {
            ...it,
            position: options.position,
            rotationY: options.rotationY,
            dimensions: options.dimensions,
            color: options.color,
            secondaryColor: options.secondaryColor || it.secondaryColor,
          };
        }
        return it;
      });
      setItems(updated);
      setSelectedItemId(origId);
      pushHistory(roomConfig, updated);
      showToast(`Positioned "${targetItem.name}" at coordinates`);
    } else {
      const newItem: PlacedFurnitureItem = {
        id: `item-${Date.now()}`,
        modelType: targetItem.modelType,
        name: targetItem.name,
        category: targetItem.category,
        position: options.position,
        rotationY: options.rotationY,
        dimensions: options.dimensions,
        color: options.color,
        secondaryColor: options.secondaryColor || targetItem.secondaryColor,
        price: targetItem.price,
      };
      const updated = [...items, newItem];
      setItems(updated);
      setSelectedItemId(newItem.id);
      pushHistory(roomConfig, updated);
      showToast(`Placed "${newItem.name}" at coordinates`);
    }
  };

  const handleRotatePlacementGhost = (delta: number) => {
    sceneManagerRef.current?.rotatePlacementGhost(delta);
    setCursorPlacementInfo((prev) => {
      if (!prev) return null;
      let newRot = (prev.rotationY + delta) % 360;
      if (newRot < 0) newRot += 360;
      return { ...prev, rotationY: Math.round(newRot) };
    });
  };

  const handleCancelCursorPlacement = () => {
    sceneManagerRef.current?.cancelPlacementWithCursor(true);
    setCursorPlacementInfo(null);
  };

  // -------------------------------------------------------------
  // Undo & Redo Handlers
  // -------------------------------------------------------------
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setRoomConfig(prev.roomConfig);
      setItems(prev.items);
      setHistoryIndex(historyIndex - 1);
      showToast('Undo action');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setRoomConfig(next.roomConfig);
      setItems(next.items);
      setHistoryIndex(historyIndex + 1);
      showToast('Redo action');
    }
  };

  const handleAddArchitecturalItem = (item: PlacedFurnitureItem) => {
    const updatedItems = [...items, item];
    setItems(updatedItems);
    setSelectedItemId(item.id);
    pushHistory(roomConfig, updatedItems);
    showToast(`Placed ${item.name}`);
  };

  const handlePlaceFolderProduct = (item: PlacedFurnitureItem) => {
    const updatedItems = [...items, item];
    setItems(updatedItems);
    setSelectedItemId(item.id);
    pushHistory(roomConfig, updatedItems);
    showToast(`Placed "${item.name}" from imported folder`);
  };

  // Keyboard shortcut listeners (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'y') {
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'v') {
        // Quick shortcut to open Image Paster Tool
        setIsImagePasterOpen(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId) {
          handleDeleteItem(selectedItemId);
        }
      } else if (e.key === 'Escape') {
        setSelectedItemId(null);
        setIsRoomSettingsOpen(false);
        setIsWallManagerOpen(false);
        setIsOfficeGridOpen(false);
        setIsImagePasterOpen(false);
        setIsTemplatesOpen(false);
        setIsAIStylistOpen(false);
        setIsBOMOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedItemId, items, roomConfig]);

  // -------------------------------------------------------------
  // Template & Style Harmonizer Loading
  // -------------------------------------------------------------
  const handleLoadTemplate = (template: DesignTemplate) => {
    const newConfig: RoomConfig = {
      ...roomConfig,
      ...template.roomConfig,
      accentWalls: {
        ...roomConfig.accentWalls,
        ...(template.roomConfig.accentWalls || {}),
      },
    };

    const newItems: PlacedFurnitureItem[] = template.items.map((it, idx) => ({
      ...it,
      id: `item-${Date.now()}-${idx}`,
    }));

    setRoomConfig(newConfig);
    setItems(newItems);
    setSelectedItemId(null);
    pushHistory(newConfig, newItems);
    showToast(`Loaded "${template.name}"`);
  };

  const handleApplyAIStyle = (
    newConfig: RoomConfig,
    newItems: PlacedFurnitureItem[],
    recommendedLighting: LightingEnv
  ) => {
    setRoomConfig(newConfig);
    setItems(newItems);
    setLightingEnv(recommendedLighting);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setLightingEnv(recommendedLighting);
    }
    pushHistory(newConfig, newItems);
    showToast('Aesthetic harmonizer applied successfully');
  };

  // -------------------------------------------------------------
  // AI Asking Bar Action Execution (Add / Remove / Restyle)
  // -------------------------------------------------------------
  const handleExecuteAIActions = (actions: AIAction[], responseSummary: string) => {
    let newItems = [...items];
    let newConfig: RoomConfig = { ...roomConfig };
    let hasItemChanges = false;
    let hasConfigChanges = false;
    const addedNames: string[] = [];
    const removedNames: string[] = [];

    for (const act of actions) {
      if (act.type === 'CLEAR_ALL') {
        newItems = [];
        hasItemChanges = true;
      } else if (act.type === 'REMOVE') {
        const initialCount = newItems.length;
        if (act.targetItemId) {
          const target = newItems.find((it) => it.id === act.targetItemId);
          if (target) removedNames.push(target.name);
          newItems = newItems.filter((it) => it.id !== act.targetItemId);
        } else if (act.targetItemName) {
          const targetName = String(act.targetItemName || '').toLowerCase();
          const matches = newItems.filter(
            (it) =>
              (it.name || '').toLowerCase().includes(targetName) ||
              (it.modelType || '').toLowerCase().includes(targetName) ||
              (it.category || '').toLowerCase().includes(targetName)
          );
          matches.forEach((m) => removedNames.push(m.name));
          newItems = newItems.filter(
            (it) =>
              !(it.name || '').toLowerCase().includes(targetName) &&
              !(it.modelType || '').toLowerCase().includes(targetName) &&
              !(it.category || '').toLowerCase().includes(targetName)
          );
        }
        if (newItems.length !== initialCount) {
          hasItemChanges = true;
        }
      } else if (act.type === 'ADD') {
        // Find catalog item
        const catalogItem =
          FURNITURE_CATALOG.find(
            (cat) =>
              cat.id === act.catalogItemId ||
              cat.modelType === act.catalogItemId ||
              cat.name.toLowerCase() === (act.name || '').toLowerCase()
          ) ||
          FURNITURE_CATALOG.find(
            (cat) =>
              (act.name && cat.name.toLowerCase().includes(act.name.toLowerCase())) ||
              (act.catalogItemId && cat.modelType.includes(act.catalogItemId))
          );

        if (catalogItem) {
          const halfWidth = newConfig.width / 2 - 0.5;
          const halfLength = newConfig.length / 2 - 0.5;
          let posX = act.position ? act.position[0] : (Math.random() - 0.5) * 1.5;
          let posY = act.position ? act.position[1] : (catalogItem.elevationOffset || 0);
          let posZ = act.position ? act.position[2] : (Math.random() - 0.5) * 1.5;

          // Clamping inside room bounds
          posX = Math.max(-halfWidth, Math.min(halfWidth, posX));
          posZ = Math.max(-halfLength, Math.min(halfLength, posZ));

          const newItem: PlacedFurnitureItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            modelType: catalogItem.modelType,
            name: catalogItem.name,
            category: catalogItem.category,
            position: [parseFloat(posX.toFixed(2)), posY, parseFloat(posZ.toFixed(2))],
            rotationY: act.rotationY ?? 0,
            dimensions: { ...catalogItem.dimensions },
            color: act.color || catalogItem.defaultColor,
            secondaryColor: catalogItem.secondaryColor,
            price: catalogItem.price,
          };

          newItems.push(newItem);
          addedNames.push(newItem.name);
          hasItemChanges = true;
        }
      } else if (act.type === 'UPDATE_ROOM' && act.roomUpdates) {
        if (act.roomUpdates.flooring) {
          newConfig.flooring = act.roomUpdates.flooring;
          hasConfigChanges = true;
        }
        if (act.roomUpdates.baseWallColor) {
          newConfig.baseWallColor = act.roomUpdates.baseWallColor;
          hasConfigChanges = true;
        }
        if (act.roomUpdates.accentColor) {
          newConfig.accentWalls = {
            ...newConfig.accentWalls,
            north: {
              ...newConfig.accentWalls.north,
              enabled: true,
              color: act.roomUpdates.accentColor,
            },
          };
          hasConfigChanges = true;
        }
      } else if (act.type === 'UPDATE_MASJID_STRUCTURAL' && act.masjidUpdates) {
        newConfig.masjidConfig = {
          isMasjid: true,
          ...(newConfig.masjidConfig || {}),
          ...act.masjidUpdates,
        } as MasjidConfig;
        hasConfigChanges = true;
      } else if (act.type === 'OPEN_STRUCTURAL_MODAL') {
        setIsWallManagerOpen(true);
      }
    }

    if (hasItemChanges || hasConfigChanges) {
      if (hasItemChanges) setItems(newItems);
      if (hasConfigChanges) setRoomConfig(newConfig);
      pushHistory(newConfig, newItems);

      const toastParts = [];
      if (addedNames.length > 0) toastParts.push(`Added ${addedNames.length} item(s)`);
      if (removedNames.length > 0) toastParts.push(`Removed ${removedNames.length} item(s)`);
      if (actions.some((a) => a.type === 'UPDATE_MASJID_STRUCTURAL')) toastParts.push('Updated structural framing');
      if (actions.some((a) => a.type === 'OPEN_STRUCTURAL_MODAL')) toastParts.push('Framing editor opened');
      if (hasConfigChanges && !actions.some((a) => a.type === 'UPDATE_MASJID_STRUCTURAL')) toastParts.push('Updated room finishes');
      showToast(toastParts.join(', ') || 'Updated successfully');
    }
  };

  // -------------------------------------------------------------
  // Multi-Project Management Handlers
  // -------------------------------------------------------------
  const handleSaveProject = useCallback(() => {
    const snapshot = sceneManagerRef.current?.captureSnapshot();
    const now = new Date().toISOString();
    const currentName = activeProject?.name || 'Untitled Project';

    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          roomConfig,
          items,
          lightingEnv,
          thumbnail: snapshot || p.thumbnail,
          updatedAt: now,
        };
      }
      return p;
    });

    setProjects(updatedProjects);
    saveAllProjects(updatedProjects);
    setIsProjectSaved(true);
    showToast(`Project "${currentName}" saved!`);
    setTimeout(() => setIsProjectSaved(false), 2400);
  }, [activeProjectId, activeProject, projects, roomConfig, items, lightingEnv]);

  const handleSelectProject = (project: SavedProject) => {
    // Persist current project state first
    handleSaveProject();

    setActiveProjectIdState(project.id);
    setActiveProjectId(project.id);
    setRoomConfig(project.roomConfig);
    setItems(project.items);
    setLightingEnv(project.lightingEnv || 'daylight');
    sceneManagerRef.current?.setLightingEnv(project.lightingEnv || 'daylight');
    setSelectedItemId(null);
    pushHistory(project.roomConfig, project.items);
    showToast(`Opened project "${project.name}"`);
  };

  const handleCreateProject = (newProject: SavedProject) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    saveAllProjects(updated);

    setActiveProjectIdState(newProject.id);
    setActiveProjectId(newProject.id);
    setRoomConfig(newProject.roomConfig);
    setItems(newProject.items);
    setLightingEnv(newProject.lightingEnv || 'daylight');
    sceneManagerRef.current?.setLightingEnv(newProject.lightingEnv || 'daylight');
    setSelectedItemId(null);
    pushHistory(newProject.roomConfig, newProject.items);
    showToast(`Created & opened "${newProject.name}"`);
  };

  const handleUpdateProjectsList = (updatedList: SavedProject[]) => {
    setProjects(updatedList);
    saveAllProjects(updatedList);
  };

  const handleLoadProjectFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.roomConfig && Array.isArray(parsed.items)) {
          const importedProject: SavedProject = {
            id: parsed.id || `project-${Date.now()}`,
            name: parsed.name || file.name.replace(/\.json$/i, ''),
            description: parsed.description || 'Imported project file',
            createdAt: parsed.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            roomConfig: parsed.roomConfig,
            items: parsed.items,
            lightingEnv: parsed.lightingEnv || 'daylight',
            thumbnail: parsed.thumbnail,
          };
          const updated = [importedProject, ...projects.filter((p) => p.id !== importedProject.id)];
          handleUpdateProjectsList(updated);
          handleSelectProject(importedProject);
          showToast(`Imported project "${importedProject.name}"`);
        } else {
          showToast('Invalid project file format');
        }
      } catch (err) {
        showToast('Error reading project file');
      }
    };
    reader.readAsText(file);
  };

  // -------------------------------------------------------------
  // CAD Drawing Tools Handlers
  // -------------------------------------------------------------
  const handleToggleCADDrawing = () => {
    const next = !isCADDrawingActive;
    setIsCADDrawingActive(next);
    if (next && cameraMode !== '2d-plan') {
      setCameraMode('2d-plan');
      sceneManagerRef.current?.setCameraMode('2d-plan');
      showToast('Switched to 2D Floor Plan CAD Mode with Drawing Tools');
    }
  };

  // Keyboard shortcut listener (Ctrl+S / Cmd+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveProject]);

  // Photo Render Export
  const handleCapturePhotoRender = () => {
    if (!sceneManagerRef.current) return;
    const dataUrl = sceneManagerRef.current.captureSnapshot();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `interior_studio_render_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('High-resolution photo render exported');
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Studio Header */}
      <Header
        cameraMode={cameraMode}
        onSelectCameraMode={(m) => {
          setCameraMode(m);
          sceneManagerRef.current?.setCameraMode(m);
          if (m === '2d-plan') {
            if (!isCADDrawingActive) setIsCADDrawingActive(true);
            setIsCatalogOpen(false);
            setTimeout(() => {
              sceneManagerRef.current?.fitPlanToScreen(isBigger2DView ? 1.15 : 1.3);
            }, 60);
          }
        }}
        lightingEnv={lightingEnv}
        onSelectLightingEnv={(env) => {
          setLightingEnv(env);
          sceneManagerRef.current?.setLightingEnv(env);
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
        onOpenWallManager={() => setIsWallManagerOpen(true)}
        onOpenOfficeGrid={() => setIsOfficeGridOpen(true)}
        onOpenImagePaster={() => setIsImagePasterOpen(true)}
        onOpenDrawWall={handleSwitchTo2DSketch}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenAIStylist={() => setIsAIStylistOpen(true)}
        onOpenBOM={() => setIsBOMOpen(true)}
        onOpenArchitecturalTools={() => setIsArchitecturalToolsOpen(true)}
        onOpenFolderPicker={() => setIsFolderPickerOpen(true)}
        onCapturePhotoRender={handleCapturePhotoRender}
        activeProjectName={activeProject?.name || 'My Interior Project'}
        onOpenProjectManager={(tab) => {
          setProjectManagerTab(tab || 'open');
          setIsProjectManagerOpen(true);
        }}
        onSaveProject={handleSaveProject}
        isProjectSaved={isProjectSaved}
        onLoadProject={handleLoadProjectFile}
        isCADDrawingActive={isCADDrawingActive}
        onToggleCADDrawing={handleToggleCADDrawing}
        onGenerate3D={handleGenerate3D}
        onSwitchTo2DSketch={handleSwitchTo2DSketch}
      />

      {/* Main Studio Viewport & Catalog Drawer */}
      <div className="flex-1 relative w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* 3D WebGL Viewport */}
        <Viewport3D
          roomConfig={roomConfig}
          items={items}
          selectedItem={selectedItem}
          cameraMode={cameraMode}
          sceneManagerRef={sceneManagerRef}
          cursorPlacementInfo={cursorPlacementInfo}
          onSelectItem={(it) => setSelectedItemId(it ? it.id : null)}
          onUpdateItem={handleUpdateItem}
          onDuplicateItem={handleDuplicateItem}
          onDeleteItem={handleDeleteItem}
          onCenterItem={handleCenterItem}
          onStartMoveWithCursor={(it) => handleStartCursorPlacement(it)}
          onRotatePlacementGhost={handleRotatePlacementGhost}
          onCancelCursorPlacement={handleCancelCursorPlacement}
          onToggleGridSnap={() => {
            const nextSnap = !roomConfig.gridSnap;
            const updated = { ...roomConfig, gridSnap: nextSnap };
            setRoomConfig(updated);
            showToast(nextSnap ? 'Grid snap enabled (0.25m)' : 'Grid snap disabled');
          }}
        />

        {/* 2D CAD Architectural Symbols Overlay (Door Swing Arcs, Window Glazing, Measurements) */}
        <CADFloorPlanOverlay
          roomConfig={roomConfig}
          items={items}
          cameraMode={cameraMode}
          sceneManagerRef={sceneManagerRef}
          measurements={cadMeasurements}
          liveDrafting={liveDraftingState}
          isBiggerView={isBigger2DView}
          onToggleBiggerView={handleToggleBiggerView}
        />

        {/* Interactive CAD Drawing Palette (Doors, Windows, Partitions, Measurements) */}
        {isCADDrawingActive && (
          <CADDrawingPalette
            roomConfig={roomConfig}
            items={items}
            activeTool={cadDrawingTool}
            onChangeTool={setCadDrawingTool}
            onAddItem={handleAddItem}
            sceneManagerRef={sceneManagerRef}
            measurements={cadMeasurements}
            onAddMeasurement={(m) => setCadMeasurements((prev) => [...prev, m])}
            onClearMeasurements={() => setCadMeasurements([])}
            onUpdateDraftingState={setLiveDraftingState}
            onGenerate3D={handleGenerate3D}
            onDeleteCustomWalls={() => {
              const remaining = items.filter((it) => !it.customData?.isSketchedWall);
              setItems(remaining);
              pushHistory(roomConfig, remaining);
              showToast('Custom sketched walls cleared');
            }}
            onClosePalette={() => setIsCADDrawingActive(false)}
            onOpenImagePaster={() => setIsImagePasterOpen(true)}
          />
        )}

        {/* Expandable Furniture Catalog Drawer */}
        <CatalogDrawer
          isOpen={isCatalogOpen && !(cameraMode === '2d-plan' && isBigger2DView)}
          onToggle={() => setIsCatalogOpen(!isCatalogOpen)}
          onAddItem={handleAddItem}
          onStartMoveWithCursor={(it) => handleStartCursorPlacement(it)}
          onOpenPlacementOptions={(it) => {
            setPlacementTargetItem(it);
            setIsPlacementOptionsOpen(true);
          }}
          onOpenArchitecturalTools={() => setIsArchitecturalToolsOpen(true)}
          onOpenWallManager={() => setIsWallManagerOpen(true)}
          onOpenFolderPicker={() => setIsFolderPickerOpen(true)}
        />

        {/* AI Asking Bar with Photo Attachment & Add/Remove Execution */}
        {!(cameraMode === '2d-plan' && isBigger2DView) && (
          <AskingBar
            roomConfig={roomConfig}
            currentItems={items}
            onExecuteActions={handleExecuteAIActions}
            onCaptureViewport={() => sceneManagerRef.current?.captureSnapshot() || null}
            onOpenStructuralEditor={() => setIsWallManagerOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <PlacementOptionsModal
        isOpen={isPlacementOptionsOpen}
        onClose={() => {
          setIsPlacementOptionsOpen(false);
          setPlacementTargetItem(null);
        }}
        item={placementTargetItem}
        roomConfig={roomConfig}
        onStartCursorPlacement={(opts) => {
          if (placementTargetItem) {
            handleStartCursorPlacement(placementTargetItem, opts);
          }
        }}
        onPlaceAtCoordinates={(opts) => {
          if (placementTargetItem) {
            handlePlaceAtCoordinates(placementTargetItem, opts);
          }
        }}
      />

      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        activeProjectId={activeProjectId}
        projects={projects}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onUpdateProjectsList={handleUpdateProjectsList}
        currentRoomConfig={roomConfig}
        currentItems={items}
        currentLightingEnv={lightingEnv}
        onSaveCurrentProject={handleSaveProject}
      />

      <RoomSettingsModal
        isOpen={isRoomSettingsOpen}
        onClose={() => setIsRoomSettingsOpen(false)}
        roomConfig={roomConfig}
        onUpdateConfig={(newConfig) => {
          setRoomConfig(newConfig);
          pushHistory(newConfig, items);
        }}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />

      <AIStylistModal
        isOpen={isAIStylistOpen}
        onClose={() => setIsAIStylistOpen(false)}
        roomConfig={roomConfig}
        items={items}
        onApplyPreset={handleApplyAIStyle}
      />

      <BOMModal
        isOpen={isBOMOpen}
        onClose={() => setIsBOMOpen(false)}
        items={items}
        roomConfig={roomConfig}
      />

      <ArchitecturalToolsModal
        isOpen={isArchitecturalToolsOpen}
        onClose={() => setIsArchitecturalToolsOpen(false)}
        roomConfig={roomConfig}
        onAddArchitecturalItem={handleAddArchitecturalItem}
      />

      <WallManagerModal
        isOpen={isWallManagerOpen}
        onClose={() => setIsWallManagerOpen(false)}
        roomConfig={roomConfig}
        onUpdateConfig={(newConfig) => {
          setRoomConfig(newConfig);
          pushHistory(newConfig, items);
        }}
        placedItems={items}
        onRemoveItem={handleDeleteItem}
        onStartCursorPlacement={(item, opts) => handleStartCursorPlacement(item, opts)}
        onAddDirectWall={(wallItem) => handleAddItem(wallItem as any)}
        onOpenOfficeGrid={() => {
          setIsWallManagerOpen(false);
          setIsOfficeGridOpen(true);
        }}
        onOpenImagePaster={() => {
          setIsWallManagerOpen(false);
          setIsImagePasterOpen(true);
        }}
        onSwitchTo2DDrawWall={handleSwitchTo2DSketch}
      />

      <ImagePasterModal
        isOpen={isImagePasterOpen}
        onClose={() => setIsImagePasterOpen(false)}
        roomConfig={roomConfig}
        placedItems={items}
        onAddDirectItem={(item) => {
          handleAddItem(item as any);
          showToast('🖼️ Wall artwork mounted successfully into 3D scene');
        }}
        onStartCursorPlacement={(item, opts) => {
          handleStartCursorPlacement(item, opts);
          showToast('🎯 Move cursor in 3D scene and click wall to mount artwork');
        }}
        onRemoveItem={handleDeleteItem}
        onSelectItem={(id) => setSelectedItemId(id)}
      />

      <OfficeStructuralGridModal
        isOpen={isOfficeGridOpen}
        onClose={() => setIsOfficeGridOpen(false)}
        roomConfig={roomConfig}
        items={items}
        onUpdateConfig={(newConfig) => {
          setRoomConfig(newConfig);
          pushHistory(newConfig, items);
        }}
        onUpdateItems={(newItems) => {
          setItems(newItems);
          pushHistory(roomConfig, newItems);
        }}
        onSelectItemId={(id) => setSelectedItemId(id)}
        showToast={showToast}
      />

      <FolderProductPickerModal
        isOpen={isFolderPickerOpen}
        onClose={() => setIsFolderPickerOpen(false)}
        roomConfig={roomConfig}
        onPlaceProduct={handlePlaceFolderProduct}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-100 text-xs font-medium rounded-xl shadow-2xl animate-fade-in flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
