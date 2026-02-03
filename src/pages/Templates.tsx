import { useState } from 'react';
import { 
  Plus, Copy, Trash2, Edit2, FileBox, Brain, Database, 
  FileText, Cpu, Zap, Layers, BarChart, Eye, Lock
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import { ProjectTemplate, TEMPLATE_CATEGORY_LABELS } from '@/types/template';
import { PHASE_TYPE_LABELS } from '@/types/process';
import { TemplateFormDialog } from '@/components/template/TemplateFormDialog';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain, Database, FileText, Cpu, Zap, Layers, BarChart,
};

const categoryColors: Record<ProjectTemplate['category'], string> = {
  classification: 'bg-blue-500/20 text-blue-500',
  regression: 'bg-green-500/20 text-green-500',
  nlp: 'bg-purple-500/20 text-purple-500',
  computer_vision: 'bg-amber-500/20 text-amber-500',
  time_series: 'bg-cyan-500/20 text-cyan-500',
  custom: 'bg-muted text-muted-foreground',
};

export default function Templates() {
  const { templates, defaultTemplates, userTemplates, deleteTemplate, duplicateTemplate, createTemplate, updateTemplate } = useTemplates();
  const { toast } = useToast();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);

  const handleDuplicate = (template: ProjectTemplate) => {
    const dup = duplicateTemplate(template.id);
    if (dup) {
      toast({
        title: 'Template duplicato',
        description: `"${dup.name}" è stato creato.`,
      });
    }
  };

  const handleDelete = (template: ProjectTemplate) => {
    if (template.isDefault) return;
    deleteTemplate(template.id);
    toast({
      title: 'Template eliminato',
      description: 'Il template è stato rimosso.',
    });
  };

  const handleEdit = (template: ProjectTemplate) => {
    if (template.isDefault) {
      // Duplicate instead of editing default
      handleDuplicate(template);
      return;
    }
    setEditingTemplate(template);
    setFormDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormDialogOpen(true);
  };

  const renderTemplateCard = (template: ProjectTemplate) => {
    const isDefault = template.isDefault;
    const totalPhases = template.processes.reduce(
      (acc, p) => acc + p.enabledPhases.length, 
      0
    );

    return (
      <Card key={template.id} className="glass-card overflow-hidden group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileBox className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  {isDefault && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{template.description}</p>
              </div>
            </div>
            <Badge className={cn("text-xs", categoryColors[template.category])}>
              {TEMPLATE_CATEGORY_LABELS[template.category]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>{template.processes.length} processo/i</span>
            <span>•</span>
            <span>{totalPhases} fasi totali</span>
          </div>

          {/* Processes preview */}
          <div className="space-y-2 mb-4">
            {template.processes.slice(0, 2).map((process) => {
              const IconComp = iconMap[process.icon] || Brain;
              return (
                <div key={process.id} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <IconComp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{process.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {process.enabledPhases.length} fasi
                  </span>
                </div>
              );
            })}
            {template.processes.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{template.processes.length - 2} altri processi
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setPreviewTemplate(template)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Anteprima
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDuplicate(template)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            {!isDefault && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(template)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Template Progetti</h1>
            <p className="text-muted-foreground">
              Gestisci i template per creare nuovi progetti rapidamente
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuovo Template
          </Button>
        </div>

        {/* Info */}
        <Alert className="border-primary/20 bg-primary/5">
          <FileBox className="w-4 h-4 text-primary" />
          <AlertDescription>
            I template ti permettono di riutilizzare configurazioni di processi e fasi.
            Puoi usarli quando crei un nuovo progetto per partire con una struttura predefinita.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              Tutti ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="default">
              Predefiniti ({defaultTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="custom">
              Personalizzati ({userTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(renderTemplateCard)}
            </div>
          </TabsContent>

          <TabsContent value="default">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultTemplates.map(renderTemplateCard)}
            </div>
          </TabsContent>

          <TabsContent value="custom">
            {userTemplates.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <FileBox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nessun Template Personalizzato
                </h3>
                <p className="text-muted-foreground mb-4">
                  Crea il tuo primo template o duplica uno dei template predefiniti.
                </p>
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crea Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTemplates.map(renderTemplateCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Sheet */}
        {previewTemplate && (
          <TemplatePreviewSheet 
            template={previewTemplate} 
            onClose={() => setPreviewTemplate(null)} 
          />
        )}
      </div>

      <TemplateFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        template={editingTemplate}
        onCreateTemplate={createTemplate}
        onUpdateTemplate={updateTemplate}
      />
    </MainLayout>
  );
}

function TemplatePreviewSheet({ 
  template, 
  onClose 
}: { 
  template: ProjectTemplate; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{template.name}</h2>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Processi Inclusi</h3>
            {template.processes.map((process) => (
              <Card key={process.id} className="p-4">
                <h4 className="font-medium">{process.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{process.description}</p>
                <div className="flex flex-wrap gap-1">
                  {process.enabledPhases.map((phase) => (
                    <Badge key={phase} variant="secondary" className="text-xs">
                      {PHASE_TYPE_LABELS[phase]}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
