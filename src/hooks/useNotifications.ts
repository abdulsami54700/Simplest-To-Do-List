import { useEffect, useRef, useCallback } from "react";
import { Task, saveTasks } from "@/lib/tasks";

export function useNotifications(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const permissionAsked = useRef(false);

  const checkAndNotify = useCallback(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = Date.now();
    let changed = false;

    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.scheduledTime && !t.completed && !t.notified && now >= t.scheduledTime) {
          try {
            new Notification("You have a task: " + t.title, {
              body: t.description || "Task reminder",
              icon: "/icon-192.png",
              tag: t.id,
            });
          } catch {
            // Notification may fail in some contexts
          }
          changed = true;
          return { ...t, notified: true };
        }
        return t;
      });
      if (changed) saveTasks(updated);
      return changed ? updated : prev;
    });
  }, [setTasks]);

  // Request permission when there are scheduled tasks
  useEffect(() => {
    const hasScheduled = tasks.some((t) => t.scheduledTime && !t.completed && !t.notified);
    if (
      hasScheduled &&
      !permissionAsked.current &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      permissionAsked.current = true;
      Notification.requestPermission().then(() => {
        checkAndNotify();
      });
    }
  }, [tasks, checkAndNotify]);

  // Set up polling interval (does not depend on tasks)
  useEffect(() => {
    checkAndNotify(); // Check immediately on mount

    const interval = setInterval(checkAndNotify, 30_000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);
}
