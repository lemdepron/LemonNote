export const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const parseKey = (key) => {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12);
};

export const shiftDay = (key, days) => {
  const date = parseKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
};

export const isJournalTitle = (title = "") => /^\d{4}-\d{2}-\d{2}$/.test(String(title).trim());

export const formatDay = (key) =>
  parseKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const JOURNAL_TEMPLATE = `## Notes

- 

## Tasks

- [ ] 

## Log

- `;