export type PipelinePhase = 
  | 'problem_understanding'
  | 'data_collection'
  | 'model_training'
  | 'evaluation'
  | 'deployment';

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export type MLEngine = 
  | 'tensorflow'
  | 'pytorch'
  | 'scikit-learn'
  | 'xgboost'
  | 'lightgbm'
  | 'keras'
  | 'huggingface'
  | 'spark-ml';

export type MLAlgorithm =
  | 'linear_regression'
  | 'logistic_regression'
  | 'random_forest'
  | 'gradient_boosting'
  | 'neural_network'
  | 'cnn'
  | 'rnn'
  | 'transformer'
  | 'svm'
  | 'kmeans'
  | 'pca';

export interface PhaseLink {
  id: string;
  title: string;
  url: string;
  type: 'documentation' | 'dataset' | 'model' | 'notebook' | 'external';
  addedAt: Date;
  addedBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  userId: string;
  userName: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineStep {
  id: string;
  phase: PipelinePhase;
  status: PhaseStatus;
  description?: string;
  links: PhaseLink[];
  activityLogs: ActivityLog[];
  startedAt?: Date;
  completedAt?: Date;
  logs: LogEntry[];
  version: number;
  config: Record<string, unknown>;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectVersion {
  id: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  description: string;
  changes: VersionChange[];
  pipelineSnapshot: PipelineStep[];
}

export interface VersionChange {
  phase: PipelinePhase;
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface MLProject {
  id: string;
  name: string;
  description: string;
  engine: MLEngine;
  algorithm: MLAlgorithm;
  status: 'active' | 'paused' | 'completed' | 'archived';
  pipeline: PipelineStep[];
  versions: ProjectVersion[];
  currentVersion: number;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metrics?: ProjectMetrics;
}

export interface ProjectMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  loss?: number;
  customMetrics?: Record<string, number>;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  members: GroupMember[];
  permissions: GroupPermission[];
  createdAt: Date;
}

export interface GroupMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface GroupPermission {
  resource: 'project' | 'pipeline' | 'data' | 'model';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  groups: string[];
  createdAt: Date;
}

export const PHASE_LABELS: Record<PipelinePhase, string> = {
  problem_understanding: 'Comprensione Problema',
  data_collection: 'Raccolta Dati',
  model_training: 'Pipeline Modellazione',
  evaluation: 'Valutazione',
  deployment: 'Produzione',
};

export const ENGINE_LABELS: Record<MLEngine, string> = {
  tensorflow: 'TensorFlow',
  pytorch: 'PyTorch',
  'scikit-learn': 'Scikit-Learn',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  keras: 'Keras',
  huggingface: 'Hugging Face',
  'spark-ml': 'Spark ML',
};

export const ALGORITHM_LABELS: Record<MLAlgorithm, string> = {
  linear_regression: 'Regressione Lineare',
  logistic_regression: 'Regressione Logistica',
  random_forest: 'Random Forest',
  gradient_boosting: 'Gradient Boosting',
  neural_network: 'Rete Neurale',
  cnn: 'CNN',
  rnn: 'RNN',
  transformer: 'Transformer',
  svm: 'SVM',
  kmeans: 'K-Means',
  pca: 'PCA',
};
