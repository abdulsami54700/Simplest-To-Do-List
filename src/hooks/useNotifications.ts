import { useEffect, useRef } from "react";
import { Task, saveTasks } from "@/lib/tasks";

export function useNotifications(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const permissionAsked = useRef(false);

  useEffect(() => {
    const scheduled = tasks.filter((t) => t.scheduledTime && !t.completed && !t.notified);
    if (scheduled.length === 0) return;

    if (!permissionAsked.current && "Notification" in window && Notification.permission === "default") {
      permissionAsked.current = true;
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = Date.now();
      let changed = false;

      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.scheduledTime && !t.completed && !t.notified && now >= t.scheduledTime) {
            new Notification(t.title, { body: t.description || "Task reminder" });
            changed = true;
            return { ...t, notified: true };
          }
          return t;
        });
        if (changed) saveTasks(updated);
        return changed ? updated : prev;
      });
    }, 60_000);

    return () => clearInterval(interval);
  }, [tasks, setTasks]);
}
