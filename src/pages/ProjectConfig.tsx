import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Workflow, Info, Save, FileBox, Check, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProcessCard } from '@/components/config/ProcessCard';
import { ProcessFormDialog } from '@/components/config/ProcessFormDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProcesses } from '@/hooks/useProcesses';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import { mockProjects } from '@/data/mock-data';
import { Process, PhaseType } from '@/types/process';
import { ProjectTemplate, TEMPLATE_CATEGORY_LABELS } from '@/types/template';
import { cn } from '@/lib/utils';

export default function ProjectConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const project = mockProjects.find((p) => p.id === id);
  const { processes, initialized, createProcess, updateProcess, deleteProcess, togglePhase, initializeFromTemplate } = useProcesses(id || '');
  const { templates, saveAsTemplate } = useTemplates();
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateSelectionOpen, setTemplateSelectionOpen] = useState(false);
  const [changeTemplateConfirmOpen, setChangeTemplateConfirmOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'custom' as ProjectTemplate['category'],
  });

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

  const handleSaveAsTemplate = () => {
    if (!templateData.name.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci un nome per il template.',
        variant: 'destructive',
      });
      return;
    }

    const processTemplates = processes.map(p => ({
      name: p.name,
      description: p.description,
      icon: p.icon,
      enabledPhases: p.phases.filter(ph => ph.enabled).map(ph => ph.type),
      previousProcessId: p.previousProcessId,
    }));

    saveAsTemplate(
      templateData.name,
      templateData.description,
      templateData.category,
      processTemplates as any
    );

    toast({
      title: 'Template salvato',
      description: `La configurazione è stata salvata come template "${templateData.name}".`,
    });

    setSaveTemplateDialogOpen(false);
    setTemplateData({ name: '', description: '', category: 'custom' });
  };

  const handleInitializeFromTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      toast({
        title: 'Errore',
        description: 'Seleziona un template valido.',
        variant: 'destructive',
      });
      return;
    }

    initializeFromTemplate(template.processes, true); // Force overwrite existing processes
    
    toast({
      title: 'Template applicato',
      description: `Il progetto è stato inizializzato con ${template.processes.length} processo/i dal template "${template.name}".`,
    });
    
    setTemplateSelectionOpen(false);
    setChangeTemplateConfirmOpen(false);
    setSelectedTemplateId('');
  };

  const handleChangeTemplate = () => {
    if (processes.length > 0) {
      setChangeTemplateConfirmOpen(true);
    } else {
      setTemplateSelectionOpen(true);
    }
  };

  const handleConfirmChangeTemplate = () => {
    setChangeTemplateConfirmOpen(false);
    setTemplateSelectionOpen(true);
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleChangeTemplate}
            >
              <RefreshCw className="w-4 h-4" />
              {processes.length > 0 ? 'Cambia Template' : 'Usa Template'}
            </Button>
            {processes.length > 0 && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setSaveTemplateDialogOpen(true)}
              >
                <Save className="w-4 h-4" />
                Salva come Template
              </Button>
            )}
            <Button onClick={handleCreateProcess} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuovo Processo
            </Button>
          </div>
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
        {initialized && sortedProcesses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nessun Processo Configurato</h3>
            <p className="text-muted-foreground mb-4">
              Inizia creando il tuo primo processo o seleziona un template predefinito.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setTemplateSelectionOpen(true)} className="gap-2">
                <FileBox className="w-4 h-4" />
                Usa Template
              </Button>
              <Button onClick={handleCreateProcess} className="gap-2">
                <Plus className="w-4 h-4" />
                Crea Processo
              </Button>
            </div>
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
                  projectId={id || ''}
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

      {/* Save as Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salva come Template</DialogTitle>
            <DialogDescription>
              Salva la configurazione attuale come template riutilizzabile per altri progetti.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome Template</Label>
              <Input
                id="template-name"
                placeholder="Es. Pipeline Classificazione Avanzata"
                value={templateData.name}
                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Descrizione</Label>
              <Textarea
                id="template-description"
                placeholder="Descrivi lo scopo del template..."
                value={templateData.description}
                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={templateData.category}
                onValueChange={(value) => setTemplateData({ ...templateData, category: value as ProjectTemplate['category'] })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <p className="font-medium mb-1">Contenuto del template:</p>
              <p className="text-muted-foreground">
                {processes.length} processo/i con {processes.reduce((acc, p) => acc + p.phases.filter(ph => ph.enabled).length, 0)} fasi attive
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveAsTemplate}>
              Salva Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={templateSelectionOpen} onOpenChange={setTemplateSelectionOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileBox className="w-5 h-5 text-primary" />
              Inizializza da Template
            </DialogTitle>
            <DialogDescription>
              Seleziona un template per configurare automaticamente i processi del progetto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "p-4 cursor-pointer transition-all border-2",
                  selectedTemplateId === template.id 
                    ? "border-primary bg-primary/5" 
                    : "border-transparent hover:border-border"
                )}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {TEMPLATE_CATEGORY_LABELS[template.category]}
                      </Badge>
                      {template.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{template.processes.length} processo/i</span>
                      <span>•</span>
                      <span>
                        {template.processes.reduce((acc, p) => acc + p.enabledPhases.length, 0)} fasi
                      </span>
                    </div>
                  </div>
                  {selectedTemplateId === template.id && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTemplateSelectionOpen(false);
              setSelectedTemplateId('');
            }}>
              Annulla
            </Button>
            <Button onClick={handleInitializeFromTemplate} disabled={!selectedTemplateId}>
              Applica Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Template Confirmation Dialog */}
      <Dialog open={changeTemplateConfirmOpen} onOpenChange={setChangeTemplateConfirmOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <RefreshCw className="w-5 h-5" />
              Cambia Template
            </DialogTitle>
            <DialogDescription>
              Hai già {processes.length} processo/i configurato/i. Applicare un nuovo template sovrascriverà 
              la configurazione esistente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <p className="font-medium text-warning mb-1">Attenzione</p>
              <p className="text-muted-foreground">
                Tutti i processi e le fasi attuali verranno sostituiti. 
                Considera di salvare la configurazione corrente come template prima di procedere.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setChangeTemplateConfirmOpen(false)}>
              Annulla
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setChangeTemplateConfirmOpen(false);
                setSaveTemplateDialogOpen(true);
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Salva prima
            </Button>
            <Button variant="destructive" onClick={handleConfirmChangeTemplate}>
              Prosegui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
