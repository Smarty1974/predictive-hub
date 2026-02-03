import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Workflow, Info } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProcessCard } from '@/components/config/ProcessCard';
import { ProcessFormDialog } from '@/components/config/ProcessFormDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProcesses } from '@/hooks/useProcesses';
import { useToast } from '@/hooks/use-toast';
import { mockProjects } from '@/data/mock-data';
import { Process, PhaseType } from '@/types/process';

export default function ProjectConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const project = mockProjects.find((p) => p.id === id);
  const { processes, createProcess, updateProcess, deleteProcess, togglePhase } = useProcesses(id || '');
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Progetto non trovato</p>
        </div>
      </MainLayout>
    );
  }

  const handleCreateProcess = () => {
    setEditingProcess(null);
    setFormDialogOpen(true);
  };

  const handleEditProcess = (process: Process) => {
    setEditingProcess(process);
    setFormDialogOpen(true);
  };

  const handleDeleteProcess = (processId: string) => {
    deleteProcess(processId);
    toast({
      title: 'Processo eliminato',
      description: 'Il processo è stato rimosso con successo.',
    });
  };

  const handleSaveProcess = (data: {
    name: string;
    description: string;
    icon: string;
    previousProcessId?: string;
    enabledPhases: PhaseType[];
  }) => {
    if (editingProcess) {
      updateProcess(editingProcess.id, data);
      toast({
        title: 'Processo aggiornato',
        description: `Il processo "${data.name}" è stato modificato.`,
      });
    } else {
      createProcess(data);
      toast({
        title: 'Processo creato',
        description: `Il processo "${data.name}" è stato aggiunto.`,
      });
    }
  };

  const handleTogglePhase = (processId: string, phaseType: PhaseType, enabled: boolean) => {
    togglePhase(processId, phaseType, enabled);
  };

  // Sort processes by dependency chain
  const sortedProcesses = [...processes].sort((a, b) => {
    if (a.previousProcessId === b.id) return 1;
    if (b.previousProcessId === a.id) return -1;
    return 0;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Configurazione Progetto</h1>
            </div>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
          <Button onClick={handleCreateProcess} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuovo Processo
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription>
            Configura i processi del tuo progetto ML. Ogni processo può essere composto da diverse fasi 
            (comprensione, raccolta dati, modellazione, ecc.) e può essere collegato ad altri processi 
            per creare workflow complessi.
          </AlertDescription>
        </Alert>

        {/* Processes List */}
        {sortedProcesses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nessun Processo Configurato</h3>
            <p className="text-muted-foreground mb-4">
              Inizia creando il tuo primo processo per definire le fasi del workflow ML.
            </p>
            <Button onClick={handleCreateProcess} className="gap-2">
              <Plus className="w-4 h-4" />
              Crea Primo Processo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedProcesses.map((process) => {
              const previousProcess = processes.find(p => p.id === process.previousProcessId);
              return (
                <ProcessCard
                  key={process.id}
                  process={process}
                  previousProcess={previousProcess}
                  onEdit={handleEditProcess}
                  onDelete={handleDeleteProcess}
                  onTogglePhase={handleTogglePhase}
                />
              );
            })}
          </div>
        )}

        {/* Process Workflow Visualization */}
        {sortedProcesses.length > 1 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Workflow dei Processi</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {sortedProcesses.map((process, index) => (
                <div key={process.id} className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium">{process.name}</span>
                  </div>
                  {index < sortedProcesses.length - 1 && (
                    <div className="w-8 h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ProcessFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        process={editingProcess}
        existingProcesses={processes}
        onSave={handleSaveProcess}
      />
    </MainLayout>
  );
}
