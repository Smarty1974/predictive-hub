import { useState } from 'react';
import { 
  Brain, Database, Settings2, Info, RotateCcw, 
  ChevronDown, Sliders, Play, Edit2, Star, StarOff,
  Plus, Trash2, Check, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlgorithmFamily, 
  AlgorithmType,
  HyperParameter,
  ModelingConfig,
  TrainingRun,
  ALGORITHM_FAMILY_LABELS,
  getAlgorithmsByFamily,
  getAlgorithmConfig,
} from '@/types/modeling';
import { SelectedDatasetConfig } from '@/types/dataset';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ModelingPanelProps {
  processId: string;
  modelingConfig?: ModelingConfig;
  availableDatasets: SelectedDatasetConfig[];
  onUpdateConfig: (config: Partial<ModelingConfig>) => void;
  onSetAlgorithm: (family: AlgorithmFamily, type: AlgorithmType) => void;
  onUpdateHyperParameter: (paramName: string, updates: Partial<HyperParameter>) => void;
}

export function ModelingPanel({
  processId,
  modelingConfig,
  availableDatasets,
  onUpdateConfig,
  onSetAlgorithm,
  onUpdateHyperParameter,
}: ModelingPanelProps) {
  const { toast } = useToast();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);
  const [isRunsDialogOpen, setIsRunsDialogOpen] = useState(false);

  const selectedFamily = modelingConfig?.algorithmFamily || 'tree_based';
  const selectedType = modelingConfig?.algorithmType;
  const hyperParameters = modelingConfig?.hyperParameters || {};
  const trainTestSplit = modelingConfig?.trainTestSplit || 80;
  const selectedDatasetIds = modelingConfig?.selectedDatasetIds || [];
  const trainingRuns = modelingConfig?.trainingRuns || [];

  const familyAlgorithms = getAlgorithmsByFamily(selectedFamily);
  const selectedAlgoConfig = selectedType ? getAlgorithmConfig(selectedType) : null;

  const handleFamilyChange = (family: AlgorithmFamily) => {
    const algorithms = getAlgorithmsByFamily(family);
    if (algorithms.length > 0) {
      onSetAlgorithm(family, algorithms[0].type);
    }
  };

  const handleAlgorithmSelect = (type: AlgorithmType) => {
    onSetAlgorithm(selectedFamily, type);
  };

  const handleResetParameter = (paramName: string) => {
    const algoConfig = selectedType ? getAlgorithmConfig(selectedType) : null;
    const defaultParam = algoConfig?.hyperParameters.find(p => p.name === paramName);
    if (defaultParam) {
      onUpdateHyperParameter(paramName, { 
        currentValue: defaultParam.defaultValue,
        gridSearch: false,
      });
    }
  };

  const handleToggleDataset = (datasetId: string, checked: boolean) => {
    const newIds = checked
      ? [...selectedDatasetIds, datasetId]
      : selectedDatasetIds.filter(id => id !== datasetId);
    onUpdateConfig({ selectedDatasetIds: newIds });
  };

  const handleStartTraining = () => {
    if (selectedDatasetIds.length === 0) {
      toast({
        title: 'Nessun dataset selezionato',
        description: 'Seleziona almeno un dataset per avviare il training.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedType) {
      toast({
        title: 'Nessun algoritmo selezionato',
        description: 'Seleziona un algoritmo prima di avviare il training.',
        variant: 'destructive',
      });
      return;
    }

    const newRun: TrainingRun = {
      id: `run-${Date.now()}`,
      name: `${getAlgorithmConfig(selectedType)?.label || selectedType} - Run ${trainingRuns.length + 1}`,
      algorithmFamily: selectedFamily,
      algorithmType: selectedType,
      hyperParameters: { ...hyperParameters },
      selectedDatasetIds: [...selectedDatasetIds],
      trainTestSplit,
      randomState: modelingConfig?.randomState || 42,
      crossValidationFolds: modelingConfig?.crossValidationFolds || 5,
      status: 'running',
      isFavorite: false,
      createdAt: new Date(),
    };

    onUpdateConfig({ 
      trainingRuns: [...trainingRuns, newRun] 
    });

    toast({
      title: 'Training avviato',
      description: `Run "${newRun.name}" in esecuzione...`,
    });

    // Simulate training completion after 3 seconds
    setTimeout(() => {
      const completedRun: TrainingRun = {
        ...newRun,
        status: 'completed',
        completedAt: new Date(),
        metrics: {
          accuracy: 0.85 + Math.random() * 0.1,
          precision: 0.82 + Math.random() * 0.1,
          recall: 0.78 + Math.random() * 0.15,
          f1Score: 0.80 + Math.random() * 0.12,
        },
      };
      
      onUpdateConfig({
        trainingRuns: trainingRuns.map(r => r.id === newRun.id ? completedRun : r).concat(
          trainingRuns.find(r => r.id === newRun.id) ? [] : [completedRun]
        ),
      });
    }, 3000);
  };

  const handleToggleFavorite = (runId: string) => {
    const updatedRuns = trainingRuns.map(run => 
      run.id === runId ? { ...run, isFavorite: !run.isFavorite } : run
    );
    onUpdateConfig({ trainingRuns: updatedRuns });
  };

  const handleDeleteRun = (runId: string) => {
    const updatedRuns = trainingRuns.filter(run => run.id !== runId);
    onUpdateConfig({ trainingRuns: updatedRuns });
  };

  const selectedDatasets = availableDatasets.filter(d => 
    selectedDatasetIds.includes(d.datasetId)
  );

  const favoriteRuns = trainingRuns.filter(r => r.isFavorite);

  return (
    <div className="space-y-6">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Algorithm Setup */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold uppercase tracking-wide">Setup Algorithm</h3>
          </div>

          {/* Algorithm Family Select */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Algorithm Family</Label>
            <Select 
              value={selectedFamily} 
              onValueChange={(v) => handleFamilyChange(v as AlgorithmFamily)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ALGORITHM_FAMILY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Algorithm Type Grid */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Algorithm Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {familyAlgorithms.map((algo) => (
                <button
                  key={algo.type}
                  onClick={() => handleAlgorithmSelect(algo.type)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-sm font-medium transition-all text-left",
                    selectedType === algo.type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {algo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Algorithm Description */}
          {selectedAlgoConfig && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {selectedAlgoConfig.description}
              </p>
              <div className="flex gap-2 mt-2">
                {selectedAlgoConfig.isClassifier && (
                  <Badge variant="outline" className="text-xs">Classificazione</Badge>
                )}
                {selectedAlgoConfig.isRegressor && (
                  <Badge variant="outline" className="text-xs">Regressione</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Parameters */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sliders className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold uppercase tracking-wide">Set Parameter</h3>
          </div>

          {selectedType && Object.keys(hyperParameters).length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground">Hyperparameters</Label>
                
                {Object.entries(hyperParameters).map(([name, param]) => (
                  <HyperParameterRow
                    key={name}
                    param={param}
                    onUpdate={(updates) => onUpdateHyperParameter(name, updates)}
                    onReset={() => handleResetParameter(name)}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Settings2 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Seleziona un algoritmo per configurare i parametri</p>
            </div>
          )}

          {/* Advanced Parameters Toggle */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Advanced Parameters</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isAdvancedOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Random State</Label>
                  <Input 
                    type="number"
                    value={modelingConfig?.randomState || 42}
                    onChange={(e) => onUpdateConfig({ randomState: parseInt(e.target.value) })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cross Validation Folds</Label>
                  <Input 
                    type="number"
                    value={modelingConfig?.crossValidationFolds || 5}
                    min={2}
                    max={10}
                    onChange={(e) => onUpdateConfig({ crossValidationFolds: parseInt(e.target.value) })}
                    className="bg-background/50"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Data Selection Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold uppercase tracking-wide">Select Data</h3>
          </div>
          {selectedDatasets.length > 0 && (
            <Badge variant="secondary">{selectedDatasets.length} dataset selezionati</Badge>
          )}
        </div>

        {availableDatasets.length > 0 ? (
          <div className="space-y-4">
            {/* Dataset list with checkboxes */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {availableDatasets.map((dataset) => {
                const isSelected = selectedDatasetIds.includes(dataset.datasetId);
                return (
                  <div
                    key={dataset.datasetId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-border hover:border-primary/50"
                    )}
                    onClick={() => handleToggleDataset(dataset.datasetId, !isSelected)}
                  >
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => handleToggleDataset(dataset.datasetId, !!checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{dataset.datasetName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dataset.selectedColumns.length} colonne • {dataset.transformations.length} trasformazioni
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                );
              })}
            </div>

            {/* Train/Test Split */}
            <div className="space-y-3 pt-2">
              <Label>Train/Test Split</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[trainTestSplit]}
                  onValueChange={([v]) => onUpdateConfig({ trainTestSplit: v })}
                  min={50}
                  max={95}
                  step={5}
                  className="flex-1"
                />
                <div className="text-sm min-w-[100px]">
                  <span className="text-primary font-medium">{trainTestSplit}%</span>
                  <span className="text-muted-foreground"> Train</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Database className="w-10 h-10 text-muted-foreground/50 mb-3 mx-auto" />
            <p className="text-muted-foreground">
              Nessun dataset disponibile dalla fase Raccolta Dati
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Configura prima la fase "Raccolta Dati" per selezionare i dataset
            </p>
          </div>
        )}
      </div>

      {/* Training Runs Section */}
      {trainingRuns.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold uppercase tracking-wide">Training Runs</h3>
            </div>
            <Badge variant="secondary">{trainingRuns.length} run</Badge>
          </div>

          <div className="space-y-3">
            {trainingRuns.map((run) => (
              <TrainingRunCard
                key={run.id}
                run={run}
                onToggleFavorite={() => handleToggleFavorite(run.id)}
                onDelete={() => handleDeleteRun(run.id)}
              />
            ))}
          </div>

          {favoriteRuns.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <Star className="w-4 h-4 inline-block mr-1 text-yellow-500" />
                {favoriteRuns.length} modellazione/i preferita/e
              </p>
            </div>
          )}
        </div>
      )}

      {/* Run Training Button */}
      <div className="flex justify-end gap-3">
        {trainingRuns.length > 0 && (
          <Button variant="outline" onClick={() => setIsRunsDialogOpen(true)}>
            Storico Training ({trainingRuns.length})
          </Button>
        )}
        <Button 
          variant="gradient" 
          size="lg" 
          className="gap-2"
          onClick={handleStartTraining}
          disabled={selectedDatasetIds.length === 0 || !selectedType}
        >
          <Play className="w-5 h-5" />
          Avvia Training
        </Button>
      </div>
    </div>
  );
}

// Training Run Card Component
interface TrainingRunCardProps {
  run: TrainingRun;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function TrainingRunCard({ run, onToggleFavorite, onDelete }: TrainingRunCardProps) {
  const algoConfig = getAlgorithmConfig(run.algorithmType);
  
  const statusConfig: Record<TrainingRun['status'], { icon: typeof Clock; label: string; color: string; animate?: boolean }> = {
    pending: { icon: Clock, label: 'In attesa', color: 'text-muted-foreground' },
    running: { icon: Loader2, label: 'In esecuzione', color: 'text-primary', animate: true },
    completed: { icon: Check, label: 'Completato', color: 'text-success' },
    error: { icon: AlertCircle, label: 'Errore', color: 'text-destructive' },
  };

  const status = statusConfig[run.status];
  const StatusIcon = status.icon;

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      run.isFavorite ? "bg-warning/5 border-warning/30" : "bg-muted/30 border-border"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{run.name}</h4>
            <StatusIcon className={cn(
              "w-4 h-4",
              status.color,
              status.animate && "animate-spin"
            )} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {algoConfig?.label} • Split {run.trainTestSplit}%
          </p>
          
          {run.status === 'completed' && run.metrics && (
            <div className="flex gap-4 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <span className="ml-1 font-medium text-success">
                  {(run.metrics.accuracy! * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">F1:</span>
                <span className="ml-1 font-medium">
                  {(run.metrics.f1Score! * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Precision:</span>
                <span className="ml-1 font-medium">
                  {(run.metrics.precision! * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleFavorite}
                  className="h-8 w-8"
                >
                  {run.isFavorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {run.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Elimina run</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

// HyperParameter Row Component
interface HyperParameterRowProps {
  param: HyperParameter;
  onUpdate: (updates: Partial<HyperParameter>) => void;
  onReset: () => void;
}

function HyperParameterRow({ param, onUpdate, onReset }: HyperParameterRowProps) {
  const currentValue = param.currentValue ?? param.defaultValue;
  const isDefault = currentValue === param.defaultValue && !param.gridSearch;

  return (
    <div className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="text-sm font-mono">{param.label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{param.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex-1 max-w-[150px]">
        {param.type === 'number' && (
          <Input
            type="number"
            value={currentValue as number}
            min={param.min}
            max={param.max}
            step={param.step}
            onChange={(e) => onUpdate({ currentValue: parseFloat(e.target.value) })}
            className="bg-background/50 h-9"
          />
        )}
        {param.type === 'string' && (
          <Input
            type="text"
            value={currentValue as string}
            onChange={(e) => onUpdate({ currentValue: e.target.value })}
            className="bg-background/50 h-9"
          />
        )}
        {param.type === 'boolean' && (
          <Switch
            checked={currentValue as boolean}
            onCheckedChange={(checked) => onUpdate({ currentValue: checked })}
          />
        )}
        {param.type === 'select' && param.options && (
          <Select
            value={currentValue as string}
            onValueChange={(v) => onUpdate({ currentValue: v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {param.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={param.gridSearch}
          onCheckedChange={(checked) => onUpdate({ gridSearch: checked })}
        />
        <Label className="text-xs text-muted-foreground">Grid Search</Label>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={isDefault}
        className="text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Reset
      </Button>
    </div>
  );
}
