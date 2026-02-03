import { useState, useCallback, useEffect } from 'react';
import { ProjectTemplate, ProcessTemplate } from '@/types/template';
import { PhaseType } from '@/types/process';

const STORAGE_KEY = 'ml-platform-templates';

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'template-classification',
    name: 'Classificazione Standard',
    description: 'Template per progetti di classificazione con pipeline completa',
    category: 'classification',
    isDefault: true,
    processes: [
      {
        id: 'process-main',
        name: 'Pipeline Principale',
        description: 'Processo principale di classificazione',
        icon: 'Brain',
        enabledPhases: ['comprensione_problema', 'raccolta_dati', 'modellazione', 'valutazione', 'produzione'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'template-nlp',
    name: 'NLP Pipeline',
    description: 'Template per progetti di Natural Language Processing',
    category: 'nlp',
    isDefault: true,
    processes: [
      {
        id: 'process-nlp',
        name: 'Elaborazione Testo',
        description: 'Pipeline NLP con preprocessing e modellazione',
        icon: 'FileText',
        enabledPhases: ['comprensione_problema', 'raccolta_dati', 'modellazione', 'ottimizzazione', 'valutazione', 'produzione'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'template-realtime',
    name: 'Inferenza Realtime',
    description: 'Template per progetti con inferenza in tempo reale',
    category: 'custom',
    isDefault: true,
    processes: [
      {
        id: 'process-training',
        name: 'Training Offline',
        description: 'Addestramento del modello',
        icon: 'Cpu',
        enabledPhases: ['comprensione_problema', 'raccolta_dati', 'modellazione', 'ottimizzazione', 'valutazione'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
      {
        id: 'process-realtime',
        name: 'Servizio Realtime',
        description: 'Inferenza in tempo reale',
        icon: 'Zap',
        enabledPhases: ['realtime', 'produzione'],
        previousProcessId: 'process-training',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
];

export function useTemplates() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((t: ProjectTemplate) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          processes: t.processes.map(p => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })),
        }));
        // Merge with defaults
        const defaultIds = DEFAULT_TEMPLATES.map(d => d.id);
        const userTemplates = withDates.filter((t: ProjectTemplate) => !defaultIds.includes(t.id));
        setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
      } catch (e) {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  const saveTemplates = useCallback((newTemplates: ProjectTemplate[]) => {
    setTemplates(newTemplates);
    // Only save non-default templates
    const toSave = newTemplates.filter(t => !t.isDefault);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const createTemplate = useCallback((data: {
    name: string;
    description: string;
    category: ProjectTemplate['category'];
    processes: Omit<ProcessTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[];
  }) => {
    const newTemplate: ProjectTemplate = {
      id: `template-${Date.now()}`,
      name: data.name,
      description: data.description,
      category: data.category,
      processes: data.processes.map((p, idx) => ({
        ...p,
        id: `process-${Date.now()}-${idx}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
    };
    saveTemplates([...templates, newTemplate]);
    return newTemplate;
  }, [templates, saveTemplates]);

  const updateTemplate = useCallback((templateId: string, data: Partial<ProjectTemplate>) => {
    const updated = templates.map(t => {
      if (t.id !== templateId || t.isDefault) return t;
      return { ...t, ...data, updatedAt: new Date() };
    });
    saveTemplates(updated);
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((templateId: string) => {
    const filtered = templates.filter(t => t.id !== templateId || t.isDefault);
    saveTemplates(filtered);
  }, [templates, saveTemplates]);

  const duplicateTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    const duplicate: ProjectTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copia)`,
      isDefault: false,
      processes: template.processes.map((p, idx) => ({
        ...p,
        id: `process-${Date.now()}-${idx}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
    };
    saveTemplates([...templates, duplicate]);
    return duplicate;
  }, [templates, saveTemplates]);

  const saveAsTemplate = useCallback((
    name: string,
    description: string,
    category: ProjectTemplate['category'],
    processes: ProcessTemplate[]
  ) => {
    const newTemplate: ProjectTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      category,
      processes: processes.map((p, idx) => ({
        ...p,
        id: `process-${Date.now()}-${idx}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
    };
    saveTemplates([...templates, newTemplate]);
    return newTemplate;
  }, [templates, saveTemplates]);

  return {
    templates,
    defaultTemplates: templates.filter(t => t.isDefault),
    userTemplates: templates.filter(t => !t.isDefault),
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    saveAsTemplate,
  };
}
