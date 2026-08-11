import { DAY_NAMES, dayType, blocksFor, uid } from "../schedule.js";
import { todayKey, weekDates, formatDisplayDate, formatTimeForInput, snapTimeInputToDisplay } from "../dates.js";
import { resolveBlocksForDate } from "../work.js";
import { escapeHtml, icon } from "./dom.js";
import { normalizeTags, parseTagsFromForm, tagsToFormValue } from "../tags.js";
import { renderWeekGrid } from "./plan/ShiftSheet.js";
import { renderBlockTimeline } from "./plan/BlockTimeline.js";
import { renderDateField } from "./DatePicker.js";

function hourLabel(hh) {
  const n = Number(hh);
  const mer = n >= 12 ? "PM" : "AM";
  const h12 = n % 12 || 12;
  return `${h12} ${mer}`;
}

function quarterHourTimeSelects(timeValue) {
  let hour = "08";
  let minute = "00";
  if (timeValue && /^\d{2}:\d{2}$/.test(timeValue)) {
    hour = timeValue.slice(0, 2);
    const m = timeValue.slice(3);
    minute = ["00", "15", "30", "45"].includes(m) ? m : "00";
  }
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  return `
    <div class="flex gap-2">
      <div class="flex-1">
        <label class="sr-only" for="block-hour">Hour</label>
        <select class="input" id="block-hour" name="hour" required>
          ${hours
            .map((h) => `<option value="${h}" ${h === hour ? "selected" : ""}>${hourLabel(h)}</option>`)
            .join("")}
        </select>
      </div>
      <div class="flex-1">
        <label class="sr-only" for="block-minute">Minutes</label>
        <select class="input" id="block-minute" name="minute" required>
          ${["00", "15", "30", "45"]
            .map((m) => `<option value="${m}" ${m === minute ? "selected" : ""}>:${m}</option>`)
            .join("")}
        </select>
      </div>
    </div>
  `;
}

export function renderPlan(state, ui, opts = {}) {
  const embedded = Boolean(opts.embedded);
  const day = ui.selectedDay;
  const mode = ui.planMode || "date";
  const selectedDate = ui.overrideDate || todayKey();
  const weekOffset = ui.shiftWeekOffset || 0;
  const week = weekDates(todayKey(), weekOffset);

  const pillsHtml = DAY_NAMES.map((name, i) => {
    const t = dayType(i);
    return `<button type="button" class="pill-day snap-start shrink-0 ${t} ${i === day ? "is-active" : ""}" data-action="select-day" data-day="${i}">${name}</button>`;
  }).join("");

  const templateBlocks = blocksFor(state, day);
  const dateBlocks = resolveBlocksForDate(state, selectedDate);
  const blocks = mode === "date" ? dateBlocks : templateBlocks;

  const weekOverrides = week.filter((k) => state.workOverrides?.[k]);
  const overrideSummary =
    weekOverrides.length > 0
      ? weekOverrides
          .map((k) => {
            const ov = state.workOverrides[k];
            return `${formatDisplayDate(k)}: ${ov.type === "work" ? "Work" : "Off"}`;
          })
          .join(" · ")
      : "No overrides this week";

  const body = `
      <div class="segment" role="tablist" aria-label="Plan mode">
        <button type="button" class="segment-btn ${mode === "date" ? "is-active accent" : ""}" id="plan-tab-date" data-action="plan-mode" data-mode="date" role="tab" aria-selected="${mode === "date"}" tabindex="${mode === "date" ? "0" : "-1"}">One day</button>
        <button type="button" class="segment-btn ${mode === "shifts" ? "is-active accent" : ""}" id="plan-tab-shifts" data-action="plan-mode" data-mode="shifts" role="tab" aria-selected="${mode === "shifts"}" tabindex="${mode === "shifts" ? "0" : "-1"}">Shifts</button>
        <button type="button" class="segment-btn ${mode === "template" ? "is-active accent" : ""}" id="plan-tab-template" data-action="plan-mode" data-mode="template" role="tab" aria-selected="${mode === "template"}" tabindex="${mode === "template" ? "0" : "-1"}">Week templates</button>
      </div>

      ${
        mode === "shifts"
          ? `<section class="panel">
              <div class="mb-3 flex items-center justify-between gap-2">
                <p class="eyebrow mb-0">Work week</p>
                <div class="flex gap-1">
                  <button type="button" class="icon-btn" data-action="shift-week" data-dir="-1" aria-label="Previous week">${icon("left", "h-4 w-4")}</button>
                  <button type="button" class="icon-btn" data-action="shift-week" data-dir="1" aria-label="Next week">${icon("right", "h-4 w-4")}</button>
                </div>
              </div>
              <p class="mb-3 text-xs" style="color:var(--mute)">Week of ${formatDisplayDate(week[0])}</p>
              ${renderWeekGrid(week, state, selectedDate)}
              <p class="mt-3 text-xs" style="color:var(--mute)">${escapeHtml(overrideSummary)}</p>
              <button type="button" class="btn btn-primary mt-4 w-full" data-action="open-shift-sheet" data-date="${selectedDate}">Edit ${formatDisplayDate(selectedDate)}</button>
            </section>`
          : ""
      }

      ${
        mode === "date"
          ? `<section class="panel">
              <p class="eyebrow mb-2">Pick a date</p>
              ${renderDateField({
                id: "override-date",
                name: "overrideDate",
                value: selectedDate,
                action: "set-override-date",
              })}
              <div class="mt-3 scroll-touch flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory">${week
                .map((key) => {
                  const dow = new Date(`${key}T12:00:00`).getDay();
                  const active = key === selectedDate;
                  return `<button type="button" class="pill-day ${dayType(dow)} ${active ? "is-active" : ""} snap-start shrink-0" data-action="pick-override-date" data-date="${key}" data-day="${dow}" aria-pressed="${active}">${DAY_NAMES[dow]}</button>`;
                })
                .join("")}</div>
            </section>
            <section class="panel">
              <p class="mb-1 text-sm font-semibold">${formatDisplayDate(selectedDate)}</p>
              ${renderBlockTimeline(blocks, { mode: "date", day, date: selectedDate, openBlockMenuIndex: ui.openBlockMenuIndex })}
              <button type="button" class="btn btn-primary mt-4 w-full gap-2" data-action="add-block" data-mode="date" data-day="${day}" data-date="${selectedDate}">
                ${icon("plus", "h-5 w-5")} Add block
              </button>
            </section>`
          : ""
      }

      ${
        mode === "template"
          ? `<section class="panel">
              <div class="mb-3 scroll-touch flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory">${pillsHtml}</div>
              <p class="mb-3 text-sm font-semibold">${DAY_NAMES[day]} · ${dayType(day) === "foundation" ? "build template" : "work template"}</p>
              ${renderBlockTimeline(blocks, { mode: "template", day, date: selectedDate, openBlockMenuIndex: ui.openBlockMenuIndex, onEmpty: "No blocks. Add one below." })}
              <button type="button" class="btn btn-primary mt-4 w-full gap-2" data-action="add-block" data-mode="template" data-day="${day}" data-date="${selectedDate}">
                ${icon("plus", "h-5 w-5")} Add block
              </button>
              <button type="button" class="btn mt-2 w-full" data-action="update-today-from-template">Update Today</button>
              <p class="mt-2 text-xs" style="color:var(--mute)">Copies today's weekday template onto today's date, then opens Track.</p>
            </section>`
          : ""
      }
  `;

  if (embedded) return `<div class="stack">${body}</div>`;

  return `
    <section class="screen">
      <header class="page-header">
        <p class="eyebrow">Plan</p>
        <h1 class="display">Edit the track</h1>
      </header>
      ${body}
    </section>
  `;
}

