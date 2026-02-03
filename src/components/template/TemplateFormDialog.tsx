import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ProjectTemplate, ProcessTemplate, TEMPLATE_CATEGORY_LABELS } from '@/types/template';
import { PhaseType, PHASE_TYPE_LABELS, AVAILABLE_ICONS } from '@/types/process';
import { cn } from '@/lib/utils';
import { 
  Brain, Database, Cog, Zap, Activity, Target, Rocket, GitBranch, 
  Layers, Box, Cpu, BarChart, LineChart, PieChart, Network, Workflow,
  Sparkles, Lightbulb, Gauge, Shield
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, Database, Cog, Zap, Activity, Target, Rocket, GitBranch,
  Layers, Box, Cpu, BarChart, LineChart, PieChart, Network, Workflow,
  Sparkles, Lightbulb, Gauge, Shield,
};

const ALL_PHASE_TYPES: PhaseType[] = [
  'comprensione_problema',
  'raccolta_dati',
  'modellazione',
  'ottimizzazione',
  'realtime',
  'valutazione',
  'produzione',
];

interface ProcessFormData {
  name: string;
  description: string;
  icon: string;
  enabledPhases: PhaseType[];
}

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ProjectTemplate | null;
  onCreateTemplate: (data: {
    name: string;
    description: string;
    category: ProjectTemplate['category'];
    processes: Omit<ProcessTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[];
  }) => void;
  onUpdateTemplate: (templateId: string, data: Partial<ProjectTemplate>) => void;
}

export function TemplateFormDialog({ 
  open, 
  onOpenChange, 
  template,
  onCreateTemplate,
  onUpdateTemplate,
}: TemplateFormDialogProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectTemplate['category']>('custom');
  const [processes, setProcesses] = useState<ProcessFormData[]>([{
    name: '',
    description: '',
    icon: 'Brain',
    enabledPhases: ['comprensione_problema'],
  }]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setCategory(template.category);
      setProcesses(template.processes.map(p => ({
        name: p.name,
        description: p.description,
        icon: p.icon,
        enabledPhases: p.enabledPhases,
      })));
    } else {
      setName('');
      setDescription('');
      setCategory('custom');
      setProcesses([{
        name: '',
        description: '',
        icon: 'Brain',
        enabledPhases: ['comprensione_problema'],
      }]);
    }
  }, [template, open]);

  const handleAddProcess = () => {
    setProcesses([...processes, {
      name: '',
      description: '',
      icon: 'Brain',
      enabledPhases: ['comprensione_problema'],
    }]);
  };

  const handleRemoveProcess = (index: number) => {
    if (processes.length <= 1) return;
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const handleUpdateProcess = (index: number, data: Partial<ProcessFormData>) => {
    setProcesses(processes.map((p, i) => i === index ? { ...p, ...data } : p));
  };

  const handlePhaseToggle = (processIndex: number, phase: PhaseType, checked: boolean) => {
    const process = processes[processIndex];
    const newPhases = checked 
      ? [...process.enabledPhases, phase]
      : process.enabledPhases.filter(p => p !== phase);
    handleUpdateProcess(processIndex, { enabledPhases: newPhases });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    if (processes.some(p => !p.name.trim() || p.enabledPhases.length === 0)) {
      toast({
        title: 'Dati incompleti',
        description: 'Ogni processo deve avere un nome e almeno una fase attiva.',
        variant: 'destructive',
      });
      return;
    }

    if (template) {
      onUpdateTemplate(template.id, {
        name,
        description,
        category,
        processes: processes.map((p, idx) => ({
          ...p,
          id: `process-${Date.now()}-${idx}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user',
        })),
      });
      toast({ title: 'Template aggiornato' });
    } else {
      onCreateTemplate({ name, description, category, processes });
      toast({ title: 'Template creato', description: `"${name}" è ora disponibile.` });
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Modifica Template' : 'Nuovo Template'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Template *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Pipeline Classificazione"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProjectTemplate['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi brevemente lo scopo di questo template..."
              rows={2}
            />
          </div>

          {/* Processes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Processi</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddProcess}>
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi Processo
              </Button>
            </div>

            {processes.map((process, index) => (
              <Card key={index} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Processo {index + 1}
                  </span>
                  {processes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProcess(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={process.name}
                      onChange={(e) => handleUpdateProcess(index, { name: e.target.value })}
                      placeholder="Es. Pipeline Principale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icona</Label>
                    <div className="flex flex-wrap gap-1">
                      {AVAILABLE_ICONS.slice(0, 10).map((iconName) => {
                        const IconComp = iconMap[iconName];
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => handleUpdateProcess(index, { icon: iconName })}
                            className={cn(
                              "p-1.5 rounded border transition-all",
                              process.icon === iconName 
                                ? "border-primary bg-primary/10" 
                                : "border-transparent hover:border-border"
                            )}
                          >
                            <IconComp className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrizione</Label>
                  <Input
                    value={process.description}
                    onChange={(e) => handleUpdateProcess(index, { description: e.target.value })}
                    placeholder="Descrizione del processo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fasi Attive *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PHASE_TYPES.map((phase) => (
                      <label
                        key={phase}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded border cursor-pointer text-sm",
                          process.enabledPhases.includes(phase)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Checkbox
                          checked={process.enabledPhases.includes(phase)}
                          onCheckedChange={(checked) => handlePhaseToggle(index, phase, checked as boolean)}
                        />
                        {PHASE_TYPE_LABELS[phase]}
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">
              {template ? 'Salva Modifiche' : 'Crea Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
