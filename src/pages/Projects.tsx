import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid, List, SortAsc, Calendar, GitBranch, Users, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/project/ProjectCard';
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog';
import { ColumnCustomizer } from '@/components/project/ColumnCustomizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import { mockProjects, mockGroups } from '@/data/mock-data';
import { MLEngine, MLAlgorithm, ENGINE_LABELS, ALGORITHM_LABELS } from '@/types/ml-project';
import { useToast } from '@/hooks/use-toast';
import { useViewPreferences } from '@/hooks/useViewPreferences';
import { useTemplates } from '@/hooks/useTemplates';
import { cn } from '@/lib/utils';

const statusVariants = {
  active: 'default',
  paused: 'secondary',
  completed: 'success',
  archived: 'outline',
} as const;

const statusLabels = {
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  archived: 'Archiviato',
};

export default function Projects() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    preferences,
    updatePreference,
    updateColumn,
    reorderColumns,
    savePreset,
    loadPreset,
    deletePreset,
    savedPresets,
    resetToDefaults,
    getVisibleColumns,
  } = useViewPreferences('projects-view-preferences');

  const filteredProjects = useMemo(() => {
    return mockProjects
      .filter((p) => {
        if (preferences.statusFilter !== 'all' && p.status !== preferences.statusFilter) return false;
        if (preferences.groupFilter !== 'all' && p.groupId !== preferences.groupFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (preferences.sortBy === 'updated') return b.updatedAt.getTime() - a.updatedAt.getTime();
        if (preferences.sortBy === 'created') return b.createdAt.getTime() - a.createdAt.getTime();
        if (preferences.sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [preferences.statusFilter, preferences.groupFilter, preferences.sortBy]);

  const { templates } = useTemplates();

  const handleCreateProject = (data: { name: string; description: string; engine: MLEngine; algorithm: MLAlgorithm; groupId: string; templateId?: string }) => {
    // Se è stato selezionato un template, salviamo i processi nel localStorage
    if (data.templateId) {
      const template = templates.find(t => t.id === data.templateId);
      if (template) {
        // Generiamo un ID per il nuovo progetto (in un'app reale verrebbe dal backend)
        const newProjectId = `project-${Date.now()}`;
        
        // Salviamo i processi del template per questo progetto
        const STORAGE_KEY = 'ml-platform-processes';
        const storageKey = `${STORAGE_KEY}-${newProjectId}`;
        
        // Crea mapping degli ID
        const idMapping: Record<string, string> = {};
        const newProcesses = template.processes.map((tp, index) => {
          const newId = `process-${Date.now()}-${index}`;
          idMapping[tp.id] = newId;
          
          const ALL_PHASE_TYPES = [
            'comprensione_problema',
            'raccolta_dati',
            'modellazione',
            'ottimizzazione',
            'realtime',
            'valutazione',
            'produzione',
          ];
          
          const phases = ALL_PHASE_TYPES.map(type => ({
            id: `phase-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            version: 1,
            status: 'da_avviare',
            enabled: tp.enabledPhases.includes(type as any),
            ...(type === 'comprensione_problema' ? { description: '', links: [], activityLogs: [] } : {}),
            ...(type === 'raccolta_dati' ? { selectedDatasets: [], normalizationFormulas: [], additionalColumns: [] } : {}),
            ...(type === 'modellazione' ? { modelConfig: {} } : {}),
            ...(type === 'ottimizzazione' ? { optimizationConfig: {} } : {}),
            ...(type === 'realtime' ? { realtimeConfig: {} } : {}),
            ...(type === 'valutazione' ? { evaluationConfig: {} } : {}),
            ...(type === 'produzione' ? { productionConfig: {} } : {}),
          }));

          return {
            id: newId,
            name: tp.name,
            description: tp.description,
            icon: tp.icon,
            previousProcessId: undefined,
            phases,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        // Aggiorna i riferimenti
        template.processes.forEach((tp, index) => {
          if (tp.previousProcessId && idMapping[tp.previousProcessId]) {
            newProcesses[index].previousProcessId = idMapping[tp.previousProcessId];
          }
        });

        localStorage.setItem(storageKey, JSON.stringify(newProcesses));
        
        toast({
          title: 'Progetto creato con template',
          description: `Il progetto "${data.name}" è stato creato con ${template.processes.length} processo/i dal template "${template.name}".`,
        });
        
        // Navigate to the config page of the new project
        navigate(`/projects/${newProjectId}/config`);
        return;
      }
    }
    
    toast({
      title: 'Progetto creato',
      description: `Il progetto "${data.name}" è stato creato con successo.`,
    });
  };

  const visibleColumns = getVisibleColumns();

  const renderCellContent = (columnId: string, project: typeof mockProjects[0]) => {
    const group = mockGroups.find((g) => g.id === project.groupId);
    
    switch (columnId) {
      case 'name':
        return (
          <div>
            <p className="font-semibold text-foreground">{project.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
          </div>
        );
      case 'status':
        return (
          <Badge variant={statusVariants[project.status] as any}>
            {statusLabels[project.status]}
          </Badge>
        );
      case 'engine':
        return <Badge variant="glass">{ENGINE_LABELS[project.engine]}</Badge>;
      case 'algorithm':
        return <Badge variant="glass">{ALGORITHM_LABELS[project.algorithm]}</Badge>;
      case 'pipeline':
        return (
          <div className="w-40">
            <PipelineProgress steps={project.pipeline} compact />
          </div>
        );
      case 'metrics':
        return project.metrics?.accuracy ? (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            <span className="font-medium text-success">
              {(project.metrics.accuracy * 100).toFixed(1)}%
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'group':
        return (
          <span className="flex items-center gap-1 text-sm">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            {group?.name}
          </span>
        );
      case 'version':
        return (
          <span className="flex items-center gap-1 text-sm">
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
            v{project.currentVersion}
          </span>
        );
      case 'updated':
        return (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {project.updatedAt.toLocaleDateString('it-IT')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout onCreateProject={() => setCreateDialogOpen(true)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progetti</h1>
            <p className="text-muted-foreground">Gestisci tutti i tuoi progetti ML</p>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="glass-card p-4 flex flex-wrap items-center gap-4">
          <Input
            placeholder="Cerca progetti..."
            className="w-64 bg-muted/50"
          />

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={preferences.statusFilter} 
              onValueChange={(value) => updatePreference('statusFilter', value)}
            >
              <SelectTrigger className="w-32 bg-muted/50">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent className="glass-card">
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="paused">In pausa</SelectItem>
                <SelectItem value="completed">Completati</SelectItem>
                <SelectItem value="archived">Archiviati</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={preferences.groupFilter} 
              onValueChange={(value) => updatePreference('groupFilter', value)}
            >
              <SelectTrigger className="w-48 bg-muted/50">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent className="glass-card">
                <SelectItem value="all">Tutti i team</SelectItem>
                {mockGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ColumnCustomizer
              columns={preferences.columns}
              savedPresets={savedPresets}
              onUpdateColumn={updateColumn}
              onReorderColumns={reorderColumns}
              onSavePreset={savePreset}
              onLoadPreset={loadPreset}
              onDeletePreset={deletePreset}
              onReset={resetToDefaults}
            />

            <div className="flex items-center gap-1">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={preferences.sortBy} 
                onValueChange={(value) => updatePreference('sortBy', value)}
              >
                <SelectTrigger className="w-40 bg-muted/50">
                  <SelectValue placeholder="Ordina per" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="updated">Ultimo aggiornamento</SelectItem>
                  <SelectItem value="created">Data creazione</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex border border-border rounded-lg p-1">
              <Button
                variant={preferences.viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updatePreference('viewMode', 'grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={preferences.viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updatePreference('viewMode', 'list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects */}
        {filteredProjects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">Nessun progetto trovato</p>
            <Button variant="gradient" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              Crea il tuo primo progetto
            </Button>
          </div>
        ) : preferences.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableHead key={column.id} className="font-semibold">
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id}>
                        {renderCellContent(column.id, project)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateProject}
      />
    </MainLayout>
  );
}
