import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProjectCard } from '@/components/project/ProjectCard';
import { MLProject } from '@/types/ml-project';
import { GripVertical } from 'lucide-react';

interface SortableProjectCardProps {
  project: MLProject;
  onClick: () => void;
}

export function SortableProjectCard({ project, onClick }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <ProjectCard project={project} onClick={onClick} />
    </div>
  );
}
