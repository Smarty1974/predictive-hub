import { useState } from 'react';
import { 
  BarChart3, Check, Trophy, Play, Star, AlertCircle, 
  Loader2, Clock, Target, TrendingUp, Award, Rocket,
  ChevronDown, Info, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TrainingRun,
  EvaluationConfig,
  EvaluationRun,
  EvaluationMetrics,
  getAlgorithmConfig,
} from '@/types/modeling';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EvaluationPanelProps {
  processId: string;
  evaluationConfig?: EvaluationConfig;
  availableTrainingRuns: TrainingRun[];
  onUpdateConfig: (config: Partial<EvaluationConfig>) => void;
}

const METRIC_LABELS: Record<keyof EvaluationMetrics, { label: string; description: string; higherIsBetter: boolean }> = {
  accuracy: { label: 'Accuracy', description: 'Percentuale di predizioni corrette', higherIsBetter: true },
  precision: { label: 'Precision', description: 'Rapporto tra veri positivi e totale predizioni positive', higherIsBetter: true },
  recall: { label: 'Recall', description: 'Rapporto tra veri positivi e totale positivi reali', higherIsBetter: true },
  f1Score: { label: 'F1 Score', description: 'Media armonica di precision e recall', higherIsBetter: true },
  auc: { label: 'AUC-ROC', description: 'Area Under the ROC Curve', higherIsBetter: true },
  mse: { label: 'MSE', description: 'Mean Squared Error', higherIsBetter: false },
  rmse: { label: 'RMSE', description: 'Root Mean Squared Error', higherIsBetter: false },
  mae: { label: 'MAE', description: 'Mean Absolute Error', higherIsBetter: false },
  r2: { label: 'R²', description: 'Coefficient of Determination', higherIsBetter: true },
  logLoss: { label: 'Log Loss', description: 'Logarithmic Loss', higherIsBetter: false },
};

