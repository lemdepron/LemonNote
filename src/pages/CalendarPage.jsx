import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { db } from "@/api/localDb";
import VaultHeader from "@/components/vault/VaultHeader";
import { dateKey, isJournalTitle } from "@/lib/journal";
import { collectTasks, getDueDateStatus } from "@/lib/tasks";
import { listActiveNotes } from "@/lib/notes";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listActiveNotes({ sort: "-created_date", limit: 500 })
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const tasks = useMemo(() => collectTasks(notes), [notes]);
  const journalNotes = useMemo(
    () => notes.filter((note) => isJournalTitle(note.title)),
    [notes]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = dateKey(task.dueDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });
    return map;
  }, [tasks]);

  const journalByDate = useMemo(() => {
    const map = new Map();
    journalNotes.forEach((note) => {
      const key = note.title.trim();
      map.set(key, note);
    });
    return map;
  }, [journalNotes]);

  const today = dateKey();
  const currentMonthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      days.push({ date, currentMonth: false, day });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, currentMonth: true, day });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, currentMonth: false, day });
    }
    return days;
  }, [viewDate]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(viewDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [viewDate]);

  const shiftView = (delta) => {
    if (viewMode === "month") {
      setViewDate((d) => {
        const next = new Date(d);
        next.setMonth(next.getMonth() + delta);
        return next;
      });
    } else {
      setViewDate((d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + delta * 7);
        return next;
      });
    }
  };

  const goToToday = () => setViewDate(new Date());

  const openDay = async (dayKey) => {
    if (creating) return;
    setCreating(true);
    try {
      const existing = notes.find((n) => String(n.title || "").trim() === dayKey);
      if (existing) {
        navigate(`/note/${existing.id}`);
      } else {
        const { JOURNAL_TEMPLATE } = await import("@/lib/journal");
        const created = await db.entities.Note.create({
          title: dayKey,
          body: JOURNAL_TEMPLATE,
          tags: ["journal"],
        });
        navigate(`/note/${created.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-0.5">
      {WEEKDAYS.map((wd) => (
        <div key={wd} className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground py-1.5">
          {wd}
        </div>
      ))}
      {daysInMonth.map(({ date, currentMonth, day }) => {
        const dayKey = dateKey(date);
        const dayTasks = tasksByDate.get(dayKey) || [];
        const journalEntry = journalByDate.get(dayKey);
        const isToday = dayKey === today;
        const isSelected = dayKey === dateKey(viewDate);

        const overdueCount = dayTasks.filter((t) => getDueDateStatus(t.dueDate) === "overdue").length;
        const todayCount = dayTasks.filter((t) => getDueDateStatus(t.dueDate) === "today").length;
        const thisWeekCount = dayTasks.filter((t) => getDueDateStatus(t.dueDate) === "this-week").length;

        return (
          <button
            key={dayKey}
            type="button"
            onClick={() => openDay(dayKey)}
            className={cn(
              "relative min-h-[90px] p-1.5 text-left transition hover:bg-accent/30",
              !currentMonth && "text-muted-foreground/40",
              isToday && "bg-primary/5 ring-1 ring-primary/30",
              isSelected && "ring-2 ring-primary"
            )}
            style={{ borderRadius: "8px" }}
          >
            <span className={cn("font-mono text-[11px]", isToday ? "text-primary font-medium" : "text-foreground")}>
              {day}
            </span>
            {journalEntry && (
              <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-green-500/80" title="Journal entry" />
            )}
            {dayTasks.length > 0 && (
              <div className="mt-1.5 space-y-0.5 max-h-[60px] overflow-hidden">
                {dayTasks.slice(0, 3).map((task, idx) => (
                  <div
                    key={`${task.noteId}-${task.line}`}
                    className={cn(
                      "truncate text-[10px] px-1 py-0.5 rounded",
                      getDueDateStatus(task.dueDate) === "overdue" && "bg-destructive/20 text-destructive",
                      getDueDateStatus(task.dueDate) === "today" && "bg-primary/20 text-primary",
                      getDueDateStatus(task.dueDate) === "this-week" && "bg-amber-500/20 text-amber-700",
                      getDueDateStatus(task.dueDate) === "future" && "bg-muted/50 text-muted-foreground",
                      getDueDateStatus(task.dueDate) === "no-date" && "bg-muted/50 text-muted-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/note/${task.noteId}`);
                    }}
                    title={task.text}
                  >
                    {task.text.slice(0, 30)}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-muted-foreground text-center truncate">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            )}
            {!currentMonth && dayTasks.length === 0 && !journalEntry && (
              <div className="mt-1.5 h-4" />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-0.5">
      {weekDays.map((date) => {
        const dayKey = dateKey(date);
        const dayTasks = tasksByDate.get(dayKey) || [];
        const journalEntry = journalByDate.get(dayKey);
        const isToday = dayKey === today;
        const isSelected = dayKey === dateKey(viewDate);

        return (
          <div key={dayKey} className={cn("min-h-[120px] p-2 rounded-lg transition", isToday && "bg-primary/5 ring-1 ring-primary/30")}>
            <button
              type="button"
              onClick={() => openDay(dayKey)}
              className={cn("w-full text-left transition", isSelected && "bg-accent rounded")}
            >
              <div className={cn("font-mono text-[11px]", isToday ? "text-primary font-medium" : "text-foreground")}>
                {date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
              </div>
              {journalEntry && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-green-600 dark:text-green-400">
                  <Calendar className="h-3 w-3" /> Journal
                </span>
              )}
            </button>
            <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto">
              {dayTasks.map((task) => (
                <button
                  key={`${task.noteId}-${task.line}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/note/${task.noteId}`);
                  }}
                  className={cn(
                    "w-full text-left truncate rounded px-1.5 py-1 text-[10px] transition hover:bg-accent/50",
                    getDueDateStatus(task.dueDate) === "overdue" && "bg-destructive/10 text-destructive border border-destructive/20",
                    getDueDateStatus(task.dueDate) === "today" && "bg-primary/10 text-primary border border-primary/20",
                    getDueDateStatus(task.dueDate) === "this-week" && "bg-amber-500/10 text-amber-700 border border-amber-500/20",
                    getDueDateStatus(task.dueDate) === "future" && "bg-muted/30 text-muted-foreground",
                    getDueDateStatus(task.dueDate) === "no-date" && "bg-muted/30 text-muted-foreground"
                  )}
                  title={task.text}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {task.dueDate ? task.dueDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "All day"}
                    </span>
                    <span>{task.text}</span>
                  </div>
                </button>
              ))}
              {dayTasks.length === 0 && !journalEntry && (
                <div className="text-[11px] text-muted-foreground/50 text-center py-4">No tasks</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="nb-label">Calendar</p>
            <h1 className="mt-1 font-display text-[26px] leading-tight tracking-tight">
              {viewMode === "month"
                ? viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
                : `Week of ${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => shiftView(-1)}
              aria-label={viewMode === "month" ? "Previous month" : "Previous week"}
              className="grid h-8 w-8 place-items-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="h-8 rounded-md border border-border/70 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              today
            </button>
            <button
              type="button"
              onClick={() => shiftView(1)}
              aria-label={viewMode === "month" ? "Next month" : "Next week"}
              className="grid h-8 w-8 place-items-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <div className="w-px h-8 bg-border/50 mx-1" />
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={cn(
                "h-8 rounded-md px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition",
                viewMode === "month"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
              )}
            >
              <Calendar className="h-3.5 w-3.5 inline-block mr-1" /> Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "h-8 rounded-md px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition",
                viewMode === "week"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
              )}
            >
              <Clock className="h-3.5 w-3.5 inline-block mr-1" /> Week
            </button>
          </div>
        </div>

        <section className="mt-5 rounded-xl border border-border/70 bg-card/30 p-4">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="h-20 rounded-lg bg-card/40" />
              ))}
            </div>
          ) : viewMode === "month" ? (
            renderMonthView()
          ) : (
            renderWeekView()
          )}
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <p className="nb-label">Tasks this week</p>
            <p className="mt-2 font-display text-[28px] leading-tight">
              {tasks.filter((t) => t.dueDate && getDueDateStatus(t.dueDate) !== "future" && getDueDateStatus(t.dueDate) !== "no-date").length}
            </p>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="nb-label">Overdue</p>
            <p className="mt-2 font-display text-[28px] leading-tight text-destructive">
              {tasks.filter((t) => getDueDateStatus(t.dueDate) === "overdue").length}
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="nb-label">Due today</p>
            <p className="mt-2 font-display text-[28px] leading-tight text-primary">
              {tasks.filter((t) => getDueDateStatus(t.dueDate) === "today").length}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="nb-label">This week</p>
            <p className="mt-2 font-display text-[28px] leading-tight text-amber-700 dark:text-amber-300">
              {tasks.filter((t) => getDueDateStatus(t.dueDate) === "this-week").length}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}