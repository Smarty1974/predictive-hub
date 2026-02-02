import { useState, useEffect, useCallback } from 'react';

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: 'version_created' | 'version_restored' | 'phase_updated' | 'link_added' | 'link_removed' | 'description_updated' | 'pipeline_reordered';
  type: 'project' | 'version' | 'pipeline' | 'phase';
  referenceId: string;
  projectId: string;
  versionId?: string;
  userId: string;
  userName: string;
  details: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'ml-platform-activity-logs';

const loadLogs = (): ActivityLogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((log: ActivityLogEntry) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  } catch (e) {
    console.error('Failed to load activity logs:', e);
  }
  return [];
};

const saveLogs = (logs: ActivityLogEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save activity logs:', e);
  }
};

export const useActivityLog = (projectId?: string) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => loadLogs());

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  const addLog = useCallback((
    entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>
  ) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setLogs((prev) => [newEntry, ...prev].slice(0, 500)); // Keep last 500 logs
    return newEntry;
  }, []);

  const getLogsByProject = useCallback((pid: string) => {
    return logs.filter((log) => log.projectId === pid);
  }, [logs]);

  const getLogsByVersion = useCallback((versionId: string) => {
    return logs.filter((log) => log.versionId === versionId);
  }, [logs]);

  const getRecentLogs = useCallback((limit: number = 10) => {
    return logs.slice(0, limit);
  }, [logs]);

  const filteredLogs = projectId 
    ? logs.filter((log) => log.projectId === projectId)
    : logs;

  return {
    logs: filteredLogs,
    allLogs: logs,
    addLog,
    getLogsByProject,
    getLogsByVersion,
    getRecentLogs,
  };
};
