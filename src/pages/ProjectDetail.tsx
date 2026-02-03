import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, RotateCcw, GitBranch, Settings, 
  FileText, Database, BarChart3, Layers, GripVertical, 
  Eye, EyeOff, RotateCw, Activity, PanelLeftClose, PanelLeft,
  ChevronRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import { PhaseDetailPanel } from '@/components/pipeline/PhaseDetailPanel';
import { DraggablePhaseList } from '@/components/pipeline/DraggablePhaseList';
import { ProjectVersionPanel } from '@/components/version/ProjectVersionPanel';
import { VersionComparisonSheet } from '@/components/version/VersionComparisonSheet';
import { ActivityLogPanel } from '@/components/version/ActivityLogPanel';
import { mockProjects, currentUser } from '@/data/mock-data';
import { PHASE_LABELS, ENGINE_LABELS, ALGORITHM_LABELS, PhaseStatus, PipelineStep, PhaseLink, ActivityLog } from '@/types/ml-project';
import { usePipelineLayout } from '@/hooks/usePipelineLayout';
import { useVersioning, VersionChange } from '@/hooks/useVersioning';
import { useActivityLog } from '@/hooks/useActivityLog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<PhaseStatus, { label: string; variant: string }> = {
  pending: { label: 'In attesa', variant: 'pending' },
  in_progress: { label: 'In corso', variant: 'active' },
  completed: { label: 'Completato', variant: 'completed' },
  error: { label: 'Errore', variant: 'error' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const baseProject = mockProjects.find((p) => p.id === id);
  const [project, setProject] = useState(baseProject);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [isPhasePanelCollapsed, setIsPhasePanelCollapsed] = useState(false);
  
  const { 
    layout, 
    reorderPhases, 
    resetLayout 
  } = usePipelineLayout(id || 'default');

  const {
    versions,
    currentVersion,
    createVersion,
    restoreVersion,
    compareVersions,
  } = useVersioning(id || '');

  const { logs, addLog } = useActivityLog(id);

  // Comparison state
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    version1: ReturnType<typeof compareVersions> extends infer T ? T extends { version1: infer V } ? V : never : never;
    version2: ReturnType<typeof compareVersions> extends infer T ? T extends { version2: infer V } ? V : never : never;
    changes: VersionChange[];
  } | null>(null);

  // Apply saved phase order
  const orderedPipeline = project ? [...project.pipeline].sort((a, b) => {
    const orderA = layout.phaseOrder.indexOf(a.id);
    const orderB = layout.phaseOrder.indexOf(b.id);
    if (orderA === -1 && orderB === -1) return 0;
    if (orderA === -1) return 1;
    if (orderB === -1) return -1;
    return orderA - orderB;
  }) : [];

  const handleUpdateDescription = (stepId: string, description: string) => {
    if (!project) return;
    const step = project.pipeline.find((s) => s.id === stepId);
    setProject({
      ...project,
      pipeline: project.pipeline.map((s) =>
        s.id === stepId ? { ...s, description } : s
      ),
    });
    addLog({
      action: 'description_updated',
      type: 'phase',
      referenceId: stepId,
      projectId: project.id,
      userId: currentUser.id,
      userName: currentUser.name,
      details: `Descrizione aggiornata per fase ${step ? PHASE_LABELS[step.phase] : stepId}`,
    });
  };

  const handleAddLink = (stepId: string, link: Omit<PhaseLink, 'id' | 'addedAt'>) => {
    if (!project) return;
    const step = project.pipeline.find((s) => s.id === stepId);
    const newLink: PhaseLink = {
      ...link,
      id: `link-${Date.now()}`,
      addedAt: new Date(),
    };
    setProject({
      ...project,
      pipeline: project.pipeline.map((s) =>
        s.id === stepId ? { ...s, links: [...s.links, newLink] } : s
      ),
    });
    addLog({
      action: 'link_added',
      type: 'phase',
      referenceId: stepId,
      projectId: project.id,
      userId: currentUser.id,
      userName: currentUser.name,
      details: `Link "${link.title}" aggiunto a ${step ? PHASE_LABELS[step.phase] : stepId}`,
    });
  };

  const handleRemoveLink = (stepId: string, linkId: string) => {
    if (!project) return;
    const step = project.pipeline.find((s) => s.id === stepId);
    setProject({
      ...project,
      pipeline: project.pipeline.map((s) =>
        s.id === stepId ? { ...s, links: s.links.filter((l) => l.id !== linkId) } : s
      ),
    });
  };

  const handleAddActivityLog = (stepId: string, log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    if (!project) return;
    const step = project.pipeline.find((s) => s.id === stepId);
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date(),
    };
    setProject({
      ...project,
      pipeline: project.pipeline.map((s) =>
        s.id === stepId ? { ...s, activityLogs: [newLog, ...s.activityLogs] } : s
      ),
    });
    addLog({
      action: 'phase_updated',
      type: 'phase',
      referenceId: stepId,
      projectId: project.id,
      userId: currentUser.id,
      userName: currentUser.name,
      details: `Attività registrata: ${log.action} - ${step ? PHASE_LABELS[step.phase] : stepId}`,
    });
  };

  const handleReorderPhases = (newPhases: PipelineStep[]) => {
    if (!project) return;
    reorderPhases(newPhases.map(p => p.id));
    addLog({
      action: 'pipeline_reordered',
      type: 'pipeline',
      referenceId: project.id,
      projectId: project.id,
      userId: currentUser.id,
      userName: currentUser.name,
      details: 'Ordine delle fasi riordinato',
    });
    toast({
      title: 'Ordine salvato',
      description: 'La nuova disposizione delle fasi è stata salvata.',
    });
  };

  const handleCompareVersions = (versionId1: string, versionId2: string) => {
    const result = compareVersions(versionId1, versionId2);
    if (result) {
      setComparisonData(result);
      setComparisonOpen(true);
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    const restoredPipeline = restoreVersion(versionId);
    if (restoredPipeline && project) {
      setProject({
        ...project,
        pipeline: restoredPipeline,
      });
      addLog({
        action: 'version_restored',
        type: 'version',
        referenceId: versionId,
        projectId: project.id,
        versionId,
        userId: currentUser.id,
        userName: currentUser.name,
        details: `Versione ${versionId.split('-v')[1]} ripristinata`,
      });
      toast({
        title: 'Versione ripristinata',
        description: 'La pipeline è stata ripristinata alla versione selezionata.',
      });
      setComparisonOpen(false);
    }
  };

  const handleCreateVersion = (description: string) => {
    if (!project) return;
    const newVersion = createVersion(
      project.name,
      project.pipeline,
      currentUser.name,
      description
    );
    addLog({
      action: 'version_created',
      type: 'version',
      referenceId: newVersion.id,
      projectId: project.id,
      versionId: newVersion.id,
      userId: currentUser.id,
      userName: currentUser.name,
      details: `Creata versione ${newVersion.version}: ${description}`,
    });
    toast({
      title: 'Versione creata',
      description: `Versione ${newVersion.version} salvata con successo.`,
    });
  };

  const handleResetLayout = () => {
    resetLayout();
    toast({
      title: 'Layout ripristinato',
      description: 'Il layout è stato ripristinato ai valori predefiniti.',
    });
  };

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
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${id}/config`)}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Pipeline Overview - Modern Stepper */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pipeline Progress</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-muted-foreground">In attesa</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">In corso</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Completato</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Errore</span>
              </span>
            </div>
          </div>
          <PipelineProgress steps={orderedPipeline} />
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
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="w-4 h-4 mr-2" />
              Attività
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phases" className="space-y-4">
            {/* Layout controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsPhasePanelCollapsed(!isPhasePanelCollapsed)}
                  className="gap-2"
                >
                  {isPhasePanelCollapsed ? (
                    <>
                      <PanelLeft className="w-4 h-4" />
                      Mostra Fasi
                    </>
                  ) : (
                    <>
                      <PanelLeftClose className="w-4 h-4" />
                      Nascondi Fasi
                    </>
                  )}
                </Button>
                {!isPhasePanelCollapsed && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    <span>Trascina per riordinare</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetLayout}>
                <RotateCw className="w-4 h-4 mr-2" />
                Ripristina ordine
              </Button>
            </div>

            <div className="flex gap-4">
              {/* Collapsible Phase List */}
              <div 
                className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
                  isPhasePanelCollapsed ? "w-0 opacity-0" : "w-80 opacity-100"
                )}
              >
                <div className="w-80">
                  <DraggablePhaseList
                    phases={orderedPipeline}
                    selectedPhaseId={selectedPhaseId}
                    onSelectPhase={setSelectedPhaseId}
                    onReorderPhases={handleReorderPhases}
                    compact
                  />
                </div>
              </div>

              {/* Collapsed Phase Indicator */}
              {isPhasePanelCollapsed && selectedPhaseId && (
                <div className="flex-shrink-0">
                  <div className="glass-card p-3 flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsPhasePanelCollapsed(false)}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {(() => {
                      const step = project.pipeline.find(s => s.id === selectedPhaseId);
                      if (!step) return null;
                      return (
                        <div className="flex items-center gap-2">
                          <Badge variant="glass" className="text-xs">
                            {PHASE_LABELS[step.phase]}
                          </Badge>
                          <Badge 
                            variant={
                              step.status === 'completed' ? 'default' : 
                              step.status === 'in_progress' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {statusConfig[step.status].label}
                          </Badge>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Phase Detail Panel - Full width when collapsed */}
              <div className="flex-1 min-w-0">
                {selectedPhaseId ? (
                  (() => {
                    const selectedStep = project.pipeline.find((s) => s.id === selectedPhaseId);
                    if (!selectedStep) return null;
                    return (
                      <PhaseDetailPanel
                        step={selectedStep}
                        projectId={id || ''}
                        onUpdateDescription={(desc) => handleUpdateDescription(selectedPhaseId, desc)}
                        onAddLink={(link) => handleAddLink(selectedPhaseId, link)}
                        onRemoveLink={(linkId) => handleRemoveLink(selectedPhaseId, linkId)}
                        onAddActivityLog={(log) => handleAddActivityLog(selectedPhaseId, log)}
                      />
                    );
                  })()
                ) : (
                  <div className="glass-card p-8 text-center h-full flex items-center justify-center min-h-[400px]">
                    <div className="text-muted-foreground">
                      <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Seleziona una fase</p>
                      <p className="text-sm mt-1">Clicca su una fase per visualizzare e gestire i dettagli</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
            <div className="glass-card p-6">
              <ProjectVersionPanel
                versions={versions}
                onCompare={handleCompareVersions}
                onRestore={handleRestoreVersion}
                onCreateVersion={handleCreateVersion}
              />
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Attività Recenti</h3>
              </div>
              <ActivityLogPanel logs={logs} maxHeight="500px" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Version Comparison Sheet */}
        <VersionComparisonSheet
          open={comparisonOpen}
          onOpenChange={setComparisonOpen}
          version1={comparisonData?.version1 || null}
          version2={comparisonData?.version2 || null}
          changes={comparisonData?.changes || []}
          onRestore={handleRestoreVersion}
        />
      </div>
    </MainLayout>
  );
}
