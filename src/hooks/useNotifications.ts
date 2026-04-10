import { useEffect, useRef, useCallback } from "react";
import { Task, saveTasks } from "@/lib/tasks";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import { storeFCMToken, syncAllScheduledTasks } from "@/lib/supabaseSync";

/**
 * Sync scheduled tasks to the service worker's IndexedDB for offline local notifications
 */
function syncTasksToServiceWorker(tasks: Task[]) {
  const scheduled = tasks
    .filter((t) => t.scheduledTime && !t.completed && !t.notified)
    .map((t) => ({ id: t.id, title: t.title, scheduledTime: t.scheduledTime, notified: false }));

  navigator.serviceWorker?.ready.then((reg) => {
    reg.active?.postMessage({ type: "SYNC_SCHEDULED_TASKS", tasks: scheduled });
  }).catch(() => {});
}

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

  // Sync tasks to service worker IndexedDB for offline fallback
  useEffect(() => {
    syncTasksToServiceWorker(tasks);
  }, [tasks]);

  // Listen for foreground FCM messages — use tag to deduplicate
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || "Task Reminder";
      const body = payload.notification?.body || "You have a task due!";
      const tag = "fcm-" + (payload.data?.taskId || Date.now());
      try {
        new Notification(title, { body, icon: "/icon-192.png", tag });
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
              tag: "local-" + t.id, // same tag as SW to prevent duplicates
            });
          } catch {
            // Notification may fail in some contexts
          }
          changed = true;
          return { ...t, notified: true };
        }
        return t;
      });
      if (changed) {
        saveTasks(updated);
        // Update SW IndexedDB so it doesn't fire again
        syncTasksToServiceWorker(updated);
      }
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

  // Poll every 10 seconds for better timing accuracy
  useEffect(() => {
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 10_000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);
}
