import { useState } from 'react';
import { 
  FileText, Link2, Plus, Trash2, ExternalLink, 
  BookOpen, Database, Brain, FileCode, Globe,
  Clock, User, Save, X, Edit2, Settings2, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PipelineStep, PhaseLink, ActivityLog, PHASE_LABELS } from '@/types/ml-project';
import { cn } from '@/lib/utils';
import { DataCollectionPanel } from '@/components/data/DataCollectionPanel';
import { ModelingPanel } from '@/components/modeling/ModelingPanel';
import { EvaluationPanel } from '@/components/evaluation/EvaluationPanel';
import { usePhaseData } from '@/hooks/usePhaseData';

interface PhaseDetailPanelProps {
  step: PipelineStep;
  projectId: string;
  onUpdateDescription?: (description: string) => void;
  onAddLink?: (link: Omit<PhaseLink, 'id' | 'addedAt'>) => void;
  onRemoveLink?: (linkId: string) => void;
  onAddActivityLog?: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
}

const linkTypeConfig: Record<PhaseLink['type'], { icon: typeof BookOpen; label: string; color: string }> = {
  documentation: { icon: BookOpen, label: 'Documentazione', color: 'text-blue-400' },
  dataset: { icon: Database, label: 'Dataset', color: 'text-green-400' },
  model: { icon: Brain, label: 'Modello', color: 'text-purple-400' },
  notebook: { icon: FileCode, label: 'Notebook', color: 'text-orange-400' },
  external: { icon: Globe, label: 'Esterno', color: 'text-muted-foreground' },
};

