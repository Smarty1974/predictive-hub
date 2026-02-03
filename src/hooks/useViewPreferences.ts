import { useState, useCallback, useEffect } from 'react';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface ViewPreferences {
  viewMode: 'grid' | 'list';
  sortBy: string;
  statusFilter: string;
  groupFilter: string;
  templateFilter: string;
  columns: ColumnConfig[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Nome', visible: true, order: 0 },
  { id: 'status', label: 'Stato', visible: true, order: 1 },
  { id: 'engine', label: 'Engine', visible: true, order: 2 },
  { id: 'algorithm', label: 'Algoritmo', visible: true, order: 3 },
  { id: 'pipeline', label: 'Pipeline', visible: true, order: 4 },
  { id: 'metrics', label: 'Metriche', visible: true, order: 5 },
  { id: 'group', label: 'Team', visible: true, order: 6 },
  { id: 'version', label: 'Versione', visible: false, order: 7 },
  { id: 'updated', label: 'Aggiornato', visible: true, order: 8 },
];

const DEFAULT_PREFERENCES: ViewPreferences = {
  viewMode: 'grid',
  sortBy: 'updated',
  statusFilter: 'all',
  groupFilter: 'all',
  templateFilter: 'all',
  columns: DEFAULT_COLUMNS,
};

export function useViewPreferences(storageKey: string = 'projects-view-preferences') {
  const [preferences, setPreferences] = useState<ViewPreferences>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load view preferences:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [savedPresets, setSavedPresets] = useState<{ name: string; preferences: ViewPreferences }[]>(() => {
    try {
      const stored = localStorage.getItem(`${storageKey}-presets`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
    return [];
  });

  // Persist preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save view preferences:', e);
    }
  }, [preferences, storageKey]);

  // Persist presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}-presets`, JSON.stringify(savedPresets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  }, [savedPresets, storageKey]);

  const updatePreference = useCallback(<K extends keyof ViewPreferences>(
    key: K,
    value: ViewPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateColumn = useCallback((columnId: string, updates: Partial<ColumnConfig>) => {
    setPreferences(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      ),
    }));
  }, []);

  const reorderColumns = useCallback((newColumns: ColumnConfig[]) => {
    setPreferences(prev => ({
      ...prev,
      columns: newColumns.map((col, index) => ({ ...col, order: index })),
    }));
  }, []);

  const savePreset = useCallback((name: string) => {
    setSavedPresets(prev => {
      const existing = prev.findIndex(p => p.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { name, preferences: { ...preferences } };
        return updated;
      }
      return [...prev, { name, preferences: { ...preferences } }];
    });
  }, [preferences]);

  const loadPreset = useCallback((name: string) => {
    const preset = savedPresets.find(p => p.name === name);
    if (preset) {
      setPreferences(preset.preferences);
    }
  }, [savedPresets]);

  const deletePreset = useCallback((name: string) => {
    setSavedPresets(prev => prev.filter(p => p.name !== name));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const getVisibleColumns = useCallback(() => {
    return [...preferences.columns]
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [preferences.columns]);

  return {
    preferences,
    updatePreference,
    updateColumn,
    reorderColumns,
    savePreset,
    loadPreset,
    deletePreset,
    savedPresets,
    resetToDefaults,
    getVisibleColumns,
  };
}
