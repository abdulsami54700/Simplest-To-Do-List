import { ListTodo, History } from "lucide-react";

type Tab = "tasks" | "history";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  historyCount: number;
}

export default function BottomNav({ active, onChange, historyCount }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="max-w-md mx-auto flex">
        <button
          onClick={() => onChange("tasks")}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
            active === "tasks" ? "text-primary" : "text-secondary-foreground"
          }`}
        >
          <ListTodo size={20} />
          <span className="text-xs font-medium">Tasks</span>
        </button>
        <button
          onClick={() => onChange("history")}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors relative ${
            active === "history" ? "text-primary" : "text-secondary-foreground"
          }`}
        >
          <History size={20} />
          <span className="text-xs font-medium">History</span>
          {historyCount > 0 && (
            <span className="absolute top-2 right-1/4 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {historyCount > 9 ? "9+" : historyCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
