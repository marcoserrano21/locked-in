import { dateKey, todayKey, parseDateKey } from "../dates.js";
import { escapeHtml, icon } from "./dom.js";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LONG = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Field display: "Tue Aug 11, 2026" — always full year (2026+ aware). */
export function formatDateFieldDisplay(key) {
  if (!key) return "Pick a date";
  const d = parseDateKey(key);
  if (Number.isNaN(d.getTime())) return "Pick a date";
  return `${WEEKDAY_LONG[d.getDay()]} ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function monthTitle(year, monthIndex) {
  return `${MONTHS[monthIndex]} ${year}`;
}

/** Render month grid. viewMonth is 0-indexed. */
export function renderDateCal({ selected = "", viewYear, viewMonth } = {}) {
  const today = todayKey();
  const sel = selected || today;
  const base = parseDateKey(sel);
  const year = viewYear != null ? Number(viewYear) : base.getFullYear();
  const month = viewMonth != null ? Number(viewMonth) : base.getMonth();

  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    let y = year;
    let m = month;
    let dayNum;
    let inMonth = true;
    if (i < startDow) {
      inMonth = false;
      m = month - 1;
      dayNum = prevDays - startDow + i + 1;
      if (m < 0) {
        m = 11;
        y = year - 1;
      }
    } else if (i >= startDow + daysInMonth) {
      inMonth = false;
      m = month + 1;
      dayNum = i - startDow - daysInMonth + 1;
      if (m > 11) {
        m = 0;
        y = year + 1;
      }
    } else {
      dayNum = i - startDow + 1;
    }
    const key = dateKey(new Date(y, m, dayNum, 12, 0, 0, 0));
    const isSel = key === sel;
    const isToday = key === today;
    cells.push(`
      <button type="button"
        class="date-cal-day${!inMonth ? " is-outside" : ""}${isSel ? " is-selected" : ""}${isToday ? " is-today" : ""}"
        data-action="date-pick"
        data-date="${key}"
        aria-label="${escapeHtml(formatDateFieldDisplay(key))}"
        aria-pressed="${isSel}"
        tabindex="${isSel || (isToday && !sel) ? "0" : "-1"}">
        <span class="date-cal-day-num">${dayNum}</span>
      </button>`);
  }

  return `
    <div class="date-cal" data-view-year="${year}" data-view-month="${month}" data-selected="${escapeHtml(sel)}">
      <div class="date-cal-head">
        <button type="button" class="icon-btn date-cal-nav" data-action="date-cal-prev" aria-label="Previous month">${icon("left", "h-4 w-4")}</button>
        <p class="date-cal-title" aria-live="polite">${escapeHtml(monthTitle(year, month))}</p>
        <button type="button" class="icon-btn date-cal-nav" data-action="date-cal-next" aria-label="Next month">${icon("right", "h-4 w-4")}</button>
      </div>
      <div class="date-cal-dows" aria-hidden="true">
        ${WEEKDAYS.map((d) => `<span class="date-cal-dow">${d}</span>`).join("")}
      </div>
      <div class="date-cal-grid" role="grid" aria-label="${escapeHtml(monthTitle(year, month))}">
        ${cells.join("")}
      </div>
      <div class="date-cal-foot">
        <button type="button" class="chip chip-build date-cal-today" data-action="date-cal-today">Today</button>
      </div>
    </div>`;
}

/**
 * Compact date field that opens a calendar popover/sheet.
 * @param {{ id?: string, name?: string, value?: string, action?: string, required?: boolean, label?: string }} opts
 */
export function renderDateField({
  id = "",
  name = "date",
  value = "",
  action = "",
  required = false,
  label = "",
} = {}) {
  const v = value || todayKey();
  const fieldId = id || name || "date-field";
  const triggerId = `${fieldId}-trigger`;
  const popoverId = `${fieldId}-popover`;
  const d = parseDateKey(v);
  const actionAttr = action ? `data-action="${escapeHtml(action)}"` : "";
  const labelHtml = label
    ? `<label class="mb-1 block text-xs" style="color:var(--mute)" for="${escapeHtml(triggerId)}">${escapeHtml(label)}</label>`
    : "";

  return `
    <div class="date-field" data-date-field>
      ${labelHtml}
      <input
        type="hidden"
        class="date-field-input"
        id="${escapeHtml(fieldId)}"
        name="${escapeHtml(name)}"
        value="${escapeHtml(v)}"
        ${required ? "required" : ""}
        ${actionAttr}
      />
      <button
        type="button"
        class="date-field-trigger"
        id="${escapeHtml(triggerId)}"
        data-action="toggle-date-picker"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="${escapeHtml(popoverId)}"
        ${required ? 'aria-required="true"' : ""}
      >
        <span class="date-field-value">${escapeHtml(formatDateFieldDisplay(v))}</span>
        <span class="date-field-icon" aria-hidden="true">${icon("today", "h-4 w-4")}</span>
      </button>
      <div
        class="date-popover"
        id="${escapeHtml(popoverId)}"
        role="dialog"
        aria-modal="false"
        aria-label="Choose date"
        hidden
      >
        ${renderDateCal({ selected: v, viewYear: d.getFullYear(), viewMonth: d.getMonth() })}
      </div>
    </div>`;
}
