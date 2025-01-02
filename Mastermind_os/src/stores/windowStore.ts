import { create } from 'zustand';
import type { WindowState } from '../types/window';

interface WindowStore {
  windows: WindowState[];
  activeWindow: string | null;
  addWindow: (windowState: Omit<WindowState, 'zIndex'>) => void;
  removeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  hasWindowType: (type: WindowState['type']) => boolean;
  getNextWindowPosition: () => { x: number; y: number };
}

const WINDOW_CASCADE_OFFSET = 30;
const INITIAL_WINDOW_POSITION = { x: 100, y: 100 };
const MIN_WINDOW_MARGIN = 50;
const DEFAULT_WINDOW_WIDTH = 400;
const DEFAULT_WINDOW_HEIGHT = 300;

// Helper to get viewport dimensions safely
const getViewportDimensions = () => ({
  width: typeof globalThis.window !== 'undefined' ? globalThis.window.innerWidth : 1024,
  height: typeof globalThis.window !== 'undefined' ? globalThis.window.innerHeight : 768,
});

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindow: null,

  addWindow: (windowState) => {
    const { windows, getNextWindowPosition } = get();
    
    // Use provided ID or generate a unique one
    const windowId = windowState.id || `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prevent duplicate windows by ID
    if (windows.some(w => w.id === windowId)) {
      console.warn(`Window with ID ${windowId} already exists`);
      return;
    }

    // Calculate position if not provided
    const position = windowState.position || getNextWindowPosition();
    const viewport = getViewportDimensions();

    // Ensure position is within viewport bounds
    const safePosition = {
      x: Math.max(MIN_WINDOW_MARGIN, Math.min(position.x, viewport.width - MIN_WINDOW_MARGIN)),
      y: Math.max(MIN_WINDOW_MARGIN, Math.min(position.y, viewport.height - MIN_WINDOW_MARGIN))
    };

    // Calculate next z-index
    const nextZIndex = Math.max(...windows.map(w => w.zIndex || 0), 0) + 1;

    set({
      windows: [
        ...windows,
        {
          ...windowState,
          id: windowId,
          position: safePosition,
          zIndex: nextZIndex,
        } as WindowState,
      ],
      activeWindow: windowId,
    });
  },

  removeWindow: (id) =>
    set((state) => {
      const newWindows = state.windows.filter((w) => w.id !== id);
      return {
        windows: newWindows,
        // If removing active window, activate the next highest z-index window
        activeWindow: state.activeWindow === id 
          ? newWindows.length > 0
            ? newWindows.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
            : null
          : state.activeWindow,
      };
    }),

  setActiveWindow: (id) =>
    set((state) => {
      if (!state.windows.some(w => w.id === id)) return state;

      const maxZIndex = Math.max(...state.windows.map(w => w.zIndex));
      return {
        windows: state.windows.map((w) => ({
          ...w,
          zIndex: w.id === id ? maxZIndex + 1 : w.zIndex,
        })),
        activeWindow: id,
      };
    }),

  updateWindow: (id, updates) =>
    set((state) => {
      const windowIndex = state.windows.findIndex(w => w.id === id);
      if (windowIndex === -1) return state;

      const updatedWindows = [...state.windows];
      updatedWindows[windowIndex] = {
        ...updatedWindows[windowIndex],
        ...updates,
        // Preserve id and ensure zIndex is valid
        id,
        zIndex: updates.zIndex || updatedWindows[windowIndex].zIndex,
      };

      return { windows: updatedWindows };
    }),

  hasWindowType: (type: WindowState['type']) => {
    const { windows } = get();
    return windows.some(w => w.type === type);
  },

  getNextWindowPosition: () => {
    const { windows } = get();
    if (windows.length === 0) {
      return INITIAL_WINDOW_POSITION;
    }

    const lastWindow = windows[windows.length - 1];
    const viewport = getViewportDimensions();

    // Calculate next position with bounds checking
    const nextX = (lastWindow.position.x + WINDOW_CASCADE_OFFSET) % (viewport.width - DEFAULT_WINDOW_WIDTH);
    const nextY = (lastWindow.position.y + WINDOW_CASCADE_OFFSET) % (viewport.height - DEFAULT_WINDOW_HEIGHT);

    return {
      x: Math.max(MIN_WINDOW_MARGIN, Math.min(nextX, viewport.width - MIN_WINDOW_MARGIN - DEFAULT_WINDOW_WIDTH)),
      y: Math.max(MIN_WINDOW_MARGIN, Math.min(nextY, viewport.height - MIN_WINDOW_MARGIN - DEFAULT_WINDOW_HEIGHT))
    };
  },
}));
