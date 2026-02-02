import { 
  GitBranch, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Minus, 
  RotateCcw,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ProjectVersion, VersionChange } from '@/hooks/useVersioning';
import { PHASE_LABELS } from '@/types/ml-project';
import { cn } from '@/lib/utils';

interface VersionComparisonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version1: ProjectVersion | null;
  version2: ProjectVersion | null;
  changes: VersionChange[];
  onRestore: (versionId: string) => void;
}

export function VersionComparisonSheet({
  open,
  onOpenChange,
  version1,
  version2,
  changes,
  onRestore,
}: VersionComparisonSheetProps) {
  if (!version1 || !version2) return null;

  const getChangeIcon = (type: VersionChange['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="w-4 h-4 text-success" />;
      case 'modified':
        return <GitBranch className="w-4 h-4 text-warning" />;
      case 'removed':
        return <Minus className="w-4 h-4 text-destructive" />;
    }
  };

  const getChangeColor = (type: VersionChange['type']) => {
    switch (type) {
      case 'added':
        return 'bg-success/10 border-success/30';
      case 'modified':
        return 'bg-warning/10 border-warning/30';
      case 'removed':
        return 'bg-destructive/10 border-destructive/30';
    }
  };

  const olderVersion = version1.version < version2.version ? version1 : version2;
  const newerVersion = version1.version > version2.version ? version1 : version2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Confronto Versioni
          </SheetTitle>
          <SheetDescription>
            Differenze tra v{olderVersion.version} e v{newerVersion.version}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Version Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft className="w-4 h-4 text-destructive" />
                <Badge variant="outline" className="border-destructive/50">
                  v{olderVersion.version}
                </Badge>
                {olderVersion.status === 'current' && (
                  <Badge variant="success" className="text-xs">Corrente</Badge>
                )}
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {olderVersion.description}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {olderVersion.createdBy}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {olderVersion.createdAt.toLocaleDateString('it-IT')}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-success/30 bg-success/5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-success" />
                <Badge variant="outline" className="border-success/50">
                  v{newerVersion.version}
                </Badge>
                {newerVersion.status === 'current' && (
                  <Badge variant="success" className="text-xs">Corrente</Badge>
                )}
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {newerVersion.description}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {newerVersion.createdBy}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {newerVersion.createdAt.toLocaleDateString('it-IT')}
              </div>
            </div>
          </div>

          {/* Changes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Differenze
              </h3>
              <Badge variant="secondary">
                {changes.length} {changes.length === 1 ? 'modifica' : 'modifiche'}
              </Badge>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {changes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nessuna differenza rilevata tra le versioni
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        getChangeColor(change.type)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getChangeIcon(change.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="glass" className="text-xs">
                              {PHASE_LABELS[change.phase]}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">
                              {change.field}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-xs font-mono">
                            {change.oldValue && (
                              <div className="flex items-center gap-2">
                                <span className="text-destructive/70">−</span>
                                <span className="text-destructive line-through">
                                  {change.oldValue}
                                </span>
                              </div>
                            )}
                            {change.newValue && (
                              <div className="flex items-center gap-2">
                                <span className="text-success/70">+</span>
                                <span className="text-success">
                                  {change.newValue}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Restore Actions */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Seleziona una versione da ripristinare:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={olderVersion.status === 'current'}
                onClick={() => onRestore(olderVersion.id)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Ripristina v{olderVersion.version}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={newerVersion.status === 'current'}
                onClick={() => onRestore(newerVersion.id)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Ripristina v{newerVersion.version}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
