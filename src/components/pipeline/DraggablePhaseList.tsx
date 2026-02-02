import { useState } from 'react';
import { 
  GripVertical, Check, Loader2, Circle, AlertCircle,
  ChevronRight, Link2, FileText, Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PipelineStep, PHASE_LABELS, PhaseStatus } from '@/types/ml-project';
import { cn } from '@/lib/utils';

interface DraggablePhaseListProps {
  phases: PipelineStep[];
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string | null) => void;
  onReorderPhases: (phases: PipelineStep[]) => void;
}

const statusConfig: Record<PhaseStatus, { 
  icon: typeof Check; 
  label: string; 
  bgColor: string; 
  textColor: string;
  borderColor: string;
  badgeVariant: string;
}> = {
  pending: { 
    icon: Circle, 
    label: 'In attesa', 
    bgColor: 'bg-muted/50',
    textColor: 'text-muted-foreground',
    borderColor: 'border-border',
    badgeVariant: 'secondary',
  },
  in_progress: { 
    icon: Loader2, 
    label: 'In corso', 
    bgColor: 'bg-primary/5',
    textColor: 'text-primary',
    borderColor: 'border-primary/30',
    badgeVariant: 'default',
  },
  completed: { 
    icon: Check, 
    label: 'Completato', 
    bgColor: 'bg-success/5',
    textColor: 'text-success',
    borderColor: 'border-success/30',
    badgeVariant: 'success',
  },
  error: { 
    icon: AlertCircle, 
    label: 'Errore', 
    bgColor: 'bg-destructive/5',
    textColor: 'text-destructive',
    borderColor: 'border-destructive/30',
    badgeVariant: 'destructive',
  },
};

interface SortablePhaseCardProps {
  phase: PipelineStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function SortablePhaseCard({ phase, index, isSelected, onSelect }: SortablePhaseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = statusConfig[phase.status];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border-2 transition-all duration-300',
        config.bgColor,
        config.borderColor,
        isDragging && 'shadow-xl scale-[1.02] z-50',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        'hover:shadow-lg'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center',
          'cursor-grab active:cursor-grabbing rounded-l-xl',
          'bg-gradient-to-r from-muted/50 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div
        className="p-5 pl-10 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Step number with status icon */}
            <div
              className={cn(
                'relative w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg',
                'shadow-inner transition-all duration-300',
                config.bgColor,
                config.textColor,
                phase.status === 'in_progress' && 'animate-pulse'
              )}
            >
              <span className="text-2xl font-bold">{index + 1}</span>
              <div className={cn(
                'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center',
                'bg-card border-2 shadow-sm',
                config.borderColor
              )}>
                <Icon className={cn(
                  'w-3.5 h-3.5',
                  config.textColor,
                  phase.status === 'in_progress' && 'animate-spin'
                )} />
              </div>
            </div>

            {/* Phase info */}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">
                {PHASE_LABELS[phase.phase]}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {phase.startedAt
                  ? `Avviato: ${phase.startedAt.toLocaleDateString('it-IT')}`
                  : 'Non ancora avviato'}
              </p>
              
              {/* Quick stats */}
              <div className="flex items-center gap-3 mt-2">
                {phase.links.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <Link2 className="w-3 h-3" />
                    {phase.links.length}
                  </span>
                )}
                {phase.activityLogs.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <FileText className="w-3 h-3" />
                    {phase.activityLogs.length}
                  </span>
                )}
                {phase.description && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    Descrizione
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status badge and chevron */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={config.badgeVariant as any}
              className={cn(
                'px-3 py-1 font-medium',
                phase.status === 'in_progress' && 'animate-pulse'
              )}
            >
              {config.label}
            </Badge>
            <ChevronRight className={cn(
              'w-5 h-5 text-muted-foreground transition-transform',
              isSelected && 'rotate-90'
            )} />
          </div>
        </div>
      </div>

      {/* Progress indicator line */}
      {phase.status === 'completed' && (
        <div className="absolute left-1/2 -bottom-6 w-0.5 h-6 bg-success/50" />
      )}
    </div>
  );
}

export function DraggablePhaseList({
  phases,
  selectedPhaseId,
  onSelectPhase,
  onReorderPhases,
}: DraggablePhaseListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = phases.findIndex((p) => p.id === active.id);
      const newIndex = phases.findIndex((p) => p.id === over.id);
      const newPhases = arrayMove(phases, oldIndex, newIndex);
      onReorderPhases(newPhases);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={phases.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <SortablePhaseCard
              key={phase.id}
              phase={phase}
              index={index}
              isSelected={selectedPhaseId === phase.id}
              onSelect={() => onSelectPhase(selectedPhaseId === phase.id ? null : phase.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
