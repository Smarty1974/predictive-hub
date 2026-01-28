import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MLEngine, MLAlgorithm, ENGINE_LABELS, ALGORITHM_LABELS } from '@/types/ml-project';
import { mockGroups } from '@/data/mock-data';
import { BrainCircuit, ArrowRight, ArrowLeft } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; description: string; engine: MLEngine; algorithm: MLAlgorithm; groupId: string }) => void;
}

const engines: MLEngine[] = ['tensorflow', 'pytorch', 'scikit-learn', 'xgboost', 'lightgbm', 'keras', 'huggingface', 'spark-ml'];
const algorithms: MLAlgorithm[] = ['linear_regression', 'logistic_regression', 'random_forest', 'gradient_boosting', 'neural_network', 'cnn', 'rnn', 'transformer', 'svm', 'kmeans', 'pca'];

export function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    engine: MLEngine | '';
    algorithm: MLAlgorithm | '';
    groupId: string;
  }>({
    name: '',
    description: '',
    engine: '',
    algorithm: '',
    groupId: '',
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = () => {
    if (formData.engine && formData.algorithm) {
      onCreate({
        name: formData.name,
        description: formData.description,
        engine: formData.engine,
        algorithm: formData.algorithm,
        groupId: formData.groupId,
      });
    }
    setFormData({ name: '', description: '', engine: '', algorithm: '', groupId: '' });
    setStep(1);
    onOpenChange(false);
  };

  const isStep1Valid = formData.name.trim() !== '' && formData.description.trim() !== '';
  const isStep2Valid = formData.engine !== '' && formData.algorithm !== '';
  const isStep3Valid = formData.groupId !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-glass-border sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-foreground">Nuovo Progetto ML</DialogTitle>
              <DialogDescription>Step {step} di 3</DialogDescription>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {step === 1 && (
            <>
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

          {step === 2 && (
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

          {step === 3 && (
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
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          {step < 3 ? (
            <Button
              variant="gradient"
              onClick={handleNext}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
            >
              Avanti
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={handleCreate} disabled={!isStep3Valid}>
              Crea Progetto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
