import { useState } from 'react';
import { 
  Brain, Database, Cog, Zap, Activity, Target, Rocket, GitBranch, 
  Layers, Box, Cpu, BarChart, LineChart, PieChart, Network, Workflow,
  Sparkles, Lightbulb, Gauge, Shield, ChevronDown, ChevronUp, Edit2, Trash2, Link2,
  Settings2, FileSpreadsheet
} from 'lucide-react';
import { Process, PHASE_TYPE_LABELS, PHASE_STATUS_LABELS, PHASE_STATUS_COLORS, PhaseType } from '@/types/process';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DataCollectionPanel } from '@/components/data/DataCollectionPanel';
import { usePhaseData } from '@/hooks/usePhaseData';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, Database, Cog, Zap, Activity, Target, Rocket, GitBranch,
  Layers, Box, Cpu, BarChart, LineChart, PieChart, Network, Workflow,
  Sparkles, Lightbulb, Gauge, Shield,
};

interface ProcessCardProps {
  process: Process;
  previousProcess?: Process;
  projectId: string;
  onEdit: (process: Process) => void;
  onDelete: (processId: string) => void;
  onTogglePhase: (processId: string, phaseType: PhaseType, enabled: boolean) => void;
}

export function ProcessCard({ process, previousProcess, projectId, onEdit, onDelete, onTogglePhase }: ProcessCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dataCollectionDialogOpen, setDataCollectionDialogOpen] = useState(false);
  const IconComponent = iconMap[process.icon] || Brain;
  const { getDataCollectionConfig, updateDataCollectionConfig } = usePhaseData(projectId);

  const enabledPhases = process.phases.filter(p => p.enabled);
  const completedPhases = enabledPhases.filter(p => p.status === 'completato');
  const dataCollectionPhase = process.phases.find(p => p.type === 'raccolta_dati');

  const handleOpenPhaseConfig = (phaseType: PhaseType) => {
    if (phaseType === 'raccolta_dati') {
      setDataCollectionDialogOpen(true);
    }
  };

  return (
    <>
      <Card className="glass-card overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{process.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{process.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(process)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(process.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <Badge variant="outline" className="text-xs">
                {enabledPhases.length} fasi attive
              </Badge>
              <Badge variant="outline" className="text-xs">
                {completedPhases.length}/{enabledPhases.length} completate
              </Badge>
              {previousProcess && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Link2 className="w-3 h-3" />
                  <span>Collegato a: {previousProcess.name}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 border-t border-border">
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium text-foreground">Fasi del Processo</h4>
                <div className="grid gap-2">
                  {process.phases.map((phase) => (
                    <div 
                      key={phase.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        phase.enabled ? "bg-muted/30 border-border" : "bg-muted/10 border-transparent opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={phase.enabled}
                          onCheckedChange={(checked) => onTogglePhase(process.id, phase.type, checked)}
                        />
                        <div>
                          <p className="text-sm font-medium">{PHASE_TYPE_LABELS[phase.type]}</p>
                          <p className="text-xs text-muted-foreground">
                            Versione {phase.version}
                            {phase.startDate && ` • Avviato: ${new Date(phase.startDate).toLocaleDateString('it-IT')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                      {phase.enabled && phase.type === 'raccolta_dati' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPhaseConfig(phase.type);
                            }}
                          >
                            <Settings2 className="w-4 h-4 mr-1" />
                            Configura Dati
                          </Button>
                        )}
                        <Badge className={cn("text-xs", PHASE_STATUS_COLORS[phase.status])}>
                          {PHASE_STATUS_LABELS[phase.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Data Collection Dialog - Full Feature Panel */}
      <Dialog open={dataCollectionDialogOpen} onOpenChange={setDataCollectionDialogOpen}>
        <DialogContent className="glass-card border-glass-border w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Configurazione Raccolta Dati - {process.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Seleziona dataset, modifica i formati, aggiungi trasformazioni e merge tra file
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 py-4">
            <DataCollectionPanel
              projectId={projectId}
              selectedDatasets={getDataCollectionConfig(process.id)}
              onUpdateDatasets={(datasets) => updateDataCollectionConfig(process.id, datasets)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
