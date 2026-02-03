import { useState } from 'react';
import { 
  Sliders, Play, Plus, Trash2, Settings2, Target, 
  TrendingUp, TrendingDown, AlertTriangle, Check, Star,
  ChevronDown, ChevronUp, Loader2, Zap, BarChart3,
  Calculator, Scale, Activity, Award, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  OptimizationConfig,
  ActionableVariable,
  OptimizationVariable,
  ObjectiveFunction,
  Constraint,
  OptimizationKPI,
  OptimizationScenario,
  ProductionVersion,
} from '@/types/modeling';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OptimizationPanelProps {
  processId: string;
  optimizationConfig?: OptimizationConfig;
  availableProductionVersions: ProductionVersion[];
  onUpdateConfig: (config: Partial<OptimizationConfig>) => void;
}

export function OptimizationPanel({
  processId,
  optimizationConfig,
  availableProductionVersions,
  onUpdateConfig,
}: OptimizationPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('setup');
  const [isAddingActionable, setIsAddingActionable] = useState(false);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [isAddingObjective, setIsAddingObjective] = useState(false);
  const [isAddingConstraint, setIsAddingConstraint] = useState(false);
  const [isAddingKPI, setIsAddingKPI] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const actionableVariables = optimizationConfig?.actionableVariables || [];
  const optimizationVariables = optimizationConfig?.optimizationVariables || [];
  const objectiveFunctions = optimizationConfig?.objectiveFunctions || [];
  const constraints = optimizationConfig?.constraints || [];
  const kpis = optimizationConfig?.kpis || [];
  const scenarios = optimizationConfig?.scenarios || [];
  const selectedVersionId = optimizationConfig?.productionVersionId;

  const deployedVersions = availableProductionVersions.filter(v => v.status === 'deployed');
  const selectedVersion = deployedVersions.find(v => v.id === selectedVersionId);

  const handleSelectVersion = (versionId: string) => {
    const version = deployedVersions.find(v => v.id === versionId);
    onUpdateConfig({
      productionVersionId: versionId,
      productionVersionName: version?.name,
    });
  };

  const handleRunOptimization = () => {
    if (!selectedVersionId) {
      toast({
        title: 'Nessun modello selezionato',
        description: 'Seleziona prima un modello dalla produzione.',
        variant: 'destructive',
      });
      return;
    }

    if (objectiveFunctions.length === 0) {
      toast({
        title: 'Funzione obiettivo mancante',
        description: 'Definisci almeno una funzione obiettivo.',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);

    // Generate scenarios based on actionable variables
    const newScenarios: OptimizationScenario[] = Array.from({ length: 6 }, (_, i) => ({
      id: `scenario-${Date.now()}-${i}`,
      name: `Scenario ${scenarios.length + i + 1}`,
      description: `Ottimizzazione con variazione ${(7 + i * 0.2).toFixed(1)}%`,
      parameters: actionableVariables.reduce((acc, v) => {
        acc[v.name] = v.minValue! + (Math.random() * ((v.maxValue || 100) - (v.minValue || 0)));
        return acc;
      }, {} as Record<string, number>),
      results: {
        objectiveValue: Math.random() * 100,
        improvement: 7 + i * 0.3 + Math.random() * 0.5,
      },
      kpiValues: kpis.reduce((acc, k) => {
        acc[k.name] = Math.random() * 100;
        return acc;
      }, {} as Record<string, number>),
      status: 'running' as const,
      isFavorite: false,
      createdAt: new Date(),
    }));

    onUpdateConfig({ scenarios: [...scenarios, ...newScenarios] });

    toast({
      title: 'Ottimizzazione avviata',
      description: `Generazione di ${newScenarios.length} scenari in corso...`,
    });

    // Simulate completion
    setTimeout(() => {
      const completedScenarios = newScenarios.map(s => ({
        ...s,
        status: 'completed' as const,
        completedAt: new Date(),
      }));

      onUpdateConfig({
        scenarios: scenarios.concat(completedScenarios),
      });

      setIsRunning(false);
      setActiveTab('scenarios');

      toast({
        title: 'Ottimizzazione completata',
        description: 'Gli scenari sono pronti per la revisione.',
      });
    }, 3000);
  };

  const handleToggleFavorite = (scenarioId: string) => {
    const updated = scenarios.map(s =>
      s.id === scenarioId ? { ...s, isFavorite: !s.isFavorite } : s
    );
    onUpdateConfig({ scenarios: updated });
  };

  const handleSelectScenario = (scenarioId: string) => {
    onUpdateConfig({ selectedScenarioId: scenarioId });
    toast({
      title: 'Scenario selezionato',
      description: 'Questo scenario sarà disponibile per la fase di Produzione.',
    });
  };

  const handleDeleteScenario = (scenarioId: string) => {
    const updated = scenarios.filter(s => s.id !== scenarioId);
    onUpdateConfig({ 
      scenarios: updated,
      selectedScenarioId: optimizationConfig?.selectedScenarioId === scenarioId 
        ? undefined 
        : optimizationConfig?.selectedScenarioId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold uppercase tracking-wide">Modello Base</h3>
          </div>
        </div>

        {deployedVersions.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seleziona Modello in Produzione</Label>
              <Select value={selectedVersionId || ''} onValueChange={handleSelectVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un modello deployato..." />
                </SelectTrigger>
                <SelectContent>
                  {deployedVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      <div className="flex items-center gap-2">
                        <span>{version.name}</span>
                        <Badge variant="outline" className="text-xs">
                          F1: {(version.metrics.f1Score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVersion && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedVersion.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedVersion.evaluationRunName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{(selectedVersion.metrics.accuracy * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">{(selectedVersion.metrics.f1Score * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">F1 Score</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/50 mb-3 mx-auto" />
            <p className="text-muted-foreground">Nessun modello deployato disponibile</p>
            <p className="text-sm text-muted-foreground mt-1">
              Completa prima il deploy di un modello nella fase "Produzione"
            </p>
          </div>
        )}
      </div>

      {/* Optimization Setup Tabs */}
      {selectedVersionId && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Scenari ({scenarios.filter(s => s.status === 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2">
              <Activity className="w-4 h-4" />
              KPIs
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            {/* Actionable Variables */}
            <ConfigSection
              title="Variabili Azionabili"
              description="Parametri su cui l'ottimizzazione può agire"
              icon={Sliders}
              count={actionableVariables.length}
              onAdd={() => setIsAddingActionable(true)}
            >
              {actionableVariables.length > 0 ? (
                <div className="space-y-2">
                  {actionableVariables.map((variable) => (
                    <ActionableVariableCard
                      key={variable.id}
                      variable={variable}
                      onToggle={(enabled) => {
                        const updated = actionableVariables.map(v =>
                          v.id === variable.id ? { ...v, enabled } : v
                        );
                        onUpdateConfig({ actionableVariables: updated });
                      }}
                      onDelete={() => {
                        const updated = actionableVariables.filter(v => v.id !== variable.id);
                        onUpdateConfig({ actionableVariables: updated });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Nessuna variabile azionabile definita" />
              )}
            </ConfigSection>

            {/* Optimization Variables */}
            <ConfigSection
              title="Variabili di Ottimizzazione"
              description="Obiettivi da massimizzare o minimizzare"
              icon={Target}
              count={optimizationVariables.length}
              onAdd={() => setIsAddingVariable(true)}
            >
              {optimizationVariables.length > 0 ? (
                <div className="space-y-2">
                  {optimizationVariables.map((variable) => (
                    <OptimizationVariableCard
                      key={variable.id}
                      variable={variable}
                      onDelete={() => {
                        const updated = optimizationVariables.filter(v => v.id !== variable.id);
                        onUpdateConfig({ optimizationVariables: updated });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Nessuna variabile di ottimizzazione definita" />
              )}
            </ConfigSection>

            {/* Objective Function */}
            <ConfigSection
              title="Funzione Obiettivo"
              description="Formula matematica da ottimizzare"
              icon={Calculator}
              count={objectiveFunctions.length}
              onAdd={() => setIsAddingObjective(true)}
            >
              {objectiveFunctions.length > 0 ? (
                <div className="space-y-2">
                  {objectiveFunctions.map((obj) => (
                    <ObjectiveFunctionCard
                      key={obj.id}
                      objective={obj}
                      onDelete={() => {
                        const updated = objectiveFunctions.filter(o => o.id !== obj.id);
                        onUpdateConfig({ objectiveFunctions: updated });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Nessuna funzione obiettivo definita" />
              )}
            </ConfigSection>

            {/* Constraints */}
            <ConfigSection
              title="Vincoli"
              description="Limitazioni e condizioni da rispettare"
              icon={Scale}
              count={constraints.filter(c => c.enabled).length}
              onAdd={() => setIsAddingConstraint(true)}
            >
              {constraints.length > 0 ? (
                <div className="space-y-2">
                  {constraints.map((constraint) => (
                    <ConstraintCard
                      key={constraint.id}
                      constraint={constraint}
                      onToggle={(enabled) => {
                        const updated = constraints.map(c =>
                          c.id === constraint.id ? { ...c, enabled } : c
                        );
                        onUpdateConfig({ constraints: updated });
                      }}
                      onDelete={() => {
                        const updated = constraints.filter(c => c.id !== constraint.id);
                        onUpdateConfig({ constraints: updated });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Nessun vincolo definito" />
              )}
            </ConfigSection>

            {/* Run Optimization Button */}
            <Button
              variant="gradient"
              size="lg"
              className="w-full gap-2"
              onClick={handleRunOptimization}
              disabled={isRunning || objectiveFunctions.length === 0}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ottimizzazione in corso...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Avvia Ottimizzazione
                </>
              )}
            </Button>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            {scenarios.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {scenarios.filter(s => s.status === 'completed').length} scenari completati
                  </h3>
                  {optimizationConfig?.selectedScenarioId && (
                    <Badge variant="default" className="gap-1">
                      <Check className="w-3 h-3" />
                      Scenario selezionato per produzione
                    </Badge>
                  )}
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {scenarios
                      .sort((a, b) => (b.results.improvement || 0) - (a.results.improvement || 0))
                      .map((scenario, index) => (
                        <ScenarioCard
                          key={scenario.id}
                          scenario={scenario}
                          rank={index + 1}
                          isSelected={scenario.id === optimizationConfig?.selectedScenarioId}
                          onToggleFavorite={() => handleToggleFavorite(scenario.id)}
                          onSelect={() => handleSelectScenario(scenario.id)}
                          onDelete={() => handleDeleteScenario(scenario.id)}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4 mx-auto" />
                <p className="text-muted-foreground">Nessuno scenario generato</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Configura le variabili e avvia l'ottimizzazione
                </p>
              </div>
            )}
          </TabsContent>

          {/* KPIs Tab */}
          <TabsContent value="kpis" className="space-y-4">
            <ConfigSection
              title="Indicatori KPI"
              description="Metriche per valutare gli scenari"
              icon={Activity}
              count={kpis.length}
              onAdd={() => setIsAddingKPI(true)}
            >
              {kpis.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {kpis.map((kpi) => (
                    <KPICard
                      key={kpi.id}
                      kpi={kpi}
                      onDelete={() => {
                        const updated = kpis.filter(k => k.id !== kpi.id);
                        onUpdateConfig({ kpis: updated });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Nessun KPI definito" />
              )}
            </ConfigSection>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <AddActionableDialog
        open={isAddingActionable}
        onOpenChange={setIsAddingActionable}
        onAdd={(variable) => {
          onUpdateConfig({ actionableVariables: [...actionableVariables, variable] });
        }}
      />

      <AddOptimizationVariableDialog
        open={isAddingVariable}
        onOpenChange={setIsAddingVariable}
        onAdd={(variable) => {
          onUpdateConfig({ optimizationVariables: [...optimizationVariables, variable] });
        }}
      />

      <AddObjectiveDialog
        open={isAddingObjective}
        onOpenChange={setIsAddingObjective}
        onAdd={(objective) => {
          onUpdateConfig({ objectiveFunctions: [...objectiveFunctions, objective] });
        }}
      />

      <AddConstraintDialog
        open={isAddingConstraint}
        onOpenChange={setIsAddingConstraint}
        onAdd={(constraint) => {
          onUpdateConfig({ constraints: [...constraints, constraint] });
        }}
      />

      <AddKPIDialog
        open={isAddingKPI}
        onOpenChange={setIsAddingKPI}
        onAdd={(kpi) => {
          onUpdateConfig({ kpis: [...kpis, kpi] });
        }}
      />
    </div>
  );
}

// Helper Components
interface ConfigSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}

function ConfigSection({ title, description, icon: Icon, count, onAdd, children }: ConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="glass-card overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-3 flex-1 text-left">
              <Icon className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <h4 className="font-medium">{title}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              {count > 0 && <Badge variant="secondary">{count}</Badge>}
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
          <Button variant="outline" size="sm" className="ml-2" onClick={onAdd}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <CollapsibleContent>
          <div className="p-4">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-6 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

// Card Components
function ActionableVariableCard({ 
  variable, 
  onToggle, 
  onDelete 
}: { 
  variable: ActionableVariable; 
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all",
      variable.enabled ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border opacity-60"
    )}>
      <div className="flex items-center gap-3">
        <Switch checked={variable.enabled} onCheckedChange={onToggle} />
        <div>
          <p className="font-medium">{variable.name}</p>
          <p className="text-xs text-muted-foreground">
            {variable.dataType} • Range: {variable.minValue} - {variable.maxValue}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function OptimizationVariableCard({ 
  variable, 
  onDelete 
}: { 
  variable: OptimizationVariable;
  onDelete: () => void;
}) {
  const TypeIcon = variable.targetType === 'maximize' ? TrendingUp : 
                   variable.targetType === 'minimize' ? TrendingDown : Target;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-center gap-3">
        <TypeIcon className={cn(
          "w-5 h-5",
          variable.targetType === 'maximize' ? "text-success" : 
          variable.targetType === 'minimize' ? "text-destructive" : "text-primary"
        )} />
        <div>
          <p className="font-medium">{variable.name}</p>
          <p className="text-xs text-muted-foreground">
            {variable.targetType === 'maximize' ? 'Massimizza' : 
             variable.targetType === 'minimize' ? 'Minimizza' : 
             `Target: ${variable.targetValue}`} • Peso: {variable.weight}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ObjectiveFunctionCard({ 
  objective, 
  onDelete 
}: { 
  objective: ObjectiveFunction;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <span className="font-medium">{objective.name}</span>
          <Badge variant={objective.type === 'maximize' ? 'default' : 'secondary'}>
            {objective.type === 'maximize' ? 'MAX' : 'MIN'}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <code className="block mt-2 p-2 bg-background/50 rounded text-sm font-mono text-primary">
        {objective.formula}
      </code>
      {objective.description && (
        <p className="text-xs text-muted-foreground mt-2">{objective.description}</p>
      )}
    </div>
  );
}

function ConstraintCard({ 
  constraint, 
  onToggle, 
  onDelete 
}: { 
  constraint: Constraint;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all",
      constraint.enabled ? "bg-muted/30 border-border" : "bg-muted/10 border-transparent opacity-60"
    )}>
      <div className="flex items-center gap-3">
        <Switch checked={constraint.enabled} onCheckedChange={onToggle} />
        <div>
          <p className="font-medium">{constraint.name}</p>
          <code className="text-xs text-muted-foreground font-mono">
            {constraint.formula} {constraint.operator} {constraint.value}
          </code>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function KPICard({ 
  kpi, 
  onDelete 
}: { 
  kpi: OptimizationKPI;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{kpi.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-6 w-6 text-destructive">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <code className="block mt-2 text-xs font-mono text-muted-foreground">
        {kpi.formula}
      </code>
      {kpi.targetValue && (
        <p className="text-xs text-muted-foreground mt-1">Target: {kpi.targetValue} {kpi.unit}</p>
      )}
    </div>
  );
}

function ScenarioCard({ 
  scenario, 
  rank,
  isSelected,
  onToggleFavorite,
  onSelect,
  onDelete,
}: { 
  scenario: OptimizationScenario;
  rank: number;
  isSelected: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      isSelected ? "bg-success/5 border-success/30" :
      rank === 1 ? "bg-warning/5 border-warning/30" :
      "bg-muted/30 border-border"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {scenario.status === 'running' ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : rank === 1 ? (
              <Award className="w-5 h-5 text-warning" />
            ) : (
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{scenario.name}</h4>
                {rank === 1 && <Badge variant="default" className="bg-warning text-warning-foreground">Migliore</Badge>}
                {isSelected && <Badge variant="default" className="bg-success text-success-foreground">Selezionato</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {scenario.status === 'completed' && (
              <div className="text-right mr-4">
                <p className="text-xl font-bold text-primary">
                  +{scenario.results.improvement?.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Improvement</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className="h-8 w-8"
            >
              <Star className={cn(
                "w-4 h-4",
                scenario.isFavorite ? "fill-warning text-warning" : "text-muted-foreground"
              )} />
            </Button>
          </div>
        </div>

        {scenario.status === 'completed' && (
          <div className="flex items-center gap-2 mt-4">
            {!isSelected && (
              <Button variant="gradient" size="sm" onClick={onSelect} className="gap-1">
                <Check className="w-4 h-4" />
                Seleziona per Produzione
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Dettagli
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive ml-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium mb-2">Parametri</h5>
                <div className="space-y-1">
                  {Object.entries(scenario.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2">KPIs</h5>
                <div className="space-y-1">
                  {Object.entries(scenario.kpiValues).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dialog Components
function AddActionableDialog({ 
  open, 
  onOpenChange, 
  onAdd 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onAdd: (variable: ActionableVariable) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState<ActionableVariable['dataType']>('number');
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `actionable-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      dataType,
      minValue,
      maxValue,
      enabled: true,
    });
    setName('');
    setDescription('');
    setDataType('number');
    setMinValue(0);
    setMaxValue(100);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Aggiungi Variabile Azionabile</DialogTitle>
          <DialogDescription>
            Definisci un parametro su cui l'ottimizzazione può agire.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es: Prezzo Base" />
          </div>
          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrizione opzionale..." />
          </div>
          <div className="space-y-2">
            <Label>Tipo Dato</Label>
            <Select value={dataType} onValueChange={(v) => setDataType(v as ActionableVariable['dataType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Numero</SelectItem>
                <SelectItem value="percentage">Percentuale</SelectItem>
                <SelectItem value="boolean">Booleano</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valore Minimo</Label>
              <Input type="number" value={minValue} onChange={(e) => setMinValue(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Valore Massimo</Label>
              <Input type="number" value={maxValue} onChange={(e) => setMaxValue(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button variant="gradient" onClick={handleAdd} disabled={!name.trim()}>Aggiungi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddOptimizationVariableDialog({ 
  open, 
  onOpenChange, 
  onAdd 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onAdd: (variable: OptimizationVariable) => void;
}) {
  const [name, setName] = useState('');
  const [targetType, setTargetType] = useState<OptimizationVariable['targetType']>('maximize');
  const [weight, setWeight] = useState(1);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `optvar-${Date.now()}`,
      name: name.trim(),
      description: '',
      targetType,
      weight,
    });
    setName('');
    setTargetType('maximize');
    setWeight(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Aggiungi Variabile di Ottimizzazione</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es: Revenue" />
          </div>
          <div className="space-y-2">
            <Label>Tipo Obiettivo</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as OptimizationVariable['targetType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maximize">Massimizza</SelectItem>
                <SelectItem value="minimize">Minimizza</SelectItem>
                <SelectItem value="target">Target Specifico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Peso (importanza)</Label>
            <Slider value={[weight]} onValueChange={([v]) => setWeight(v)} min={1} max={10} step={1} />
            <p className="text-xs text-muted-foreground text-right">{weight}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button variant="gradient" onClick={handleAdd} disabled={!name.trim()}>Aggiungi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddObjectiveDialog({ 
  open, 
  onOpenChange, 
  onAdd 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onAdd: (objective: ObjectiveFunction) => void;
}) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'maximize' | 'minimize'>('maximize');

  const handleAdd = () => {
    if (!name.trim() || !formula.trim()) return;
    onAdd({
      id: `objective-${Date.now()}`,
      name: name.trim(),
      formula: formula.trim(),
      description: description.trim(),
      type,
    });
    setName('');
    setFormula('');
    setDescription('');
    setType('maximize');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Aggiungi Funzione Obiettivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es: Margine Totale" />
          </div>
          <div className="space-y-2">
            <Label>Formula</Label>
            <Textarea 
              value={formula} 
              onChange={(e) => setFormula(e.target.value)} 
              placeholder="Es: SUM_COL('Margin Income Parameter')"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'maximize' | 'minimize')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maximize">Massimizza</SelectItem>
                <SelectItem value="minimize">Minimizza</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrizione (opzionale)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrizione..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button variant="gradient" onClick={handleAdd} disabled={!name.trim() || !formula.trim()}>Aggiungi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddConstraintDialog({ 
  open, 
  onOpenChange, 
  onAdd 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onAdd: (constraint: Constraint) => void;
}) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [operator, setOperator] = useState<Constraint['operator']>('<=');
  const [value, setValue] = useState(0);

  const handleAdd = () => {
    if (!name.trim() || !formula.trim()) return;
    onAdd({
      id: `constraint-${Date.now()}`,
      name: name.trim(),
      formula: formula.trim(),
      operator,
      value,
      enabled: true,
    });
    setName('');
    setFormula('');
    setOperator('<=');
    setValue(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Aggiungi Vincolo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es: Budget Massimo" />
          </div>
          <div className="space-y-2">
            <Label>Formula</Label>
            <Input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="Es: total_cost" className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Operatore</Label>
              <Select value={operator} onValueChange={(v) => setOperator(v as Constraint['operator'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="<">&lt;</SelectItem>
                  <SelectItem value="<=">&le;</SelectItem>
                  <SelectItem value="=">=</SelectItem>
                  <SelectItem value=">=">&ge;</SelectItem>
                  <SelectItem value=">">&gt;</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valore</Label>
              <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button variant="gradient" onClick={handleAdd} disabled={!name.trim() || !formula.trim()}>Aggiungi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddKPIDialog({ 
  open, 
  onOpenChange, 
  onAdd 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onAdd: (kpi: OptimizationKPI) => void;
}) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [unit, setUnit] = useState('');
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);

  const handleAdd = () => {
    if (!name.trim() || !formula.trim()) return;
    onAdd({
      id: `kpi-${Date.now()}`,
      name: name.trim(),
      formula: formula.trim(),
      unit: unit.trim() || undefined,
      targetValue,
    });
    setName('');
    setFormula('');
    setUnit('');
    setTargetValue(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Aggiungi KPI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es: ROI" />
          </div>
          <div className="space-y-2">
            <Label>Formula</Label>
            <Input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="Es: revenue / cost" className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unità (opzionale)</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Es: %" />
            </div>
            <div className="space-y-2">
              <Label>Target (opzionale)</Label>
              <Input type="number" value={targetValue || ''} onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button variant="gradient" onClick={handleAdd} disabled={!name.trim() || !formula.trim()}>Aggiungi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
