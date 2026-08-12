/** Local calendar date as YYYY-MM-DD (avoids UTC shift). */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function yesterdayKey() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

export function addDays(date, delta) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  return d;
}

export function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function daysBetween(startKey, endKey) {
  const a = parseDateKey(startKey).getTime();
  const b = parseDateKey(endKey).getTime();
  return Math.floor((b - a) / 86400000);
}

/** User-facing dates: MM/DD/YY */
export function formatDisplayDate(key) {
  if (!key) return "";
  const d = parseDateKey(key);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

/** Sunday-start week containing the given date (or today). */
export function weekDates(aroundKey = todayKey(), weekOffset = 0) {
  const base = parseDateKey(aroundKey);
  base.setDate(base.getDate() + weekOffset * 7);
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(sunday, i)));
}

function matchClockToken(token) {
  const match = String(token || "").trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const min = Number(match[2] || 0);
  const mer = (match[3] || "").toLowerCase();
  if (mer === "pm" && hour < 12) hour += 12;
  if (mer === "am" && hour === 12) hour = 0;
  if (!mer && hour <= 6) hour += 12;
  if (hour > 23 || min > 59) return null;
  return hour * 60 + min;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const start = String(timeStr).split(/[-–—]/)[0].trim();
  return matchClockToken(start);
}

/** Parse "8:00 - 9:00 AM" into HTML time input values { start: "08:00", end: "09:00" }. */
export function parseTimeRange(timeStr) {
  const raw = String(timeStr || "").trim();
  if (!raw) return { start: "", end: "", freeText: "" };
  const parts = raw.split(/\s*[-–—]\s*/);
  if (parts.length < 2) {
    const only = matchClockToken(raw);
    if (only == null) return { start: "", end: "", freeText: raw };
    return { start: minutesToInput(only), end: "", freeText: "" };
  }
  const leftMer = (parts[0].match(/(am|pm)/i) || [])[0];
  const rightMer = (parts[1].match(/(am|pm)/i) || [])[0];
  const sharedMer = rightMer || leftMer || "";
  const startToken = leftMer ? parts[0] : `${parts[0]} ${sharedMer}`.trim();
  const endToken = parts[1];
  const startMins = matchClockToken(startToken);
  const endMins = matchClockToken(endToken);
  if (startMins == null || endMins == null) {
    return { start: "", end: "", freeText: raw };
  }
  return { start: minutesToInput(startMins), end: minutesToInput(endMins), freeText: "" };
}

function minutesToInput(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Snap minutes to nearest 15-minute increment (00, 15, 30, 45). */
export function snapToQuarterHour(mins) {
  if (mins == null || !Number.isFinite(mins)) return null;
  const dayMins = 24 * 60;
  const wrapped = ((Math.round(Number(mins) / 15) * 15) % dayMins + dayMins) % dayMins;
  return wrapped;
}

/** Snap HTML time input value (HH:mm) to quarter hour; returns HH:mm. */
export function snapTimeInputValue(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(String(hhmm))) return hhmm || "";
  const [h, m] = String(hhmm).split(":").map(Number);
  return minutesToInput(snapToQuarterHour(h * 60 + m));
}

function inputToDisplay(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "";
  let h = Number(hhmm.slice(0, 2));
  const m = hhmm.slice(3);
  const mer = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return m === "00" ? `${h}:00 ${mer}` : `${h}:${m} ${mer}`;
}

/** Build display range from type=time values, or free-text fallback. */
export function formatTimeRange(startInput, endInput, freeText = "") {
  const free = String(freeText || "").trim();
  if (free) return free;
  const start = inputToDisplay(startInput);
  const end = inputToDisplay(endInput);
  if (start && end) {
    const sameMer = start.slice(-2) === end.slice(-2);
    if (sameMer) {
      return `${start.replace(/\s*(AM|PM)$/i, "")} - ${end}`;
    }
    return `${start} - ${end}`;
  }
  if (start) return start;
  if (end) return end;
  return "";
}

/** Snap time input and format for block storage (e.g. "8:00 AM"). */
export function snapTimeInputToDisplay(hhmm) {
  const snapped = snapTimeInputValue(hhmm);
  if (!snapped) return "";
  return inputToDisplay(snapped);
}

export function formatTimeForInput(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins == null) return "";
  return minutesToInput(snapToQuarterHour(mins));
}

export function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}
