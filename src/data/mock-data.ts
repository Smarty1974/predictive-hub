import { MLProject, UserGroup, User, PipelinePhase, PhaseLink, ActivityLog } from '@/types/ml-project';

const createPipelineSteps = (statuses: Record<PipelinePhase, 'pending' | 'in_progress' | 'completed' | 'error'>) => {
  const phases: PipelinePhase[] = ['problem_understanding', 'data_collection', 'model_training', 'evaluation', 'deployment'];
  return phases.map((phase, index) => ({
    id: `step-${index}`,
    phase,
    status: statuses[phase],
    description: statuses[phase] !== 'pending' ? `Descrizione della fase ${phase.replace('_', ' ')}` : undefined,
    links: statuses[phase] === 'completed' ? [
      {
        id: `link-${index}-1`,
        title: 'Documentazione fase',
        url: 'https://docs.example.com',
        type: 'documentation' as PhaseLink['type'],
        addedAt: new Date(),
        addedBy: 'user-1',
      }
    ] : [],
    activityLogs: statuses[phase] !== 'pending' ? [
      {
        id: `log-${index}-1`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        action: 'Avviata fase',
        details: `La fase ${phase.replace('_', ' ')} è stata avviata`,
        userId: 'user-1',
        userName: 'Marco Rossi',
      }
    ] : [],
    startedAt: statuses[phase] !== 'pending' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
    completedAt: statuses[phase] === 'completed' ? new Date() : undefined,
    logs: [],
    version: 1,
    config: {},
  }));
};

export const mockProjects: MLProject[] = [
  {
    id: '1',
    name: 'Fraud Detection Model',
    description: 'Sistema di rilevamento frodi per transazioni bancarie usando deep learning',
    engine: 'pytorch',
    algorithm: 'neural_network',
    status: 'active',
    pipeline: createPipelineSteps({
      problem_understanding: 'completed',
      data_collection: 'completed',
      model_training: 'in_progress',
      evaluation: 'pending',
      deployment: 'pending',
    }),
    versions: [],
    currentVersion: 3,
    groupId: 'group-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    createdBy: 'user-1',
    metrics: { accuracy: 0.94, precision: 0.91, recall: 0.89, f1Score: 0.90 },
  },
  {
    id: '2',
    name: 'Customer Churn Prediction',
    description: 'Modello predittivo per identificare clienti a rischio di abbandono',
    engine: 'xgboost',
    algorithm: 'gradient_boosting',
    status: 'active',
    pipeline: createPipelineSteps({
      problem_understanding: 'completed',
      data_collection: 'completed',
      model_training: 'completed',
      evaluation: 'completed',
      deployment: 'in_progress',
    }),
    versions: [],
    currentVersion: 5,
    groupId: 'group-1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    createdBy: 'user-2',
    metrics: { accuracy: 0.87, precision: 0.85, recall: 0.82, f1Score: 0.83 },
  },
  {
    id: '3',
    name: 'Image Classification Pipeline',
    description: 'Classificazione immagini prodotti per e-commerce con CNN',
    engine: 'tensorflow',
    algorithm: 'cnn',
    status: 'completed',
    pipeline: createPipelineSteps({
      problem_understanding: 'completed',
      data_collection: 'completed',
      model_training: 'completed',
      evaluation: 'completed',
      deployment: 'completed',
    }),
    versions: [],
    currentVersion: 8,
    groupId: 'group-2',
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date(),
    createdBy: 'user-1',
    metrics: { accuracy: 0.96, precision: 0.95, recall: 0.94, f1Score: 0.945 },
  },
  {
    id: '4',
    name: 'Sentiment Analysis NLP',
    description: 'Analisi sentiment per review prodotti usando Transformers',
    engine: 'huggingface',
    algorithm: 'transformer',
    status: 'active',
    pipeline: createPipelineSteps({
      problem_understanding: 'completed',
      data_collection: 'in_progress',
      model_training: 'pending',
      evaluation: 'pending',
      deployment: 'pending',
    }),
    versions: [],
    currentVersion: 2,
    groupId: 'group-2',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
    createdBy: 'user-3',
  },
  {
    id: '5',
    name: 'Time Series Forecasting',
    description: 'Previsione vendite con modelli LSTM',
    engine: 'keras',
    algorithm: 'rnn',
    status: 'paused',
    pipeline: createPipelineSteps({
      problem_understanding: 'completed',
      data_collection: 'error',
      model_training: 'pending',
      evaluation: 'pending',
      deployment: 'pending',
    }),
    versions: [],
    currentVersion: 1,
    groupId: 'group-1',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date(),
    createdBy: 'user-2',
  },
];

export const mockGroups: UserGroup[] = [
  {
    id: 'group-1',
    name: 'Data Science Team Alpha',
    description: 'Team principale di data science per progetti bancari',
    members: [
      { userId: 'user-1', role: 'owner', joinedAt: new Date('2023-06-01') },
      { userId: 'user-2', role: 'admin', joinedAt: new Date('2023-07-15') },
      { userId: 'user-4', role: 'member', joinedAt: new Date('2023-09-01') },
    ],
    permissions: [
      { resource: 'project', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'pipeline', actions: ['create', 'read', 'update'] },
      { resource: 'data', actions: ['create', 'read', 'update'] },
      { resource: 'model', actions: ['create', 'read', 'update', 'delete'] },
    ],
    createdAt: new Date('2023-06-01'),
  },
  {
    id: 'group-2',
    name: 'ML Engineering Team',
    description: 'Team di ML engineering per e-commerce',
    parentId: 'group-1',
    members: [
      { userId: 'user-1', role: 'admin', joinedAt: new Date('2023-08-01') },
      { userId: 'user-3', role: 'owner', joinedAt: new Date('2023-08-01') },
    ],
    permissions: [
      { resource: 'project', actions: ['create', 'read', 'update'] },
      { resource: 'pipeline', actions: ['read', 'update'] },
      { resource: 'data', actions: ['read'] },
      { resource: 'model', actions: ['create', 'read', 'update'] },
    ],
    createdAt: new Date('2023-08-01'),
  },
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'marco.rossi@example.com',
    name: 'Marco Rossi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
    groups: ['group-1', 'group-2'],
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'user-2',
    email: 'giulia.bianchi@example.com',
    name: 'Giulia Bianchi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Giulia',
    groups: ['group-1'],
    createdAt: new Date('2023-03-15'),
  },
  {
    id: 'user-3',
    email: 'luca.verdi@example.com',
    name: 'Luca Verdi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luca',
    groups: ['group-2'],
    createdAt: new Date('2023-05-20'),
  },
  {
    id: 'user-4',
    email: 'anna.neri@example.com',
    name: 'Anna Neri',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    groups: ['group-1'],
    createdAt: new Date('2023-09-01'),
  },
];

export const currentUser = mockUsers[0];
