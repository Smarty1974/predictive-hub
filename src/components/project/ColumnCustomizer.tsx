import { useState } from 'react';
import { 
  GripVertical, Eye, EyeOff, Settings2, Save, 
  RotateCcw, Bookmark, Trash2, Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { ColumnConfig, ViewPreferences } from '@/hooks/useViewPreferences';
import { cn } from '@/lib/utils';

interface ColumnCustomizerProps {
  columns: ColumnConfig[];
  savedPresets: { name: string; preferences: ViewPreferences }[];
  onUpdateColumn: (columnId: string, updates: Partial<ColumnConfig>) => void;
  onReorderColumns: (columns: ColumnConfig[]) => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  onReset: () => void;
}

interface SortableColumnItemProps {
  column: ColumnConfig;
  onToggleVisibility: (columnId: string) => void;
}

function SortableColumnItem({ column, onToggleVisibility }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border border-border bg-card',
        'transition-all duration-200',
        isDragging && 'shadow-lg scale-[1.02] z-50 bg-accent',
        !column.visible && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className={cn('font-medium', !column.visible && 'text-muted-foreground')}>
          {column.label}
        </span>
      </div>
      <button
        onClick={() => onToggleVisibility(column.id)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          column.visible 
            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        {column.visible ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export function ColumnCustomizer({
  columns,
  savedPresets,
  onUpdateColumn,
  onReorderColumns,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onReset,
}: ColumnCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedColumns.findIndex((col) => col.id === active.id);
      const newIndex = sortedColumns.findIndex((col) => col.id === over.id);
      const newColumns = arrayMove(sortedColumns, oldIndex, newIndex);
      onReorderColumns(newColumns);
    }
  };

  const handleToggleVisibility = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (column) {
      onUpdateColumn(columnId, { visible: !column.visible });
    }
  };

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim());
      setNewPresetName('');
      setPresetDialogOpen(false);
    }
  };

  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Personalizza</span>
          <Badge variant="secondary" className="ml-1">
            {visibleCount}/{columns.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Personalizza Vista
          </SheetTitle>
          <SheetDescription>
            Trascina le colonne per riordinarle e usa l'icona occhio per mostrarle/nasconderle.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Viste Salvate</Label>
              <div className="flex flex-wrap gap-2">
                {savedPresets.map((preset) => (
                  <div
                    key={preset.name}
                    className="flex items-center gap-1 bg-muted rounded-lg pl-3 pr-1 py-1"
                  >
                    <button
                      onClick={() => onLoadPreset(preset.name)}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => onDeletePreset(preset.name)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Separator />
            </div>
          )}

          {/* Columns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Colonne</Label>
              <span className="text-xs text-muted-foreground">
                {visibleCount} di {columns.length} visibili
              </span>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedColumns.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedColumns.map((column) => (
                      <SortableColumnItem
                        key={column.id}
                        column={column}
                        onToggleVisibility={handleToggleVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Bookmark className="w-4 h-4" />
                  Salva Vista
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Salva Vista Preferita</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nome della vista</Label>
                    <Input
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Es: Vista compatta, Solo metriche..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setPresetDialogOpen(false)}>
                      Annulla
                    </Button>
                    <Button onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                      <Check className="w-4 h-4 mr-2" />
                      Salva
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Ripristina
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
