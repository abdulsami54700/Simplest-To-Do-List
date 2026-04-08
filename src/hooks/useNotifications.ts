import { useEffect, useRef, useCallback } from "react";
import { Task, saveTasks } from "@/lib/tasks";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import { storeFCMToken, syncAllScheduledTasks } from "@/lib/supabaseSync";

export function useNotifications(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const permissionAsked = useRef(false);
  const fcmInitialized = useRef(false);

  // Initialize FCM when there are scheduled tasks
  useEffect(() => {
    const hasScheduled = tasks.some((t) => t.scheduledTime && !t.completed && !t.notified);
    if (hasScheduled && !fcmInitialized.current) {
      fcmInitialized.current = true;
      requestFCMToken().then((token) => {
        if (token) storeFCMToken(token);
      }).catch(console.error);
      // Sync scheduled tasks to backend
      syncAllScheduledTasks(tasks).catch(console.error);
    }
  }, [tasks]);

  // Listen for foreground FCM messages
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || "Task Reminder";
      const body = payload.notification?.body || "You have a task due!";
      try {
        new Notification(title, { body, icon: "/icon-192.png" });
      } catch {
        // fallback: already shown by FCM
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

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

  // Poll every 30 seconds
  useEffect(() => {
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 30_000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);
}
