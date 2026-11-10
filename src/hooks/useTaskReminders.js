import { useEffect, useRef } from "react";
import { collectTasks } from "@/lib/tasks";
import { toast } from "@/lib/toast";

let isTauri = false;
try {
  isTauri = !!window.__TAURI__;
} catch {
  isTauri = false;
}

let notify = null;
if (isTauri) {
  import("@tauri-apps/plugin-notification").then((mod) => {
    notify = mod;
  }).catch(() => {
    // Notification plugin not available
  });
}

const CHECK_INTERVAL = 60000; // Check every minute
const REMINDER_WINDOW = 5 * 60 * 1000; // 5 minutes before due

export function useTaskReminders(notes) {
  const remindedRef = useRef(new Set());
  const lastCheckRef = useRef(0);

  useEffect(() => {
    if (!notes || notes.length === 0) return;

    const checkReminders = async () => {
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_INTERVAL) return;
      lastCheckRef.current = now;

      const tasks = collectTasks(notes);
      const nowDate = new Date();

      for (const task of tasks) {
        if (!task.dueDate) continue;
        if (task.state === "DONE") continue;

        const dueTime = task.dueDate.getTime();
        const timeUntilDue = dueTime - nowDate.getTime();

        // Check if we should remind (within 5 minutes before due, or overdue by less than 1 minute)
        const shouldRemind = timeUntilDue <= REMINDER_WINDOW && timeUntilDue > -60000;
        const reminderKey = `${task.noteId}-${task.line}`;

        if (shouldRemind && !remindedRef.current.has(reminderKey)) {
          remindedRef.current.add(reminderKey);
          
          const timeStr = task.dueDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          const dateStr = task.dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
          
          const message = `"${task.text}" is due ${dateStr} at ${timeStr}`;

          if (isTauri && notify) {
            try {
              await notify.sendNotification({
                title: "Task Reminder",
                body: message,
              });
            } catch {
              // Fallback to toast if notification fails
              toast(message, { type: "info", duration: 8000 });
            }
          } else {
            toast(message, { type: "info", duration: 8000 });
          }
        }

        // Clean up old reminders (tasks that are no longer due soon)
        if (timeUntilDue > REMINDER_WINDOW || timeUntilDue < -60000) {
          remindedRef.current.delete(reminderKey);
        }
      }
    };

    // Initial check
    checkReminders();

    // Set up interval
    const interval = setInterval(checkReminders, CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [notes]);
}

export function requestNotificationPermission() {
  if (isTauri && notify) {
    return notify.requestPermission().catch(() => false);
  }
  // Browser notifications
  if ("Notification" in window) {
    return Notification.requestPermission().then((perm) => perm === "granted");
  }
  return Promise.resolve(false);
}