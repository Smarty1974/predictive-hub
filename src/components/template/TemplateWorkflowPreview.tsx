import { 
  Brain, Database, Cog, Zap, Activity, Target, Rocket, GitBranch, 
  Layers, Box, Cpu, BarChart, LineChart, PieChart, Network, Workflow,
  Sparkles, Lightbulb, Gauge, Shield, ArrowRight, ArrowDown, X,
  FileText, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProjectTemplate, TEMPLATE_CATEGORY_LABELS } from '@/types/template';
import { PHASE_TYPE_LABELS, PhaseType } from '@/types/process';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, Database, Cog, Zap, Activity, Target, Rocket, GitBranch,
  Layers, Box, Cpu, BarChart, LineChart, PieChart, Network, Workflow,
  Sparkles, Lightbulb, Gauge, Shield, FileText,
};

const phaseColors: Record<PhaseType, string> = {
  comprensione_problema: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  raccolta_dati: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  modellazione: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  ottimizzazione: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  realtime: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  valutazione: 'bg-rose-500/20 text-rose-500 border-rose-500/30',
  produzione: 'bg-green-500/20 text-green-500 border-green-500/30',
};

const phaseIcons: Record<PhaseType, React.ComponentType<{ className?: string }>> = {
  comprensione_problema: Lightbulb,
  raccolta_dati: Database,
  modellazione: Brain,
  ottimizzazione: Gauge,
  realtime: Zap,
  valutazione: Target,
  produzione: Rocket,
};

interface TemplateWorkflowPreviewProps {
  template: ProjectTemplate;
  onClose: () => void;
}

export function TemplateWorkflowPreview({ template, onClose }: TemplateWorkflowPreviewProps) {
  const totalPhases = template.processes.reduce((acc, p) => acc + p.enabledPhases.length, 0);
  
  // Build process dependency graph
  const processWithDeps = template.processes.map(process => {
    const prevProcess = process.previousProcessId 
      ? template.processes.find(p => p.id === process.previousProcessId)
      : null;
    return { process, prevProcess };
  });

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l shadow-xl overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Workflow className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{template.name}</h2>
                  <Badge variant="outline" className="mt-1">
                    {TEMPLATE_CATEGORY_LABELS[template.category]}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground mt-2">{template.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">{template.processes.length} Processi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">{totalPhases} Fasi totali</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Workflow Diagram */}
          <section>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              Diagramma Workflow
            </h3>
            
            <div className="relative">
              {processWithDeps.map(({ process, prevProcess }, processIndex) => {
                const IconComp = iconMap[process.icon] || Brain;
                const isLast = processIndex === processWithDeps.length - 1;
                
                return (
                  <div key={process.id} className="relative">
                    {/* Connection from previous process */}
                    {prevProcess && (
                      <div className="flex items-center justify-center py-2">
                        <div className="flex flex-col items-center text-muted-foreground">
                          <ArrowDown className="w-5 h-5" />
                          <span className="text-xs">da {prevProcess.name}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Process Card */}
                    <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                          <IconComp className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">{process.name}</h4>
                          {process.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {process.description}
                            </p>
                          )}
                          
                          {/* Phase Flow */}
                          <div className="mt-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {process.enabledPhases.map((phase, phaseIndex) => {
                                const PhaseIcon = phaseIcons[phase];
                                const isLastPhase = phaseIndex === process.enabledPhases.length - 1;
                                
                                return (
                                  <div key={phase} className="flex items-center gap-2">
                                    <div 
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105",
                                        phaseColors[phase]
                                      )}
                                    >
                                      <PhaseIcon className="w-4 h-4" />
                                      <span className="text-sm font-medium">
                                        {PHASE_TYPE_LABELS[phase]}
                                      </span>
                                    </div>
                                    {!isLastPhase && (
                                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Connection to next process */}
                    {!isLast && !template.processes[processIndex + 1]?.previousProcessId && (
                      <div className="flex items-center justify-center py-4">
                        <ArrowDown className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Phase Legend */}
          <section>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Legenda Fasi
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(phaseColors).map(([phase, colorClass]) => {
                const PhaseIcon = phaseIcons[phase as PhaseType];
                const isUsed = template.processes.some(p => 
                  p.enabledPhases.includes(phase as PhaseType)
                );
                
                return (
                  <div 
                    key={phase}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-sm",
                      isUsed ? colorClass : "bg-muted/30 text-muted-foreground border-transparent opacity-50"
                    )}
                  >
                    <PhaseIcon className="w-4 h-4" />
                    <span>{PHASE_TYPE_LABELS[phase as PhaseType]}</span>
                    {isUsed && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Process Details */}
          <section>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Dettagli Processi
            </h3>
            <div className="space-y-3">
              {template.processes.map((process, index) => {
                const IconComp = iconMap[process.icon] || Brain;
                return (
                  <div 
                    key={process.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      #{index + 1}
                    </span>
                    <IconComp className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{process.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {process.enabledPhases.length} fasi attive
                      </p>
                    </div>
                    {process.previousProcessId && (
                      <Badge variant="outline" className="text-xs">
                        Dipende da processo precedente
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
