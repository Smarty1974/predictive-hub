export type AlgorithmFamily = 
  | 'tree_based'
  | 'linear'
  | 'neural_network'
  | 'ensemble'
  | 'clustering'
  | 'dimensionality_reduction';

export type AlgorithmType = 
  // Tree Based
  | 'random_forest_classifier'
  | 'random_forest_regressor'
  | 'catboost_classifier'
  | 'catboost_regressor'
  | 'lightgbm_classifier'
  | 'lightgbm_regressor'
  | 'xgboost_classifier'
  | 'xgboost_regressor'
  // Linear
  | 'linear_regression'
  | 'logistic_regression'
  | 'ridge'
  | 'lasso'
  | 'elastic_net'
  // Neural Networks
  | 'mlp_classifier'
  | 'mlp_regressor'
  | 'cnn'
  | 'rnn'
  | 'lstm'
  | 'transformer'
  // Ensemble
  | 'gradient_boosting'
  | 'adaboost'
  | 'bagging'
  | 'voting'
  | 'stacking'
  // Clustering
  | 'kmeans'
  | 'dbscan'
  | 'hierarchical'
  | 'gaussian_mixture'
  // Dimensionality Reduction
  | 'pca'
  | 'tsne'
  | 'umap';

export interface HyperParameter {
  name: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  defaultValue: number | string | boolean;
  currentValue?: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  description: string;
  gridSearch: boolean;
  gridSearchValues?: (number | string)[];
}

export interface AlgorithmConfig {
  family: AlgorithmFamily;
  type: AlgorithmType;
  label: string;
  description: string;
  hyperParameters: HyperParameter[];
  isClassifier?: boolean;
  isRegressor?: boolean;
}

export interface ModelingConfig {
  selectedDatasetId?: string;
  datasetName?: string;
  trainTestSplit: number;
  randomState?: number;
  algorithmFamily: AlgorithmFamily;
  algorithmType: AlgorithmType;
  hyperParameters: Record<string, HyperParameter>;
}

export const ALGORITHM_FAMILY_LABELS: Record<AlgorithmFamily, string> = {
  tree_based: 'Tree Based',
  linear: 'Linear',
  neural_network: 'Neural Network',
  ensemble: 'Ensemble',
  clustering: 'Clustering',
  dimensionality_reduction: 'Dimensionality Reduction',
};

