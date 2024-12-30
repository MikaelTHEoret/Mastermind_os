import { create } from 'zustand';
import type { WindowState } from '../types/window';

interface WindowStore {
  windows: WindowState[];
  activeWindow: string | null;
  addWindow: (window: Omit<WindowState, 'zIndex'>) => void;
  removeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  hasWindowType: (type: string) => boolean;
  getNextWindowPosition: () => { x: number; y: number };
}

const WINDOW_CASCADE_OFFSET = 30;
const INITIAL_WINDOW_POSITION = { x: 100, y: 100 };

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindow: null,

  addWindow: (window) => {
    const { windows, getNextWindowPosition, hasWindowType } = get();
    
    // Use provided ID or generate a unique one
    const position = getNextWindowPosition();
    const windowId = window.id || `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prevent duplicate windows by ID
    if (windows.some(w => w.id === windowId)) {
      return;
    }

    set({
      windows: [
        ...windows,
        {
          ...window,
          id: windowId,
          position,
          zIndex: Math.max(...windows.map(w => w.zIndex || 0), 0) + 1,
        },
      ],
      activeWindow: windowId,
    });
  },

  removeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindow: state.activeWindow === id ? null : state.activeWindow,
    })),

  setActiveWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => ({
        ...w,
        zIndex: w.id === id ? Math.max(...state.windows.map(w => w.zIndex || 0), 0) + 1 : w.zIndex,
      })),
      activeWindow: id,
    })),

  updateWindow: (id, updates) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  hasWindowType: (type) => {
    const { windows } = get();
    return windows.some(w => w.type === type);
  },

  getNextWindowPosition: () => {
    const { windows } = get();
    if (windows.length === 0) {
      return INITIAL_WINDOW_POSITION;
    }

    const lastWindow = windows[windows.length - 1];
    const x = (lastWindow.position.x + WINDOW_CASCADE_OFFSET) % (window.innerWidth - 400);
    const y = (lastWindow.position.y + WINDOW_CASCADE_OFFSET) % (window.innerHeight - 300);

    return { x, y };
  },
}));
