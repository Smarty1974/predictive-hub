import { useState } from 'react';
import { 
  GitBranch, 
  GitCompare, 
  RotateCcw, 
  Check, 
  Clock, 
  User,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectVersion, VersionChange } from '@/hooks/useVersioning';
import { PHASE_LABELS } from '@/types/ml-project';
import { cn } from '@/lib/utils';

interface ProjectVersionPanelProps {
  versions: ProjectVersion[];
  onCompare: (versionId1: string, versionId2: string) => void;
  onRestore: (versionId: string) => void;
  onCreateVersion: (description: string) => void;
}

export function ProjectVersionPanel({
  versions,
  onCompare,
  onRestore,
  onCreateVersion,
}: ProjectVersionPanelProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVersionDescription, setNewVersionDescription] = useState('');

  const handleVersionClick = (versionId: string) => {
    if (!compareMode) {
      setExpandedVersion(expandedVersion === versionId ? null : versionId);
      return;
    }

    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      onCompare(selectedVersions[0], selectedVersions[1]);
      setCompareMode(false);
      setSelectedVersions([]);
    }
  };

  const handleCreateVersion = () => {
    if (newVersionDescription.trim()) {
      onCreateVersion(newVersionDescription.trim());
      setNewVersionDescription('');
      setShowCreateDialog(false);
    }
  };

  const getChangeTypeLabel = (type: VersionChange['type']) => {
    switch (type) {
      case 'added': return 'Aggiunto';
      case 'modified': return 'Modificato';
      case 'removed': return 'Rimosso';
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={compareMode ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedVersions([]);
            }}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            {compareMode ? 'Esci dal confronto' : 'Confronta'}
          </Button>
          {compareMode && selectedVersions.length === 2 && (
            <Button variant="gradient" size="sm" onClick={handleCompare}>
              Mostra differenze
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuova versione
        </Button>
      </div>

      {/* Compare Mode Hint */}
      {compareMode && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm text-muted-foreground">
            Seleziona due versioni da confrontare ({selectedVersions.length}/2 selezionate)
          </p>
        </div>
      )}

      {/* Versions List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nessuna versione salvata. Crea la prima versione per iniziare.
              </p>
            </div>
          ) : (
            versions.map((version) => {
              const isSelected = selectedVersions.includes(version.id);
              const isExpanded = expandedVersion === version.id;

              return (
                <div
                  key={version.id}
                  className={cn(
                    "glass-card transition-all cursor-pointer",
                    isSelected && "ring-2 ring-primary",
                    compareMode && "hover:ring-2 hover:ring-primary/50"
                  )}
                  onClick={() => handleVersionClick(version.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={version.status === 'current' ? 'default' : 'glass'} 
                            className="flex items-center gap-1"
                          >
                            <GitBranch className="w-3 h-3" />
                            v{version.version}
                          </Badge>
                          {version.status === 'current' && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Corrente
                            </Badge>
                          )}
                          {version.changes.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {version.changes.length} modifiche
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-2">
                          {version.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.createdBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {version.createdAt.toLocaleDateString('it-IT')} {version.createdAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {!compareMode && (
                        <div className="flex items-center gap-2">
                          {version.status !== 'current' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestore(version.id);
                              }}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Ripristina
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expanded Changes */}
                    {isExpanded && version.changes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          Modifiche in questa versione
                        </h4>
                        <div className="space-y-2">
                          {version.changes.map((change, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 text-sm p-2 rounded bg-muted/30"
                            >
                              <Badge 
                                variant={
                                  change.type === 'added' ? 'success' :
                                  change.type === 'modified' ? 'secondary' : 'destructive'
                                }
                                className="text-xs"
                              >
                                {getChangeTypeLabel(change.type)}
                              </Badge>
                              <span className="text-muted-foreground">
                                {PHASE_LABELS[change.phase]}
                              </span>
                              <span className="text-foreground font-medium">
                                {change.field}
                              </span>
                              {change.oldValue && change.newValue && (
                                <span className="text-xs text-muted-foreground">
                                  {change.oldValue} → {change.newValue}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea nuova versione</DialogTitle>
            <DialogDescription>
              Salva lo stato attuale della pipeline come nuova versione.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Descrizione della versione (es. Ottimizzazione hyperparameters)"
              value={newVersionDescription}
              onChange={(e) => setNewVersionDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateVersion()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleCreateVersion}
              disabled={!newVersionDescription.trim()}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Crea versione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
