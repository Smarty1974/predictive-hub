export interface Dataset {
  id: string;
  name: string;
  type: 'csv' | 'json' | 'parquet' | 'xlsx';
  size: number;
  rows: number;
  columns: number;
  uploadedAt: Date;
  uploadedBy: string;
  projectId?: string;
  projectName?: string;
  status: 'ready' | 'processing' | 'error';
  description?: string;
  schema?: ColumnSchema[];
  preview?: Record<string, unknown>[];
}

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullCount: number;
  uniqueCount: number;
  sample: string;
  originalType?: string;
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'integer' | 'real';

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  string: 'Stringa',
  number: 'Numero',
  integer: 'Intero',
  real: 'Reale',
  boolean: 'Booleano',
  date: 'Data',
  object: 'Oggetto',
};

export interface DataTransformation {
  id: string;
  name: string;
  columnName: string;
  functionType: TransformFunctionType;
  functionCategory: TransformFunctionCategory;
  formula: string;
  sourceColumns: string[];
  parameters: Record<string, unknown>;
}

export type TransformFunctionCategory = 
  | 'text' 
  | 'numeric' 
  | 'date' 
  | 'missing' 
  | 'aggregate' 
  | 'custom';

export type TransformFunctionType =
  | 'IF_MISSING'
  | 'FILL_NA'
  | 'REPLACE'
  | 'UPPERCASE'
  | 'LOWERCASE'
  | 'TRIM'
  | 'CONCAT'
  | 'SUBSTRING'
  | 'ROUND'
  | 'ABS'
  | 'LOG'
  | 'SQRT'
  | 'NORMALIZE'
  | 'SCALE'
  | 'DATE_FORMAT'
  | 'DATE_DIFF'
  | 'DATE_ADD'
  | 'SUM'
  | 'AVG'
  | 'COUNT'
  | 'MIN'
  | 'MAX'
  | 'CUSTOM';

export const TRANSFORM_FUNCTIONS: Record<TransformFunctionType, {
  label: string;
  category: TransformFunctionCategory;
  description: string;
  syntax: string;
}> = {
  IF_MISSING: {
    label: 'IF_MISSING',
    category: 'missing',
    description: 'Sostituisce valori mancanti',
    syntax: 'IF_MISSING(x, fill) → valore',
  },
  FILL_NA: {
    label: 'FILL_NA',
    category: 'missing',
    description: 'Riempie valori NA con un valore predefinito',
    syntax: 'FILL_NA(colonna, valore)',
  },
  REPLACE: {
    label: 'REPLACE',
    category: 'text',
    description: 'Sostituisce pattern nel testo',
    syntax: 'REPLACE(colonna, pattern, nuovo_valore)',
  },
  UPPERCASE: {
    label: 'UPPERCASE',
    category: 'text',
    description: 'Converte in maiuscolo',
    syntax: 'UPPERCASE(colonna)',
  },
  LOWERCASE: {
    label: 'LOWERCASE',
    category: 'text',
    description: 'Converte in minuscolo',
    syntax: 'LOWERCASE(colonna)',
  },
  TRIM: {
    label: 'TRIM',
    category: 'text',
    description: 'Rimuove spazi iniziali e finali',
    syntax: 'TRIM(colonna)',
  },
  CONCAT: {
    label: 'CONCAT',
    category: 'text',
    description: 'Concatena più colonne',
    syntax: 'CONCAT(col1, col2, ...)',
  },
  SUBSTRING: {
    label: 'SUBSTRING',
    category: 'text',
    description: 'Estrae parte del testo',
    syntax: 'SUBSTRING(colonna, inizio, lunghezza)',
  },
  ROUND: {
    label: 'ROUND',
    category: 'numeric',
    description: 'Arrotonda numeri',
    syntax: 'ROUND(colonna, decimali)',
  },
  ABS: {
    label: 'ABS',
    category: 'numeric',
    description: 'Valore assoluto',
    syntax: 'ABS(colonna)',
  },
  LOG: {
    label: 'LOG',
    category: 'numeric',
    description: 'Logaritmo naturale',
    syntax: 'LOG(colonna)',
  },
  SQRT: {
    label: 'SQRT',
    category: 'numeric',
    description: 'Radice quadrata',
    syntax: 'SQRT(colonna)',
  },
  NORMALIZE: {
    label: 'NORMALIZE',
    category: 'numeric',
    description: 'Normalizza tra 0 e 1',
    syntax: 'NORMALIZE(colonna)',
  },
  SCALE: {
    label: 'SCALE',
    category: 'numeric',
    description: 'Scala con media e deviazione standard',
    syntax: 'SCALE(colonna)',
  },
  DATE_FORMAT: {
    label: 'DATE_FORMAT',
    category: 'date',
    description: 'Formatta data',
    syntax: 'DATE_FORMAT(colonna, formato)',
  },
  DATE_DIFF: {
    label: 'DATE_DIFF',
    category: 'date',
    description: 'Differenza tra date',
    syntax: 'DATE_DIFF(data1, data2, unità)',
  },
  DATE_ADD: {
    label: 'DATE_ADD',
    category: 'date',
    description: 'Aggiunge tempo a una data',
    syntax: 'DATE_ADD(colonna, valore, unità)',
  },
  SUM: {
    label: 'SUM',
    category: 'aggregate',
    description: 'Somma dei valori',
    syntax: 'SUM(colonna)',
  },
  AVG: {
    label: 'AVG',
    category: 'aggregate',
    description: 'Media dei valori',
    syntax: 'AVG(colonna)',
  },
  COUNT: {
    label: 'COUNT',
    category: 'aggregate',
    description: 'Conteggio dei valori',
    syntax: 'COUNT(colonna)',
  },
  MIN: {
    label: 'MIN',
    category: 'aggregate',
    description: 'Valore minimo',
    syntax: 'MIN(colonna)',
  },
  MAX: {
    label: 'MAX',
    category: 'aggregate',
    description: 'Valore massimo',
    syntax: 'MAX(colonna)',
  },
  CUSTOM: {
    label: 'Custom',
    category: 'custom',
    description: 'Formula personalizzata',
    syntax: 'Espressione personalizzata',
  },
};

export const FUNCTION_CATEGORIES: Record<TransformFunctionCategory, string> = {
  text: 'Text Custom',
  numeric: 'Numeric',
  date: 'Date',
  missing: 'Missing Values',
  aggregate: 'Aggregate',
  custom: 'Custom',
};

export interface DatasetMergeConfig {
  id: string;
  name: string;
  sourceDatasets: string[];
  joinType: 'inner' | 'left' | 'right' | 'full' | 'concat';
  joinKeys: { left: string; right: string }[];
  selectedColumns: { datasetId: string; column: string }[];
}

export interface SelectedDatasetConfig {
  datasetId: string;
  datasetName: string;
  selectedColumns: string[];
  columnTypes: Record<string, ColumnType>;
  transformations: DataTransformation[];
}
