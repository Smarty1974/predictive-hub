import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid, List, SortAsc } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/project/ProjectCard';
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockProjects, mockGroups } from '@/data/mock-data';
import { MLEngine, MLAlgorithm } from '@/types/ml-project';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Projects() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredProjects = mockProjects
    .filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (groupFilter !== 'all' && p.groupId !== groupFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'updated') return b.updatedAt.getTime() - a.updatedAt.getTime();
      if (sortBy === 'created') return b.createdAt.getTime() - a.createdAt.getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleCreateProject = (data: { name: string; description: string; engine: MLEngine; algorithm: MLAlgorithm; groupId: string }) => {
    toast({
      title: 'Progetto creato',
      description: `Il progetto "${data.name}" è stato creato con successo.`,
    });
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

        {/* Filters */}
        <div className="glass-card p-4 flex flex-wrap items-center gap-4">
          <Input
            placeholder="Cerca progetti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-muted/50"
          />

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

            <Select value={groupFilter} onValueChange={setGroupFilter}>
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
            <div className="flex items-center gap-1">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
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
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
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
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            )}
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
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
