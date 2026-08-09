import { DAY_NAMES, dayType, blocksFor, uid } from "../schedule.js";
import { todayKey, weekDates, formatDisplayDate, parseTimeRange, formatTimeRange } from "../dates.js";
import { resolveBlocksForDate } from "../work.js";
import { escapeHtml, icon, renderMetaRow } from "./dom.js";
import { normalizeTags, parseTagsFromForm, tagsToFormValue, TAG_TONES, PRIORITY_LEVELS } from "../tags.js";

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

  const pills = DAY_NAMES.map((name, i) => {
    const t = dayType(i);
    return `<button type="button" class="pill-day ${t} ${i === day ? "is-active" : ""}" data-action="select-day" data-day="${i}">${name}</button>`;
  }).join("");

  const templateBlocks = blocksFor(state, day);
  const dateBlocks = resolveBlocksForDate(state, selectedDate);
  const blocks = mode === "date" ? dateBlocks : templateBlocks;

  const rows = blocks
    .map(
      (b, index) => `
      <div class="plan-row">
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <p class="task-title">${escapeHtml(b.label)}</p>
            ${renderMetaRow(b.time, b.tags, b.soft)}
          </div>
          <div class="flex gap-1">
            <button type="button" class="icon-btn" data-action="move-block" data-mode="${mode}" data-day="${day}" data-date="${selectedDate}" data-index="${index}" data-dir="-1" aria-label="Move up" ${index === 0 ? "disabled" : ""}>${icon("up", "h-4 w-4")}</button>
            <button type="button" class="icon-btn" data-action="move-block" data-mode="${mode}" data-day="${day}" data-date="${selectedDate}" data-index="${index}" data-dir="1" aria-label="Move down" ${index === blocks.length - 1 ? "disabled" : ""}>${icon("down", "h-4 w-4")}</button>
          </div>
        </div>
        <div class="plan-actions">
          <button type="button" class="btn flex-1 !text-xs" data-action="edit-block" data-mode="${mode}" data-day="${day}" data-date="${selectedDate}" data-index="${index}">Edit</button>
          <button type="button" class="btn btn-danger !text-xs" data-action="delete-block" data-mode="${mode}" data-day="${day}" data-date="${selectedDate}" data-index="${index}">Delete</button>
        </div>
      </div>`
    )
    .join("");

  const weekStrip = week
    .map((key) => {
      const dow = new Date(`${key}T12:00:00`).getDay();
      const ov = state.workOverrides?.[key];
      const status = ov?.type === "work" ? "Work" : ov?.type === "off" ? "Off" : "Tmpl";
      const active = key === selectedDate;
      return `
        <button type="button" class="rounded-2xl px-2 py-3 text-center" style="background:${active ? "var(--build)" : "var(--bg-elev)"};color:${active ? "var(--build-ink)" : "var(--text)"};min-width:3.35rem" data-action="pick-shift-day" data-date="${key}">
          <div class="text-[10px] font-semibold">${DAY_NAMES[dow]}</div>
          <div class="text-[11px] mt-1">${formatDisplayDate(key)}</div>
          <div class="text-[10px] mt-1 font-bold">${status}</div>
        </button>`;
    })
    .join("");

  const overrides = Object.entries(state.workOverrides || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 21)
    .map(
      ([date, ov]) => `
      <div class="plan-row !min-h-[5.5rem]">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="task-title !min-h-0">${formatDisplayDate(date)}</p>
            <p class="task-meta">${ov.type === "work" ? `Work ${ov.start || ""} to ${ov.end || ""}` : "Off"}${ov.note ? ` - ${escapeHtml(ov.note)}` : ""}</p>
          </div>
          <button type="button" class="btn !min-h-11 !text-xs" data-action="clear-override" data-date="${date}">Clear</button>
        </div>
      </div>`
    )
    .join("");

  const birthdays = (state.events || [])
    .filter((e) => e.type === "birthday")
    .map(
      (e) => `
      <div class="plan-row !min-h-[5.5rem]">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="task-title !min-h-0">${escapeHtml(e.title)}</p>
            <div class="task-meta">
              <span class="chip chip-soft">${formatDisplayDate(e.date)}</span>
              ${e.recurYearly ? '<span class="chip">yearly</span>' : ""}
            </div>
          </div>
          <div class="flex gap-1">
            <button type="button" class="btn !min-h-11 !text-xs" data-action="edit-event" data-id="${escapeHtml(e.id)}">Edit</button>
            <button type="button" class="btn btn-danger !min-h-11 !text-xs" data-action="delete-event" data-id="${escapeHtml(e.id)}">Delete</button>
          </div>
        </div>
      </div>`
    )
    .join("");

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
              <p class="eyebrow mb-3">Work overrides</p>
              <div class="mb-3 flex items-center justify-between gap-2">
                <button type="button" class="icon-btn" data-action="shift-week" data-dir="-1" aria-label="Previous week">${icon("left", "h-4 w-4")}</button>
                <p class="text-xs font-semibold" style="color:var(--mute)">Week of ${formatDisplayDate(week[0])}</p>
                <button type="button" class="icon-btn" data-action="shift-week" data-dir="1" aria-label="Next week">${icon("right", "h-4 w-4")}</button>
              </div>
              <div class="mb-4 flex gap-1.5 overflow-x-auto pb-1">${weekStrip}</div>
              <form class="space-y-2" data-action="override-form">
                <input class="input" type="date" name="date" value="${selectedDate}" required />
                <select class="input" name="type" aria-label="Override type">
                  <option value="work">Work shift</option>
                  <option value="off">Day off</option>
                </select>
                <div class="flex gap-2">
                  <input class="input" name="start" placeholder="Start (10:00 AM)" />
                  <input class="input" name="end" placeholder="End (6:30 PM)" />
                </div>
                <input class="input" name="note" placeholder="Note (optional)" />
                <button class="btn btn-primary w-full" type="submit">Save override</button>
              </form>
              <div class="mt-4 space-y-2">${overrides || `<p class="text-sm" style="color:var(--mute)">No overrides yet.</p>`}</div>
            </section>`
          : ""
      }

      ${
        mode === "date"
          ? `<section class="panel">
              <p class="eyebrow mb-2">Edit a specific date</p>
              <input class="input" type="date" value="${selectedDate}" data-action="set-override-date" />
            </section>
            <section class="panel">
              <p class="mb-3 text-sm font-semibold">${formatDisplayDate(selectedDate)}</p>
              <div class="space-y-2">${rows || `<p class="text-sm" style="color:var(--mute)">No blocks. Add one.</p>`}</div>
              <button type="button" class="btn btn-primary mt-4 w-full gap-2" data-action="add-block" data-mode="date" data-day="${day}" data-date="${selectedDate}">
                ${icon("plus", "h-5 w-5")} Add block
              </button>
            </section>
            <section class="panel">
              <div class="mb-3 flex items-center justify-between gap-2">
                <p class="eyebrow mb-0">Birthdays</p>
                <button type="button" class="btn !min-h-11 !text-xs" data-action="add-event">Add</button>
              </div>
              <div class="space-y-2">${birthdays || `<p class="text-sm" style="color:var(--mute)">No birthdays yet.</p>`}</div>
            </section>`
          : ""
      }

      ${
        mode === "template"
          ? `<section class="panel">
              <div class="mb-3 flex gap-1.5">${pills}</div>
              <p class="mb-3 text-sm font-semibold">${DAY_NAMES[day]} · ${dayType(day) === "foundation" ? "build template" : "work template"}</p>
              <div class="space-y-2">${rows || `<p class="text-sm" style="color:var(--mute)">No blocks. Add one.</p>`}</div>
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
        <p class="mt-2 text-sm" style="color:var(--mute)">
          ${activeChallenge ? "Mid-lock edits are allowed, but logged for Day 30." : "Structure is a tool. Do not rewrite it to dodge the hard block."}
        </p>
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
    tags: [],
  };
  const tags = normalizeTags(
    Array.isArray(draft.tags)
      ? draft.tags
      : String(draft.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
    draft.soft
  );
  const isNew = draft.index < 0;
  const range = parseTimeRange(draft.time || "");
  const priority = tags[0]?.tone || "";
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="${isNew ? "Add block" : "Edit block"}" data-stop>
        <h2 class="display text-3xl">${isNew ? "Add block" : "Edit block"}</h2>
        <form class="mt-4 space-y-3" data-action="save-block">
          <input type="hidden" name="day" value="${draft.day}" />
          <input type="hidden" name="date" value="${draft.date || ""}" />
          <input type="hidden" name="mode" value="${draft.mode || "template"}" />
          <input type="hidden" name="index" value="${draft.index}" />
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-label">Title</label>
            <input class="input" id="block-label" name="label" required value="${escapeHtml(draft.label)}" />
          </div>
          <div>
            <p class="mb-1 text-xs" style="color:var(--mute)">Time range</p>
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="mb-1 block text-[11px]" style="color:var(--mute)" for="block-time-start">Start</label>
                <input class="input" id="block-time-start" name="timeStart" type="time" value="${escapeHtml(range.start)}" />
              </div>
              <div class="flex-1">
                <label class="mb-1 block text-[11px]" style="color:var(--mute)" for="block-time-end">End</label>
                <input class="input" id="block-time-end" name="timeEnd" type="time" value="${escapeHtml(range.end)}" />
              </div>
            </div>
            <label class="mb-1 mt-2 block text-[11px]" style="color:var(--mute)" for="block-time-free">Or free text (optional)</label>
            <input class="input" id="block-time-free" name="timeFree" placeholder="e.g. 1-2x / month" value="${escapeHtml(range.freeText)}" />
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-details">Details</label>
            <textarea class="input min-h-[88px] py-3" id="block-details" name="details" placeholder="Context, rules, reminders">${escapeHtml(draft.details || "")}</textarea>
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="block-tags">Tags (optional, max 2, comma separated)</label>
            <input class="input" id="block-tags" name="tags" placeholder="work-day, soft" value="${escapeHtml(tagsToFormValue(tags))}" />
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="mb-1 block text-xs" style="color:var(--mute)" for="tone1">Priority (optional)</label>
              <select class="input" id="tone1" name="tone1" aria-label="Priority level">${priorityOptions(priority)}</select>
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-xs" style="color:var(--mute)" for="tone2">Tag 2 tone (optional)</label>
              <select class="input" id="tone2" name="tone2" aria-label="Second tag tone">${toneOptions(tags[1]?.tone || "")}</select>
            </div>
          </div>
          <label class="flex min-h-tap items-center gap-2 text-sm">
            <input type="checkbox" name="soft" ${draft.soft ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--maintain)" />
            Soft target (does not count toward streak)
          </label>
          <div class="flex gap-2 pt-2">
            <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderEventEditorModal(ui) {
  const draft = ui.editingEvent || { id: "", title: "", date: todayKey(), recurYearly: true };
  const isNew = !draft.id;
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="${isNew ? "Add birthday" : "Edit birthday"}" data-stop>
        <h2 class="display text-3xl">${isNew ? "Add birthday" : "Edit birthday"}</h2>
        <form class="mt-4 space-y-3" data-action="save-event">
          <input type="hidden" name="id" value="${escapeHtml(draft.id || "")}" />
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="event-title">Title</label>
            <input class="input" id="event-title" name="title" required value="${escapeHtml(draft.title || "")}" />
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="event-date">Date</label>
            <input class="input" id="event-date" type="date" name="date" required value="${escapeHtml(draft.date || todayKey())}" />
          </div>
          <label class="flex min-h-tap items-center gap-2 text-sm">
            <input type="checkbox" name="recurYearly" ${draft.recurYearly !== false ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--build)" />
            Repeat yearly
          </label>
          <div class="flex gap-2 pt-2">
            <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderEditConfirmModal() {
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Confirm plan edit" data-stop>
        <h2 class="display text-3xl">Editing mid-lock</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">Editing the plan mid-lock. This gets logged for Day 30.</p>
        <div class="mt-4 flex gap-2">
          <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
          <button type="button" class="btn btn-primary flex-1" data-action="confirm-plan-edit">Continue</button>
        </div>
      </div>
    </div>
  `;
}

export function createBlockFromForm(form) {
  const soft = Boolean(form.soft?.checked);
  const tone1 = form.tone1?.value || "neutral";
  const tone2 = form.tone2?.value || "neutral";
  const tags = parseTagsFromForm(form.tags.value, soft, tone1, tone2);
  const softFinal = soft || tags.some((t) => t.label.toLowerCase() === "soft");
  const time = formatTimeRange(form.timeStart?.value, form.timeEnd?.value, form.timeFree?.value);
  return {
    id: uid("custom"),
    label: form.label.value.trim(),
    time,
    details: form.details.value.trim(),
    soft: softFinal,
    tags,
  };
}
