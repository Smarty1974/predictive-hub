import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MLEngine, MLAlgorithm, ENGINE_LABELS, ALGORITHM_LABELS } from '@/types/ml-project';
import { mockGroups } from '@/data/mock-data';
import { useTemplates } from '@/hooks/useTemplates';
import { ProjectTemplate, TEMPLATE_CATEGORY_LABELS } from '@/types/template';
import { PHASE_TYPE_LABELS } from '@/types/process';
import { BrainCircuit, ArrowRight, ArrowLeft, FileBox, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { 
    name: string; 
    description: string; 
    engine: MLEngine; 
    algorithm: MLAlgorithm; 
    groupId: string;
    templateId?: string;
  }) => void;
}

const engines: MLEngine[] = ['tensorflow', 'pytorch', 'scikit-learn', 'xgboost', 'lightgbm', 'keras', 'huggingface', 'spark-ml'];
const algorithms: MLAlgorithm[] = ['linear_regression', 'logistic_regression', 'random_forest', 'gradient_boosting', 'neural_network', 'cnn', 'rnn', 'transformer', 'svm', 'kmeans', 'pca'];

export function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const { templates } = useTemplates();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    engine: MLEngine | '';
    algorithm: MLAlgorithm | '';
    groupId: string;
    templateId: string;
  }>({
    name: '',
    description: '',
    engine: '',
    algorithm: '',
    groupId: '',
    templateId: '',
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = () => {
    if (formData.engine && formData.algorithm) {
      onCreate({
        name: formData.name,
        description: formData.description,
        engine: formData.engine,
        algorithm: formData.algorithm,
        groupId: formData.groupId,
        templateId: formData.templateId || undefined,
      });
    }
    setFormData({ name: '', description: '', engine: '', algorithm: '', groupId: '', templateId: '' });
    setStep(1);
    onOpenChange(false);
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);
  
  const isStep1Valid = formData.templateId !== '' || true; // Template is optional
  const isStep2Valid = formData.name.trim() !== '' && formData.description.trim() !== '';
  const isStep3Valid = formData.engine !== '' && formData.algorithm !== '';
  const isStep4Valid = formData.groupId !== '';

  const handleReset = () => {
    setFormData({ name: '', description: '', engine: '', algorithm: '', groupId: '', templateId: '' });
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleReset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="glass-card border-glass-border sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-foreground">Nuovo Progetto ML</DialogTitle>
              <DialogDescription>Step {step} di 4</DialogDescription>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileBox className="w-5 h-5 text-primary" />
                <Label className="text-base font-medium">Scegli un Template (opzionale)</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Seleziona un template per iniziare con una configurazione predefinita di processi e fasi.
              </p>
              
              {/* No Template Option */}
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all border-2",
                  formData.templateId === '' 
                    ? "border-primary bg-primary/5" 
                    : "border-transparent hover:border-border"
                )}
                onClick={() => setFormData({ ...formData, templateId: '' })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nessun Template</p>
                    <p className="text-sm text-muted-foreground">
                      Configura i processi manualmente dopo la creazione
                    </p>
                  </div>
                  {formData.templateId === '' && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>

              {/* Template List */}
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all border-2",
                      formData.templateId === template.id 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent hover:border-border"
                    )}
                    onClick={() => setFormData({ ...formData, templateId: template.id })}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{template.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {TEMPLATE_CATEGORY_LABELS[template.category]}
                          </Badge>
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
                      {formData.templateId === template.id && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <>
              {selectedTemplate && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Template selezionato: </span>
                    <span className="font-medium">{selectedTemplate.name}</span>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Progetto</Label>
                <Input
                  id="name"
                  placeholder="Es. Fraud Detection Model"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  placeholder="Descrivi l'obiettivo del progetto..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-muted/50 min-h-[100px]"
                />
              </div>
            </>
          )}

          {/* Step 3: Engine & Algorithm */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Engine ML</Label>
                <Select
                  value={formData.engine}
                  onValueChange={(value) => setFormData({ ...formData, engine: value as MLEngine })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Seleziona engine" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {engines.map((engine) => (
                      <SelectItem key={engine} value={engine}>
                        {ENGINE_LABELS[engine]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Algoritmo</Label>
                <Select
                  value={formData.algorithm}
                  onValueChange={(value) => setFormData({ ...formData, algorithm: value as MLAlgorithm })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Seleziona algoritmo" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {algorithms.map((algo) => (
                      <SelectItem key={algo} value={algo}>
                        {ALGORITHM_LABELS[algo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step 4: Team */}
          {step === 4 && (
            <div className="space-y-2">
              <Label>Team / Gruppo</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => setFormData({ ...formData, groupId: value })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Seleziona team" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {mockGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Il progetto sarà visibile solo ai membri del team selezionato.
              </p>
              
              {/* Summary */}
              {selectedTemplate && (
                <div className="mt-4 p-4 rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">Riepilogo configurazione:</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Template: {selectedTemplate.name}</p>
                    <p>• Processi: {selectedTemplate.processes.map(p => p.name).join(', ')}</p>
                    <p>• Fasi totali: {selectedTemplate.processes.reduce((acc, p) => acc + p.enabledPhases.length, 0)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          {step < 4 ? (
            <Button
              variant="gradient"
              onClick={handleNext}
              disabled={
                (step === 1 && !isStep1Valid) || 
                (step === 2 && !isStep2Valid) || 
                (step === 3 && !isStep3Valid)
              }
            >
              Avanti
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={handleCreate} disabled={!isStep4Valid}>
              Crea Progetto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
