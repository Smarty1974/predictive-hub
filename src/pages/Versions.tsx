import { useState } from 'react';
import { 
  GitBranch, 
  Clock, 
  User, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  GitCompare,
  Check,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Filter,
  Search
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProjects } from '@/data/mock-data';
import { PHASE_LABELS, PipelinePhase } from '@/types/ml-project';
import { cn } from '@/lib/utils';

interface VersionEntry {
  id: string;
  version: number;
  projectId: string;
  projectName: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  changes: VersionChange[];
  status: 'current' | 'previous' | 'archived';
}

interface VersionChange {
  type: 'added' | 'modified' | 'removed';
  phase: PipelinePhase;
  field: string;
  oldValue?: string;
  newValue?: string;
}

// Generate mock version history
const generateVersionHistory = (): VersionEntry[] => {
  const versions: VersionEntry[] = [];
  
  mockProjects.forEach((project) => {
    for (let v = project.currentVersion; v >= 1; v--) {
      const daysAgo = (project.currentVersion - v) * 2;
      versions.push({
        id: `${project.id}-v${v}`,
        version: v,
        projectId: project.id,
        projectName: project.name,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        createdBy: ['Marco Rossi', 'Giulia Bianchi', 'Luca Verdi'][Math.floor(Math.random() * 3)],
        description: v === project.currentVersion 
          ? 'Versione corrente' 
          : getVersionDescription(v),
        changes: generateChanges(v),
        status: v === project.currentVersion ? 'current' : v === 1 ? 'archived' : 'previous',
      });
    }
  });
  
  return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const getVersionDescription = (version: number): string => {
  const descriptions = [
    'Aggiornamento parametri modello',
    'Ottimizzazione hyperparameters',
    'Correzione bug pipeline',
    'Aggiunta nuove feature',
    'Miglioramento performance',
    'Refactoring codice training',
    'Aggiornamento dataset',
  ];
  return descriptions[version % descriptions.length];
};

const generateChanges = (version: number): VersionChange[] => {
  const phases: PipelinePhase[] = ['problem_understanding', 'data_collection', 'model_training', 'evaluation', 'deployment'];
  const changes: VersionChange[] = [];
  
  const numChanges = (version % 3) + 1;
  for (let i = 0; i < numChanges; i++) {
    const phase = phases[Math.floor(Math.random() * phases.length)];
    changes.push({
      type: ['added', 'modified', 'removed'][Math.floor(Math.random() * 3)] as 'added' | 'modified' | 'removed',
      phase,
      field: ['learning_rate', 'batch_size', 'epochs', 'optimizer', 'loss_function'][Math.floor(Math.random() * 5)],
      oldValue: `0.${Math.floor(Math.random() * 9) + 1}`,
      newValue: `0.${Math.floor(Math.random() * 9) + 1}`,
    });
  }
  
  return changes;
};

const mockVersions = generateVersionHistory();

export default function Versions() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const filteredVersions = mockVersions.filter((version) => {
    const matchesProject = selectedProject === 'all' || version.projectId === selectedProject;
    const matchesSearch = 
      version.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      version.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      version.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const handleVersionSelect = (versionId: string) => {
    if (!compareMode) return;
    
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

  const getComparisonVersions = () => {
    if (selectedVersions.length !== 2) return null;
    const v1 = mockVersions.find((v) => v.id === selectedVersions[0]);
    const v2 = mockVersions.find((v) => v.id === selectedVersions[1]);
    return v1 && v2 ? [v1, v2] : null;
  };

  const comparisonData = getComparisonVersions();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestione Versioni</h1>
            <p className="text-muted-foreground mt-1">
              Cronologia completa delle versioni pipeline con confronto diff
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={compareMode ? 'gradient' : 'outline'}
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedVersions([]);
              }}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              {compareMode ? 'Esci dal confronto' : 'Confronta versioni'}
            </Button>
          </div>
        </div>

        {/* Compare Mode Banner */}
        {compareMode && (
          <div className="glass-card p-4 border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitCompare className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Modalità confronto attiva</p>
                  <p className="text-sm text-muted-foreground">
                    Seleziona due versioni per visualizzare le differenze
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedVersions.map((id, index) => {
                  const version = mockVersions.find((v) => v.id === id);
                  return version ? (
                    <Badge key={id} variant="glass" className="flex items-center gap-1">
                      {index === 0 ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                      {version.projectName} v{version.version}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={() => setSelectedVersions((prev) => prev.filter((v) => v !== id))}
                      />
                    </Badge>
                  ) : null;
                })}
                {selectedVersions.length < 2 && (
                  <span className="text-sm text-muted-foreground">
                    {2 - selectedVersions.length} da selezionare
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca versioni..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-64">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtra per progetto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i progetti</SelectItem>
              {mockProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Diff Comparison View */}
        {compareMode && comparisonData && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Confronto Diff</h2>
              <Badge variant="glass">{comparisonData[0].changes.length + comparisonData[1].changes.length} modifiche</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {comparisonData.map((version, index) => (
                <div key={version.id} className={cn(
                  "p-4 rounded-lg border",
                  index === 0 ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    {index === 0 ? (
                      <ArrowLeft className="w-4 h-4 text-destructive" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-success" />
                    )}
                    <span className="font-medium text-foreground">
                      {version.projectName} v{version.version}
                    </span>
                    {version.status === 'current' && (
                      <Badge variant="success" className="text-xs">Corrente</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{version.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {version.createdBy} • {version.createdAt.toLocaleDateString('it-IT')}
                  </p>
                </div>
              ))}
            </div>

            {/* Diff Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Differenze</h3>
              <div className="space-y-2 font-mono text-sm">
                {comparisonData[0].changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center shrink-0",
                      change.type === 'added' && "bg-success/20 text-success",
                      change.type === 'modified' && "bg-warning/20 text-warning",
                      change.type === 'removed' && "bg-destructive/20 text-destructive"
                    )}>
                      {change.type === 'added' && <Plus className="w-4 h-4" />}
                      {change.type === 'modified' && <GitBranch className="w-4 h-4" />}
                      {change.type === 'removed' && <Minus className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="glass" className="text-xs">{PHASE_LABELS[change.phase]}</Badge>
                        <span className="text-foreground">{change.field}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        {change.oldValue && (
                          <span className="text-destructive line-through">{change.oldValue}</span>
                        )}
                        {change.oldValue && change.newValue && <span className="text-muted-foreground">→</span>}
                        {change.newValue && (
                          <span className="text-success">{change.newValue}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedVersions([])}>
                Annulla
              </Button>
              <Button variant="gradient">
                <RotateCcw className="w-4 h-4 mr-2" />
                Ripristina v{Math.min(comparisonData[0].version, comparisonData[1].version)}
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Versioni Totali</p>
            <p className="text-2xl font-bold text-foreground mt-1">{mockVersions.length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Questa Settimana</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {mockVersions.filter((v) => {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return v.createdAt > weekAgo;
              }).length}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Progetti Attivi</p>
            <p className="text-2xl font-bold text-success mt-1">
              {new Set(mockVersions.map((v) => v.projectId)).size}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Modifiche Totali</p>
            <p className="text-2xl font-bold text-warning mt-1">
              {mockVersions.reduce((acc, v) => acc + v.changes.length, 0)}
            </p>
          </div>
        </div>

        {/* Version Timeline */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Cronologia Versioni</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-4">
              {filteredVersions.map((version) => {
                const isSelected = selectedVersions.includes(version.id);
                const isExpanded = expandedVersion === version.id;
                
                return (
                  <div
                    key={version.id}
                    className={cn(
                      "relative pl-14 transition-all",
                      compareMode && "cursor-pointer",
                      isSelected && "opacity-100",
                      compareMode && !isSelected && selectedVersions.length >= 2 && "opacity-50"
                    )}
                    onClick={() => handleVersionSelect(version.id)}
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      version.status === 'current' && "bg-primary border-primary",
                      version.status === 'previous' && "bg-background border-primary",
                      version.status === 'archived' && "bg-muted border-muted-foreground",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}>
                      {version.status === 'current' && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    
                    <div className={cn(
                      "glass-card p-4 transition-all",
                      isSelected && "ring-2 ring-primary",
                      compareMode && "hover:ring-2 hover:ring-primary/50"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="glass" className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              v{version.version}
                            </Badge>
                            <span className="font-medium text-foreground">{version.projectName}</span>
                            {version.status === 'current' && (
                              <Badge variant="success">Corrente</Badge>
                            )}
                            {version.status === 'archived' && (
                              <Badge variant="secondary">Archiviata</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{version.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {version.createdBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {version.createdAt.toLocaleDateString('it-IT')} {version.createdAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                              {version.changes.length} modifiche
                            </span>
                          </div>
                        </div>
                        
                        {!compareMode && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedVersion(isExpanded ? null : version.id);
                              }}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            {version.status !== 'current' && (
                              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Ripristina
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Expanded changes */}
                      {isExpanded && !compareMode && (
                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Modifiche in questa versione</h4>
                          {version.changes.map((change, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/30 text-sm">
                              <div className={cn(
                                "w-5 h-5 rounded flex items-center justify-center shrink-0",
                                change.type === 'added' && "bg-success/20 text-success",
                                change.type === 'modified' && "bg-warning/20 text-warning",
                                change.type === 'removed' && "bg-destructive/20 text-destructive"
                              )}>
                                {change.type === 'added' && <Plus className="w-3 h-3" />}
                                {change.type === 'modified' && <GitBranch className="w-3 h-3" />}
                                {change.type === 'removed' && <Minus className="w-3 h-3" />}
                              </div>
                              <Badge variant="glass" className="text-xs">{PHASE_LABELS[change.phase]}</Badge>
                              <span className="text-foreground">{change.field}</span>
                              {change.oldValue && (
                                <span className="text-destructive text-xs line-through">{change.oldValue}</span>
                              )}
                              {change.newValue && (
                                <span className="text-success text-xs">{change.newValue}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {filteredVersions.length === 0 && (
          <div className="glass-card p-12 text-center">
            <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessuna versione trovata</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
