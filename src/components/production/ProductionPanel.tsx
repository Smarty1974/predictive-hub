import { useState } from 'react';
import { 
  Rocket, Check, Plus, Clock, Tag, GitBranch, 
  Download, Copy, Shield, AlertCircle, Trash2,
  ChevronDown, Settings2, Play, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  EvaluationRun,
  ProductionConfig,
  ProductionVersion,
  getAlgorithmConfig,
} from '@/types/modeling';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProductionPanelProps {
  processId: string;
  productionConfig?: ProductionConfig;
  selectedEvaluationRun?: EvaluationRun;
  onUpdateConfig: (config: Partial<ProductionConfig>) => void;
}

export function ProductionPanel({
  processId,
  productionConfig,
  selectedEvaluationRun,
  onUpdateConfig,
}: ProductionPanelProps) {
  const { toast } = useToast();
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  const versions = productionConfig?.versions || [];
  const activeVersionId = productionConfig?.activeVersionId;
  const activeVersion = versions.find(v => v.id === activeVersionId);

  const handleCreateVersion = () => {
    if (!selectedEvaluationRun) {
      toast({
        title: 'Nessun modello disponibile',
        description: 'Seleziona prima un modello dalla fase di Valutazione.',
        variant: 'destructive',
      });
      return;
    }

    const versionNumber = versions.length + 1;
    const name = newVersionName.trim() || `v${versionNumber}.0.0`;
    
    const newVersion: ProductionVersion = {
      id: `prod-${Date.now()}`,
      versionNumber,
      name,
      description: newVersionDescription.trim() || `Versione ${versionNumber} basata su ${selectedEvaluationRun.trainingRunName}`,
      evaluationRunId: selectedEvaluationRun.id,
      evaluationRunName: selectedEvaluationRun.trainingRunName,
      algorithmType: selectedEvaluationRun.algorithmType,
      metrics: selectedEvaluationRun.metrics,
      status: 'draft',
      createdAt: new Date(),
      createdBy: 'current-user',
    };

    onUpdateConfig({
      versions: [...versions, newVersion],
      selectedEvaluationRunId: selectedEvaluationRun.id,
    });

    toast({
      title: 'Versione creata',
      description: `${name} è pronta per il deployment.`,
    });

    setIsCreatingVersion(false);
    setNewVersionName('');
    setNewVersionDescription('');
  };

  const handleDeploy = (versionId: string) => {
    setIsDeploying(true);
    
    // Simulate deployment
    setTimeout(() => {
      const updatedVersions = versions.map(v => ({
        ...v,
        status: v.id === versionId ? 'deployed' as const : 
               v.status === 'deployed' ? 'archived' as const : v.status,
        deployedAt: v.id === versionId ? new Date() : v.deployedAt,
      }));

      onUpdateConfig({
        versions: updatedVersions,
        activeVersionId: versionId,
      });

      setIsDeploying(false);
      
      toast({
        title: 'Deployment completato',
        description: 'La versione è ora attiva in produzione.',
      });
    }, 2000);
  };

  const handleSetActive = (versionId: string) => {
    onUpdateConfig({ activeVersionId: versionId });
    toast({
      title: 'Versione attiva aggiornata',
      description: 'La versione selezionata è ora quella attiva.',
    });
  };

  const handleDeleteVersion = (versionId: string) => {
    const updated = versions.filter(v => v.id !== versionId);
    onUpdateConfig({
      versions: updated,
      activeVersionId: activeVersionId === versionId ? undefined : activeVersionId,
    });
    toast({
      title: 'Versione eliminata',
      description: 'La versione è stata rimossa.',
    });
  };

  const algoConfig = selectedEvaluationRun 
    ? getAlgorithmConfig(selectedEvaluationRun.algorithmType)
    : null;

  return (
    <div className="space-y-6">
      {/* Selected Model from Evaluation */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold uppercase tracking-wide">Modello Selezionato</h3>
          </div>
        </div>

        {selectedEvaluationRun ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 rounded-xl">
                  <Rocket className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedEvaluationRun.trainingRunName}</h4>
                  <p className="text-sm text-muted-foreground">{algoConfig?.label}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-success">
                  {(selectedEvaluationRun.metrics.f1Score * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">F1 Score</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <MetricBadge label="Accuracy" value={selectedEvaluationRun.metrics.accuracy} />
              <MetricBadge label="Precision" value={selectedEvaluationRun.metrics.precision} />
              <MetricBadge label="Recall" value={selectedEvaluationRun.metrics.recall} />
              <MetricBadge label="AUC" value={selectedEvaluationRun.metrics.auc} />
            </div>

            <Button 
              variant="gradient" 
              className="w-full gap-2"
              onClick={() => setIsCreatingVersion(true)}
            >
              <Plus className="w-4 h-4" />
              Crea Nuova Versione
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-3 mx-auto" />
            <p className="text-muted-foreground">
              Nessun modello selezionato per la produzione
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Vai alla fase "Valutazione" e seleziona un modello per la produzione
            </p>
          </div>
        )}
      </div>

      {/* Production Versions */}
      {versions.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold uppercase tracking-wide">Versioni di Produzione</h3>
            </div>
            <Badge variant="secondary">{versions.length} versioni</Badge>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {versions
                .sort((a, b) => b.versionNumber - a.versionNumber)
                .map((version) => (
                  <ProductionVersionCard
                    key={version.id}
                    version={version}
                    isActive={version.id === activeVersionId}
                    isDeploying={isDeploying}
                    onDeploy={() => handleDeploy(version.id)}
                    onSetActive={() => handleSetActive(version.id)}
                    onDelete={() => handleDeleteVersion(version.id)}
                  />
                ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Active Version Summary */}
      {activeVersion && (
        <div className="glass-card p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Versione Attiva</h3>
                <p className="text-sm text-muted-foreground">
                  {activeVersion.name} • {activeVersion.evaluationRunName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Play className="w-3 h-3" />
                In Produzione
              </Badge>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {(activeVersion.metrics.f1Score * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">F1 Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {(activeVersion.metrics.accuracy * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {activeVersion.deployedAt?.toLocaleDateString('it-IT')}
              </p>
              <p className="text-xs text-muted-foreground">Data Deploy</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                v{activeVersion.versionNumber}.0.0
              </p>
              <p className="text-xs text-muted-foreground">Versione</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Version Dialog */}
      <Dialog open={isCreatingVersion} onOpenChange={setIsCreatingVersion}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Crea Nuova Versione
            </DialogTitle>
            <DialogDescription>
              Crea una versione del modello per il deployment in produzione.
              Questa versione sarà disponibile per i processi successivi.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Versione</Label>
              <Input
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder={`v${versions.length + 1}.0.0`}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="Descrivi le caratteristiche e le modifiche di questa versione..."
                rows={3}
              />
            </div>

            {selectedEvaluationRun && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  Basata su: <span className="font-medium text-foreground">{selectedEvaluationRun.trainingRunName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  F1: {(selectedEvaluationRun.metrics.f1Score * 100).toFixed(1)}% • 
                  Accuracy: {(selectedEvaluationRun.metrics.accuracy * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreatingVersion(false)}>
              Annulla
            </Button>
            <Button variant="gradient" onClick={handleCreateVersion}>
              <Plus className="w-4 h-4 mr-2" />
              Crea Versione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Version Card Component
interface ProductionVersionCardProps {
  version: ProductionVersion;
  isActive: boolean;
  isDeploying: boolean;
  onDeploy: () => void;
  onSetActive: () => void;
  onDelete: () => void;
}

function ProductionVersionCard({ 
  version, 
  isActive, 
  isDeploying, 
  onDeploy, 
  onSetActive, 
  onDelete 
}: ProductionVersionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const algoConfig = getAlgorithmConfig(version.algorithmType);

  const statusConfig: Record<ProductionVersion['status'], { label: string; color: string; icon: typeof Clock }> = {
    draft: { label: 'Bozza', color: 'text-muted-foreground', icon: Clock },
    testing: { label: 'Testing', color: 'text-warning', icon: Settings2 },
    deployed: { label: 'Deployato', color: 'text-success', icon: CheckCircle2 },
    archived: { label: 'Archiviato', color: 'text-muted-foreground', icon: GitBranch },
  };

  const status = statusConfig[version.status];
  const StatusIcon = status.icon;

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      isActive ? "bg-primary/5 border-primary/30" : 
      version.status === 'deployed' ? "bg-success/5 border-success/30" : 
      "bg-muted/30 border-border"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={cn("w-5 h-5", status.color)} />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{version.name}</h4>
                <Badge variant="outline" className="text-xs">{status.label}</Badge>
                {isActive && (
                  <Badge variant="default" className="text-xs gap-1">
                    <Play className="w-3 h-3" />
                    Attivo
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {version.evaluationRunName} • {algoConfig?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {version.status === 'draft' && (
              <Button
                variant="gradient"
                size="sm"
                onClick={onDeploy}
                disabled={isDeploying}
                className="gap-1"
              >
                {isDeploying ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                Deploy
              </Button>
            )}
            {version.status === 'deployed' && !isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetActive}
                className="gap-1"
              >
                <Check className="w-4 h-4" />
                Attiva
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

        {version.description && (
          <p className="text-sm text-muted-foreground mt-2 pl-8">
            {version.description}
          </p>
        )}

        {/* Metrics */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-3 gap-1">
              <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
              {isExpanded ? 'Nascondi Metriche' : 'Mostra Metriche'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
              <MetricBadge label="Accuracy" value={version.metrics.accuracy} />
              <MetricBadge label="Precision" value={version.metrics.precision} />
              <MetricBadge label="Recall" value={version.metrics.recall} />
              <MetricBadge label="F1 Score" value={version.metrics.f1Score} />
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Creata: {version.createdAt.toLocaleDateString('it-IT')}</span>
              {version.deployedAt && (
                <span>Deployata: {version.deployedAt.toLocaleDateString('it-IT')}</span>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

// Metric Badge Component
function MetricBadge({ label, value }: { label: string; value: number }) {
  const percentage = (value * 100).toFixed(1);
  return (
    <div className="text-center p-2 rounded-lg bg-background/50">
      <p className="text-lg font-bold">{percentage}%</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
