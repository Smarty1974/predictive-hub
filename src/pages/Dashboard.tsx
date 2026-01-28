import { useState } from 'react';
import { FolderKanban, Layers, Users, TrendingUp, Filter } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SortableProjectCard } from '@/components/dashboard/SortableProjectCard';
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockProjects, mockGroups } from '@/data/mock-data';
import { useNavigate } from 'react-router-dom';
import { MLEngine, MLAlgorithm, MLProject } from '@/types/ml-project';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [projects, setProjects] = useState<MLProject[]>(mockProjects);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (groupFilter !== 'all' && p.groupId !== groupFilter) return false;
    return true;
  });

  const stats = {
    totalProjects: projects.length,
    activePipelines: projects.filter((p) => p.status === 'active').length,
    totalTeams: mockGroups.length,
    avgAccuracy: Math.round(
      (projects.filter((p) => p.metrics?.accuracy).reduce((acc, p) => acc + (p.metrics?.accuracy || 0), 0) /
        projects.filter((p) => p.metrics?.accuracy).length) *
        100
    ),
  };

  const handleCreateProject = (data: { name: string; description: string; engine: MLEngine; algorithm: MLAlgorithm; groupId: string }) => {
    toast({
      title: 'Progetto creato',
      description: `Il progetto "${data.name}" è stato creato con successo.`,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast({
        title: 'Layout aggiornato',
        description: 'La posizione delle card è stata salvata.',
      });
    }
  };

  return (
    <MainLayout onCreateProject={() => setCreateDialogOpen(true)}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glow-effect glass-card p-6 rounded-xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Benvenuto nella <span className="gradient-text">ML Platform</span>
          </h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi progetti di machine learning, monitora le pipeline e collabora con il tuo team.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Progetti Totali"
            value={stats.totalProjects}
            change="+2 questo mese"
            changeType="positive"
            icon={FolderKanban}
          />
          <StatsCard
            title="Pipeline Attive"
            value={stats.activePipelines}
            change="3 in training"
            changeType="neutral"
            icon={Layers}
            iconColor="bg-warning/20"
          />
          <StatsCard
            title="Team"
            value={stats.totalTeams}
            change="8 membri attivi"
            changeType="neutral"
            icon={Users}
            iconColor="bg-accent/20"
          />
          <StatsCard
            title="Accuracy Media"
            value={`${stats.avgAccuracy}%`}
            change="+3% vs mese scorso"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-success/20"
          />
        </div>

        {/* Projects Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Progetti Recenti</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-9 bg-muted/50">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="active">Attivi</SelectItem>
                    <SelectItem value="paused">In pausa</SelectItem>
                    <SelectItem value="completed">Completati</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-40 h-9 bg-muted/50">
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
            </div>

            {/* Project Grid with Drag & Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredProjects.slice(0, 4).map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.slice(0, 4).map((project) => (
                    <SortableProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {filteredProjects.length > 4 && (
              <div className="text-center">
                <Button variant="outline" onClick={() => navigate('/projects')}>
                  Vedi tutti i progetti ({filteredProjects.length})
                </Button>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <ActivityFeed />
          </div>
        </div>
      </div>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateProject}
      />
    </MainLayout>
  );
}
