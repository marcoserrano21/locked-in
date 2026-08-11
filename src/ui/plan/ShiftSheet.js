import { DAY_NAMES } from "../../schedule.js";
import { formatDisplayDate } from "../../dates.js";
import { escapeHtml } from "../dom.js";

export function renderWeekGrid(week, state, selectedDate) {
  return `
    <div class="week-grid" role="group" aria-label="Week schedule">
      ${week
        .map((key) => {
          const dow = new Date(`${key}T12:00:00`).getDay();
          const ov = state.workOverrides?.[key];
          const status = ov?.type === "work" ? "Work" : ov?.type === "off" ? "Off" : "Tmpl";
          const cls = ov?.type === "work" ? "is-work" : ov?.type === "off" ? "is-off" : "is-template";
          const active = key === selectedDate;
          return `
            <button type="button" class="week-grid-cell ${cls} ${active ? "is-active" : ""}" data-action="pick-shift-day" data-date="${key}" aria-pressed="${active}">
              <div class="text-[10px] font-semibold">${DAY_NAMES[dow]}</div>
              <div class="text-[10px] mt-1 opacity-80">${formatDisplayDate(key).slice(0, 5)}</div>
              <div class="text-[10px] mt-1 font-bold">${status}</div>
            </button>`;
        })
        .join("")}
    </div>
  `;
}

export function renderShiftSheet(ui, state) {
  const date = ui.shiftSheetDate || ui.overrideDate || "";
  const ov = state.workOverrides?.[date];
  const type = ui.shiftSheetType || ov?.type || "work";
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Edit shift" data-stop>
        <h2 class="display text-3xl">${formatDisplayDate(date)}</h2>
        <p class="mt-1 text-sm" style="color:var(--mute)">Tap a type, set hours, save.</p>
        <form class="mt-4 space-y-3" data-action="override-form">
          <input type="hidden" name="date" value="${escapeHtml(date)}" />
          <div class="segment">
            <button type="button" class="segment-btn ${type === "work" ? "is-active accent" : ""}" data-action="shift-type-pick" data-type="work">Work</button>
            <button type="button" class="segment-btn ${type === "off" ? "is-active accent" : ""}" data-action="shift-type-pick" data-type="off">Off</button>
          </div>
          <input type="hidden" name="type" id="shift-type" value="${type}" />
          <div class="flex gap-2">
            <input class="input" name="start" placeholder="Start (10:00 AM)" value="${escapeHtml(ov?.start || "")}" />
            <input class="input" name="end" placeholder="End (6:30 PM)" value="${escapeHtml(ov?.end || "")}" />
          </div>
          <input class="input" name="note" placeholder="Note (optional)" value="${escapeHtml(ov?.note || "")}" />
          <div class="flex gap-2 pt-1">
            <button type="button" class="btn flex-1" data-action="clear-override" data-date="${escapeHtml(date)}">Reset</button>
            <button type="submit" class="btn btn-primary flex-1">Save</button>
          </div>
        </form>
        <button type="button" class="btn w-full mt-2" data-action="close-modal">Close</button>
      </div>
    </div>
  `;
}
