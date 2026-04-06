import { useState, useCallback, useMemo } from "react";
import { Task, loadTasks, saveTasks, createTask } from "@/lib/tasks";
import { useNotifications } from "@/hooks/useNotifications";
import TaskCard from "@/components/TaskCard";
import HistoryCard from "@/components/HistoryCard";
import AddTaskModal from "@/components/AddTaskModal";
import BottomNav from "@/components/BottomNav";
import { Plus, ClipboardList, Archive } from "lucide-react";

type Tab = "tasks" | "history";

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [tab, setTab] = useState<Tab>("tasks");
  const [modalOpen, setModalOpen] = useState(false);

  useNotifications(tasks, setTasks);

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completed).sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) return a.scheduledTime - b.scheduledTime;
      if (a.scheduledTime) return -1;
      if (b.scheduledTime) return 1;
      return b.createdAt - a.createdAt;
    }),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed).sort((a, b) => b.createdAt - a.createdAt),
    [tasks]
  );

  const handleAdd = useCallback(
    (title: string, description: string, scheduledTime: number | null) => {
      const task = createTask(title, description, scheduledTime);
      setTasks((prev) => {
        const next = [...prev, task];
        saveTasks(next);
        return next;
      });
    },
    []
  );

  const handleComplete = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, completed: true } : t
      );
      saveTasks(next);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTasks(next);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">To Do List</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        {tab === "tasks" ? (
          activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-secondary-foreground">
              <ClipboardList size={48} className="mb-3 opacity-40" />
              <p className="text-sm">No tasks yet</p>
              <p className="text-xs mt-1 opacity-60">Tap + to add one</p>
            </div>
          ) : (
            activeTasks.map((t) => (
              <TaskCard key={t.id} task={t} onComplete={handleComplete} />
            ))
          )
        ) : completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary-foreground">
            <Archive size={48} className="mb-3 opacity-40" />
            <p className="text-sm">No completed tasks</p>
          </div>
        ) : (
          completedTasks.map((t) => (
            <HistoryCard key={t.id} task={t} onDelete={handleDelete} />
          ))
        )}
      </main>

      {tab === "tasks" && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
          aria-label="Add task"
        >
          <Plus size={28} />
        </button>
      )}

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
      />

      <BottomNav
        active={tab}
        onChange={setTab}
        historyCount={completedTasks.length}
      />
    </div>
  );
}
