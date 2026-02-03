import { useEffect, useRef } from 'react';
import { mockProjects } from '@/data/mock-data';
import { useTemplates, ALGORITHM_TO_TEMPLATE } from './useTemplates';

const AUTO_INIT_KEY = 'ml-platform-auto-initialized';
const STORAGE_KEY = 'ml-platform-processes';

export function useAutoInitializeProjects() {
  const { templates } = useTemplates();
  const initialized = useRef(false);

  useEffect(() => {
    // Only run once and when templates are loaded
    if (initialized.current || templates.length === 0) return;

    // Check if we've already run auto-initialization
    const alreadyInitialized = localStorage.getItem(AUTO_INIT_KEY);
    if (alreadyInitialized) {
      initialized.current = true;
      return;
    }

    // Initialize each project that doesn't have processes
    mockProjects.forEach(project => {
      const storageKey = `${STORAGE_KEY}-${project.id}`;
      const existingProcesses = localStorage.getItem(storageKey);
      
      // Skip if already has processes
      if (existingProcesses) {
        try {
          const parsed = JSON.parse(existingProcesses);
          if (parsed.length > 0) return;
        } catch (e) {
          // Continue with initialization
        }
      }

      // Find the appropriate template based on algorithm
      const templateId = ALGORITHM_TO_TEMPLATE[project.algorithm];
      if (!templateId) return;

      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Create processes from template
      const idMapping: Record<string, string> = {};
      
      const newProcesses = template.processes.map((tp, index) => {
        const newId = `process-${Date.now()}-${project.id}-${index}`;
        idMapping[tp.id] = newId;

        const ALL_PHASE_TYPES = [
          'comprensione_problema',
          'raccolta_dati',
          'modellazione',
          'ottimizzazione',
          'realtime',
          'valutazione',
          'produzione',
        ] as const;

        const phases = ALL_PHASE_TYPES.map(type => ({
          id: `phase-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          version: 1,
          status: 'da_avviare',
          enabled: tp.enabledPhases.includes(type),
          ...(type === 'comprensione_problema' && { description: '', links: [], activityLogs: [] }),
          ...(type === 'raccolta_dati' && { selectedDatasets: [], normalizationFormulas: [], additionalColumns: [] }),
          ...(type === 'modellazione' && { modelConfig: {} }),
          ...(type === 'ottimizzazione' && { optimizationConfig: {} }),
          ...(type === 'realtime' && { realtimeConfig: {} }),
          ...(type === 'valutazione' && { evaluationConfig: {} }),
          ...(type === 'produzione' && { productionConfig: {} }),
        }));

        return {
          id: newId,
          name: tp.name,
          description: tp.description,
          icon: tp.icon,
          previousProcessId: undefined,
          phases,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Update previousProcessId references
      template.processes.forEach((tp, index) => {
        if (tp.previousProcessId && idMapping[tp.previousProcessId]) {
          newProcesses[index].previousProcessId = idMapping[tp.previousProcessId];
        }
      });

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(newProcesses));
    });

    // Mark as initialized
    localStorage.setItem(AUTO_INIT_KEY, 'true');
    initialized.current = true;
  }, [templates]);
}
