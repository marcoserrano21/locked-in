import { escapeHtml, icon, renderMetaRow } from "../dom.js";
import { parseTimeToMinutes, todayKey, nowMinutes } from "../../dates.js";

export function formatTimeShort(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const am = h < 12;
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, "0")}${am ? "a" : "p"}` : `${hr}${am ? "a" : "p"}`;
}

function sortBlocksByTime(blocks) {
  return [...blocks].sort((a, b) => {
    const am = parseTimeToMinutes(a.time);
    const bm = parseTimeToMinutes(b.time);
    if (am == null && bm == null) return 0;
    if (am == null) return 1;
    if (bm == null) return -1;
    return am - bm;
  });
}

function renderSpine(timeStr) {
  return `
    <div class="schedule-spine" aria-hidden="true">
      <span class="schedule-dot"></span>
      <span class="schedule-time">${escapeHtml(formatTimeShort(timeStr))}</span>
    </div>`;
}

function renderTrackCard(block, ctx) {
  const { state, selectedDate, canEdit, focusId } = ctx;
  const done = isDone(state, selectedDate, block.id);
  const isFocus = focusId && block.id === focusId;
  return `
    <button type="button" class="schedule-card ${done ? "is-done" : ""} ${isFocus ? "is-focus" : ""}" data-action="toggle-block" data-id="${escapeHtml(block.id)}" data-date="${selectedDate}" data-block-id="${escapeHtml(block.id)}" ${canEdit ? "" : "disabled"} aria-pressed="${done}">
      <div class="min-w-0 flex-1 text-left">
        <p class="task-title !min-h-0">${escapeHtml(block.label)}</p>
        ${renderMetaRow("", block.tags, block.soft)}
      </div>
      <span class="check shrink-0 ${done ? "is-done" : ""}" aria-hidden="true">${done ? icon("check", "h-4 w-4") : ""}</span>
    </button>`;
}

function renderEditCard(block, ctx) {
  const { mode, day, date, blocks } = ctx;
  const realIndex = blocks.indexOf(block);
  return `
    <div class="schedule-card schedule-card-edit">
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <p class="task-title !min-h-0">${escapeHtml(block.label)}</p>
          ${renderMetaRow("", block.tags, block.soft)}
          ${block.details ? `<p class="mt-1 text-xs" style="color:var(--text-soft)">${escapeHtml(block.details)}</p>` : ""}
        </div>
        <div class="flex gap-1 shrink-0">
          <button type="button" class="icon-btn" data-action="move-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}" data-dir="-1" aria-label="Move up" ${realIndex === 0 ? "disabled" : ""}>${icon("up", "h-4 w-4")}</button>
          <button type="button" class="icon-btn" data-action="move-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}" data-dir="1" aria-label="Move down" ${realIndex === blocks.length - 1 ? "disabled" : ""}>${icon("down", "h-4 w-4")}</button>
        </div>
      </div>
      <div class="plan-actions">
        <button type="button" class="btn flex-1 !text-xs" data-action="edit-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}">Edit</button>
        <button type="button" class="btn btn-danger !text-xs" data-action="delete-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}">Delete</button>
      </div>
    </div>`;
}

/**
 * Unified spine + card timeline for Track and Edit.
 * @param {object[]} blocks
 * @param {object} ctx - mode: "track" | "edit", plus mode-specific fields
 */
export function renderScheduleTimeline(blocks, ctx = {}) {
  const mode = ctx.mode || "track";
  const onEmpty = ctx.onEmpty || "No blocks for this day.";
  const scrollable = ctx.scrollable !== false;

  if (!blocks?.length) {
    return `<p class="py-4 text-center text-sm" style="color:var(--mute)">${escapeHtml(onEmpty)}</p>`;
  }

  const sorted = sortBlocksByTime(blocks);
  const rows = sorted
    .map((block) => {
      const card = mode === "edit" ? renderEditCard(block, { ...ctx, blocks }) : renderTrackCard(block, ctx);
      return `
        <div class="schedule-row">
          ${renderSpine(block.time)}
          ${card}
        </div>`;
    })
    .join("");

  let nowMarker = "";
  if (mode === "track" && ctx.selectedDate === todayKey()) {
    const now = nowMinutes();
    const idx = sorted.findIndex((b, i) => {
      const start = parseTimeToMinutes(b.time);
      const nextStart = parseTimeToMinutes(sorted[i + 1]?.time);
      if (start == null) return false;
      if (now < start) return i === 0;
      if (nextStart == null) return true;
      return now >= start && now < nextStart;
    });
    if (idx >= 0) {
      nowMarker = `<div class="schedule-now" data-row="${idx}" aria-hidden="true"><span>Now</span></div>`;
    }
  }

  const inner = `
    <div class="schedule-timeline ${mode === "edit" ? "schedule-timeline-edit" : "schedule-timeline-track"}" data-region="block-list">
      ${nowMarker}
      ${rows}
    </div>`;

  if (!scrollable) return inner;

  return `<div class="timeline-scroll scroll-touch">${inner}</div>`;
}
