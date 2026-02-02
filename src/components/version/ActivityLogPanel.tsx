import { 
  Activity, 
  GitBranch, 
  Link2, 
  FileText, 
  RotateCcw, 
  Layers,
  Clock,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityLogEntry } from '@/hooks/useActivityLog';
import { cn } from '@/lib/utils';

interface ActivityLogPanelProps {
  logs: ActivityLogEntry[];
  maxHeight?: string;
  showProjectName?: boolean;
}

const actionConfig: Record<ActivityLogEntry['action'], { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}> = {
  version_created: {
    icon: GitBranch,
    label: 'Nuova versione',
    color: 'text-primary',
  },
  version_restored: {
    icon: RotateCcw,
    label: 'Versione ripristinata',
    color: 'text-warning',
  },
  phase_updated: {
    icon: Layers,
    label: 'Fase aggiornata',
    color: 'text-success',
  },
  link_added: {
    icon: Link2,
    label: 'Link aggiunto',
    color: 'text-primary',
  },
  link_removed: {
    icon: Link2,
    label: 'Link rimosso',
    color: 'text-destructive',
  },
  description_updated: {
    icon: FileText,
    label: 'Descrizione aggiornata',
    color: 'text-muted-foreground',
  },
  pipeline_reordered: {
    icon: Layers,
    label: 'Pipeline riordinata',
    color: 'text-primary',
  },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Adesso';
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays < 7) return `${diffDays} giorni fa`;
  
  return date.toLocaleDateString('it-IT');
}

export function ActivityLogPanel({ 
  logs, 
  maxHeight = '400px',
  showProjectName = false 
}: ActivityLogPanelProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Nessuna attività registrata
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("pr-4")} style={{ maxHeight }}>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4">
          {logs.map((log) => {
            const config = actionConfig[log.action];
            const Icon = config.icon;

            return (
              <div key={log.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-0 top-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center",
                  config.color
                )}>
                  <Icon className="w-3 h-3" />
                </div>

                <div className="glass-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="glass" className="text-xs">
                          {config.label}
                        </Badge>
                        {log.versionId && (
                          <Badge variant="secondary" className="text-xs">
                            v{log.versionId.split('-v')[1]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1">
                        {log.details}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
