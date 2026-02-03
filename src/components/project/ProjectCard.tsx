import { Calendar, GitBranch, MoreVertical, Users, FileBox } from 'lucide-react';
import { MLProject, ENGINE_LABELS, ALGORITHM_LABELS } from '@/types/ml-project';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { mockGroups } from '@/data/mock-data';
import { ALGORITHM_TO_TEMPLATE } from '@/hooks/useTemplates';

// Template names mapping
const TEMPLATE_NAMES: Record<string, string> = {
  'template-classification': 'Classificazione',
  'template-regression': 'Regressione',
  'template-nlp': 'NLP',
  'template-computer-vision': 'Computer Vision',
  'template-time-series': 'Serie Temporali',
  'template-realtime': 'Realtime',
};

interface ProjectCardProps {
  project: MLProject;
  onClick?: () => void;
  className?: string;
}

const statusVariants = {
  active: 'active',
  paused: 'warning',
  completed: 'completed',
  archived: 'secondary',
} as const;

const statusLabels = {
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  archived: 'Archiviato',
};

export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
  const group = mockGroups.find((g) => g.id === project.groupId);
  const templateId = ALGORITHM_TO_TEMPLATE[project.algorithm];
  const templateName = templateId ? TEMPLATE_NAMES[templateId] : null;

  return (
    <div
      className={cn(
        'glass-card-hover p-5 cursor-pointer animate-fade-in',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
            <Badge variant={statusVariants[project.status] as any}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card">
            <DropdownMenuItem>Apri progetto</DropdownMenuItem>
            <DropdownMenuItem>Modifica</DropdownMenuItem>
            <DropdownMenuItem>Duplica</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Archivia</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tech Stack & Template */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="glass">{ENGINE_LABELS[project.engine]}</Badge>
        <Badge variant="glass">{ALGORITHM_LABELS[project.algorithm]}</Badge>
        {templateName && (
          <Badge variant="outline" className="bg-primary/5 border-primary/30 text-primary">
            <FileBox className="w-3 h-3 mr-1" />
            {templateName}
          </Badge>
        )}
      </div>

      {/* Pipeline Progress */}
      <div className="mb-4 overflow-hidden">
        <p className="text-xs text-muted-foreground mb-2">Pipeline Progress</p>
        <PipelineProgress steps={project.pipeline} compact />
      </div>

      {/* Metrics */}
      {project.metrics && (
        <div className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg bg-muted/30">
          {project.metrics.accuracy && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-sm font-semibold text-primary">
                {(project.metrics.accuracy * 100).toFixed(1)}%
              </p>
            </div>
          )}
          {project.metrics.precision && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Precision</p>
              <p className="text-sm font-semibold">{(project.metrics.precision * 100).toFixed(1)}%</p>
            </div>
          )}
          {project.metrics.recall && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Recall</p>
              <p className="text-sm font-semibold">{(project.metrics.recall * 100).toFixed(1)}%</p>
            </div>
          )}
          {project.metrics.f1Score && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">F1</p>
              <p className="text-sm font-semibold">{(project.metrics.f1Score * 100).toFixed(1)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {group?.name}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5" />
            v{project.currentVersion}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {project.updatedAt.toLocaleDateString('it-IT')}
        </span>
      </div>
    </div>
  );
}
