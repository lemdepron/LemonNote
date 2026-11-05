export const RATINGS = [
  { id: "again", label: "Again" },
  { id: "hard", label: "Hard" },
  { id: "good", label: "Good" },
  { id: "easy", label: "Easy" },
];

const iso = (date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const todayISO = () => iso(new Date());

export function addDays(dateISO, days) {
  const date = new Date(`${dateISO || todayISO()}T00:00:00`);
  date.setDate(date.getDate() + days);
  return iso(date);
}

export function newCard({ front, back, noteId = "", noteTitle = "" }) {
  return {
    front: front.trim(),
    back: back.trim(),
    noteId,
    noteTitle,
    interval: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    due_date: todayISO(),
    last_reviewed: "",
  };
}

export function schedule(card, rating) {
  const interval = Number(card.interval) || 0;
  const ease = Number(card.ease) || 2.5;
  let nextInterval = interval;
  let nextEase = ease;
  let lapses = Number(card.lapses) || 0;

  if (rating === "again") {
    nextEase = Math.max(1.3, ease - 0.2);
    nextInterval = 1;
    lapses += 1;
  } else if (rating === "hard") {
    nextEase = Math.max(1.3, ease - 0.05);
    nextInterval = interval <= 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
  } else if (rating === "good") {
    nextInterval = interval <= 0 ? 1 : interval === 1 ? 3 : Math.max(1, Math.round(interval * ease));
  } else {
    nextEase = Math.min(3.2, ease + 0.15);
    nextInterval = interval <= 0 ? 2 : Math.max(2, Math.round(interval * ease * 1.3));
  }

  return {
    interval: nextInterval,
    ease: Number(nextEase.toFixed(2)),
    lapses,
    reps: (Number(card.reps) || 0) + 1,
    due_date: addDays(todayISO(), nextInterval),
    last_reviewed: todayISO(),
  };
}

export const STARTER_CARDS = [
  {
    front: "What does it mean that LemonNote is local-first?",
    back: "Your notes are plain markdown documents you own — no proprietary blocks and no server-side lock-in.",
  },
  {
    front: "How do you write a wiki-link?",
    back: "Wrap another note's title in double brackets, like [[Getting started]].",
  },
  {
    front: "How is a tag different from a link?",
    back: "A tag groups notes by theme. A link states that one specific note refers to another, and creates a backlink in both directions.",
  },
].map((card) => newCard(card));

export const isDue = (card) => !card.due_date || card.due_date <= todayISO();

export function dueLabel(card) {
  if (!card.due_date) return "new";
  if (card.due_date <= todayISO()) return "due now";
  const days = Math.round(
    (new Date(`${card.due_date}T00:00:00`) - new Date(`${todayISO()}T00:00:00`)) / 86400000
  );
  return days === 1 ? "in 1 day" : `in ${days} days`;
}