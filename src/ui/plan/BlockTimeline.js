import { escapeHtml, icon, renderMetaRow } from "../dom.js";
import { parseTimeToMinutes } from "../../dates.js";

function formatTimeShort(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const am = h < 12;
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, "0")}${am ? "a" : "p"}` : `${hr}${am ? "a" : "p"}`;
}

export function renderBlockTimeline(blocks, ctx) {
  const { mode, day, date, onEmpty = "No blocks yet." } = ctx;
  if (!blocks.length) {
    return `<p class="text-sm py-4 text-center" style="color:var(--mute)">${onEmpty}</p>`;
  }

  const sorted = [...blocks].sort((a, b) => {
    const am = parseTimeToMinutes(a.time);
    const bm = parseTimeToMinutes(b.time);
    if (am == null && bm == null) return 0;
    if (am == null) return 1;
    if (bm == null) return -1;
    return am - bm;
  });

  return `
    <div class="block-timeline">
      ${sorted
        .map((b, index) => {
          const realIndex = blocks.indexOf(b);
          return `
          <div class="timeline-row">
            <span class="timeline-time">${escapeHtml(formatTimeShort(b.time))}</span>
            <span class="timeline-dot" aria-hidden="true"></span>
            <div class="plan-row">
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <p class="task-title">${escapeHtml(b.label)}</p>
                  ${renderMetaRow("", b.tags, b.soft)}
                  ${b.details ? `<p class="mt-1 text-xs" style="color:var(--text-soft)">${escapeHtml(b.details)}</p>` : ""}
                </div>
                <div class="flex gap-1">
                  <button type="button" class="icon-btn" data-action="move-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}" data-dir="-1" aria-label="Move up" ${realIndex === 0 ? "disabled" : ""}>${icon("up", "h-4 w-4")}</button>
                  <button type="button" class="icon-btn" data-action="move-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}" data-dir="1" aria-label="Move down" ${realIndex === blocks.length - 1 ? "disabled" : ""}>${icon("down", "h-4 w-4")}</button>
                </div>
              </div>
              <div class="plan-actions">
                <button type="button" class="btn flex-1 !text-xs" data-action="edit-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}">Edit</button>
                <button type="button" class="btn btn-danger !text-xs" data-action="delete-block" data-mode="${mode}" data-day="${day}" data-date="${date}" data-index="${realIndex}">Delete</button>
              </div>
            </div>
          </div>`;
        })
        .join("")}
    </div>
  `;
}
