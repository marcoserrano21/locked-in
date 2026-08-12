import { escapeHtml, icon, renderMetaRow } from "../dom.js";
import { parseTimeToMinutes, todayKey, nowMinutes } from "../../dates.js";
import { isDone } from "../../streaks.js";

export function formatTimeShort(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins == null) return "-";
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
      <span class="schedule-time">${escapeHtml(formatTimeShort(timeStr))}</span>
      <span class="schedule-dot"></span>
    </div>`;
}

function renderTrackCard(block, ctx) {
  const { state, selectedDate, canEdit, focusId } = ctx;
  const done = isDone(state, selectedDate, block.id);
  const isFocus = focusId && block.id === focusId;
  return `
    <div class="schedule-card ${done ? "is-done" : ""} ${isFocus ? "is-focus" : ""}" data-block-id="${escapeHtml(block.id)}">
      <div class="min-w-0 flex-1 text-left">
        <p class="task-title !min-h-0">${escapeHtml(block.label)}</p>
        ${renderMetaRow("", block.tags, block.soft)}
      </div>
    </div>`;
}

function renderEditCard(block, ctx) {
  const planMode = ctx.planMode || ctx.mode || "template";
  const { day, date, blocks, openBlockMenuIndex } = ctx;
  const realIndex = blocks.indexOf(block);
  const menuOpen = openBlockMenuIndex != null && Number(openBlockMenuIndex) === realIndex;
  return `
    <div class="schedule-card schedule-card-edit">
      <p class="task-title !min-h-0">${escapeHtml(block.label)}</p>
      ${renderMetaRow("", block.tags, block.soft)}
      ${block.details ? `<p class="mt-1 text-xs" style="color:var(--text-soft)">${escapeHtml(block.details)}</p>` : ""}
      <div class="plan-actions schedule-edit-actions">
        <div class="flex gap-1 shrink-0">
          <button type="button" class="icon-btn icon-btn-sm" data-action="move-block" data-mode="${planMode}" data-day="${day}" data-date="${date}" data-index="${realIndex}" data-dir="-1" aria-label="Move up" ${realIndex === 0 ? "disabled" : ""}>${icon("up", "h-3.5 w-3.5")}</button>
          <button type="button" class="icon-btn icon-btn-sm" data-action="move-block" data-mode="${planMode}" data-day="${day}" data-date="${date}" data-index="${realIndex}" data-dir="1" aria-label="Move down" ${realIndex === blocks.length - 1 ? "disabled" : ""}>${icon("down", "h-3.5 w-3.5")}</button>
        </div>
        <div class="relative ml-auto">
          <button type="button" class="icon-btn icon-btn-sm" data-action="toggle-block-menu" data-index="${realIndex}" aria-expanded="${menuOpen}" aria-label="Block options">${icon("more", "h-3.5 w-3.5")}</button>
          ${
            menuOpen
              ? `<div class="fitness-session-menu" role="menu">
            <button type="button" role="menuitem" data-action="edit-block" data-mode="${planMode}" data-day="${day}" data-date="${date}" data-index="${realIndex}">Edit</button>
            <button type="button" role="menuitem" class="text-danger" data-action="delete-block" data-mode="${planMode}" data-day="${day}" data-date="${date}" data-index="${realIndex}">Delete</button>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>`;
}

/**
 * Unified spine + card timeline for Track and Edit.
 * @param {object[]} blocks
 * @param {object} ctx - mode: "track" | "edit" (UI variant); planMode: "template" | "date" for plan actions
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
