import { useState } from 'react';
import { 
  Brain, Database, Settings2, Info, RotateCcw, 
  ChevronDown, Sliders, Play, Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  ALGORITHM_FAMILY_LABELS,
  getAlgorithmsByFamily,
  getAlgorithmConfig,
} from '@/types/modeling';
import { SelectedDatasetConfig } from '@/types/dataset';
import { cn } from '@/lib/utils';

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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);

  const selectedFamily = modelingConfig?.algorithmFamily || 'tree_based';
  const selectedType = modelingConfig?.algorithmType;
  const hyperParameters = modelingConfig?.hyperParameters || {};
  const trainTestSplit = modelingConfig?.trainTestSplit || 80;

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

  const selectedDataset = availableDatasets.find(
    d => d.datasetId === modelingConfig?.selectedDatasetId
  );

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
                    defaultValue={5}
                    min={2}
                    max={10}
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
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold uppercase tracking-wide">Select Data</h3>
        </div>

        {selectedDataset ? (
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{selectedDataset.datasetName}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedDataset.selectedColumns.length} colonne selezionate</p>
                        <p>{selectedDataset.transformations.length} trasformazioni applicate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Apply Random Split: {100 - trainTestSplit}% Testing, {trainTestSplit}% Training
                </p>
              </div>
            </div>
            <Dialog open={isDataDialogOpen} onOpenChange={setIsDataDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Configura Dataset</DialogTitle>
                </DialogHeader>
                <DataSelectionContent
                  availableDatasets={availableDatasets}
                  selectedDatasetId={modelingConfig?.selectedDatasetId}
                  trainTestSplit={trainTestSplit}
                  onSelectDataset={(id, name) => {
                    onUpdateConfig({ selectedDatasetId: id, datasetName: name });
                  }}
                  onUpdateSplit={(split) => onUpdateConfig({ trainTestSplit: split })}
                  onClose={() => setIsDataDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            {availableDatasets.length > 0 ? (
              <>
                <Database className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">Nessun dataset selezionato</p>
                <Dialog open={isDataDialogOpen} onOpenChange={setIsDataDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Seleziona Dataset
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Seleziona Dataset</DialogTitle>
                    </DialogHeader>
                    <DataSelectionContent
                      availableDatasets={availableDatasets}
                      selectedDatasetId={modelingConfig?.selectedDatasetId}
                      trainTestSplit={trainTestSplit}
                      onSelectDataset={(id, name) => {
                        onUpdateConfig({ selectedDatasetId: id, datasetName: name });
                      }}
                      onUpdateSplit={(split) => onUpdateConfig({ trainTestSplit: split })}
                      onClose={() => setIsDataDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <div className="text-center">
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
        )}
      </div>

      {/* Run Training Button */}
      {selectedType && selectedDataset && (
        <div className="flex justify-end">
          <Button variant="gradient" size="lg" className="gap-2">
            <Play className="w-5 h-5" />
            Avvia Training
          </Button>
        </div>
      )}
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

// Data Selection Dialog Content
interface DataSelectionContentProps {
  availableDatasets: SelectedDatasetConfig[];
  selectedDatasetId?: string;
  trainTestSplit: number;
  onSelectDataset: (id: string, name: string) => void;
  onUpdateSplit: (split: number) => void;
  onClose: () => void;
}

function DataSelectionContent({
  availableDatasets,
  selectedDatasetId,
  trainTestSplit,
  onSelectDataset,
  onUpdateSplit,
  onClose,
}: DataSelectionContentProps) {
  const [localSplit, setLocalSplit] = useState(trainTestSplit);

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-3">
        <Label>Dataset dalla Raccolta Dati</Label>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {availableDatasets.map((dataset) => (
            <button
              key={dataset.datasetId}
              onClick={() => onSelectDataset(dataset.datasetId, dataset.datasetName)}
              className={cn(
                "w-full p-3 rounded-lg border-2 text-left transition-all",
                selectedDatasetId === dataset.datasetId
                  ? "bg-primary/10 border-primary"
                  : "bg-muted/30 border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{dataset.datasetName}</span>
                <Badge variant="secondary">
                  {dataset.selectedColumns.length} colonne
                </Badge>
              </div>
              {dataset.transformations.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {dataset.transformations.length} trasformazioni applicate
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Train/Test Split</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[localSplit]}
            onValueChange={([v]) => setLocalSplit(v)}
            min={50}
            max={95}
            step={5}
            className="flex-1"
          />
          <div className="text-sm min-w-[100px]">
            <span className="text-primary font-medium">{localSplit}%</span>
            <span className="text-muted-foreground"> Train</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Testing: {100 - localSplit}%</span>
          <span>Training: {localSplit}%</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Annulla
        </Button>
        <Button 
          variant="gradient" 
          onClick={() => {
            onUpdateSplit(localSplit);
            onClose();
          }}
        >
          Conferma
        </Button>
      </div>
    </div>
  );
}