export const ALGORITHM_CONFIGS: AlgorithmConfig[] = [
  // Tree Based - Classifiers
  {
    family: 'tree_based',
    type: 'random_forest_classifier',
    label: 'Random Forest Classifier',
    description: 'Ensemble di alberi decisionali per classificazione',
    isClassifier: true,
    hyperParameters: [
      { name: 'n_estimators', label: 'n_estimators', type: 'number', defaultValue: 100, min: 10, max: 1000, step: 10, description: 'Numero di alberi nella foresta', gridSearch: false },
      { name: 'max_depth', label: 'max_depth', type: 'number', defaultValue: 10, min: 1, max: 100, step: 1, description: 'Profondità massima degli alberi', gridSearch: false },
      { name: 'min_samples_split', label: 'min_samples_split', type: 'number', defaultValue: 2, min: 2, max: 20, step: 1, description: 'Campioni minimi per split', gridSearch: false },
      { name: 'min_samples_leaf', label: 'min_samples_leaf', type: 'number', defaultValue: 1, min: 1, max: 20, step: 1, description: 'Campioni minimi per foglia', gridSearch: false },
    ],
  },
  {
    family: 'tree_based',
    type: 'random_forest_regressor',
    label: 'Random Forest Regressor',
    description: 'Ensemble di alberi decisionali per regressione',
    isRegressor: true,
    hyperParameters: [
      { name: 'n_estimators', label: 'n_estimators', type: 'number', defaultValue: 100, min: 10, max: 1000, step: 10, description: 'Numero di alberi nella foresta', gridSearch: false },
      { name: 'max_depth', label: 'max_depth', type: 'number', defaultValue: 10, min: 1, max: 100, step: 1, description: 'Profondità massima degli alberi', gridSearch: false },
      { name: 'min_samples_split', label: 'min_samples_split', type: 'number', defaultValue: 2, min: 2, max: 20, step: 1, description: 'Campioni minimi per split', gridSearch: false },
      { name: 'min_samples_leaf', label: 'min_samples_leaf', type: 'number', defaultValue: 1, min: 1, max: 20, step: 1, description: 'Campioni minimi per foglia', gridSearch: false },
    ],
  },
  // CatBoost
  {
    family: 'tree_based',
    type: 'catboost_classifier',
    label: 'CatBoost Classifier',
    description: 'Gradient boosting ottimizzato per variabili categoriche',
    isClassifier: true,
    hyperParameters: [
      { name: 'iterations', label: 'iterations', type: 'number', defaultValue: 500, min: 100, max: 5000, step: 100, description: 'Numero di iterazioni di boosting', gridSearch: false },
      { name: 'learning_rate', label: 'learning_rate', type: 'number', defaultValue: 0.1, min: 0.001, max: 1, step: 0.01, description: 'Tasso di apprendimento', gridSearch: false },
      { name: 'depth', label: 'depth', type: 'number', defaultValue: 6, min: 1, max: 16, step: 1, description: 'Profondità degli alberi', gridSearch: false },
      { name: 'l2_leaf_reg', label: 'l2_leaf_reg', type: 'number', defaultValue: 3, min: 0, max: 10, step: 0.5, description: 'Regolarizzazione L2', gridSearch: false },
    ],
  },
  {
    family: 'tree_based',
    type: 'catboost_regressor',
    label: 'CatBoost Regressor',
    description: 'Gradient boosting per regressione con supporto categoriche',
    isRegressor: true,
    hyperParameters: [
      { name: 'iterations', label: 'iterations', type: 'number', defaultValue: 500, min: 100, max: 5000, step: 100, description: 'Numero di iterazioni di boosting', gridSearch: false },
      { name: 'learning_rate', label: 'learning_rate', type: 'number', defaultValue: 0.1, min: 0.001, max: 1, step: 0.01, description: 'Tasso di apprendimento', gridSearch: false },
      { name: 'depth', label: 'depth', type: 'number', defaultValue: 6, min: 1, max: 16, step: 1, description: 'Profondità degli alberi', gridSearch: false },
      { name: 'l2_leaf_reg', label: 'l2_leaf_reg', type: 'number', defaultValue: 3, min: 0, max: 10, step: 0.5, description: 'Regolarizzazione L2', gridSearch: false },
    ],
  },
  // LightGBM
  {
    family: 'tree_based',
    type: 'lightgbm_classifier',
    label: 'LightGBM Classifier',
    description: 'Gradient boosting veloce ed efficiente',
    isClassifier: true,
    hyperParameters: [
      { name: 'n_estimators', label: 'n_estimators', type: 'number', defaultValue: 100, min: 10, max: 1000, step: 10, description: 'Numero di alberi', gridSearch: false },
      { name: 'learning_rate', label: 'learning_rate', type: 'number', defaultValue: 0.1, min: 0.001, max: 1, step: 0.01, description: 'Tasso di apprendimento', gridSearch: false },
      { name: 'max_depth', label: 'max_depth', type: 'number', defaultValue: -1, min: -1, max: 100, step: 1, description: 'Profondità massima (-1 = no limit)', gridSearch: false },
      { name: 'num_leaves', label: 'num_leaves', type: 'number', defaultValue: 31, min: 2, max: 256, step: 1, description: 'Numero massimo di foglie', gridSearch: false },
    ],
  },
  {
    family: 'tree_based',
    type: 'lightgbm_regressor',
    label: 'LightGBM Regressor',
    description: 'Gradient boosting veloce per regressione',
    isRegressor: true,
    hyperParameters: [
      { name: 'n_estimators', label: 'n_estimators', type: 'number', defaultValue: 100, min: 10, max: 1000, step: 10, description: 'Numero di alberi', gridSearch: false },
      { name: 'learning_rate', label: 'learning_rate', type: 'number', defaultValue: 0.1, min: 0.001, max: 1, step: 0.01, description: 'Tasso di apprendimento', gridSearch: false },
      { name: 'max_depth', label: 'max_depth', type: 'number', defaultValue: -1, min: -1, max: 100, step: 1, description: 'Profondità massima (-1 = no limit)', gridSearch: false },
      { name: 'num_leaves', label: 'num_leaves', type: 'number', defaultValue: 31, min: 2, max: 256, step: 1, description: 'Numero massimo di foglie', gridSearch: false },
    ],
  },
  // XGBoost
  {
    family: 'tree_based',
    type: 'xgboost_classifier',
    label: 'XGBoost Classifier',
    description: 'Extreme Gradient Boosting per classificazione',
    isClassifier: true,
    hyperParameters: [
      { name: 'n_estimators', label: 'n_estimators', type: 'number', defaultValue: 100, min: 10, max: 1000, step: 10, description: 'Numero di alberi', gridSearch: false },
      { name: 'learning_rate', label: 'learning_rate', type: 'number', defaultValue: 0.1, min: 0.001, max: 1, step: 0.01, description: 'Tasso di apprendimento', gridSearch: false },
      { name: 'max_depth', label: 'max_depth', type: 'number', defaultValue: 6, min: 1, max: 20, step: 1, description: 'Profondità massima', gridSearch: false },
      { name: 'subsample', label: 'subsample', type: 'number', defaultValue: 1, min: 0.1, max: 1, step: 0.1, description: 'Frazione campioni per albero', gridSearch: false },
    ],
  },
  {
    family: 'tree_based',
    type: 'xgboost_regressor',
    label: 'XGBoost Regressor',
    description: 'Extreme Gradient Boosting per regressione',
    isRegressor: true,
    hyperParameters: [
      { name: 'n_estimators', label: 'n_estimators', type: 'number', defaultValue: 100, min: 10, max: 1000, step: 10, description: 'Numero di alberi', gridSearch: false },
      { name: 'learning_rate', label: 'learning_rate', type: 'number', defaultValue: 0.1, min: 0.001, max: 1, step: 0.01, description: 'Tasso di apprendimento', gridSearch: false },
      { name: 'max_depth', label: 'max_depth', type: 'number', defaultValue: 6, min: 1, max: 20, step: 1, description: 'Profondità massima', gridSearch: false },
      { name: 'subsample', label: 'subsample', type: 'number', defaultValue: 1, min: 0.1, max: 1, step: 0.1, description: 'Frazione campioni per albero', gridSearch: false },
    ],
  },
  // Linear
  {
    family: 'linear',
    type: 'linear_regression',
    label: 'Linear Regression',
    description: 'Regressione lineare semplice',
    isRegressor: true,
    hyperParameters: [
      { name: 'fit_intercept', label: 'fit_intercept', type: 'boolean', defaultValue: true, description: 'Calcola intercetta', gridSearch: false },
      { name: 'normalize', label: 'normalize', type: 'boolean', defaultValue: false, description: 'Normalizza le feature', gridSearch: false },
    ],
  },
  {
    family: 'linear',
    type: 'logistic_regression',
    label: 'Logistic Regression',
    description: 'Classificazione binaria o multiclasse',
    isClassifier: true,
    hyperParameters: [
      { name: 'C', label: 'C', type: 'number', defaultValue: 1, min: 0.001, max: 100, step: 0.1, description: 'Inverso della regolarizzazione', gridSearch: false },
      { name: 'max_iter', label: 'max_iter', type: 'number', defaultValue: 100, min: 50, max: 1000, step: 50, description: 'Iterazioni massime', gridSearch: false },
      { name: 'solver', label: 'solver', type: 'select', defaultValue: 'lbfgs', options: [
        { value: 'lbfgs', label: 'L-BFGS' },
        { value: 'liblinear', label: 'Liblinear' },
        { value: 'saga', label: 'SAGA' },
      ], description: 'Algoritmo di ottimizzazione', gridSearch: false },
    ],
  },
  // Neural Networks
  {
    family: 'neural_network',
    type: 'mlp_classifier',
    label: 'MLP Classifier',
    description: 'Multi-Layer Perceptron per classificazione',
    isClassifier: true,
    hyperParameters: [
      { name: 'hidden_layer_sizes', label: 'hidden_layer_sizes', type: 'string', defaultValue: '100,50', description: 'Neuroni per layer (es: 100,50,25)', gridSearch: false },
      { name: 'activation', label: 'activation', type: 'select', defaultValue: 'relu', options: [
        { value: 'relu', label: 'ReLU' },
        { value: 'tanh', label: 'Tanh' },
        { value: 'logistic', label: 'Sigmoid' },
      ], description: 'Funzione di attivazione', gridSearch: false },
      { name: 'learning_rate_init', label: 'learning_rate', type: 'number', defaultValue: 0.001, min: 0.0001, max: 0.1, step: 0.0001, description: 'Learning rate iniziale', gridSearch: false },
      { name: 'max_iter', label: 'max_iter', type: 'number', defaultValue: 200, min: 50, max: 1000, step: 50, description: 'Epoche massime', gridSearch: false },
    ],
  },
  {
    family: 'neural_network',
    type: 'mlp_regressor',
    label: 'MLP Regressor',
    description: 'Multi-Layer Perceptron per regressione',
    isRegressor: true,
    hyperParameters: [
      { name: 'hidden_layer_sizes', label: 'hidden_layer_sizes', type: 'string', defaultValue: '100,50', description: 'Neuroni per layer (es: 100,50,25)', gridSearch: false },
      { name: 'activation', label: 'activation', type: 'select', defaultValue: 'relu', options: [
        { value: 'relu', label: 'ReLU' },
        { value: 'tanh', label: 'Tanh' },
        { value: 'logistic', label: 'Sigmoid' },
      ], description: 'Funzione di attivazione', gridSearch: false },
      { name: 'learning_rate_init', label: 'learning_rate', type: 'number', defaultValue: 0.001, min: 0.0001, max: 0.1, step: 0.0001, description: 'Learning rate iniziale', gridSearch: false },
      { name: 'max_iter', label: 'max_iter', type: 'number', defaultValue: 200, min: 50, max: 1000, step: 50, description: 'Epoche massime', gridSearch: false },
    ],
  },
  // Clustering
  {
    family: 'clustering',
    type: 'kmeans',
    label: 'K-Means',
    description: 'Clustering basato su centroidi',
    hyperParameters: [
      { name: 'n_clusters', label: 'n_clusters', type: 'number', defaultValue: 8, min: 2, max: 50, step: 1, description: 'Numero di cluster', gridSearch: false },
      { name: 'max_iter', label: 'max_iter', type: 'number', defaultValue: 300, min: 100, max: 1000, step: 50, description: 'Iterazioni massime', gridSearch: false },
      { name: 'n_init', label: 'n_init', type: 'number', defaultValue: 10, min: 1, max: 50, step: 1, description: 'Inizializzazioni', gridSearch: false },
    ],
  },
  // Dimensionality Reduction
  {
    family: 'dimensionality_reduction',
    type: 'pca',
    label: 'PCA',
    description: 'Principal Component Analysis',
    hyperParameters: [
      { name: 'n_components', label: 'n_components', type: 'number', defaultValue: 2, min: 1, max: 100, step: 1, description: 'Numero di componenti', gridSearch: false },
      { name: 'whiten', label: 'whiten', type: 'boolean', defaultValue: false, description: 'Whitening delle componenti', gridSearch: false },
    ],
  },
];

export const getAlgorithmsByFamily = (family: AlgorithmFamily): AlgorithmConfig[] => {
  return ALGORITHM_CONFIGS.filter(algo => algo.family === family);
};

export const getAlgorithmConfig = (type: AlgorithmType): AlgorithmConfig | undefined => {
  return ALGORITHM_CONFIGS.find(algo => algo.type === type);
};
