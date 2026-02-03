import { useState } from 'react';
import {
  Database, Plus, Trash2, Eye, Search, Settings2,
  FileSpreadsheet, Columns, ChevronDown, ChevronUp,
  Merge, Save, ArrowRight, Filter, X, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useDatasets } from '@/hooks/useDatasets';
import { TransformationPreview } from './TransformationPreview';
import {
  Dataset,
  ColumnSchema,
  ColumnType,
  COLUMN_TYPE_LABELS,
  DataTransformation,
  TransformFunctionType,
  TransformFunctionCategory,
  TRANSFORM_FUNCTIONS,
  FUNCTION_CATEGORIES,
  SelectedDatasetConfig,
} from '@/types/dataset';

interface DataCollectionPanelProps {
  projectId: string;
  selectedDatasets: SelectedDatasetConfig[];
  onUpdateDatasets: (configs: SelectedDatasetConfig[]) => void;
}

export function DataCollectionPanel({
  projectId,
  selectedDatasets,
  onUpdateDatasets,
}: DataCollectionPanelProps) {
  const { datasets } = useDatasets();
  const [selectDatasetDialogOpen, setSelectDatasetDialogOpen] = useState(false);
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDatasets, setExpandedDatasets] = useState<Record<string, boolean>>({});

  // Transformation state
  const [editingTransformation, setEditingTransformation] = useState<DataTransformation | null>(null);
  const [newTransformation, setNewTransformation] = useState<Partial<DataTransformation>>({
    name: '',
    columnName: '',
    functionType: 'IF_MISSING',
    functionCategory: 'missing',
    formula: '',
    sourceColumns: [],
    parameters: {},
  });

  const availableDatasets = datasets.filter(
    d => d.status === 'ready' && !selectedDatasets.find(s => s.datasetId === d.id)
  );

  const handleAddDataset = (dataset: Dataset) => {
    const config: SelectedDatasetConfig = {
      datasetId: dataset.id,
      datasetName: dataset.name,
      selectedColumns: dataset.schema?.map(c => c.name) || [],
      columnTypes: dataset.schema?.reduce((acc, c) => ({ ...acc, [c.name]: c.type }), {}) || {},
      transformations: [],
    };
    onUpdateDatasets([...selectedDatasets, config]);
    setSelectDatasetDialogOpen(false);
  };

  const handleRemoveDataset = (datasetId: string) => {
    onUpdateDatasets(selectedDatasets.filter(d => d.datasetId !== datasetId));
  };

  const handleUpdateColumnType = (datasetId: string, columnName: string, newType: ColumnType) => {
    const updated = selectedDatasets.map(d => {
      if (d.datasetId !== datasetId) return d;
      return {
        ...d,
        columnTypes: { ...d.columnTypes, [columnName]: newType },
      };
    });
    onUpdateDatasets(updated);
  };

  const handleToggleColumn = (datasetId: string, columnName: string) => {
    const updated = selectedDatasets.map(d => {
      if (d.datasetId !== datasetId) return d;
      const isSelected = d.selectedColumns.includes(columnName);
      return {
        ...d,
        selectedColumns: isSelected
          ? d.selectedColumns.filter(c => c !== columnName)
          : [...d.selectedColumns, columnName],
      };
    });
    onUpdateDatasets(updated);
  };

  const handleAddTransformation = () => {
    if (!activeDatasetId || !newTransformation.name || !newTransformation.columnName) return;

    const transformation: DataTransformation = {
      id: `transform-${Date.now()}`,
      name: newTransformation.name || '',
      columnName: newTransformation.columnName || '',
      functionType: newTransformation.functionType || 'CUSTOM',
      functionCategory: newTransformation.functionCategory || 'custom',
      formula: newTransformation.formula || '',
      sourceColumns: newTransformation.sourceColumns || [],
      parameters: newTransformation.parameters || {},
    };

    const updated = selectedDatasets.map(d => {
      if (d.datasetId !== activeDatasetId) return d;
      return {
        ...d,
        transformations: [...d.transformations, transformation],
      };
    });
    onUpdateDatasets(updated);
    setNewTransformation({
      name: '',
      columnName: '',
      functionType: 'IF_MISSING',
      functionCategory: 'missing',
      formula: '',
      sourceColumns: [],
      parameters: {},
    });
    setTransformDialogOpen(false);
  };

  const handleRemoveTransformation = (datasetId: string, transformationId: string) => {
    const updated = selectedDatasets.map(d => {
      if (d.datasetId !== datasetId) return d;
      return {
        ...d,
        transformations: d.transformations.filter(t => t.id !== transformationId),
      };
    });
    onUpdateDatasets(updated);
  };

  const handleFunctionTypeChange = (funcType: TransformFunctionType) => {
    const func = TRANSFORM_FUNCTIONS[funcType];
    setNewTransformation({
      ...newTransformation,
      functionType: funcType,
      functionCategory: func.category,
      formula: func.syntax,
    });
  };

  const getDatasetSchema = (datasetId: string): ColumnSchema[] => {
    const dataset = datasets.find(d => d.id === datasetId);
    return dataset?.schema || [];
  };

  const toggleDatasetExpanded = (datasetId: string) => {
    setExpandedDatasets(prev => ({
      ...prev,
      [datasetId]: !prev[datasetId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Dataset Selezionati</h3>
          <p className="text-sm text-muted-foreground">
            Seleziona e configura i dataset per questa fase
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDatasets.length > 1 && (
            <Button variant="outline" onClick={() => setMergeDialogOpen(true)}>
              <Merge className="w-4 h-4 mr-2" />
              Merge Dataset
            </Button>
          )}
          <Button onClick={() => setSelectDatasetDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Dataset
          </Button>
        </div>
      </div>

      {/* Selected Datasets List */}
      {selectedDatasets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nessun Dataset Selezionato</h3>
          <p className="text-muted-foreground mb-4">
            Aggiungi dataset dal menu Dati per iniziare la raccolta dati
          </p>
          <Button onClick={() => setSelectDatasetDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Seleziona Dataset
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedDatasets.map((config) => {
            const dataset = datasets.find(d => d.id === config.datasetId);
            if (!dataset) return null;

            const isExpanded = expandedDatasets[config.datasetId];

            return (
              <div key={config.datasetId} className="glass-card overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleDatasetExpanded(config.datasetId)}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{dataset.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {config.selectedColumns.length} colonne selezionate • {config.transformations.length} trasformazioni
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveDatasetId(config.datasetId);
                          setPreviewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveDatasetId(config.datasetId);
                          setSchemaDialogOpen(true);
                        }}
                      >
                        <Columns className="w-4 h-4 mr-1" />
                        Schema
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveDatasetId(config.datasetId);
                          setTransformDialogOpen(true);
                        }}
                      >
                        <Settings2 className="w-4 h-4 mr-1" />
                        Trasformazioni
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDataset(config.datasetId)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Column Schema */}
                      <div>
                        <h5 className="text-sm font-medium mb-3">Colonne e Tipi</h5>
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Cerca colonna..."
                            className="pl-10 h-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <ScrollArea className="h-[200px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getDatasetSchema(config.datasetId)
                                .filter(col => col.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((column) => (
                                  <TableRow key={column.name}>
                                    <TableCell>
                                      <Checkbox
                                        checked={config.selectedColumns.includes(column.name)}
                                        onCheckedChange={() => handleToggleColumn(config.datasetId, column.name)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{column.name}</TableCell>
                                    <TableCell>
                                      <Select
                                        value={config.columnTypes[column.name] || column.type}
                                        onValueChange={(value) => handleUpdateColumnType(config.datasetId, column.name, value as ColumnType)}
                                      >
                                        <SelectTrigger className="h-8 w-28">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(COLUMN_TYPE_LABELS).map(([type, label]) => (
                                            <SelectItem key={type} value={type}>{label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>

                      {/* Transformations */}
                      {config.transformations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-3">Trasformazioni Applicate</h5>
                          <div className="space-y-2">
                            {config.transformations.map((transform, index) => (
                              <div
                                key={transform.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline">{index + 1}</Badge>
                                  <div>
                                    <p className="font-medium text-sm">{transform.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {transform.formula}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveTransformation(config.datasetId, transform.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      )}

      {/* Select Dataset Dialog */}
      <Dialog open={selectDatasetDialogOpen} onOpenChange={setSelectDatasetDialogOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Seleziona Dataset</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cerca dataset..." className="pl-10" />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {availableDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleAddDataset(dataset)}
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{dataset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dataset.rows?.toLocaleString('it-IT')} righe • {dataset.columns} colonne
                        </p>
                      </div>
                      <Badge variant="outline">{dataset.type.toUpperCase()}</Badge>
                    </div>
                  </div>
                ))}
                {availableDatasets.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nessun dataset disponibile. Carica nuovi dataset dal menu Dati.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schema Dialog */}
      <Dialog open={schemaDialogOpen} onOpenChange={setSchemaDialogOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schema Dataset</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {activeDatasetId && (
              <SchemaEditor
                datasetId={activeDatasetId}
                config={selectedDatasets.find(d => d.datasetId === activeDatasetId)}
                schema={getDatasetSchema(activeDatasetId)}
                onUpdateColumnType={(col, type) => handleUpdateColumnType(activeDatasetId, col, type)}
                onToggleColumn={(col) => handleToggleColumn(activeDatasetId, col)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transformation Dialog */}
      <Dialog open={transformDialogOpen} onOpenChange={setTransformDialogOpen}>
        <DialogContent className="glass-card border-glass-border w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gestione Trasformazioni
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Transformation List */}
              <div className="space-y-4">
                <h4 className="font-medium">SELEZIONA TRASFORMAZIONE</h4>
                <div className="space-y-2">
                  {activeDatasetId && selectedDatasets.find(d => d.datasetId === activeDatasetId)?.transformations.map((t, i) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span>{i + 1}. {t.name}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleRemoveTransformation(activeDatasetId, t.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setEditingTransformation({} as DataTransformation)}
                  >
                    Aggiungi
                  </Button>
                </div>
              </div>

              {/* Right: Function Editor */}
              <div className="space-y-4">
                <h4 className="font-medium">FUNCTION</h4>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={newTransformation.functionCategory || 'text'}
                    onValueChange={(value) => setNewTransformation({ ...newTransformation, functionCategory: value as TransformFunctionCategory })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FUNCTION_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome Nuova Colonna</Label>
                  <Input
                    value={newTransformation.columnName || ''}
                    onChange={(e) => setNewTransformation({ ...newTransformation, columnName: e.target.value })}
                    placeholder="Es. colonna_normalizzata"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Funzione</Label>
                    <Select
                      value={newTransformation.functionType || 'IF_MISSING'}
                      onValueChange={(value) => handleFunctionTypeChange(value as TransformFunctionType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRANSFORM_FUNCTIONS)
                          .filter(([_, f]) => f.category === newTransformation.functionCategory)
                          .map(([key, func]) => (
                            <SelectItem key={key} value={key}>{func.label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Colonna Sorgente</Label>
                    <Select
                      value={newTransformation.sourceColumns?.[0] || ''}
                      onValueChange={(value) => setNewTransformation({ 
                        ...newTransformation, 
                        sourceColumns: [value] 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona colonna" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDatasetId && getDatasetSchema(activeDatasetId).map((col) => (
                          <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 font-mono text-sm">
                  <span className="text-primary">{newTransformation.functionType}</span>
                  <span className="text-muted-foreground"> (</span>
                  <span className="text-warning">{newTransformation.sourceColumns?.[0] || 'COLUMN_NAME'}</span>
                  <span className="text-muted-foreground">)</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="text-primary font-semibold">{newTransformation.columnName || 'nuova_colonna'}</span>
                </div>

                <div className="space-y-2">
                  <Label>Nome Trasformazione</Label>
                  <Input
                    value={newTransformation.name || ''}
                    onChange={(e) => setNewTransformation({ ...newTransformation, name: e.target.value })}
                    placeholder="Es. Gestione valori mancanti"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Section */}
            {activeDatasetId && (() => {
              const activeDataset = datasets.find(d => d.id === activeDatasetId);
              const activeConfig = selectedDatasets.find(d => d.datasetId === activeDatasetId);
              
              if (activeDataset && activeConfig) {
                return (
                  <div className="border-t border-border pt-4">
                    <TransformationPreview
                      dataset={activeDataset}
                      config={activeConfig}
                      newTransformation={newTransformation}
                    />
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setTransformDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleAddTransformation}>
              <Save className="w-4 h-4 mr-2" />
              Salva Trasformazione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Dataset</DialogTitle>
          </DialogHeader>
          <MergeDatasetPanel
            selectedDatasets={selectedDatasets}
            datasets={datasets}
            onClose={() => setMergeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Anteprima Dataset</DialogTitle>
          </DialogHeader>
          {activeDatasetId && (
            <DatasetPreview
              dataset={datasets.find(d => d.id === activeDatasetId)}
              config={selectedDatasets.find(d => d.datasetId === activeDatasetId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Schema Editor Component
interface SchemaEditorProps {
  datasetId: string;
  config?: SelectedDatasetConfig;
  schema: ColumnSchema[];
  onUpdateColumnType: (columnName: string, type: ColumnType) => void;
  onToggleColumn: (columnName: string) => void;
}

function SchemaEditor({ datasetId, config, schema, onUpdateColumnType, onToggleColumn }: SchemaEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredSchema = schema.filter(col => {
    const matchesSearch = col.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || col.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca colonna..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            {Object.entries(COLUMN_TYPE_LABELS).map(([type, label]) => (
              <SelectItem key={type} value={type}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          Export Configuration
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Null</TableHead>
              <TableHead className="text-right">Unici</TableHead>
              <TableHead>Esempio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchema.map((column) => (
              <TableRow key={column.name}>
                <TableCell>
                  <Checkbox
                    checked={config?.selectedColumns.includes(column.name)}
                    onCheckedChange={() => onToggleColumn(column.name)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{column.name}</TableCell>
                <TableCell>
                  <Select
                    value={config?.columnTypes[column.name] || column.type}
                    onValueChange={(value) => onUpdateColumnType(column.name, value as ColumnType)}
                  >
                    <SelectTrigger className="h-8 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COLUMN_TYPE_LABELS).map(([type, label]) => (
                        <SelectItem key={type} value={type}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{column.nullCount}</TableCell>
                <TableCell className="text-right text-muted-foreground">{column.uniqueCount.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono truncate max-w-[150px]">
                  {column.sample}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredSchema.length} colonne • {config?.selectedColumns.length || 0} selezionate</span>
      </div>
    </div>
  );
}

// Merge Dataset Panel
interface MergeDatasetPanelProps {
  selectedDatasets: SelectedDatasetConfig[];
  datasets: Dataset[];
  onClose: () => void;
}

function MergeDatasetPanel({ selectedDatasets, datasets, onClose }: MergeDatasetPanelProps) {
  const [joinType, setJoinType] = useState<'inner' | 'left' | 'right' | 'full' | 'concat'>('inner');
  const [leftDataset, setLeftDataset] = useState(selectedDatasets[0]?.datasetId || '');
  const [rightDataset, setRightDataset] = useState(selectedDatasets[1]?.datasetId || '');
  const [joinKeys, setJoinKeys] = useState<{ left: string; right: string }[]>([]);
  const [outputName, setOutputName] = useState('merged_dataset');

  const leftSchema = datasets.find(d => d.id === leftDataset)?.schema || [];
  const rightSchema = datasets.find(d => d.id === rightDataset)?.schema || [];

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dataset Sinistra</Label>
          <Select value={leftDataset} onValueChange={setLeftDataset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedDatasets.map((d) => (
                <SelectItem key={d.datasetId} value={d.datasetId}>
                  {d.datasetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Dataset Destra</Label>
          <Select value={rightDataset} onValueChange={setRightDataset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedDatasets.map((d) => (
                <SelectItem key={d.datasetId} value={d.datasetId}>
                  {d.datasetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo di Join</Label>
        <Select value={joinType} onValueChange={(v) => setJoinType(v as typeof joinType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inner">Inner Join</SelectItem>
            <SelectItem value="left">Left Join</SelectItem>
            <SelectItem value="right">Right Join</SelectItem>
            <SelectItem value="full">Full Outer Join</SelectItem>
            <SelectItem value="concat">Concatenazione (verticale)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {joinType !== 'concat' && (
        <div className="space-y-2">
          <Label>Chiavi di Join</Label>
          {joinKeys.map((key, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select value={key.left} onValueChange={(v) => {
                const updated = [...joinKeys];
                updated[index].left = v;
                setJoinKeys(updated);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Colonna sinistra" />
                </SelectTrigger>
                <SelectContent>
                  {leftSchema.map((col) => (
                    <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Select value={key.right} onValueChange={(v) => {
                const updated = [...joinKeys];
                updated[index].right = v;
                setJoinKeys(updated);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Colonna destra" />
                </SelectTrigger>
                <SelectContent>
                  {rightSchema.map((col) => (
                    <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setJoinKeys(joinKeys.filter((_, i) => i !== index))}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJoinKeys([...joinKeys, { left: '', right: '' }])}
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Chiave
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label>Nome Dataset Output</Label>
        <Input
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder="merged_dataset"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annulla</Button>
        <Button>
          <Merge className="w-4 h-4 mr-2" />
          Crea Dataset Merged
        </Button>
      </DialogFooter>
    </div>
  );
}

// Dataset Preview Component
interface DatasetPreviewProps {
  dataset?: Dataset;
  config?: SelectedDatasetConfig;
}

function DatasetPreview({ dataset, config }: DatasetPreviewProps) {
  if (!dataset) return null;

  const visibleColumns = config?.selectedColumns || dataset.schema?.map(c => c.name) || [];

  return (
    <div className="space-y-4 py-4">
      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Dataset Preview</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <div className="mb-2 text-sm text-muted-foreground">
            <strong>DATASET PREVIEW</strong> {dataset.columns} columns, {dataset.rows?.toLocaleString()} rows of which {dataset.rows?.toLocaleString()} unique rows
          </div>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((col) => (
                    <TableHead key={col} className="min-w-[150px]">
                      <div className="flex items-center gap-1">
                        {col}
                        <ChevronDown className="w-3 h-3" />
                        <Search className="w-3 h-3" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.preview?.map((row, i) => (
                  <TableRow key={i}>
                    {visibleColumns.map((col) => (
                      <TableCell key={col} className="font-mono text-sm">
                        {String(row[col] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Righe Totali</p>
              <p className="text-2xl font-bold">{dataset.rows?.toLocaleString()}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Colonne</p>
              <p className="text-2xl font-bold">{dataset.columns}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Dimensione</p>
              <p className="text-2xl font-bold">{(dataset.size / 1000000).toFixed(1)} MB</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="text-2xl font-bold">{dataset.type.toUpperCase()}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="mt-4">
          <p className="text-center text-muted-foreground py-8">
            I grafici saranno disponibili dopo la configurazione
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          Export
        </Button>
        <Button>
          Save Transformed Dataset
        </Button>
      </div>
    </div>
  );
}
