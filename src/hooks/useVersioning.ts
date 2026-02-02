import { useState, useEffect, useCallback } from 'react';
import { PipelineStep, PipelinePhase } from '@/types/ml-project';

export interface VersionChange {
  type: 'added' | 'modified' | 'removed';
  phase: PipelinePhase;
  field: string;
  oldValue?: string;
  newValue?: string;
}

export interface ProjectVersion {
  id: string;
  version: number;
  projectId: string;
  projectName: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  changes: VersionChange[];
  pipelineSnapshot: PipelineStep[];
  status: 'current' | 'previous' | 'archived';
}

const STORAGE_KEY = 'ml-platform-versions';

const loadVersions = (): ProjectVersion[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((v: ProjectVersion) => ({
        ...v,
        createdAt: new Date(v.createdAt),
        pipelineSnapshot: v.pipelineSnapshot.map((step: PipelineStep) => ({
          ...step,
          startedAt: step.startedAt ? new Date(step.startedAt) : undefined,
          completedAt: step.completedAt ? new Date(step.completedAt) : undefined,
        })),
      }));
    }
  } catch (e) {
    console.error('Failed to load versions:', e);
  }
  return [];
};

const saveVersions = (versions: ProjectVersion[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  } catch (e) {
    console.error('Failed to save versions:', e);
  }
};

const computeChanges = (
  oldPipeline: PipelineStep[],
  newPipeline: PipelineStep[]
): VersionChange[] => {
  const changes: VersionChange[] = [];

  newPipeline.forEach((newStep) => {
    const oldStep = oldPipeline.find((s) => s.id === newStep.id);
    
    if (!oldStep) {
      changes.push({
        type: 'added',
        phase: newStep.phase,
        field: 'phase',
        newValue: newStep.phase,
      });
      return;
    }

    // Check status change
    if (oldStep.status !== newStep.status) {
      changes.push({
        type: 'modified',
        phase: newStep.phase,
        field: 'status',
        oldValue: oldStep.status,
        newValue: newStep.status,
      });
    }

    // Check description change
    if (oldStep.description !== newStep.description) {
      changes.push({
        type: 'modified',
        phase: newStep.phase,
        field: 'description',
        oldValue: oldStep.description || '(vuoto)',
        newValue: newStep.description || '(vuoto)',
      });
    }

    // Check links changes
    if (oldStep.links.length !== newStep.links.length) {
      const diff = newStep.links.length - oldStep.links.length;
      changes.push({
        type: diff > 0 ? 'added' : 'removed',
        phase: newStep.phase,
        field: 'links',
        oldValue: `${oldStep.links.length} link`,
        newValue: `${newStep.links.length} link`,
      });
    }

    // Check config changes
    const oldConfig = JSON.stringify(oldStep.config);
    const newConfig = JSON.stringify(newStep.config);
    if (oldConfig !== newConfig) {
      changes.push({
        type: 'modified',
        phase: newStep.phase,
        field: 'config',
        oldValue: 'configurazione precedente',
        newValue: 'nuova configurazione',
      });
    }
  });

  // Check for removed phases
  oldPipeline.forEach((oldStep) => {
    const exists = newPipeline.find((s) => s.id === oldStep.id);
    if (!exists) {
      changes.push({
        type: 'removed',
        phase: oldStep.phase,
        field: 'phase',
        oldValue: oldStep.phase,
      });
    }
  });

  return changes;
};

export const useVersioning = (projectId: string) => {
  const [versions, setVersions] = useState<ProjectVersion[]>(() => loadVersions());

  useEffect(() => {
    saveVersions(versions);
  }, [versions]);

  const projectVersions = versions
    .filter((v) => v.projectId === projectId)
    .sort((a, b) => b.version - a.version);

  const currentVersion = projectVersions.find((v) => v.status === 'current');

  const createVersion = useCallback((
    projectName: string,
    pipeline: PipelineStep[],
    createdBy: string,
    description: string
  ) => {
    const existingVersions = versions.filter((v) => v.projectId === projectId);
    const newVersionNumber = existingVersions.length > 0
      ? Math.max(...existingVersions.map((v) => v.version)) + 1
      : 1;

    const previousPipeline = currentVersion?.pipelineSnapshot || [];
    const changes = computeChanges(previousPipeline, pipeline);

    // Update all previous versions status
    const updatedVersions = versions.map((v) => 
      v.projectId === projectId && v.status === 'current'
        ? { ...v, status: 'previous' as const }
        : v
    );

    const newVersion: ProjectVersion = {
      id: `${projectId}-v${newVersionNumber}`,
      version: newVersionNumber,
      projectId,
      projectName,
      createdAt: new Date(),
      createdBy,
      description,
      changes,
      pipelineSnapshot: JSON.parse(JSON.stringify(pipeline)),
      status: 'current',
    };

    setVersions([...updatedVersions, newVersion]);
    return newVersion;
  }, [projectId, versions, currentVersion]);

  const restoreVersion = useCallback((versionId: string): PipelineStep[] | null => {
    const version = versions.find((v) => v.id === versionId);
    if (!version) return null;

    // Mark restored version as current
    const updatedVersions = versions.map((v) => {
      if (v.projectId === projectId) {
        if (v.id === versionId) {
          return { ...v, status: 'current' as const };
        }
        return { ...v, status: v.status === 'current' ? 'previous' as const : v.status };
      }
      return v;
    });

    setVersions(updatedVersions);
    return version.pipelineSnapshot;
  }, [projectId, versions]);

  const compareVersions = useCallback((versionId1: string, versionId2: string) => {
    const v1 = versions.find((v) => v.id === versionId1);
    const v2 = versions.find((v) => v.id === versionId2);
    
    if (!v1 || !v2) return null;

    const changes = computeChanges(v1.pipelineSnapshot, v2.pipelineSnapshot);
    
    return {
      version1: v1,
      version2: v2,
      changes,
    };
  }, [versions]);

  return {
    versions: projectVersions,
    allVersions: versions,
    currentVersion,
    createVersion,
    restoreVersion,
    compareVersions,
  };
};
