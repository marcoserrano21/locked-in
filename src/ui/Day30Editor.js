import { escapeHtml, icon } from "./dom.js";

import { BLANK_DAY30 } from "../constants.js";

export { BLANK_DAY30 };

export function renderDay30Editor(state, opts = {}) {
  const embedded = Boolean(opts.embedded);
  const questions = state.day30Questions || [];
  const rows = questions
    .map(
      (q, i) => `
      <div class="plan-row !min-h-[4.5rem]">
        <div class="flex items-start gap-2">
          <span class="chip shrink-0">Q${i + 1}</span>
          <p class="task-title !min-h-0 flex-1">${escapeHtml(q)}</p>
          <div class="flex shrink-0 gap-1">
            <button type="button" class="icon-btn" data-action="day30-move" data-index="${i}" data-dir="-1" aria-label="Move up" ${i === 0 ? "disabled" : ""}>${icon("up", "h-4 w-4")}</button>
            <button type="button" class="icon-btn" data-action="day30-move" data-index="${i}" data-dir="1" aria-label="Move down" ${i === questions.length - 1 ? "disabled" : ""}>${icon("down", "h-4 w-4")}</button>
            <button type="button" class="icon-btn" data-action="day30-delete" data-index="${i}" aria-label="Delete">${icon("trash", "h-4 w-4")}</button>
          </div>
        </div>
      </div>`
    )
    .join("");

  const body = `
      ${embedded ? "" : `<div class="flex items-center justify-between gap-2">
        <p class="eyebrow mb-0">Day 30 review</p>
        <button type="button" class="btn !min-h-11 !text-xs" data-action="set-tab" data-tab="proof">Answer on Proof</button>
      </div>`}
      ${embedded ? `<button type="button" class="btn w-full !min-h-11 !text-xs mb-2" data-action="set-tab" data-tab="proof">Answer on Proof</button>` : ""}
      <div class="space-y-2">${rows || `<p class="text-sm" style="color:var(--mute)">No questions yet.</p>`}</div>
      ${
        questions.length < 12
          ? `<form class="flex gap-2" data-action="day30-add">
              <input class="input flex-1" name="question" placeholder="Add a review question" required />
              <button type="submit" class="btn btn-primary shrink-0 !min-h-tap">Add</button>
            </form>`
          : `<p class="text-xs" style="color:var(--mute)">Max 12 questions.</p>`
      }
  `;

  if (embedded) return `<div class="space-y-2 mt-2">${body}</div>`;

  return `
    <section class="panel space-y-2">
      ${body}
    </section>
  `;
}
