import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Filter, Search, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import { mockProjects } from '@/data/mock-data';
import { PHASE_LABELS, PhaseStatus } from '@/types/ml-project';
import { cn } from '@/lib/utils';

const statusConfig: Record<PhaseStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'In attesa', icon: Clock, color: 'text-muted-foreground' },
  in_progress: { label: 'In corso', icon: Loader2, color: 'text-primary' },
  completed: { label: 'Completato', icon: CheckCircle2, color: 'text-success' },
  error: { label: 'Errore', icon: AlertCircle, color: 'text-destructive' },
};

export default function Pipelines() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  // Get current phase for each project
  const pipelinesData = mockProjects.map((project) => {
    const currentPhaseIndex = project.pipeline.findIndex(
      (step) => step.status === 'in_progress' || step.status === 'error'
    );
    const currentPhase = currentPhaseIndex !== -1 
      ? project.pipeline[currentPhaseIndex] 
      : project.pipeline[project.pipeline.length - 1];
    
    const completedSteps = project.pipeline.filter((s) => s.status === 'completed').length;
    const progress = (completedSteps / project.pipeline.length) * 100;

    return {
      ...project,
      currentPhase,
      progress,
      overallStatus: project.pipeline.some((s) => s.status === 'error')
        ? 'error'
        : project.pipeline.some((s) => s.status === 'in_progress')
        ? 'in_progress'
        : project.pipeline.every((s) => s.status === 'completed')
        ? 'completed'
        : 'pending',
    };
  });

  // Apply filters
  const filteredPipelines = pipelinesData.filter((pipeline) => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pipeline.overallStatus === statusFilter;
    const matchesPhase = phaseFilter === 'all' || pipeline.currentPhase?.phase === phaseFilter;
    return matchesSearch && matchesStatus && matchesPhase;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Monitora e gestisci le pipeline di tutti i progetti
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca pipeline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-background/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="in_progress">In corso</SelectItem>
                  <SelectItem value="completed">Completate</SelectItem>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="error">Errore</SelectItem>
                </SelectContent>
              </Select>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger className="w-[200px] bg-background/50">
                  <SelectValue placeholder="Fase corrente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le fasi</SelectItem>
                  <SelectItem value="problem_understanding">Comprensione</SelectItem>
                  <SelectItem value="data_collection">Raccolta Dati</SelectItem>
                  <SelectItem value="model_training">Training</SelectItem>
                  <SelectItem value="evaluation">Valutazione</SelectItem>
                  <SelectItem value="deployment">Deployment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'In Corso', value: pipelinesData.filter((p) => p.overallStatus === 'in_progress').length, color: 'text-primary' },
            { label: 'Completate', value: pipelinesData.filter((p) => p.overallStatus === 'completed').length, color: 'text-success' },
            { label: 'In Attesa', value: pipelinesData.filter((p) => p.overallStatus === 'pending').length, color: 'text-muted-foreground' },
            { label: 'Errori', value: pipelinesData.filter((p) => p.overallStatus === 'error').length, color: 'text-destructive' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <p className={cn('text-3xl font-bold', stat.color)}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pipelines List */}
        <div className="space-y-4">
          {filteredPipelines.map((pipeline) => {
            const StatusIcon = statusConfig[pipeline.overallStatus as PhaseStatus].icon;
            
            return (
              <div
                key={pipeline.id}
                className="glass-card p-6 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate(`/projects/${pipeline.id}`)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Project Info */}
                  <div className="flex-shrink-0 lg:w-64">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        pipeline.overallStatus === 'completed' && 'bg-success/20',
                        pipeline.overallStatus === 'in_progress' && 'bg-primary/20',
                        pipeline.overallStatus === 'pending' && 'bg-muted',
                        pipeline.overallStatus === 'error' && 'bg-destructive/20'
                      )}>
                        <StatusIcon className={cn(
                          'w-5 h-5',
                          statusConfig[pipeline.overallStatus as PhaseStatus].color,
                          pipeline.overallStatus === 'in_progress' && 'animate-spin'
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{pipeline.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          v{pipeline.currentVersion} • {Math.round(pipeline.progress)}% completato
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Progress */}
                  <div className="flex-1">
                    <PipelineProgress steps={pipeline.pipeline} compact />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={pipeline.overallStatus as any}>
                      {statusConfig[pipeline.overallStatus as PhaseStatus].label}
                    </Badge>
                    {pipeline.overallStatus === 'in_progress' ? (
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : pipeline.overallStatus !== 'completed' ? (
                      <Button variant="gradient" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Play className="w-4 h-4" />
                      </Button>
                    ) : null}
                    {pipeline.overallStatus === 'error' && (
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Current Phase Details */}
                {pipeline.currentPhase && pipeline.overallStatus !== 'completed' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Fase corrente: <span className="text-foreground font-medium">
                          {PHASE_LABELS[pipeline.currentPhase.phase]}
                        </span>
                      </span>
                      {pipeline.currentPhase.startedAt && (
                        <span className="text-muted-foreground">
                          Avviato: {pipeline.currentPhase.startedAt.toLocaleDateString('it-IT')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredPipelines.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">Nessuna pipeline trovata con i filtri selezionati</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
