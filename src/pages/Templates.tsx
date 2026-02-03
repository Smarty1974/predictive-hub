import { useState } from 'react';
import { 
  Plus, Copy, Trash2, Edit2, FileBox, Brain, Database, 
  FileText, Cpu, Zap, Layers, BarChart, Eye, Lock, Download, Upload
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
import { TemplateImportDialog } from '@/components/template/TemplateImportDialog';
import { TemplateWorkflowPreview } from '@/components/template/TemplateWorkflowPreview';
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);

  const handleExport = (template: ProjectTemplate) => {
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      processes: template.processes.map(p => ({
        name: p.name,
        description: p.description,
        icon: p.icon,
        enabledPhases: p.enabledPhases,
        previousProcessId: p.previousProcessId,
      })),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template esportato',
      description: `"${template.name}" è stato scaricato come JSON.`,
    });
  };

  const handleImport = (data: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isDefault'>) => {
    createTemplate({
      name: data.name,
      description: data.description,
      category: data.category,
      processes: data.processes,
    });
    toast({
      title: 'Template importato',
      description: `"${data.name}" è stato aggiunto ai tuoi template.`,
    });
  };

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
              onClick={() => handleExport(template)}
              title="Esporta JSON"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDuplicate(template)}
              title="Duplica"
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Importa
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuovo Template
            </Button>
          </div>
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

        {/* Workflow Preview */}
        {previewTemplate && (
          <TemplateWorkflowPreview 
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

      <TemplateImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
    </MainLayout>
  );
}

