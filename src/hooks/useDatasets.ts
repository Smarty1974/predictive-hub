import { useState, useEffect, useCallback } from 'react';
import { Dataset, ColumnSchema } from '@/types/dataset';

const STORAGE_KEY = 'ml-platform-datasets';

// Mock datasets for demonstration
const mockDatasets: Dataset[] = [
  {
    id: '1',
    name: 'transactions_2024.csv',
    type: 'csv',
    size: 125000000,
    rows: 1500000,
    columns: 24,
    uploadedAt: new Date('2024-03-10'),
    uploadedBy: 'Marco Rossi',
    projectId: '1',
    projectName: 'Fraud Detection Model',
    status: 'ready',
    description: 'Dataset transazioni bancarie per rilevamento frodi',
    schema: [
      { name: 'transaction_id', type: 'string', nullCount: 0, uniqueCount: 1500000, sample: 'TXN_001234' },
      { name: 'amount', type: 'number', nullCount: 0, uniqueCount: 45000, sample: '150.50' },
      { name: 'timestamp', type: 'date', nullCount: 0, uniqueCount: 1200000, sample: '2024-01-15T10:30:00' },
      { name: 'merchant_id', type: 'string', nullCount: 120, uniqueCount: 8500, sample: 'MERCH_789' },
      { name: 'is_fraud', type: 'boolean', nullCount: 0, uniqueCount: 2, sample: 'false' },
    ],
    preview: [
      { transaction_id: 'TXN_001234', amount: 150.50, timestamp: '2024-01-15', merchant_id: 'MERCH_789', is_fraud: false },
      { transaction_id: 'TXN_001235', amount: 2500.00, timestamp: '2024-01-15', merchant_id: 'MERCH_456', is_fraud: true },
      { transaction_id: 'TXN_001236', amount: 45.99, timestamp: '2024-01-15', merchant_id: 'MERCH_123', is_fraud: false },
    ],
  },
  {
    id: '2',
    name: 'customer_profiles.json',
    type: 'json',
    size: 45000000,
    rows: 250000,
    columns: 18,
    uploadedAt: new Date('2024-03-08'),
    uploadedBy: 'Giulia Bianchi',
    projectId: '2',
    projectName: 'Customer Churn Prediction',
    status: 'ready',
    description: 'Profili clienti con storico acquisti',
    schema: [
      { name: 'customer_id', type: 'string', nullCount: 0, uniqueCount: 250000, sample: 'CUST_00001' },
      { name: 'age', type: 'number', nullCount: 500, uniqueCount: 80, sample: '34' },
      { name: 'subscription_date', type: 'date', nullCount: 0, uniqueCount: 1200, sample: '2022-05-20' },
      { name: 'total_purchases', type: 'number', nullCount: 0, uniqueCount: 15000, sample: '45' },
      { name: 'email', type: 'string', nullCount: 0, uniqueCount: 250000, sample: 'mario@example.com' },
      { name: 'region', type: 'string', nullCount: 100, uniqueCount: 20, sample: 'Lombardia' },
    ],
    preview: [
      { customer_id: 'CUST_00001', age: 34, subscription_date: '2022-05-20', total_purchases: 45, email: 'mario@example.com', region: 'Lombardia' },
      { customer_id: 'CUST_00002', age: 28, subscription_date: '2023-01-10', total_purchases: 12, email: 'lucia@example.com', region: 'Lazio' },
    ],
  },
  {
    id: '3',
    name: 'mutui_storico.csv',
    type: 'csv',
    size: 78000000,
    rows: 500000,
    columns: 32,
    uploadedAt: new Date('2024-03-15'),
    uploadedBy: 'Marco Rossi',
    status: 'ready',
    description: 'Dataset storico mutui con tassi e condizioni',
    schema: [
      { name: 'ACCEPTANCE_PREDICTION$PREDICT', type: 'string', nullCount: 0, uniqueCount: 2, sample: '0' },
      { name: 'ACCEPTANCE_PREDICTION$PREDICT_PROBA_0', type: 'real', nullCount: 0, uniqueCount: 45000, sample: '0.606' },
      { name: 'ACCEPTANCE_PREDICTION$PREDICT_PROBA_1', type: 'real', nullCount: 0, uniqueCount: 45000, sample: '0.394' },
      { name: 'CD_APPLICATION', type: 'string', nullCount: 0, uniqueCount: 500000, sample: '29026811122102' },
      { name: 'CD_BORROWER_TYPE_O', type: 'string', nullCount: 120, uniqueCount: 5, sample: 'PRIMARY' },
      { name: 'LOAN_AMOUNT', type: 'number', nullCount: 0, uniqueCount: 35000, sample: '150000' },
      { name: 'INTEREST_RATE', type: 'real', nullCount: 0, uniqueCount: 500, sample: '3.25' },
      { name: 'LOAN_TERM_MONTHS', type: 'integer', nullCount: 0, uniqueCount: 10, sample: '360' },
    ],
    preview: [
      { 'ACCEPTANCE_PREDICTION$PREDICT': '0', 'ACCEPTANCE_PREDICTION$PREDICT_PROBA_0': 0.606, 'ACCEPTANCE_PREDICTION$PREDICT_PROBA_1': 0.394, 'CD_APPLICATION': '29026811122102', 'CD_BORROWER_TYPE_O': 'PRIMARY', 'LOAN_AMOUNT': 150000, 'INTEREST_RATE': 3.25, 'LOAN_TERM_MONTHS': 360 },
      { 'ACCEPTANCE_PREDICTION$PREDICT': '0', 'ACCEPTANCE_PREDICTION$PREDICT_PROBA_0': 0.754, 'ACCEPTANCE_PREDICTION$PREDICT_PROBA_1': 0.246, 'CD_APPLICATION': '29037821120922', 'CD_BORROWER_TYPE_O': 'SECONDARY', 'LOAN_AMOUNT': 200000, 'INTEREST_RATE': 3.50, 'LOAN_TERM_MONTHS': 240 },
    ],
  },
  {
    id: '4',
    name: 'market_rates.xlsx',
    type: 'xlsx',
    size: 5000000,
    rows: 10000,
    columns: 8,
    uploadedAt: new Date('2024-03-18'),
    uploadedBy: 'Anna Neri',
    status: 'ready',
    description: 'Tassi di mercato storici',
    schema: [
      { name: 'date', type: 'date', nullCount: 0, uniqueCount: 3650, sample: '2024-01-01' },
      { name: 'euribor_1m', type: 'real', nullCount: 0, uniqueCount: 1500, sample: '3.856' },
      { name: 'euribor_3m', type: 'real', nullCount: 0, uniqueCount: 1500, sample: '3.923' },
      { name: 'euribor_6m', type: 'real', nullCount: 0, uniqueCount: 1500, sample: '3.987' },
    ],
    preview: [
      { date: '2024-01-01', euribor_1m: 3.856, euribor_3m: 3.923, euribor_6m: 3.987 },
      { date: '2024-01-02', euribor_1m: 3.862, euribor_3m: 3.928, euribor_6m: 3.991 },
    ],
  },
];

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDatasets(parsed.map((d: Dataset) => ({
          ...d,
          uploadedAt: new Date(d.uploadedAt),
        })));
      } catch (e) {
        console.error('Failed to parse datasets', e);
        setDatasets(mockDatasets);
      }
    } else {
      setDatasets(mockDatasets);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDatasets));
    }
    setInitialized(true);
  }, []);

  const saveDatasets = useCallback((newDatasets: Dataset[]) => {
    setDatasets(newDatasets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatasets));
  }, []);

  const addDataset = useCallback((dataset: Omit<Dataset, 'id'>) => {
    const newDataset: Dataset = {
      ...dataset,
      id: `dataset-${Date.now()}`,
    };
    saveDatasets([...datasets, newDataset]);
    return newDataset;
  }, [datasets, saveDatasets]);

  const updateDataset = useCallback((datasetId: string, updates: Partial<Dataset>) => {
    const updated = datasets.map(d => 
      d.id === datasetId ? { ...d, ...updates } : d
    );
    saveDatasets(updated);
  }, [datasets, saveDatasets]);

  const deleteDataset = useCallback((datasetId: string) => {
    saveDatasets(datasets.filter(d => d.id !== datasetId));
  }, [datasets, saveDatasets]);

  const getDatasetById = useCallback((datasetId: string) => {
    return datasets.find(d => d.id === datasetId);
  }, [datasets]);

  return {
    datasets,
    initialized,
    addDataset,
    updateDataset,
    deleteDataset,
    getDatasetById,
  };
}
