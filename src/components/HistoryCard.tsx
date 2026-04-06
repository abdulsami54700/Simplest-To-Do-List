import { Task } from "@/lib/tasks";
import { format } from "date-fns";
import { Trash2, Clock } from "lucide-react";
import { useCallback } from "react";

interface Props {
  task: Task;
  onDelete: (id: string) => void;
}

export default function HistoryCard({ task, onDelete }: Props) {
  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  return (
    <div className="bg-card rounded-lg p-4 mb-3 opacity-75 shadow-lg shadow-black/10">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm line-through">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-secondary-foreground text-xs mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          {task.scheduledTime && (
            <div className="flex items-center gap-1 mt-2 text-xs text-secondary-foreground">
              <Clock size={12} />
              <span>{format(new Date(task.scheduledTime), "MMM d, h:mm a")}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="p-2 rounded-md hover:bg-destructive/20 text-destructive transition-colors shrink-0"
          aria-label="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
