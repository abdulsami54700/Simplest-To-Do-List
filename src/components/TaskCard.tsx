import { useState, useCallback } from "react";
import { Task } from "@/lib/tasks";
import { format } from "date-fns";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  task: Task;
  onComplete: (id: string) => void;
}

export default function TaskCard({ task, onComplete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleCheck = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirming(true);
    },
    []
  );

  const confirmComplete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(50);
      onComplete(task.id);
      setConfirming(false);
    },
    [onComplete, task.id]
  );

  const cancelComplete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
  }, []);

  return (
    <div
      className="bg-card rounded-lg p-4 mb-3 cursor-pointer transition-all duration-200 hover:brightness-110 shadow-lg shadow-black/10"
      onClick={() => setExpanded((p) => !p)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight">
            {task.title}
          </h3>
          {task.description && (
            <p
              className={`text-secondary-foreground text-xs mt-1 ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {task.description}
            </p>
          )}
          {task.scheduledTime && (
            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
              <Clock size={12} />
              <span>{format(new Date(task.scheduledTime), "MMM d, h:mm a")}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expanded ? (
            <ChevronUp size={16} className="text-secondary-foreground" />
          ) : (
            <ChevronDown size={16} className="text-secondary-foreground" />
          )}
          <button
            onClick={handleCheck}
            className="w-6 h-6 rounded-md border-2 border-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
            aria-label="Complete task"
          >
            {confirming && (
              <div className="w-3 h-3 rounded-sm bg-primary" />
            )}
          </button>
        </div>
      </div>

      {confirming && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-xs text-secondary-foreground">Mark as completed?</span>
          <div className="flex gap-2">
            <button
              onClick={cancelComplete}
              className="px-3 py-1 text-xs rounded-md bg-muted text-foreground hover:brightness-125 transition-colors"
            >
              No
            </button>
            <button
              onClick={confirmComplete}
              className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground font-medium hover:brightness-110 transition-colors"
            >
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
