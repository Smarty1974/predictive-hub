import { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileJson,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  X,
  Pencil,
  Trash2,
  Plus,
  Database,
  Image as ImageIcon,
  RefreshCw,
  Search,
  ChevronDown,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
  Settings2,
  Columns3,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// === Types ===
interface ParsedColumn {
  originalName: string;
  newName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'image' | 'empty';
  visible: boolean;
  hasErrors: boolean;
  errorCount: number;
  nullCount: number;
  sampleValues: string[];
}

interface CellEdit {
  row: number;
  col: string;
  oldValue: unknown;
  newValue: unknown;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  row?: number;
  column?: string;
}

interface CouchDBResource {
  id: string;
  name: string;
  database: string;
  description: string;
  documentCount: number;
}

// Mock CouchDB resources
const mockResources: CouchDBResource[] = [
  { id: 'res-1', name: 'materiali_catalogo', database: 'inventory_db', description: 'Catalogo materiali industriali', documentCount: 12450 },
  { id: 'res-2', name: 'valvole_produzione', database: 'production_db', description: 'Database valvole per produzione', documentCount: 8900 },
  { id: 'res-3', name: 'componenti_idraulici', database: 'components_db', description: 'Componenti idraulici e raccordi', documentCount: 5600 },
  { id: 'res-4', name: 'specifiche_tecniche', database: 'specs_db', description: 'Specifiche tecniche prodotti', documentCount: 3200 },
  { id: 'res-5', name: 'listino_prezzi', database: 'pricing_db', description: 'Listino prezzi aggiornato', documentCount: 15000 },
];

// === Helpers ===
const STEP_LABELS = ['Upload File', 'Revisione & Modifica', 'Destinazione', 'Conferma'];

function detectColumnType(values: unknown[]): ParsedColumn['type'] {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonEmpty.length === 0) return 'empty';

  let numCount = 0, boolCount = 0, dateCount = 0, imgCount = 0;

  for (const v of nonEmpty) {
    const s = String(v).trim();
    if (/^data:image|\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp/i.test(s)) { imgCount++; continue; }
    if (s === 'true' || s === 'false' || s === '0' || s === '1') { boolCount++; continue; }
    if (!isNaN(Number(s)) && s !== '') { numCount++; continue; }
    if (!isNaN(Date.parse(s)) && s.length > 5) { dateCount++; }
  }

  const total = nonEmpty.length;
  if (imgCount / total > 0.5) return 'image';
  if (numCount / total > 0.7) return 'number';
  if (boolCount / total > 0.7) return 'boolean';
  if (dateCount / total > 0.7) return 'date';
  return 'string';
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

const typeColors: Record<string, string> = {
  string: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  number: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  boolean: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  date: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  image: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  empty: 'bg-muted text-muted-foreground border-border',
};

const typeLabels: Record<string, string> = {
  string: 'Testo',
  number: 'Numero',
  boolean: 'Booleano',
  date: 'Data',
  image: 'Immagine',
  empty: 'Vuoto',
};

// === Component ===
export default function DataUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // File state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState<'csv' | 'json' | 'xlsx' | 'xls' | ''>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Data state
  const [columns, setColumns] = useState<ParsedColumn[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [editedCells, setEditedCells] = useState<Map<string, unknown>>(new Map());
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  // Target state
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importNotes, setImportNotes] = useState('');

  // Import state
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // === File Parsing ===
  const parseFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    setFileSize(file.size);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setFileType(ext as typeof fileType);

    try {
      if (ext === 'json') {
        const text = await file.text();
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : [json];
        processData(arr);
      } else if (ext === 'csv') {
        const text = await file.text();
        const wb = XLSX.read(text, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        processData(data);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        setSheetNames(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        processData(data);
      }
      setCurrentStep(1);
    } catch (err) {
      console.error(err);
      setIssues([{ type: 'error', message: `Errore nel parsing del file: ${(err as Error).message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processData = useCallback((data: Record<string, unknown>[]) => {
    if (!data.length) {
      setIssues([{ type: 'error', message: 'Il file è vuoto o non contiene dati validi.' }]);
      return;
    }

    // Filter out completely empty rows
    const nonEmptyRows = data.filter(row => 
      Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '')
    );

    const allKeys = Array.from(new Set(nonEmptyRows.flatMap(r => Object.keys(r))));

    const parsedCols: ParsedColumn[] = allKeys.map(key => {
      const values = nonEmptyRows.map(r => r[key]);
      const nullCount = values.filter(v => v === null || v === undefined || String(v).trim() === '').length;
      const type = detectColumnType(values);
      const sampleValues = values
        .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
        .slice(0, 5)
        .map(v => String(v));

      return {
        originalName: key,
        newName: key,
        type,
        visible: true,
        hasErrors: false,
        errorCount: 0,
        nullCount,
        sampleValues,
      };
    });

    // Validate
    const newIssues: ValidationIssue[] = [];
    const emptyRowsCount = data.length - nonEmptyRows.length;
    if (emptyRowsCount > 0) {
      newIssues.push({ type: 'warning', message: `${emptyRowsCount} righe vuote rimosse automaticamente.` });
    }

    parsedCols.forEach(col => {
      if (col.nullCount > 0) {
        const pct = ((col.nullCount / nonEmptyRows.length) * 100).toFixed(0);
        newIssues.push({
          type: col.nullCount / nonEmptyRows.length > 0.5 ? 'warning' : 'info',
          message: `Colonna "${col.originalName}": ${col.nullCount} valori mancanti (${pct}%)`,
          column: col.originalName,
        });
      }
    });

    const emptyCols = parsedCols.filter(c => c.type === 'empty');
    if (emptyCols.length > 0) {
      newIssues.push({
        type: 'warning',
        message: `${emptyCols.length} colonne completamente vuote trovate: ${emptyCols.map(c => c.originalName).join(', ')}`,
      });
    }

    setColumns(parsedCols);
    setRows(nonEmptyRows);
    setIssues(newIssues);
    setEditedCells(new Map());
  }, []);

  const switchSheet = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
    // Re-parse with the new sheet - we'd need the original file
    // For now this is handled at initial parse
  }, []);

  // === Cell Editing ===
  const getCellValue = (rowIdx: number, colName: string): unknown => {
    const key = `${rowIdx}:${colName}`;
    if (editedCells.has(key)) return editedCells.get(key);
    return rows[rowIdx]?.[colName];
  };

  const setCellValue = (rowIdx: number, colName: string, value: unknown) => {
    const key = `${rowIdx}:${colName}`;
    setEditedCells(prev => new Map(prev).set(key, value));
  };

  const renameColumn = (oldName: string, newName: string) => {
    setColumns(prev => prev.map(c =>
      c.originalName === oldName ? { ...c, newName: newName.trim() || c.originalName } : c
    ));
  };

  const toggleColumnVisibility = (colName: string) => {
    setColumns(prev => prev.map(c =>
      c.originalName === colName ? { ...c, visible: !c.visible } : c
    ));
  };

  const deleteColumn = (colName: string) => {
    setColumns(prev => prev.filter(c => c.originalName !== colName));
  };

  // === Filtering ===
  const visibleColumns = columns.filter(c => c.visible);
  const filteredRows = rows.filter((row, idx) => {
    if (!searchFilter) return true;
    return visibleColumns.some(col => {
      const val = getCellValue(idx, col.originalName);
      return String(val ?? '').toLowerCase().includes(searchFilter.toLowerCase());
    });
  });

  // === Import simulation ===
  const startImport = () => {
    setIsImporting(true);
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          setImportComplete(true);
          toast({
            title: 'Importazione completata',
            description: `${rows.length} record importati con successo.`,
          });
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  // === Drag & Drop ===
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) parseFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) parseFile(e.target.files[0]);
  };

  // === Step Validation ===
  const canProceed = () => {
    if (currentStep === 0) return rows.length > 0;
    if (currentStep === 1) return visibleColumns.length > 0;
    if (currentStep === 2) return !!selectedResource;
    return true;
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  // === Render ===
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/data')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Importa Dati</h1>
            <p className="text-muted-foreground text-sm">
              Carica e configura i dati prima dell'importazione
            </p>
          </div>
          {fileName && (
            <Badge variant="glass" className="gap-2 px-3 py-1.5">
              {fileType === 'xlsx' || fileType === 'xls' ? <FileSpreadsheet className="w-4 h-4" /> :
               fileType === 'json' ? <FileJson className="w-4 h-4" /> :
               <FileText className="w-4 h-4" />}
              {fileName} ({formatFileSize(fileSize)})
            </Badge>
          )}
        </div>

        {/* Stepper */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, idx) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                      idx < currentStep && 'bg-success text-success-foreground',
                      idx === currentStep && 'bg-primary text-primary-foreground shadow-md shadow-primary/30',
                      idx > currentStep && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={cn(
                    'text-sm font-medium hidden sm:inline',
                    idx === currentStep ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-4',
                    idx < currentStep ? 'bg-success' : 'bg-border'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 0: Upload */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div
              className={cn(
                'glass-card p-12 border-2 border-dashed transition-all cursor-pointer group',
                dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50',
                isLoading && 'pointer-events-none opacity-60'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
              {isLoading ? (
                <div className="text-center space-y-4">
                  <Loader2 className="w-14 h-14 mx-auto text-primary animate-spin" />
                  <p className="text-foreground font-semibold text-lg">Analisi file in corso...</p>
                  <p className="text-muted-foreground text-sm">Lettura struttura e validazione dati</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className={cn(
                    'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all',
                    dragActive
                      ? 'bg-primary/20 rotate-6 scale-110'
                      : 'bg-muted group-hover:bg-primary/10'
                  )}>
                    <Upload className={cn(
                      'w-10 h-10 transition-colors',
                      dragActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                    )} />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">
                      {dragActive ? 'Rilascia il file qui' : 'Trascina il file qui oppure clicca per selezionare'}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Formati supportati: XLS, XLSX, CSV, JSON — max 20MB
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {[
                      { icon: FileSpreadsheet, label: 'Excel', color: 'text-emerald-400' },
                      { icon: FileText, label: 'CSV', color: 'text-blue-400' },
                      { icon: FileJson, label: 'JSON', color: 'text-amber-400' },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50">
                        <Icon className={cn('w-4 h-4', color)} />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {issues.length > 0 && (
              <div className="space-y-2">
                {issues.filter(i => i.type === 'error').map((issue, idx) => (
                  <Alert key={idx} variant="destructive">
                    <XCircle className="w-4 h-4" />
                    <AlertTitle>Errore</AlertTitle>
                    <AlertDescription>{issue.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Review & Edit */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Issues Banner */}
            {issues.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{errorCount} errori</span>
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">{warningCount} avvisi</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">{issues.filter(i => i.type === 'info').length} informazioni</span>
                  </div>
                </div>
                <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {issues.map((issue, idx) => (
                    <div key={idx} className={cn(
                      'flex items-start gap-2 text-xs py-1 px-2 rounded',
                      issue.type === 'error' && 'bg-destructive/10 text-destructive',
                      issue.type === 'warning' && 'bg-warning/10 text-warning',
                      issue.type === 'info' && 'bg-muted text-muted-foreground',
                    )}>
                      {issue.type === 'error' ? <XCircle className="w-3 h-3 mt-0.5 shrink-0" /> :
                       issue.type === 'warning' ? <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> :
                       <Info className="w-3 h-3 mt-0.5 shrink-0" />}
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca nei dati..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-9"
                />
              </div>

              {sheetNames.length > 1 && (
                <Select value={selectedSheet} onValueChange={switchSheet}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetNames.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Badge variant="glass" className="h-9 px-3">
                {rows.length} righe × {visibleColumns.length} colonne
              </Badge>
            </div>

            {/* Tabs: Data Table + Column Settings */}
            <Tabs defaultValue="data" className="space-y-4">
              <TabsList>
                <TabsTrigger value="data" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Anteprima Dati
                </TabsTrigger>
                <TabsTrigger value="columns" className="gap-2">
                  <Columns3 className="w-4 h-4" />
                  Gestione Colonne
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data">
                <div className="glass-card overflow-hidden">
                  <ScrollArea className="w-full">
                    <div className="min-w-max">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">#</TableHead>
                            {visibleColumns.map(col => (
                              <TableHead key={col.originalName} className="min-w-[150px]">
                                <div className="space-y-1">
                                  {editingColumnName === col.originalName ? (
                                    <Input
                                      autoFocus
                                      defaultValue={col.newName}
                                      className="h-7 text-xs"
                                      onBlur={(e) => {
                                        renameColumn(col.originalName, e.target.value);
                                        setEditingColumnName(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          renameColumn(col.originalName, (e.target as HTMLInputElement).value);
                                          setEditingColumnName(null);
                                        }
                                        if (e.key === 'Escape') setEditingColumnName(null);
                                      }}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium truncate">{col.newName}</span>
                                      <button
                                        onClick={() => setEditingColumnName(col.originalName)}
                                        className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', typeColors[col.type])}>
                                    {typeLabels[col.type]}
                                  </Badge>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRows.slice(0, 100).map((row, rowIdx) => {
                            const actualIdx = rows.indexOf(row);
                            return (
                              <TableRow key={actualIdx} className="group">
                                <TableCell className="text-center text-xs text-muted-foreground">{actualIdx + 1}</TableCell>
                                {visibleColumns.map(col => {
                                  const val = getCellValue(actualIdx, col.originalName);
                                  const isEditing = editingCell?.row === actualIdx && editingCell?.col === col.originalName;
                                  const isEdited = editedCells.has(`${actualIdx}:${col.originalName}`);
                                  const isEmpty = val === null || val === undefined || String(val).trim() === '';

                                  return (
                                    <TableCell
                                      key={col.originalName}
                                      className={cn(
                                        'relative cursor-pointer transition-colors',
                                        isEdited && 'bg-primary/5',
                                        isEmpty && 'bg-warning/5',
                                      )}
                                      onDoubleClick={() => setEditingCell({ row: actualIdx, col: col.originalName })}
                                    >
                                      {isEditing ? (
                                        <Input
                                          autoFocus
                                          defaultValue={String(val ?? '')}
                                          className="h-7 text-xs min-w-[120px]"
                                          onBlur={(e) => {
                                            setCellValue(actualIdx, col.originalName, e.target.value);
                                            setEditingCell(null);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              setCellValue(actualIdx, col.originalName, (e.target as HTMLInputElement).value);
                                              setEditingCell(null);
                                            }
                                            if (e.key === 'Escape') setEditingCell(null);
                                          }}
                                        />
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          {isEmpty ? (
                                            <span className="text-xs text-muted-foreground italic">vuoto</span>
                                          ) : col.type === 'image' ? (
                                            <div className="flex items-center gap-1">
                                              <ImageIcon className="w-3 h-3 text-pink-400" />
                                              <span className="text-xs truncate max-w-[120px]">[immagine]</span>
                                            </div>
                                          ) : (
                                            <span className="text-xs font-mono truncate max-w-[200px]">
                                              {String(val)}
                                            </span>
                                          )}
                                          {isEdited && (
                                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  {filteredRows.length > 100 && (
                    <div className="p-3 border-t border-border text-center text-xs text-muted-foreground">
                      Visualizzate le prime 100 righe su {filteredRows.length} totali
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="columns">
                <div className="glass-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Visibile</TableHead>
                        <TableHead>Nome Originale</TableHead>
                        <TableHead>Nome Modificato</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valori Vuoti</TableHead>
                        <TableHead>Esempi</TableHead>
                        <TableHead className="w-12">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {columns.map(col => (
                        <TableRow key={col.originalName} className={cn(!col.visible && 'opacity-50')}>
                          <TableCell>
                            <Checkbox
                              checked={col.visible}
                              onCheckedChange={() => toggleColumnVisibility(col.originalName)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{col.originalName}</TableCell>
                          <TableCell>
                            <Input
                              value={col.newName}
                              onChange={(e) => renameColumn(col.originalName, e.target.value)}
                              className="h-8 text-sm max-w-[200px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-xs', typeColors[col.type])}>
                              {typeLabels[col.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {col.nullCount > 0 ? (
                              <span className="text-warning text-sm">
                                {col.nullCount} ({((col.nullCount / rows.length) * 100).toFixed(0)}%)
                              </span>
                            ) : (
                              <span className="text-success text-sm">Nessuno</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {col.sampleValues.slice(0, 3).map((s, i) => (
                                <Badge key={i} variant="glass" className="text-[10px] font-mono max-w-[100px] truncate">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteColumn(col.originalName)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 2: Target Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Seleziona Destinazione CouchDB</h2>
                  <p className="text-sm text-muted-foreground">Scegli il documento o la risorsa dove importare i dati</p>
                </div>
              </div>

              <div className="grid gap-3">
                {mockResources.map(res => (
                  <div
                    key={res.id}
                    onClick={() => setSelectedResource(res.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedResource === res.id
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          selectedResource === res.id ? 'bg-primary/20' : 'bg-muted'
                        )}>
                          <Database className={cn(
                            'w-4 h-4',
                            selectedResource === res.id ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{res.name}</p>
                          <p className="text-xs text-muted-foreground">{res.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="glass" className="text-xs">{res.database}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Intl.NumberFormat('it-IT').format(res.documentCount)} documenti
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Opzioni di Importazione</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modalità</Label>
                  <Select value={importMode} onValueChange={(v: 'append' | 'replace') => setImportMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="append">Aggiungi ai dati esistenti</SelectItem>
                      <SelectItem value="replace">Sostituisci dati esistenti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Note (opzionale)</Label>
                  <Textarea
                    placeholder="Note sull'importazione..."
                    value={importNotes}
                    onChange={(e) => setImportNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              {importMode === 'replace' && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Attenzione</AlertTitle>
                  <AlertDescription>
                    La modalità "Sostituisci" eliminerà tutti i dati esistenti nella risorsa selezionata prima di importare i nuovi dati.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Import */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {!importComplete ? (
              <>
                <div className="glass-card p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Riepilogo Importazione</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 rounded-xl bg-muted/30 space-y-1">
                      <p className="text-xs text-muted-foreground">File</p>
                      <p className="text-sm font-semibold text-foreground truncate">{fileName}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 space-y-1">
                      <p className="text-xs text-muted-foreground">Record</p>
                      <p className="text-sm font-semibold text-foreground">{new Intl.NumberFormat('it-IT').format(rows.length)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 space-y-1">
                      <p className="text-xs text-muted-foreground">Colonne</p>
                      <p className="text-sm font-semibold text-foreground">{visibleColumns.length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 space-y-1">
                      <p className="text-xs text-muted-foreground">Destinazione</p>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {mockResources.find(r => r.id === selectedResource)?.name}
                      </p>
                    </div>
                  </div>

                  {/* Column mapping summary */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Mappatura Colonne</p>
                    <div className="flex flex-wrap gap-2">
                      {visibleColumns.map(col => (
                        <div key={col.originalName} className="flex items-center gap-1 text-xs bg-muted/50 rounded-lg px-2.5 py-1.5">
                          {col.originalName !== col.newName ? (
                            <>
                              <span className="text-muted-foreground line-through">{col.originalName}</span>
                              <ArrowRight className="w-3 h-3 text-primary" />
                              <span className="font-medium text-foreground">{col.newName}</span>
                            </>
                          ) : (
                            <span className="font-medium text-foreground">{col.newName}</span>
                          )}
                          <Badge variant="outline" className={cn('text-[9px] ml-1 px-1', typeColors[col.type])}>
                            {typeLabels[col.type]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {editedCells.size > 0 && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Pencil className="w-4 h-4" />
                      <span>{editedCells.size} celle modificate manualmente</span>
                    </div>
                  )}
                </div>

                {isImporting ? (
                  <div className="glass-card p-8 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <span className="text-foreground font-medium">Importazione in corso...</span>
                    </div>
                    <Progress value={Math.min(importProgress, 100)} className="max-w-md mx-auto" />
                    <p className="text-center text-sm text-muted-foreground">
                      {Math.min(Math.round(importProgress), 100)}% completato
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button variant="gradient" size="lg" onClick={startImport}>
                      <Upload className="w-5 h-5 mr-2" />
                      Avvia Importazione
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Importazione Completata!</h2>
                <p className="text-muted-foreground">
                  {new Intl.NumberFormat('it-IT').format(rows.length)} record importati correttamente in{' '}
                  <span className="font-medium text-foreground">
                    {mockResources.find(r => r.id === selectedResource)?.name}
                  </span>
                </p>
                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => navigate('/data')}>
                    Torna ai Dataset
                  </Button>
                  <Button variant="gradient" onClick={() => {
                    setCurrentStep(0);
                    setRows([]);
                    setColumns([]);
                    setFileName('');
                    setImportComplete(false);
                    setSelectedResource('');
                    setEditedCells(new Map());
                    setIssues([]);
                  }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nuova Importazione
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {!importComplete && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
            {currentStep < 3 && (
              <Button
                variant="gradient"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Avanti
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
