import { create } from 'zustand';

interface LogEntry {
  id: string;
  timestamp: number;
  source: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

interface LogStore {
  logs: LogEntry[];
  filters: Set<string>;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  toggleFilter: (source: string) => void;
  clearFilters: () => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  filters: new Set(),
  addLog: (log) =>
    set((state) => ({
      logs: [
        {
          ...log,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        },
        ...state.logs,
      ].slice(0, 1000), // Keep last 1000 logs
    })),
  clearLogs: () => set({ logs: [] }),
  toggleFilter: (source) =>
    set((state) => {
      const newFilters = new Set(state.filters);
      if (newFilters.has(source)) {
        newFilters.delete(source);
      } else {
        newFilters.add(source);
      }
      return { filters: newFilters };
    }),
  clearFilters: () => set({ filters: new Set() }),
}));