export function renderBlockEditorModal(ui) {
  const draft = ui.editingBlock || {
    day: ui.selectedDay,
    date: ui.overrideDate || todayKey(),
    mode: "template",
    index: -1,
    label: "",
    time: "",
    details: "",
    soft: false,
    tags: "",
  };
  const isNew = Number(draft.index) < 0;
  const tags = Array.isArray(draft.tags) ? tagsToFormValue(draft.tags) : draft.tags || "";
  const timeValue = formatTimeForInput(draft.time || "");

  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="${isNew ? "Add block" : "Edit block"}" data-stop>
        <h2 class="display text-3xl">${isNew ? "Add block" : "Edit block"}</h2>
        <form class="mt-4 space-y-3" data-action="save-block">
          <input type="hidden" name="day" value="${draft.day}" />
          <input type="hidden" name="date" value="${draft.date}" />
          <input type="hidden" name="mode" value="${draft.mode || "template"}" />
          <input type="hidden" name="index" value="${draft.index ?? -1}" />
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-label">Title</label>
            <input class="input" id="block-label" name="label" required value="${escapeHtml(draft.label || "")}" />
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-hour">Time</label>
            ${quarterHourTimeSelects(timeValue)}
            <p class="mt-1 text-xs" style="color:var(--mute)">Quarter hours only — :00, :15, :30, :45</p>
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-details">Details</label>
            <textarea class="input min-h-[88px] py-3" id="block-details" name="details">${escapeHtml(draft.details || "")}</textarea>
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-tags">Tags (comma separated)</label>
            <input class="input" id="block-tags" name="tags" value="${escapeHtml(tags)}" placeholder="workout, deep work" />
          </div>
          <label class="flex min-h-tap items-center gap-2 text-sm">
            <input type="checkbox" name="soft" ${draft.soft ? "checked" : ""} />
            Soft target (does not count toward streak)
          </label>
          <button type="submit" class="btn btn-primary w-full">Save block</button>
        </form>
      </div>
    </div>
  `;
}

export function renderEditConfirmModal() {
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" data-stop>
        <p class="eyebrow" style="color:var(--maintain)">Mid-lock edit</p>
        <h2 class="display text-3xl mt-1">Log this change?</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">Edits during an active challenge are saved for Day 30 review.</p>
        <div class="mt-4 flex gap-2">
          <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
          <button type="button" class="btn btn-primary flex-1" data-action="confirm-plan-edit">Continue</button>
        </div>
      </div>
    </div>
  `;
}

export function createBlockFromForm(form) {
  const tags = parseTagsFromForm(form.tags?.value || "");
  const hour = form.hour?.value;
  const minute = form.minute?.value;
  const rawTime =
    hour != null && minute != null && hour !== "" && minute !== ""
      ? `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      : form.time?.value || "";
  const time = snapTimeInputToDisplay(rawTime) || rawTime;
  return {
    id: uid("custom"),
    label: form.label.value.trim(),
    time,
    details: form.details.value.trim(),
    soft: Boolean(form.soft?.checked),
    tags: normalizeTags(tags),
  };
}

export { renderShiftSheet } from "./plan/ShiftSheet.js";
