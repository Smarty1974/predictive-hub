import { LucideIcon } from 'lucide-react';

export type PhaseStatus = 
  | 'da_avviare' 
  | 'avviato' 
  | 'in_esecuzione' 
  | 'bloccato' 
  | 'in_errore' 
  | 'completato';

export type PhaseType = 
  | 'comprensione_problema'
  | 'raccolta_dati'
  | 'modellazione'
  | 'ottimizzazione'
  | 'realtime'
  | 'valutazione'
  | 'produzione';

export interface PhaseLink {
  id: string;
  title: string;
  url: string;
  type: 'documentation' | 'dataset' | 'reference' | 'external';
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  userId: string;
  userName: string;
}

export interface BasePhase {
  id: string;
  type: PhaseType;
  startDate?: Date;
  version: number;
  status: PhaseStatus;
  enabled: boolean;
}

export interface ComprensioneProblemaPhase extends BasePhase {
  type: 'comprensione_problema';
  description: string;
  links: PhaseLink[];
  activityLogs: ActivityLogEntry[];
}

export interface RaccoltaDatiPhase extends BasePhase {
  type: 'raccolta_dati';
  selectedDatasets: string[];
  normalizationFormulas: string[];
  additionalColumns: { name: string; formula: string }[];
}

export interface ModellazionePhase extends BasePhase {
  type: 'modellazione';
  modelConfig: Record<string, unknown>;
}

export interface OttimizzazionePhase extends BasePhase {
  type: 'ottimizzazione';
  optimizationConfig: Record<string, unknown>;
}

export interface RealtimePhase extends BasePhase {
  type: 'realtime';
  realtimeConfig: Record<string, unknown>;
}

export interface ValutazionePhase extends BasePhase {
  type: 'valutazione';
  evaluationConfig: Record<string, unknown>;
}

export interface ProduzionePhase extends BasePhase {
  type: 'produzione';
  productionConfig: Record<string, unknown>;
}

export type ProcessPhase = 
  | ComprensioneProblemaPhase
  | RaccoltaDatiPhase
  | ModellazionePhase
  | OttimizzazionePhase
  | RealtimePhase
  | ValutazionePhase
  | ProduzionePhase;

export interface Process {
  id: string;
  name: string;
  description: string;
  icon: string;
  previousProcessId?: string;
  phases: ProcessPhase[];
  createdAt: Date;
  updatedAt: Date;
}

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  da_avviare: 'Da Avviare',
  avviato: 'Avviato',
  in_esecuzione: 'In Esecuzione',
  bloccato: 'Bloccato',
  in_errore: 'In Errore',
  completato: 'Completato',
};

export const PHASE_STATUS_COLORS: Record<PhaseStatus, string> = {
  da_avviare: 'bg-muted text-muted-foreground',
  avviato: 'bg-blue-500/20 text-blue-500',
  in_esecuzione: 'bg-amber-500/20 text-amber-500',
  bloccato: 'bg-orange-500/20 text-orange-500',
  in_errore: 'bg-destructive/20 text-destructive',
  completato: 'bg-green-500/20 text-green-500',
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  comprensione_problema: 'Comprensione Problema',
  raccolta_dati: 'Raccolta Dati',
  modellazione: 'Pipeline di Modellazione',
  ottimizzazione: 'Pipeline di Ottimizzazione',
  realtime: 'Pipeline Realtime',
  valutazione: 'Valutazione',
  produzione: 'Produzione',
};

export const AVAILABLE_ICONS = [
  'Brain', 'Database', 'Cog', 'Zap', 'Activity', 'Target', 'Rocket',
  'GitBranch', 'Layers', 'Box', 'Cpu', 'BarChart', 'LineChart', 'PieChart',
  'Network', 'Workflow', 'Sparkles', 'Lightbulb', 'Gauge', 'Shield'
];
