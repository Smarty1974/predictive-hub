import { useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectTemplate } from '@/types/template';

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isDefault'>) => void;
}

export function TemplateImportDialog({ open, onOpenChange, onImport }: TemplateImportDialogProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndParseTemplate = (json: string): Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isDefault'> | null => {
    try {
      const parsed = JSON.parse(json);
      
      // Validate required fields
      if (!parsed.name || typeof parsed.name !== 'string') {
        throw new Error('Campo "name" mancante o non valido');
      }
      if (!parsed.description || typeof parsed.description !== 'string') {
        throw new Error('Campo "description" mancante o non valido');
      }
      if (!parsed.category || typeof parsed.category !== 'string') {
        throw new Error('Campo "category" mancante o non valido');
      }
      if (!Array.isArray(parsed.processes) || parsed.processes.length === 0) {
        throw new Error('Campo "processes" deve essere un array non vuoto');
      }

      // Validate processes
      for (let i = 0; i < parsed.processes.length; i++) {
        const p = parsed.processes[i];
        if (!p.name || typeof p.name !== 'string') {
          throw new Error(`Processo ${i + 1}: campo "name" mancante`);
        }
        if (!Array.isArray(p.enabledPhases) || p.enabledPhases.length === 0) {
          throw new Error(`Processo ${i + 1}: campo "enabledPhases" deve essere un array non vuoto`);
        }
      }

      return {
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        processes: parsed.processes.map((p: any) => ({
          name: p.name,
          description: p.description || '',
          icon: p.icon || 'Brain',
          enabledPhases: p.enabledPhases,
          previousProcessId: p.previousProcessId,
        })),
      };
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('JSON non valido. Controlla la sintassi.');
      } else if (e instanceof Error) {
        setError(e.message);
      }
      return null;
    }
  };

  const handleImport = () => {
    setError(null);
    const template = validateAndParseTemplate(jsonInput);
    if (template) {
      onImport(template);
      setJsonInput('');
      onOpenChange(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Errore nella lettura del file');
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importa Template
          </DialogTitle>
          <DialogDescription>
            Carica un file JSON o incolla il contenuto per importare un template.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Incolla JSON</TabsTrigger>
            <TabsTrigger value="file">Carica File</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <Label>Contenuto JSON</Label>
              <Textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setError(null);
                }}
                placeholder='{"name": "...", "description": "...", "category": "...", "processes": [...]}'
                className="font-mono text-sm min-h-[200px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileJson className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Seleziona un file JSON da importare
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="template-file-input"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Seleziona File
              </Button>
            </div>
            {jsonInput && (
              <div className="space-y-2">
                <Label>Anteprima contenuto</Label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="font-mono text-sm min-h-[150px]"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleImport} disabled={!jsonInput.trim()}>
            Importa Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