export function PhaseDetailPanel({ 
  step, 
  projectId,
  onUpdateDescription, 
  onAddLink, 
  onRemoveLink,
  onAddActivityLog 
}: PhaseDetailPanelProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(step.description || '');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  
  // Phase data handling
  const { 
    getDataCollectionConfig, 
    updateDataCollectionConfig,
    getAllDataCollectionConfigs,
    getModelingConfig,
    updateModelingConfig,
    updateHyperParameter,
    setAlgorithm,
    getAllTrainingRuns,
    getEvaluationConfig,
    updateEvaluationConfig,
  } = usePhaseData(projectId);
  
  const isDataCollectionPhase = step.phase === 'data_collection';
  const isModelingPhase = step.phase === 'model_training';
  const isEvaluationPhase = step.phase === 'evaluation';
  
  // Get data from data collection phase for modeling - use ALL datasets across project
  const allDataCollectionDatasets = getAllDataCollectionConfigs();
  const modelingConfig = getModelingConfig(step.id);
  
  // Get all training runs for evaluation phase
  const allTrainingRuns = getAllTrainingRuns();
  const evaluationConfig = getEvaluationConfig(step.id);
  
  // New link form state
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    type: 'documentation' as PhaseLink['type'],
    addedBy: 'current-user',
  });
  
  // New activity log form state
  const [newLog, setNewLog] = useState({
    action: '',
    details: '',
    userId: 'user-1',
    userName: 'Marco Rossi',
  });

  const handleSaveDescription = () => {
    onUpdateDescription?.(description);
    setIsEditingDescription(false);
  };

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      onAddLink?.(newLink);
      setNewLink({ title: '', url: '', type: 'documentation', addedBy: 'current-user' });
      setIsAddingLink(false);
    }
  };

  const handleAddLog = () => {
    if (newLog.action && newLog.details) {
      onAddActivityLog?.(newLog);
      setNewLog({ action: '', details: '', userId: 'user-1', userName: 'Marco Rossi' });
      setIsAddingLog(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {PHASE_LABELS[step.phase]}
        </h3>
        <Badge 
          variant={
            step.status === 'completed' ? 'default' : 
            step.status === 'in_progress' ? 'secondary' : 
            step.status === 'error' ? 'destructive' : 'outline'
          }
        >
          {step.status.replace('_', ' ')}
        </Badge>
      </div>

      <Accordion type="multiple" defaultValue={['data-collection', 'modeling', 'evaluation', 'description', 'links', 'logs']} className="space-y-2">
        {/* Data Collection Section - FIRST for data_collection phase */}
        {isDataCollectionPhase && (
          <AccordionItem value="data-collection" className="border-none">
            <AccordionTrigger className="glass-card px-4 py-3 hover:no-underline rounded-lg bg-primary/5 border-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Configurazione Dati</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <DataCollectionPanel
                projectId={projectId}
                selectedDatasets={getDataCollectionConfig(step.id)}
                onUpdateDatasets={(datasets) => updateDataCollectionConfig(step.id, datasets)}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Modeling Section - FIRST for model_training phase */}
        {isModelingPhase && (
          <AccordionItem value="modeling" className="border-none">
            <AccordionTrigger className="glass-card px-4 py-3 hover:no-underline rounded-lg bg-primary/5 border-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Configurazione Modello</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <ModelingPanel
                processId={step.id}
                modelingConfig={modelingConfig}
                availableDatasets={allDataCollectionDatasets}
                onUpdateConfig={(config) => updateModelingConfig(step.id, config)}
                onSetAlgorithm={(family, type) => setAlgorithm(step.id, family, type)}
                onUpdateHyperParameter={(name, updates) => updateHyperParameter(step.id, name, updates)}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Evaluation Section - FIRST for evaluation phase */}
        {isEvaluationPhase && (
          <AccordionItem value="evaluation" className="border-none">
            <AccordionTrigger className="glass-card px-4 py-3 hover:no-underline rounded-lg bg-primary/5 border-2 border-primary/20">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Valutazione Modelli</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <EvaluationPanel
                processId={step.id}
                evaluationConfig={evaluationConfig}
                availableTrainingRuns={allTrainingRuns}
                onUpdateConfig={(config) => updateEvaluationConfig(step.id, config)}
              />
            </AccordionContent>
          </AccordionItem>
        )}


        <AccordionItem value="description" className="border-none">
          <AccordionTrigger className="glass-card px-4 py-3 hover:no-underline rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-medium">Descrizione</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="glass-card p-4 bg-muted/30">
              {isEditingDescription ? (
                <div className="space-y-3">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrivi gli obiettivi, le attività e le note per questa fase..."
                    className="min-h-[120px] bg-background/50"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDescription(step.description || '');
                        setIsEditingDescription(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annulla
                    </Button>
                    <Button variant="gradient" size="sm" onClick={handleSaveDescription}>
                      <Save className="w-4 h-4 mr-1" />
                      Salva
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {step.description || 'Nessuna descrizione. Clicca per aggiungere.'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Links Section */}
        <AccordionItem value="links" className="border-none">
          <AccordionTrigger className="glass-card px-4 py-3 hover:no-underline rounded-lg">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="font-medium">Link e Riferimenti</span>
              {step.links.length > 0 && (
                <Badge variant="secondary" className="ml-2">{step.links.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="space-y-3">
              {step.links.length > 0 ? (
                <div className="space-y-2">
                  {step.links.map((link) => {
                    const config = linkTypeConfig[link.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={link.id}
                        className="glass-card p-3 flex items-center justify-between group hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg bg-muted', config.color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground hover:text-primary flex items-center gap-1"
                            >
                              {link.title}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {config.label} • Aggiunto {link.addedAt.toLocaleDateString('it-IT')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => onRemoveLink?.(link.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun link aggiunto
                </p>
              )}

              <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Aggiungi Link o Riferimento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Titolo</Label>
                      <Input
                        value={newLink.title}
                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                        placeholder="Es: Documentazione API"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newLink.type}
                        onValueChange={(value) => setNewLink({ ...newLink, type: value as PhaseLink['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(linkTypeConfig).map(([type, config]) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                <config.icon className={cn('w-4 h-4', config.color)} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setIsAddingLink(false)}>
                        Annulla
                      </Button>
                      <Button variant="gradient" onClick={handleAddLink}>
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Activity Logs Section */}
        <AccordionItem value="logs" className="border-none">
          <AccordionTrigger className="glass-card px-4 py-3 hover:no-underline rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">Log Attività</span>
              {step.activityLogs.length > 0 && (
                <Badge variant="secondary" className="ml-2">{step.activityLogs.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="space-y-3">
              {step.activityLogs.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {step.activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="glass-card p-4 border-l-2 border-primary/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{log.action}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {log.details}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {log.timestamp.toLocaleString('it-IT')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun log registrato
                </p>
              )}

              <Dialog open={isAddingLog} onOpenChange={setIsAddingLog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Registra Attività
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Registra Attività</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Azione</Label>
                      <Input
                        value={newLog.action}
                        onChange={(e) => setNewLog({ ...newLog, action: e.target.value })}
                        placeholder="Es: Completato preprocessing dati"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dettagli</Label>
                      <Textarea
                        value={newLog.details}
                        onChange={(e) => setNewLog({ ...newLog, details: e.target.value })}
                        placeholder="Descrivi in dettaglio l'attività svolta..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setIsAddingLog(false)}>
                        Annulla
                      </Button>
                      <Button variant="gradient" onClick={handleAddLog}>
                        Registra
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
