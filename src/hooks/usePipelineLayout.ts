import { useState, useCallback, useEffect } from 'react';

export interface SectionLayout {
  id: string;
  order: number;
  visible: boolean;
}

export interface PipelineLayoutConfig {
  sections: SectionLayout[];
  phaseOrder: string[];
}

const DEFAULT_SECTIONS: SectionLayout[] = [
  { id: 'overview', order: 0, visible: true },
  { id: 'phases', order: 1, visible: true },
  { id: 'data', order: 2, visible: true },
  { id: 'metrics', order: 3, visible: true },
  { id: 'logs', order: 4, visible: true },
  { id: 'versions', order: 5, visible: true },
];

export function usePipelineLayout(projectId: string) {
  const storageKey = `pipeline-layout-${projectId}`;

  const [layout, setLayout] = useState<PipelineLayoutConfig>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load pipeline layout:', e);
    }
    return {
      sections: DEFAULT_SECTIONS,
      phaseOrder: [],
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (e) {
      console.error('Failed to save pipeline layout:', e);
    }
  }, [layout, storageKey]);

  const reorderSections = useCallback((newSections: SectionLayout[]) => {
    setLayout(prev => ({
      ...prev,
      sections: newSections.map((section, index) => ({ ...section, order: index })),
    }));
  }, []);

  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, visible: !section.visible } : section
      ),
    }));
  }, []);

  const reorderPhases = useCallback((newPhaseOrder: string[]) => {
    setLayout(prev => ({
      ...prev,
      phaseOrder: newPhaseOrder,
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout({
      sections: DEFAULT_SECTIONS,
      phaseOrder: [],
    });
  }, []);

  const getOrderedSections = useCallback(() => {
    return [...layout.sections]
      .filter(section => section.visible)
      .sort((a, b) => a.order - b.order);
  }, [layout.sections]);

  return {
    layout,
    reorderSections,
    toggleSectionVisibility,
    reorderPhases,
    resetLayout,
    getOrderedSections,
  };
}
