import { useState, useCallback, useEffect } from 'react';
import { Process, ProcessPhase, PhaseType, PhaseStatus } from '@/types/process';
import { ProcessTemplate } from '@/types/template';

const STORAGE_KEY = 'ml-platform-processes';

const createDefaultPhase = (type: PhaseType, enabled: boolean): ProcessPhase => {
  const base = {
    id: `phase-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    version: 1,
    status: 'da_avviare' as PhaseStatus,
    enabled,
  };

  switch (type) {
    case 'comprensione_problema':
      return { ...base, type: 'comprensione_problema', description: '', links: [], activityLogs: [] };
    case 'raccolta_dati':
      return { ...base, type: 'raccolta_dati', selectedDatasets: [], normalizationFormulas: [], additionalColumns: [] };
    case 'modellazione':
      return { ...base, type: 'modellazione', modelConfig: {} };
    case 'ottimizzazione':
      return { ...base, type: 'ottimizzazione', optimizationConfig: {} };
    case 'realtime':
      return { ...base, type: 'realtime', realtimeConfig: {} };
    case 'valutazione':
      return { ...base, type: 'valutazione', evaluationConfig: {} };
    case 'produzione':
      return { ...base, type: 'produzione', productionConfig: {} };
  }
};

const ALL_PHASE_TYPES: PhaseType[] = [
  'comprensione_problema',
  'raccolta_dati',
  'modellazione',
  'ottimizzazione',
  'realtime',
  'valutazione',
  'produzione',
];

export function useProcesses(projectId: string) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [initialized, setInitialized] = useState(false);

  const storageKey = `${STORAGE_KEY}-${projectId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProcesses(parsed.map((p: Process) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          phases: p.phases.map(phase => ({
            ...phase,
            startDate: phase.startDate ? new Date(phase.startDate) : undefined,
          })),
        })));
      } catch (e) {
        console.error('Failed to parse processes', e);
      }
    }
    setInitialized(true);
  }, [storageKey]);

  const saveProcesses = useCallback((newProcesses: Process[]) => {
    setProcesses(newProcesses);
    localStorage.setItem(storageKey, JSON.stringify(newProcesses));
  }, [storageKey]);

  const createProcess = useCallback((data: {
    name: string;
    description: string;
    icon: string;
    previousProcessId?: string;
    enabledPhases: PhaseType[];
  }) => {
    const phases = ALL_PHASE_TYPES.map(type => 
      createDefaultPhase(type, data.enabledPhases.includes(type))
    );

    const newProcess: Process = {
      id: `process-${Date.now()}`,
      name: data.name,
      description: data.description,
      icon: data.icon,
      previousProcessId: data.previousProcessId,
      phases,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveProcesses([...processes, newProcess]);
    return newProcess;
  }, [processes, saveProcesses]);

  const initializeFromTemplate = useCallback((templateProcesses: ProcessTemplate[]) => {
    // Only initialize if no processes exist yet
    if (processes.length > 0) return;

    // Create a mapping from template process IDs to new process IDs
    const idMapping: Record<string, string> = {};
    
    const newProcesses: Process[] = templateProcesses.map((tp, index) => {
      const newId = `process-${Date.now()}-${index}`;
      idMapping[tp.id] = newId;
      
      const phases = ALL_PHASE_TYPES.map(type => 
        createDefaultPhase(type, tp.enabledPhases.includes(type))
      );

      return {
        id: newId,
        name: tp.name,
        description: tp.description,
        icon: tp.icon,
        previousProcessId: undefined, // Will be set in second pass
        phases,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Second pass: update previousProcessId references
    templateProcesses.forEach((tp, index) => {
      if (tp.previousProcessId && idMapping[tp.previousProcessId]) {
        newProcesses[index].previousProcessId = idMapping[tp.previousProcessId];
      }
    });

    saveProcesses(newProcesses);
    return newProcesses;
  }, [processes, saveProcesses]);

  const updateProcess = useCallback((processId: string, data: {
    name: string;
    description: string;
    icon: string;
    previousProcessId?: string;
    enabledPhases: PhaseType[];
  }) => {
    const updated = processes.map(p => {
      if (p.id !== processId) return p;

      const updatedPhases = p.phases.map(phase => ({
        ...phase,
        enabled: data.enabledPhases.includes(phase.type),
      }));

      return {
        ...p,
        name: data.name,
        description: data.description,
        icon: data.icon,
        previousProcessId: data.previousProcessId,
        phases: updatedPhases,
        updatedAt: new Date(),
      };
    });

    saveProcesses(updated);
  }, [processes, saveProcesses]);

  const deleteProcess = useCallback((processId: string) => {
    // Also remove references from other processes
    const updated = processes
      .filter(p => p.id !== processId)
      .map(p => ({
        ...p,
        previousProcessId: p.previousProcessId === processId ? undefined : p.previousProcessId,
      }));

    saveProcesses(updated);
  }, [processes, saveProcesses]);

  const togglePhase = useCallback((processId: string, phaseType: PhaseType, enabled: boolean) => {
    const updated = processes.map(p => {
      if (p.id !== processId) return p;

      return {
        ...p,
        phases: p.phases.map(phase => 
          phase.type === phaseType ? { ...phase, enabled } : phase
        ),
        updatedAt: new Date(),
      };
    });

    saveProcesses(updated);
  }, [processes, saveProcesses]);

  const updatePhaseStatus = useCallback((processId: string, phaseType: PhaseType, status: PhaseStatus) => {
    const updated = processes.map(p => {
      if (p.id !== processId) return p;

      return {
        ...p,
        phases: p.phases.map(phase => {
          if (phase.type !== phaseType) return phase;
          return {
            ...phase,
            status,
            startDate: status !== 'da_avviare' && !phase.startDate ? new Date() : phase.startDate,
          };
        }),
        updatedAt: new Date(),
      };
    });

    saveProcesses(updated);
  }, [processes, saveProcesses]);

  return {
    processes,
    initialized,
    createProcess,
    updateProcess,
    deleteProcess,
    togglePhase,
    updatePhaseStatus,
    initializeFromTemplate,
  };
}
