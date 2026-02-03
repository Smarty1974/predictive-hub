import { useState, useEffect } from 'react';
import { 
  Brain, Database, Cog, Zap, Activity, Target, Rocket, GitBranch, 
  Layers, Box, Cpu, BarChart, LineChart, PieChart, Network, Workflow,
  Sparkles, Lightbulb, Gauge, Shield
} from 'lucide-react';
import { Process, PhaseType, PHASE_TYPE_LABELS, AVAILABLE_ICONS } from '@/types/process';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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

interface ProcessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process?: Process | null;
  existingProcesses: Process[];
  onSave: (data: {
    name: string;
    description: string;
    icon: string;
    previousProcessId?: string;
    enabledPhases: PhaseType[];
  }) => void;
}

export function ProcessFormDialog({ 
  open, 
  onOpenChange, 
  process, 
  existingProcesses,
  onSave 
}: ProcessFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Brain');
  const [previousProcessId, setPreviousProcessId] = useState<string>('');
  const [enabledPhases, setEnabledPhases] = useState<PhaseType[]>(['comprensione_problema']);

  useEffect(() => {
    if (process) {
      setName(process.name);
      setDescription(process.description);
      setIcon(process.icon);
      setPreviousProcessId(process.previousProcessId || '');
      setEnabledPhases(process.phases.filter(p => p.enabled).map(p => p.type));
    } else {
      setName('');
      setDescription('');
      setIcon('Brain');
      setPreviousProcessId('');
      setEnabledPhases(['comprensione_problema']);
    }
  }, [process, open]);

  const handlePhaseToggle = (phaseType: PhaseType, checked: boolean) => {
    if (checked) {
      setEnabledPhases([...enabledPhases, phaseType]);
    } else {
      setEnabledPhases(enabledPhases.filter(p => p !== phaseType));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || enabledPhases.length === 0) return;
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      icon,
      previousProcessId: previousProcessId || undefined,
      enabledPhases,
    });
    onOpenChange(false);
  };

  const availableForLink = existingProcesses.filter(p => p.id !== process?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{process ? 'Modifica Processo' : 'Nuovo Processo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome e Descrizione */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Processo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Analisi Predittiva Vendite"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi brevemente lo scopo del processo..."
                rows={3}
              />
            </div>
          </div>

          {/* Selezione Icona */}
          <div className="space-y-2">
            <Label>Icona</Label>
            <div className="grid grid-cols-10 gap-2">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComp = iconMap[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "p-2 rounded-lg border transition-all",
                      icon === iconName 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collegamento Processo Precedente */}
          {availableForLink.length > 0 && (
            <div className="space-y-2">
              <Label>Collega a Processo Precedente (opzionale)</Label>
              <Select value={previousProcessId} onValueChange={setPreviousProcessId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nessun collegamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun collegamento</SelectItem>
                  {availableForLink.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selezione Fasi */}
          <div className="space-y-3">
            <Label>Fasi del Processo * (seleziona almeno una)</Label>
            <div className="grid gap-2">
              {ALL_PHASE_TYPES.map((phaseType) => (
                <label
                  key={phaseType}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    enabledPhases.includes(phaseType)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={enabledPhases.includes(phaseType)}
                    onCheckedChange={(checked) => handlePhaseToggle(phaseType, checked as boolean)}
                  />
                  <div>
                    <p className="font-medium text-sm">{PHASE_TYPE_LABELS[phaseType]}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPhaseDescription(phaseType)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name.trim() || enabledPhases.length === 0}>
              {process ? 'Salva Modifiche' : 'Crea Processo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getPhaseDescription(phaseType: PhaseType): string {
  const descriptions: Record<PhaseType, string> = {
    comprensione_problema: 'Definizione obiettivi, link documentali, log attività',
    raccolta_dati: 'Selezione dataset, normalizzazione, aggiunta colonne',
    modellazione: 'Configurazione pipeline di modellazione ML',
    ottimizzazione: 'Ottimizzazione iperparametri e performance',
    realtime: 'Configurazione streaming e inferenza realtime',
    valutazione: 'Metriche, validazione e test del modello',
    produzione: 'Deploy, monitoring e gestione in produzione',
  };
  return descriptions[phaseType];
}
