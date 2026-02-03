import { useState, useCallback, useEffect } from 'react';
import { SelectedDatasetConfig } from '@/types/dataset';

const STORAGE_KEY = 'ml-platform-phase-data';

interface PhaseDataConfig {
  processId: string;
  phaseType: string;
  dataCollectionConfig?: {
    selectedDatasets: SelectedDatasetConfig[];
  };
}

export function usePhaseData(projectId: string) {
  const [phaseConfigs, setPhaseConfigs] = useState<Record<string, PhaseDataConfig>>({});
  const [initialized, setInitialized] = useState(false);

  const storageKey = `${STORAGE_KEY}-${projectId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setPhaseConfigs(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse phase data', e);
      }
    }
    setInitialized(true);
  }, [storageKey]);

  const savePhaseConfigs = useCallback((configs: Record<string, PhaseDataConfig>) => {
    setPhaseConfigs(configs);
    localStorage.setItem(storageKey, JSON.stringify(configs));
  }, [storageKey]);

  const getPhaseKey = (processId: string, phaseType: string) => `${processId}-${phaseType}`;

  const getPhaseConfig = useCallback((processId: string, phaseType: string): PhaseDataConfig | undefined => {
    const key = getPhaseKey(processId, phaseType);
    return phaseConfigs[key];
  }, [phaseConfigs]);

  const updateDataCollectionConfig = useCallback((
    processId: string,
    selectedDatasets: SelectedDatasetConfig[]
  ) => {
    const key = getPhaseKey(processId, 'raccolta_dati');
    const updated = {
      ...phaseConfigs,
      [key]: {
        processId,
        phaseType: 'raccolta_dati',
        dataCollectionConfig: { selectedDatasets },
      },
    };
    savePhaseConfigs(updated);
  }, [phaseConfigs, savePhaseConfigs]);

  const getDataCollectionConfig = useCallback((processId: string): SelectedDatasetConfig[] => {
    const config = getPhaseConfig(processId, 'raccolta_dati');
    return config?.dataCollectionConfig?.selectedDatasets || [];
  }, [getPhaseConfig]);

  return {
    initialized,
    getPhaseConfig,
    updateDataCollectionConfig,
    getDataCollectionConfig,
  };
}
