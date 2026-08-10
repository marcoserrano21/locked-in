import { DAY_NAMES, dayType, blocksFor, uid } from "../schedule.js";
import { todayKey, weekDates, formatDisplayDate } from "../dates.js";
import { resolveBlocksForDate } from "../work.js";
import { escapeHtml, icon, renderMetaRow } from "./dom.js";
import { normalizeTags, parseTagsFromForm, tagsToFormValue, TAG_TONES, PRIORITY_LEVELS } from "../tags.js";
import { renderWeekGrid } from "./plan/ShiftSheet.js";
import { renderBlockTimeline } from "./plan/BlockTimeline.js";

function priorityOptions(selected) {
  const sel = selected || "";
  return PRIORITY_LEVELS.map(
    (p) => `<option value="${p.value}" ${sel === p.value ? "selected" : ""}>${p.label}</option>`
  ).join("");
}

function toneOptions(selected) {
  return [
    `<option value="" ${!selected ? "selected" : ""}>None</option>`,
    ...TAG_TONES.map(
      (t) => `<option value="${t}" ${selected === t ? "selected" : ""}>${t}</option>`
    ),
  ].join("");
}

export function renderPlan(state, ui, opts = {}) {
  const embedded = Boolean(opts.embedded);
  const day = ui.selectedDay;
  const mode = ui.planMode || "template";
  const activeChallenge = state.challenge?.status === "active";
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

  const birthdays = (state.events || []).filter((e) => e.type === "birthday");

  const body = `
      ${
        embedded
          ? `<p class="text-sm" style="color:var(--mute)">
              ${activeChallenge ? "Mid-lock edits are allowed, but logged for Day 30." : "Structure is a tool. Do not rewrite it to dodge the hard block."}
            </p>`
          : ""
      }

      <div class="segment">
        <button type="button" class="segment-btn ${mode === "template" ? "is-active accent" : ""}" data-action="plan-mode" data-mode="template">Week templates</button>
        <button type="button" class="segment-btn ${mode === "shifts" ? "is-active accent" : ""}" data-action="plan-mode" data-mode="shifts">Shifts</button>
        <button type="button" class="segment-btn ${mode === "date" ? "is-active accent" : ""}" data-action="plan-mode" data-mode="date">One day</button>
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
              <input class="input" type="date" value="${selectedDate}" data-action="set-override-date" />
              <div class="mt-3 scroll-touch flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory">${week
                .map((key) => {
                  const dow = new Date(`${key}T12:00:00`).getDay();
                  const active = key === selectedDate;
                  return `<button type="button" class="pill-day ${dayType(dow)} ${active ? "is-active" : ""} snap-start shrink-0" data-action="pick-shift-day" data-date="${key}">${DAY_NAMES[dow]}</button>`;
                })
                .join("")}</div>
            </section>
            <section class="panel">
              <p class="mb-1 text-sm font-semibold">${formatDisplayDate(selectedDate)}</p>
              ${renderBlockTimeline(blocks, { mode: "date", day, date: selectedDate })}
              <button type="button" class="btn btn-primary mt-4 w-full gap-2" data-action="add-block" data-mode="date" data-day="${day}" data-date="${selectedDate}">
                ${icon("plus", "h-5 w-5")} Add block
              </button>
              ${
                birthdays.length
                  ? `<div class="mt-4 flex flex-wrap gap-1">${birthdays
                      .map((e) => `<span class="chip chip-soft">${escapeHtml(e.title)} · ${formatDisplayDate(e.date)}</span>`)
                      .join("")}</div>`
                  : ""
              }
              <button type="button" class="btn mt-2 w-full !text-xs" data-action="add-event">Add birthday</button>
            </section>`
          : ""
      }

      ${
        mode === "template"
          ? `<section class="panel">
              <div class="mb-3 scroll-touch flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory">${pillsHtml}</div>
              <p class="mb-3 text-sm font-semibold">${DAY_NAMES[day]} · ${dayType(day) === "foundation" ? "build template" : "work template"}</p>
              ${renderBlockTimeline(blocks, { mode: "template", day, date: selectedDate, onEmpty: "No blocks. Add one below." })}
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

  return `
    <div class="modal-backdrop" data-action="close-modal">
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
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-time">Time</label>
            <input class="input" id="block-time" name="time" type="time" value="${escapeHtml(draft.time || "")}" />
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

export function renderEventEditorModal(ui) {
  const draft = ui.editingEvent || { id: "", title: "", date: todayKey(), recurYearly: true };
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet" role="dialog" aria-modal="true" data-stop>
        <h2 class="display text-3xl">${draft.id ? "Edit birthday" : "Add birthday"}</h2>
        <form class="mt-4 space-y-3" data-action="save-event">
          <input type="hidden" name="id" value="${escapeHtml(draft.id || "")}" />
          <input class="input" name="title" required placeholder="Name" value="${escapeHtml(draft.title || "")}" />
          <input class="input" name="date" type="date" required value="${escapeHtml(draft.date || todayKey())}" />
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="recurYearly" ${draft.recurYearly !== false ? "checked" : ""} /> Repeats yearly</label>
          <button type="submit" class="btn btn-primary w-full">Save</button>
        </form>
      </div>
    </div>
  `;
}

export function renderEditConfirmModal() {
  return `
    <div class="modal-backdrop" data-action="close-modal">
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
  return {
    id: uid("custom"),
    label: form.label.value.trim(),
    time: form.time.value,
    details: form.details.value.trim(),
    soft: Boolean(form.soft?.checked),
    tags: normalizeTags(tags),
  };
}

export { renderShiftSheet } from "./plan/ShiftSheet.js";
