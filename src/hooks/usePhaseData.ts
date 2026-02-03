import { useState, useCallback, useEffect } from 'react';
import { SelectedDatasetConfig } from '@/types/dataset';
import { 
  ModelingConfig, 
  EvaluationConfig,
  ProductionConfig,
  AlgorithmFamily, 
  AlgorithmType, 
  HyperParameter, 
  TrainingRun,
  EvaluationRun,
  getAlgorithmConfig 
} from '@/types/modeling';

const STORAGE_KEY = 'ml-platform-phase-data';

interface PhaseDataConfig {
  processId: string;
  phaseType: string;
  dataCollectionConfig?: {
    selectedDatasets: SelectedDatasetConfig[];
  };
  modelingConfig?: ModelingConfig;
  evaluationConfig?: EvaluationConfig;
  productionConfig?: ProductionConfig;
}

export function usePhaseData(projectId: string) {
  const [phaseConfigs, setPhaseConfigs] = useState<Record<string, PhaseDataConfig>>({});
  const [initialized, setInitialized] = useState(false);

  const storageKey = `${STORAGE_KEY}-${projectId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setPhaseConfigs(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse phase data', e);
      }
    }
    setInitialized(true);
  }, [storageKey]);

  const savePhaseConfigs = useCallback((configs: Record<string, PhaseDataConfig>) => {
    setPhaseConfigs(configs);
    localStorage.setItem(storageKey, JSON.stringify(configs));
  }, [storageKey]);

  const getPhaseKey = (processId: string, phaseType: string) => `${processId}-${phaseType}`;

  const getPhaseConfig = useCallback((processId: string, phaseType: string): PhaseDataConfig | undefined => {
    const key = getPhaseKey(processId, phaseType);
    return phaseConfigs[key];
  }, [phaseConfigs]);

  // Data Collection Config
  const updateDataCollectionConfig = useCallback((
    processId: string,
    selectedDatasets: SelectedDatasetConfig[]
  ) => {
    const key = getPhaseKey(processId, 'raccolta_dati');
    const updated = {
      ...phaseConfigs,
      [key]: {
        ...phaseConfigs[key],
        processId,
        phaseType: 'raccolta_dati',
        dataCollectionConfig: { selectedDatasets },
      },
    };
    savePhaseConfigs(updated);
  }, [phaseConfigs, savePhaseConfigs]);

  const getDataCollectionConfig = useCallback((processId: string): SelectedDatasetConfig[] => {
    const config = getPhaseConfig(processId, 'raccolta_dati');
    return config?.dataCollectionConfig?.selectedDatasets || [];
  }, [getPhaseConfig]);

  // Get ALL data collection configs across the project (for modeling phase)
  const getAllDataCollectionConfigs = useCallback((): SelectedDatasetConfig[] => {
    const allDatasets: SelectedDatasetConfig[] = [];
    Object.values(phaseConfigs).forEach(config => {
      if (config.phaseType === 'raccolta_dati' && config.dataCollectionConfig?.selectedDatasets) {
        allDatasets.push(...config.dataCollectionConfig.selectedDatasets);
      }
    });
    return allDatasets;
  }, [phaseConfigs]);

  // Modeling Config
  const updateModelingConfig = useCallback((
    processId: string,
    modelingConfig: Partial<ModelingConfig>
  ) => {
    const key = getPhaseKey(processId, 'modellazione');
    const existingConfig = phaseConfigs[key]?.modelingConfig;
    
    const updated = {
      ...phaseConfigs,
      [key]: {
        ...phaseConfigs[key],
        processId,
        phaseType: 'modellazione',
        modelingConfig: {
          ...existingConfig,
          ...modelingConfig,
        } as ModelingConfig,
      },
    };
    savePhaseConfigs(updated);
  }, [phaseConfigs, savePhaseConfigs]);

  const getModelingConfig = useCallback((processId: string): ModelingConfig | undefined => {
    const config = getPhaseConfig(processId, 'modellazione');
    return config?.modelingConfig;
  }, [getPhaseConfig]);

  const updateHyperParameter = useCallback((
    processId: string,
    paramName: string,
    updates: Partial<HyperParameter>
  ) => {
    const config = getModelingConfig(processId);
    if (!config) return;

    const updatedParams = {
      ...config.hyperParameters,
      [paramName]: {
        ...config.hyperParameters[paramName],
        ...updates,
      },
    };

    updateModelingConfig(processId, { hyperParameters: updatedParams });
  }, [getModelingConfig, updateModelingConfig]);

  const setAlgorithm = useCallback((
    processId: string,
    family: AlgorithmFamily,
    type: AlgorithmType
  ) => {
    const algoConfig = getAlgorithmConfig(type);
    if (!algoConfig) return;

    const hyperParameters: Record<string, HyperParameter> = {};
    algoConfig.hyperParameters.forEach(param => {
      hyperParameters[param.name] = { ...param, currentValue: param.defaultValue };
    });

    updateModelingConfig(processId, {
      algorithmFamily: family,
      algorithmType: type,
      hyperParameters,
    });
  }, [updateModelingConfig]);

  // Get ALL training runs across the project (for evaluation phase)
  const getAllTrainingRuns = useCallback((): TrainingRun[] => {
    const allRuns: TrainingRun[] = [];
    Object.values(phaseConfigs).forEach(config => {
      if (config.phaseType === 'modellazione' && config.modelingConfig?.trainingRuns) {
        allRuns.push(...config.modelingConfig.trainingRuns);
      }
    });
    return allRuns;
  }, [phaseConfigs]);

  // Evaluation Config
  const updateEvaluationConfig = useCallback((
    processId: string,
    evaluationConfig: Partial<EvaluationConfig>
  ) => {
    const key = getPhaseKey(processId, 'valutazione');
    const existingConfig = phaseConfigs[key]?.evaluationConfig;
    
    const updated = {
      ...phaseConfigs,
      [key]: {
        ...phaseConfigs[key],
        processId,
        phaseType: 'valutazione',
        evaluationConfig: {
          ...existingConfig,
          ...evaluationConfig,
        } as EvaluationConfig,
      },
    };
    savePhaseConfigs(updated);
  }, [phaseConfigs, savePhaseConfigs]);

  const getEvaluationConfig = useCallback((processId: string): EvaluationConfig | undefined => {
    const config = getPhaseConfig(processId, 'valutazione');
    return config?.evaluationConfig;
  }, [getPhaseConfig]);

  // Get selected production model from any evaluation phase
  const getProductionSelectedEvaluation = useCallback((): EvaluationRun | undefined => {
    for (const config of Object.values(phaseConfigs)) {
      if (config.phaseType === 'valutazione' && config.evaluationConfig?.productionModelId) {
        const evalRun = config.evaluationConfig.evaluationRuns?.find(
          r => r.id === config.evaluationConfig?.productionModelId
        );
        if (evalRun) return evalRun;
      }
    }
    return undefined;
  }, [phaseConfigs]);

  // Production Config
  const updateProductionConfig = useCallback((
    processId: string,
    productionConfig: Partial<ProductionConfig>
  ) => {
    const key = getPhaseKey(processId, 'produzione');
    const existingConfig = phaseConfigs[key]?.productionConfig;
    
    const updated = {
      ...phaseConfigs,
      [key]: {
        ...phaseConfigs[key],
        processId,
        phaseType: 'produzione',
        productionConfig: {
          ...existingConfig,
          ...productionConfig,
        } as ProductionConfig,
      },
    };
    savePhaseConfigs(updated);
  }, [phaseConfigs, savePhaseConfigs]);

  const getProductionConfig = useCallback((processId: string): ProductionConfig | undefined => {
    const config = getPhaseConfig(processId, 'produzione');
    return config?.productionConfig;
  }, [getPhaseConfig]);

  return {
    initialized,
    getPhaseConfig,
    updateDataCollectionConfig,
    getDataCollectionConfig,
    getAllDataCollectionConfigs,
    updateModelingConfig,
    getModelingConfig,
    updateHyperParameter,
    setAlgorithm,
    getAllTrainingRuns,
    updateEvaluationConfig,
    getEvaluationConfig,
    getProductionSelectedEvaluation,
    updateProductionConfig,
    getProductionConfig,
  };
}
