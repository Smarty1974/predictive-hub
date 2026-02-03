import { PhaseType } from './process';

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabledPhases: PhaseType[];
  previousProcessId?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'classification' | 'regression' | 'nlp' | 'computer_vision' | 'time_series' | 'custom';
  processes: ProcessTemplate[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export const TEMPLATE_CATEGORY_LABELS: Record<ProjectTemplate['category'], string> = {
  classification: 'Classificazione',
  regression: 'Regressione',
  nlp: 'NLP',
  computer_vision: 'Computer Vision',
  time_series: 'Serie Temporali',
  custom: 'Personalizzato',
};
