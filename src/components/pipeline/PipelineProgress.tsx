import { Check, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineStep, PHASE_LABELS, PhaseStatus } from '@/types/ml-project';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PipelineProgressProps {
  steps: PipelineStep[];
  compact?: boolean;
}

const statusConfig: Record<PhaseStatus, { icon: typeof Check; color: string; bgColor: string }> = {
  pending: { icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  in_progress: { icon: Loader2, color: 'text-primary', bgColor: 'bg-primary/20' },
  completed: { icon: Check, color: 'text-success', bgColor: 'bg-success/20' },
  error: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/20' },
};

export function PipelineProgress({ steps, compact = false }: PipelineProgressProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const config = statusConfig[step.status];
        const Icon = config.icon;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'pipeline-node',
                    config.bgColor,
                    step.status === 'in_progress' && 'animate-glow-pulse'
                  )}
                >
                  <Icon
                    className={cn(
                      compact ? 'w-4 h-4' : 'w-5 h-5',
                      config.color,
                      step.status === 'in_progress' && 'animate-spin'
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass-card">
                <div className="text-sm">
                  <p className="font-medium">{PHASE_LABELS[step.phase]}</p>
                  <p className="text-muted-foreground capitalize">{step.status.replace('_', ' ')}</p>
                </div>
              </TooltipContent>
            </Tooltip>

            {!isLast && (
              <div
                className={cn(
                  'pipeline-line',
                  step.status === 'completed' ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
