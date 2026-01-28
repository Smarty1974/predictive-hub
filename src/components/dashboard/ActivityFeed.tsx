import { GitCommit, PlayCircle, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "commit" | "start" | "complete" | "error" | "upload";
  message: string;
  project: string;
  user: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "complete",
    message: "Training completato",
    project: "Fraud Detection",
    user: "Marco S.",
    time: "5 min fa",
  },
  {
    id: "2",
    type: "commit",
    message: "Versione 3.2 creata",
    project: "Customer Churn",
    user: "Giulia B.",
    time: "12 min fa",
  },
  {
    id: "3",
    type: "upload",
    message: "Dataset caricato (2.4GB)",
    project: "Sentiment Analysis",
    user: "Luca V.",
    time: "1 ora fa",
  },
  {
    id: "4",
    type: "start",
    message: "Pipeline avviata",
    project: "Image Classification",
    user: "Anna N.",
    time: "2 ore fa",
  },
  {
    id: "5",
    type: "error",
    message: "Errore validazione dati",
    project: "Time Series",
    user: "Marco R.",
    time: "3 ore fa",
  },
];

const typeConfig = {
  commit: { icon: GitCommit, color: "text-primary", bg: "bg-primary/20" },
  start: { icon: PlayCircle, color: "text-warning", bg: "bg-warning/20" },
  complete: { icon: CheckCircle, color: "text-success", bg: "bg-success/20" },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/20" },
  upload: { icon: Upload, color: "text-accent", bg: "bg-accent/20" },
};

export function ActivityFeed() {
  return (
    <div className="glass-card p-5">
      <h3 className="font-semibold text-foreground mb-4">Attività Recenti</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.project} • {activity.user}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