export function EvaluationPanel({
  processId,
  evaluationConfig,
  availableTrainingRuns,
  onUpdateConfig,
}: EvaluationPanelProps) {
  const { toast } = useToast();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [confirmProductionDialog, setConfirmProductionDialog] = useState<string | null>(null);

  const selectedRunIds = evaluationConfig?.selectedTrainingRunIds || [];
  const evaluationRuns = evaluationConfig?.evaluationRuns || [];
  const productionModelId = evaluationConfig?.productionModelId;

  // Filter only completed training runs
  const completedTrainingRuns = availableTrainingRuns.filter(r => r.status === 'completed');

  const handleToggleTrainingRun = (runId: string, checked: boolean) => {
    const newIds = checked
      ? [...selectedRunIds, runId]
      : selectedRunIds.filter(id => id !== runId);
    onUpdateConfig({ selectedTrainingRunIds: newIds });
  };

  const handleStartEvaluation = () => {
    if (selectedRunIds.length === 0) {
      toast({
        title: 'Nessun modello selezionato',
        description: 'Seleziona almeno un modello dalla Pipeline Modellazione.',
        variant: 'destructive',
      });
      return;
    }

    // Create evaluation runs for selected training runs
    const newEvaluationRuns: EvaluationRun[] = selectedRunIds.map(runId => {
      const trainingRun = completedTrainingRuns.find(r => r.id === runId);
      return {
        id: `eval-${Date.now()}-${runId}`,
        trainingRunId: runId,
        trainingRunName: trainingRun?.name || runId,
        algorithmType: trainingRun?.algorithmType || 'random_forest_classifier',
        status: 'running' as const,
        isSelectedForProduction: false,
        metrics: generateMockMetrics(),
      };
    });

    onUpdateConfig({ 
      evaluationRuns: [...evaluationRuns, ...newEvaluationRuns] 
    });

    toast({
      title: 'Valutazione avviata',
      description: `Valutazione di ${newEvaluationRuns.length} modello/i in corso...`,
    });

    // Simulate evaluation completion
    setTimeout(() => {
      const completedRuns = newEvaluationRuns.map(run => ({
        ...run,
        status: 'completed' as const,
        evaluatedAt: new Date(),
        metrics: generateMockMetrics(),
        confusionMatrix: generateMockConfusionMatrix(),
        featureImportance: generateMockFeatureImportance(),
      }));
      
      onUpdateConfig({
        evaluationRuns: evaluationRuns
          .filter(r => !newEvaluationRuns.some(nr => nr.id === r.id))
          .concat(completedRuns),
      });

      toast({
        title: 'Valutazione completata',
        description: 'I risultati sono pronti per la revisione.',
      });
    }, 3000);
  };

  const handleSelectForProduction = (evalRunId: string) => {
    setConfirmProductionDialog(evalRunId);
  };

  const confirmProduction = () => {
    if (confirmProductionDialog) {
      onUpdateConfig({ productionModelId: confirmProductionDialog });
      toast({
        title: 'Modello selezionato per la produzione',
        description: 'Il modello è pronto per essere deployato.',
      });
      setConfirmProductionDialog(null);
    }
  };

  const handleDeleteEvaluation = (evalId: string) => {
    const updated = evaluationRuns.filter(r => r.id !== evalId);
    onUpdateConfig({ 
      evaluationRuns: updated,
      productionModelId: productionModelId === evalId ? undefined : productionModelId,
    });
  };

  // Find best model based on F1 score
  const completedEvaluations = evaluationRuns.filter(r => r.status === 'completed');
  const bestModel = completedEvaluations.length > 0
    ? completedEvaluations.reduce((best, current) => 
        current.metrics.f1Score > best.metrics.f1Score ? current : best
      )
    : null;

  const productionModel = evaluationRuns.find(r => r.id === productionModelId);

  return (
    <div className="space-y-6">
      {/* Model Selection Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold uppercase tracking-wide">Seleziona Modelli da Valutare</h3>
          </div>
          {selectedRunIds.length > 0 && (
            <Badge variant="secondary">{selectedRunIds.length} selezionati</Badge>
          )}
        </div>

        {completedTrainingRuns.length > 0 ? (
          <div className="space-y-3">
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {completedTrainingRuns.map((run) => {
                  const isSelected = selectedRunIds.includes(run.id);
                  const algoConfig = getAlgorithmConfig(run.algorithmType);
                  const isAlreadyEvaluated = evaluationRuns.some(e => e.trainingRunId === run.id);
                  
                  return (
                    <div
                      key={run.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/30 border-border hover:border-primary/50",
                        isAlreadyEvaluated && "opacity-60"
                      )}
                    >
                      <Checkbox 
                        checked={isSelected}
                        disabled={isAlreadyEvaluated}
                        onCheckedChange={(checked) => handleToggleTrainingRun(run.id, !!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{run.name}</span>
                          {run.isFavorite && (
                            <Star className="w-4 h-4 text-warning fill-warning" />
                          )}
                          {isAlreadyEvaluated && (
                            <Badge variant="outline" className="text-xs">Già valutato</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {algoConfig?.label} • Accuracy: {((run.metrics?.accuracy || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Button 
              variant="gradient" 
              className="w-full gap-2"
              onClick={handleStartEvaluation}
              disabled={selectedRunIds.length === 0}
            >
              <Play className="w-4 h-4" />
              Avvia Valutazione ({selectedRunIds.length})
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-10 h-10 text-muted-foreground/50 mb-3 mx-auto" />
            <p className="text-muted-foreground">
              Nessun modello disponibile dalla Pipeline Modellazione
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Completa prima almeno un training nella fase "Pipeline Modellazione"
            </p>
          </div>
        )}
      </div>

      {/* Evaluation Results Section */}
      {evaluationRuns.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold uppercase tracking-wide">Risultati Valutazione</h3>
            </div>
            <div className="flex items-center gap-2">
              {bestModel && (
                <Badge variant="default" className="gap-1">
                  <Trophy className="w-3 h-3" />
                  Migliore: {bestModel.trainingRunName}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsCompareOpen(!isCompareOpen)}>
                Confronta
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {evaluationRuns.map((evalRun) => (
              <EvaluationRunCard
                key={evalRun.id}
                evalRun={evalRun}
                isBest={bestModel?.id === evalRun.id}
                isProduction={productionModelId === evalRun.id}
                onSelectForProduction={() => handleSelectForProduction(evalRun.id)}
                onDelete={() => handleDeleteEvaluation(evalRun.id)}
              />
            ))}
          </div>

          {/* Comparison Table */}
          <Collapsible open={isCompareOpen} onOpenChange={setIsCompareOpen}>
            <CollapsibleContent className="pt-4">
              <ComparisonTable evaluations={completedEvaluations} bestModelId={bestModel?.id} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Production Selection Section */}
      {productionModel && (
        <div className="glass-card p-6 bg-success/5 border-success/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-xl">
                <Rocket className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Modello per la Produzione</h3>
                <p className="text-sm text-muted-foreground">{productionModel.trainingRunName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-success">
                {(productionModel.metrics.f1Score * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">F1 Score</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-4">
            <MetricBadge label="Accuracy" value={productionModel.metrics.accuracy} />
            <MetricBadge label="Precision" value={productionModel.metrics.precision} />
            <MetricBadge label="Recall" value={productionModel.metrics.recall} />
            <MetricBadge label="AUC" value={productionModel.metrics.auc} />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmProductionDialog} onOpenChange={() => setConfirmProductionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Selezione per Produzione</DialogTitle>
            <DialogDescription>
              Stai per selezionare questo modello per il deployment in produzione. 
              Questa azione lo renderà disponibile per la fase successiva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmProductionDialog(null)}>
              Annulla
            </Button>
            <Button variant="gradient" onClick={confirmProduction}>
              <Rocket className="w-4 h-4 mr-2" />
              Conferma per Produzione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Evaluation Run Card
interface EvaluationRunCardProps {
  evalRun: EvaluationRun;
  isBest: boolean;
  isProduction: boolean;
  onSelectForProduction: () => void;
  onDelete: () => void;
}

function EvaluationRunCard({ evalRun, isBest, isProduction, onSelectForProduction, onDelete }: EvaluationRunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const algoConfig = getAlgorithmConfig(evalRun.algorithmType);

  const statusConfig: Record<EvaluationRun['status'], { icon: typeof Clock; label: string; color: string; animate?: boolean }> = {
    pending: { icon: Clock, label: 'In attesa', color: 'text-muted-foreground' },
    running: { icon: Loader2, label: 'In esecuzione', color: 'text-primary', animate: true },
    completed: { icon: Check, label: 'Completato', color: 'text-success' },
    error: { icon: AlertCircle, label: 'Errore', color: 'text-destructive' },
  };

  const status = statusConfig[evalRun.status];
  const StatusIcon = status.icon;

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      isProduction ? "bg-success/5 border-success/30" : 
      isBest ? "bg-warning/5 border-warning/30" : 
      "bg-muted/30 border-border"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn(
                "w-5 h-5",
                status.color,
                status.animate && "animate-spin"
              )} />
              <h4 className="font-medium">{evalRun.trainingRunName}</h4>
            </div>
            {isBest && !isProduction && (
              <Badge variant="default" className="gap-1 bg-warning text-warning-foreground">
                <Trophy className="w-3 h-3" />
                Migliore
              </Badge>
            )}
            {isProduction && (
              <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                <Rocket className="w-3 h-3" />
                Produzione
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {evalRun.status === 'completed' && !isProduction && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectForProduction}
                className="gap-1"
              >
                <Rocket className="w-4 h-4" />
                Porta in Produzione
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-1">
          {algoConfig?.label}
        </p>

        {evalRun.status === 'completed' && (
          <>
            {/* Main Metrics */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <MetricCard label="Accuracy" value={evalRun.metrics.accuracy} />
              <MetricCard label="Precision" value={evalRun.metrics.precision} />
              <MetricCard label="Recall" value={evalRun.metrics.recall} />
              <MetricCard label="F1 Score" value={evalRun.metrics.f1Score} highlight />
            </div>

            {/* Expandable Details */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-3 gap-1">
                  {isExpanded ? 'Nascondi dettagli' : 'Mostra dettagli'}
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {/* Additional Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="AUC-ROC" value={evalRun.metrics.auc} small />
                  <MetricCard label="Log Loss" value={evalRun.metrics.logLoss} small inverse />
                  <MetricCard label="R²" value={evalRun.metrics.r2} small />
                </div>

                {/* Feature Importance */}
                {evalRun.featureImportance && evalRun.featureImportance.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Feature Importance</h5>
                    <div className="space-y-2">
                      {evalRun.featureImportance.slice(0, 5).map((fi, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 truncate">{fi.feature}</span>
                          <Progress value={fi.importance * 100} className="flex-1 h-2" />
                          <span className="text-xs font-medium w-12 text-right">
                            {(fi.importance * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {evalRun.status === 'running' && (
          <div className="mt-4">
            <Progress value={undefined} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Valutazione in corso...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Metric Card
function MetricCard({ 
  label, 
  value, 
  highlight, 
  small,
  inverse 
}: { 
  label: string; 
  value?: number; 
  highlight?: boolean;
  small?: boolean;
  inverse?: boolean;
}) {
  if (value === undefined) return null;
  
  const displayValue = inverse ? value : value * 100;
  const isGood = inverse ? value < 0.5 : value > 0.7;
  
  return (
    <div className={cn(
      "p-3 rounded-lg bg-background/50",
      highlight && "ring-2 ring-primary"
    )}>
      <p className={cn(
        "text-muted-foreground",
        small ? "text-[10px]" : "text-xs"
      )}>{label}</p>
      <p className={cn(
        "font-bold",
        small ? "text-lg" : "text-xl",
        isGood ? "text-success" : "text-foreground"
      )}>
        {inverse ? displayValue.toFixed(3) : `${displayValue.toFixed(1)}%`}
      </p>
    </div>
  );
}

// Metric Badge
function MetricBadge({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null;
  return (
    <div className="text-center p-2 bg-background/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{(value * 100).toFixed(1)}%</p>
    </div>
  );
}

// Comparison Table
function ComparisonTable({ evaluations, bestModelId }: { evaluations: EvaluationRun[]; bestModelId?: string }) {
  const metrics: (keyof EvaluationMetrics)[] = ['accuracy', 'precision', 'recall', 'f1Score', 'auc'];
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium">Modello</th>
            {metrics.map(m => (
              <th key={m} className="text-right py-2 px-3 font-medium">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 justify-end">
                      {METRIC_LABELS[m].label}
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{METRIC_LABELS[m].description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evaluations.map(evalRun => (
            <tr 
              key={evalRun.id} 
              className={cn(
                "border-b border-border/50",
                evalRun.id === bestModelId && "bg-warning/10"
              )}
            >
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  {evalRun.trainingRunName}
                  {evalRun.id === bestModelId && <Trophy className="w-4 h-4 text-warning" />}
                </div>
              </td>
              {metrics.map(m => {
                const value = evalRun.metrics[m];
                const isBestInColumn = evaluations.every(e => 
                  (e.metrics[m] || 0) <= (value || 0)
                );
                return (
                  <td 
                    key={m} 
                    className={cn(
                      "text-right py-2 px-3",
                      isBestInColumn && "text-success font-medium"
                    )}
                  >
                    {value !== undefined ? `${(value * 100).toFixed(1)}%` : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mock data generators
function generateMockMetrics(): EvaluationMetrics {
  return {
    accuracy: 0.82 + Math.random() * 0.15,
    precision: 0.78 + Math.random() * 0.18,
    recall: 0.75 + Math.random() * 0.20,
    f1Score: 0.77 + Math.random() * 0.18,
    auc: 0.80 + Math.random() * 0.15,
    logLoss: 0.2 + Math.random() * 0.3,
    r2: 0.70 + Math.random() * 0.25,
  };
}

function generateMockConfusionMatrix(): number[][] {
  return [
    [Math.floor(Math.random() * 50) + 80, Math.floor(Math.random() * 20)],
    [Math.floor(Math.random() * 15), Math.floor(Math.random() * 50) + 70],
  ];
}

function generateMockFeatureImportance(): { feature: string; importance: number }[] {
  const features = ['feature_1', 'feature_2', 'feature_3', 'feature_4', 'feature_5', 'feature_6'];
  return features
    .map(f => ({ feature: f, importance: Math.random() * 0.4 }))
    .sort((a, b) => b.importance - a.importance);
}
