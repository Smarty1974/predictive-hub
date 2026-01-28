import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, GitBranch, Settings, FileText, Database, BarChart3 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import { mockProjects } from '@/data/mock-data';
import { PHASE_LABELS, ENGINE_LABELS, ALGORITHM_LABELS, PhaseStatus } from '@/types/ml-project';
import { cn } from '@/lib/utils';

const statusConfig: Record<PhaseStatus, { label: string; variant: string }> = {
  pending: { label: 'In attesa', variant: 'pending' },
  in_progress: { label: 'In corso', variant: 'active' },
  completed: { label: 'Completato', variant: 'completed' },
  error: { label: 'Errore', variant: 'error' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground">Progetto non trovato</p>
          <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
            Torna alla dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <p className="text-muted-foreground mt-1">{project.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="glass">{ENGINE_LABELS[project.engine]}</Badge>
                <Badge variant="glass">{ALGORITHM_LABELS[project.algorithm]}</Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  v{project.currentVersion}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Rollback
            </Button>
            {project.status === 'active' ? (
              <Button variant="outline" size="sm">
                <Pause className="w-4 h-4 mr-2" />
                Pausa
              </Button>
            ) : (
              <Button variant="gradient" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Avvia
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pipeline Progress</h2>
          <PipelineProgress steps={project.pipeline} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="phases" className="space-y-4">
          <TabsList className="glass-card h-auto p-1 gap-1">
            <TabsTrigger value="phases" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Layers className="w-4 h-4 mr-2" />
              Fasi
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="w-4 h-4 mr-2" />
              Dati
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              Metriche
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Log
            </TabsTrigger>
            <TabsTrigger value="versions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GitBranch className="w-4 h-4 mr-2" />
              Versioni
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phases" className="space-y-4">
            {project.pipeline.map((step) => {
              const config = statusConfig[step.status];
              return (
                <div key={step.id} className="glass-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg',
                          step.status === 'completed' && 'bg-success/20 text-success',
                          step.status === 'in_progress' && 'bg-primary/20 text-primary animate-glow-pulse',
                          step.status === 'pending' && 'bg-muted text-muted-foreground',
                          step.status === 'error' && 'bg-destructive/20 text-destructive'
                        )}
                      >
                        {project.pipeline.indexOf(step) + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{PHASE_LABELS[step.phase]}</h3>
                        <p className="text-sm text-muted-foreground">
                          {step.startedAt
                            ? `Avviato: ${step.startedAt.toLocaleDateString('it-IT')}`
                            : 'Non ancora avviato'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={config.variant as any}>{config.label}</Badge>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="data">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Dataset</h3>
              <p className="text-muted-foreground">
                Gestisci i tuoi dataset qui. Carica nuovi file, visualizza statistiche e prepara i dati per il training.
              </p>
              <Button variant="outline" className="mt-4">
                Carica Dataset
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            {project.metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(project.metrics).map(([key, value]) => (
                  <div key={key} className="glass-card p-5 text-center">
                    <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-6 text-center text-muted-foreground">
                Nessuna metrica disponibile. Completa il training per visualizzare i risultati.
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs">
            <div className="glass-card p-6 font-mono text-sm">
              <div className="space-y-2 max-h-96 overflow-auto scrollbar-thin">
                <p className="text-muted-foreground">[2024-03-15 10:30:22] INFO: Pipeline avviata</p>
                <p className="text-success">[2024-03-15 10:30:25] SUCCESS: Fase 1 completata</p>
                <p className="text-muted-foreground">[2024-03-15 10:31:00] INFO: Caricamento dataset...</p>
                <p className="text-success">[2024-03-15 10:32:15] SUCCESS: Dataset caricato (1.2GB)</p>
                <p className="text-warning">[2024-03-15 10:32:20] WARNING: Valori mancanti rilevati</p>
                <p className="text-muted-foreground">[2024-03-15 10:33:00] INFO: Avvio training...</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="versions">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="glass">v{project.currentVersion - i}</Badge>
                    <div>
                      <p className="text-sm text-foreground">
                        {i === 0 ? 'Versione corrente' : `Aggiornamento parametri ${i === 1 ? 'precedente' : ''}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Confronta
                    </Button>
                    {i > 0 && (
                      <Button variant="outline" size="sm">
                        Ripristina
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// Add missing import
import { Layers } from 'lucide-react';
