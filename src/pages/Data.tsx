import { useState, useRef } from 'react';
import {
  Database,
  Upload,
  FileSpreadsheet,
  Trash2,
  Eye,
  Download,
  Search,
  Filter,
  HardDrive,
  FileText,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Grid3X3,
  List,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Dataset {
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

interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  nullCount: number;
  uniqueCount: number;
  sample: string;
}

// Mock datasets
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
    ],
    preview: [
      { customer_id: 'CUST_00001', age: 34, subscription_date: '2022-05-20', total_purchases: 45 },
      { customer_id: 'CUST_00002', age: 28, subscription_date: '2023-01-10', total_purchases: 12 },
    ],
  },
  {
    id: '3',
    name: 'product_images_metadata.parquet',
    type: 'parquet',
    size: 890000000,
    rows: 5000000,
    columns: 12,
    uploadedAt: new Date('2024-02-28'),
    uploadedBy: 'Luca Verdi',
    projectId: '3',
    projectName: 'Image Classification Pipeline',
    status: 'ready',
    description: 'Metadati immagini prodotti e-commerce',
  },
  {
    id: '4',
    name: 'reviews_sentiment.xlsx',
    type: 'xlsx',
    size: 15000000,
    rows: 100000,
    columns: 8,
    uploadedAt: new Date('2024-03-12'),
    uploadedBy: 'Anna Neri',
    projectId: '4',
    projectName: 'Sentiment Analysis NLP',
    status: 'processing',
    description: 'Review prodotti per analisi sentiment',
  },
  {
    id: '5',
    name: 'sales_timeseries.csv',
    type: 'csv',
    size: 8500000,
    rows: 50000,
    columns: 15,
    uploadedAt: new Date('2024-03-01'),
    uploadedBy: 'Marco Rossi',
    projectId: '5',
    projectName: 'Time Series Forecasting',
    status: 'error',
    description: 'Dati vendite per previsioni temporali',
  },
];

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(2)} GB`;
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('it-IT').format(num);
};

const typeIcons: Record<string, typeof FileSpreadsheet> = {
  csv: FileSpreadsheet,
  json: FileText,
  parquet: Database,
  xlsx: FileSpreadsheet,
};

export default function Data() {
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDatasets = datasets.filter((dataset) => {
    const matchesSearch =
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || dataset.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || dataset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalSize = datasets.reduce((acc, d) => acc + d.size, 0);
  const totalRows = datasets.reduce((acc, d) => acc + d.rows, 0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Add mock dataset
          const file = files[0];
          const extension = file.name.split('.').pop()?.toLowerCase() as 'csv' | 'json' | 'parquet' | 'xlsx';
          const newDataset: Dataset = {
            id: String(datasets.length + 1),
            name: file.name,
            type: extension || 'csv',
            size: file.size,
            rows: Math.floor(Math.random() * 100000) + 1000,
            columns: Math.floor(Math.random() * 20) + 5,
            uploadedAt: new Date(),
            uploadedBy: 'Marco Rossi',
            status: 'processing',
            description: 'Nuovo dataset caricato',
          };
          setDatasets((prev) => [newDataset, ...prev]);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDelete = (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestione Dati</h1>
            <p className="text-muted-foreground mt-1">
              Carica, visualizza e gestisci i dataset per i tuoi progetti ML
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              accept=".csv,.json,.parquet,.xlsx,.xls"
              className="hidden"
            />
            <Button variant="gradient" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Carica Dataset
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={cn(
            'glass-card p-8 border-2 border-dashed transition-all cursor-pointer',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            isUploading && 'pointer-events-none'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-foreground font-medium">Caricamento in corso...</span>
              </div>
              <Progress value={uploadProgress} className="max-w-md mx-auto" />
              <p className="text-center text-sm text-muted-foreground">{uploadProgress}% completato</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className={cn(
                'w-12 h-12 mx-auto mb-4 transition-colors',
                dragActive ? 'text-primary' : 'text-muted-foreground'
              )} />
              <p className="text-foreground font-medium">
                {dragActive ? 'Rilascia il file qui' : 'Trascina i file qui o clicca per selezionare'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Formati supportati: CSV, JSON, Parquet, Excel (max 20MB)
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dataset Totali</p>
                <p className="text-xl font-bold text-foreground">{datasets.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spazio Totale</p>
                <p className="text-xl font-bold text-foreground">{formatFileSize(totalSize)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Righe Totali</p>
                <p className="text-xl font-bold text-foreground">{formatNumber(totalRows)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pronti all'uso</p>
                <p className="text-xl font-bold text-foreground">
                  {datasets.filter((d) => d.status === 'ready').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca dataset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo file" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="parquet">Parquet</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="ready">Pronto</SelectItem>
              <SelectItem value="processing">In elaborazione</SelectItem>
              <SelectItem value="error">Errore</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dataset Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map((dataset) => {
              const TypeIcon = typeIcons[dataset.type] || FileText;
              return (
                <div key={dataset.id} className="glass-card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        dataset.status === 'ready' && 'bg-success/20 text-success',
                        dataset.status === 'processing' && 'bg-warning/20 text-warning',
                        dataset.status === 'error' && 'bg-destructive/20 text-destructive'
                      )}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">{dataset.name}</h3>
                        <p className="text-xs text-muted-foreground">{dataset.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        dataset.status === 'ready' ? 'success' :
                        dataset.status === 'processing' ? 'warning' : 'error'
                      }
                    >
                      {dataset.status === 'ready' ? 'Pronto' :
                       dataset.status === 'processing' ? 'Elaborazione' : 'Errore'}
                    </Badge>
                  </div>

                  {dataset.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{dataset.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground">Righe</p>
                      <p className="text-sm font-medium text-foreground">{formatNumber(dataset.rows)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground">Colonne</p>
                      <p className="text-sm font-medium text-foreground">{dataset.columns}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="text-sm font-medium text-foreground">{formatFileSize(dataset.size)}</p>
                    </div>
                  </div>

                  {dataset.projectName && (
                    <div className="flex items-center gap-2">
                      <Badge variant="glass" className="text-xs">{dataset.projectName}</Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dataset.uploadedAt.toLocaleDateString('it-IT')}
                    </span>
                    <span>{dataset.uploadedBy}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedDataset(dataset)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Anteprima
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(dataset.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Righe</TableHead>
                  <TableHead>Colonne</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Progetto</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.map((dataset) => {
                  const TypeIcon = typeIcons[dataset.type] || FileText;
                  return (
                    <TableRow key={dataset.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{dataset.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="glass">{dataset.type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{formatNumber(dataset.rows)}</TableCell>
                      <TableCell>{dataset.columns}</TableCell>
                      <TableCell>{formatFileSize(dataset.size)}</TableCell>
                      <TableCell>
                        {dataset.projectName && (
                          <span className="text-sm text-muted-foreground">{dataset.projectName}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            dataset.status === 'ready' ? 'success' :
                            dataset.status === 'processing' ? 'warning' : 'error'
                          }
                        >
                          {dataset.status === 'ready' ? 'Pronto' :
                           dataset.status === 'processing' ? 'Elaborazione' : 'Errore'}
                        </Badge>
                      </TableCell>
                      <TableCell>{dataset.uploadedAt.toLocaleDateString('it-IT')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedDataset(dataset)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(dataset.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredDatasets.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun dataset trovato</p>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!selectedDataset} onOpenChange={() => setSelectedDataset(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                {selectedDataset?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDataset && (
              <div className="flex-1 overflow-auto space-y-6">
                {/* Dataset Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Righe</p>
                    <p className="text-lg font-bold text-foreground">{formatNumber(selectedDataset.rows)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Colonne</p>
                    <p className="text-lg font-bold text-foreground">{selectedDataset.columns}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Dimensione</p>
                    <p className="text-lg font-bold text-foreground">{formatFileSize(selectedDataset.size)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="text-lg font-bold text-foreground">{selectedDataset.type.toUpperCase()}</p>
                  </div>
                </div>

                {/* Schema */}
                {selectedDataset.schema && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Schema Colonne
                    </h3>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colonna</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valori Nulli</TableHead>
                            <TableHead>Valori Unici</TableHead>
                            <TableHead>Esempio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDataset.schema.map((col) => (
                            <TableRow key={col.name}>
                              <TableCell className="font-medium">{col.name}</TableCell>
                              <TableCell>
                                <Badge variant="glass">{col.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {col.nullCount > 0 ? (
                                  <span className="text-warning">{formatNumber(col.nullCount)}</span>
                                ) : (
                                  <span className="text-success">0</span>
                                )}
                              </TableCell>
                              <TableCell>{formatNumber(col.uniqueCount)}</TableCell>
                              <TableCell className="font-mono text-xs">{col.sample}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Preview Data */}
                {selectedDataset.preview && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Anteprima Dati (prime 3 righe)
                    </h3>
                    <div className="rounded-lg border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(selectedDataset.preview[0]).map((key) => (
                              <TableHead key={key}>{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDataset.preview.map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).map((val, j) => (
                                <TableCell key={j} className="font-mono text-xs">
                                  {String(val)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
