import { useState, useCallback, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, scheduledTime: number | null) => void;
}

export default function AddTaskModal({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const saving = useRef(false);

  const handleSave = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed || saving.current) return;
    saving.current = true;

    const scheduled = dateTime ? new Date(dateTime).getTime() : null;
    onSave(trimmed, description, scheduled);

    setTitle("");
    setDescription("");
    setDateTime("");
    saving.current = false;
    onClose();
  }, [title, description, dateTime, onSave, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-t-xl sm:rounded-xl w-full max-w-md p-5 animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground font-semibold text-lg">New Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X size={20} className="text-secondary-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-secondary-foreground mb-1 block">
              Title *
            </label>
            <input
              type="text"
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-secondary-foreground/50 outline-none focus:ring-2 focus:ring-primary/50 transition"
              autoFocus
            />
            <span className="text-xs text-secondary-foreground/50 mt-0.5 block text-right">
              {title.length}/50
            </span>
          </div>

          <div>
            <label className="text-xs text-secondary-foreground mb-1 block">
              Description
            </label>
            <textarea
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-secondary-foreground/50 outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
            />
            <span className="text-xs text-secondary-foreground/50 mt-0.5 block text-right">
              {description.length}/200
            </span>
          </div>

          <div>
            <label className="text-xs text-secondary-foreground mb-1 block">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition [color-scheme:dark]"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}
