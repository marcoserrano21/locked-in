import playbookSeed from "../../content/freelance.playbook.json";
import { mergePlaybookFor } from "../hustle-playbook.js";
import { formatDisplayDate, todayKey } from "../dates.js";
import { escapeHtml, icon } from "./dom.js";
import { renderDateField } from "./DatePicker.js";
import { renderFitness } from "./Fitness.js";
import { paginate, renderPager } from "./Pagination.js";

const STATUSES = ["sent", "replied", "call", "won", "lost"];
const HUSTLE_TABS = [
  { id: "flow", label: "Flow" },
  { id: "ramp", label: "Ramp" },
  { id: "scripts", label: "Scripts" },
  { id: "log", label: "Log" },
];

const VIEW_TABS = [
  { id: "fitness", label: "Fitness" },
  { id: "hustle", label: "Hustle" },
];

const SCRIPT_KEYS = [
  { key: "warmDm", label: "Warm DM" },
  { key: "contraHeadline", label: "Contra headline" },
  { key: "socialPost", label: "Social post" },
  { key: "discoveryOpener", label: "Discovery opener" },
];

function weekKeys() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
}

function progressRail(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `
    <div>
      <div class="mb-1 flex justify-between text-[11px]">
        <span style="color:var(--mute)">${escapeHtml(label)}</span>
        <span style="color:var(--text-soft)">${done}/${total}</span>
      </div>
      <div class="day-rail"><div class="day-rail-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

function renderHustlePanel(state, ui) {
  const playbook = mergePlaybookFor(state);
  // No niche yet means a blank playbook (guests start empty). Don't render
  // the stats and panels around nothing — point at the editor instead.
  if (!playbook.niche?.trim()) {
    return `
    <section class="panel space-y-3">
      <p class="eyebrow">Command center</p>
      <p class="text-sm font-semibold">Set your niche to start the Hustle loop</p>
      <p class="text-sm" style="color:var(--mute)">Pick a niche, then add your weekly flow, ramp, and scripts. Nothing here is pre-filled.</p>
      <button type="button" class="btn btn-primary w-full" data-action="open-hustle-editor">Set your niche</button>
    </section>
  `;
  }
  const log = state.outreachLog || [];
  const checks = state.hustleChecks || {};
  const tab = ui.hustleTab || "flow";
  const settings = state.settings || {};
  const keysThisWeek = weekKeys();
  const thisWeek = log.filter((e) => keysThisWeek.includes(e.date));
  const sent = thisWeek.length;
  const replies = thisWeek.filter((e) => ["replied", "call", "won"].includes(e.status)).length;
  const won = log.filter((e) => e.status === "won").length;
  const flowDone = playbook.weeklyFlow.filter((f) => checks[f.id]).length;
  const rampDone = playbook.ramp.filter((w) => checks[w.id]).length;
  const portfolio = settings.portfolioUrl || playbook.proofPrimary.links.portfolio;
  const linkedin = settings.linkedinUrl || playbook.proofPrimary.links.linkedin;

  const tabBar = `
    <div class="segment" role="tablist" aria-label="Hustle sections">
      ${HUSTLE_TABS.map(
        (t) =>
          `<button type="button" class="segment-btn ${tab === t.id ? "is-active accent" : ""}" data-action="hustle-tab" data-tab="${t.id}" role="tab" aria-selected="${tab === t.id}">${t.label}</button>`
      ).join("")}
    </div>
  `;

  let panel = "";

  if (tab === "flow") {
    const flow = playbook.weeklyFlow
      .map(
        (f) => `
        <button type="button" class="plan-row !min-h-[5.75rem] w-full text-left" data-action="toggle-hustle" data-id="${escapeHtml(f.id)}">
          <div class="flex items-start gap-3">
            <span class="check ${checks[f.id] ? "is-done" : ""}" aria-hidden="true">${checks[f.id] ? icon("check", "h-4 w-4") : ""}</span>
            <div class="min-w-0">
              <p class="task-title !min-h-0">${escapeHtml(f.label)}</p>
              <p class="task-meta">${escapeHtml(f.detail)}</p>
            </div>
          </div>
        </button>`
      )
      .join("");
    panel = `
      <section class="panel">
        <div class="mb-3 flex items-center justify-between gap-2">
          <p class="eyebrow mb-0">Weekly flow</p>
          <span class="text-xs" style="color:var(--mute)">${flowDone}/${playbook.weeklyFlow.length}</span>
        </div>
        <p class="mb-3 text-xs" style="color:var(--mute)">${escapeHtml(playbook.moneyBlock)}</p>
        <div class="space-y-2">${flow}</div>
      </section>`;
  } else if (tab === "ramp") {
    const ramp = playbook.ramp
      .map(
        (w) => `
        <div class="rounded-2xl px-3 py-3" style="background:var(--bg-elev)">
          <div class="flex items-center justify-between gap-2 mb-2">
            <p class="text-sm font-semibold">${escapeHtml(w.label)}</p>
            <button type="button" class="btn !min-h-10 !text-xs ${checks[w.id] ? "btn-primary" : ""}" data-action="toggle-hustle" data-id="${escapeHtml(w.id)}">${checks[w.id] ? "done" : "mark"}</button>
          </div>
          <ul class="space-y-1 text-sm" style="color:var(--text-soft)">
            ${w.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>`
      )
      .join("");
    panel = `
      <section class="panel space-y-2">
        <div class="mb-1 flex items-center justify-between gap-2">
          <p class="eyebrow mb-0">4-week ramp</p>
          <span class="text-xs" style="color:var(--mute)">${rampDone}/${playbook.ramp.length}</span>
        </div>
        ${ramp}
      </section>`;
  } else if (tab === "scripts") {
    panel = `
      <section class="panel space-y-3">
        <p class="eyebrow">Scripts</p>
        ${SCRIPT_KEYS.map(
          (s) => `
          <div class="rounded-2xl px-3 py-3" style="background:var(--bg-elev)">
            <div class="mb-2 flex items-center justify-between gap-2">
              <p class="text-xs font-semibold" style="color:var(--mute)">${escapeHtml(s.label)}</p>
              <button type="button" class="icon-btn !h-10 !w-10 !min-h-10 !min-w-10" data-action="copy-script" data-script="${escapeHtml(s.key)}" aria-label="Copy ${escapeHtml(s.label)}">${icon("copy", "h-4 w-4")}</button>
            </div>
            <p class="text-sm" style="color:var(--text-soft)">${escapeHtml(playbook.scripts[s.key])}</p>
          </div>`
        ).join("")}
        <p class="text-xs" style="color:var(--mute)">${playbook.channels.map((c) => escapeHtml(c)).join(" · ")}</p>
      </section>`;
  } else {
    const { items: pageRows, page, totalPages } = paginate(log, ui.hustleLogPage || 0);
    const rows = pageRows
      .map(
        (e) => `
        <div class="plan-row !min-h-[5.75rem]">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="task-title">${escapeHtml(e.who)}</p>
              <div class="task-meta">
                <span>${formatDisplayDate(e.date)}</span>
                <span>${escapeHtml(e.channel || "dm")}</span>
                <span>${escapeHtml(e.status)}</span>
              </div>
              ${e.note ? `<p class="mt-1 text-xs" style="color:var(--text-soft)">${escapeHtml(e.note)}</p>` : ""}
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="icon-btn" data-action="edit-outreach" data-id="${escapeHtml(e.id)}" aria-label="Edit">${icon("edit", "h-4 w-4")}</button>
              <button type="button" class="icon-btn" data-action="delete-outreach" data-id="${escapeHtml(e.id)}" aria-label="Delete">${icon("trash", "h-4 w-4")}</button>
            </div>
          </div>
          <div class="segment mt-2">
            ${STATUSES.map(
              (s) =>
                `<button type="button" class="segment-btn ${e.status === s ? "is-active accent" : ""}" data-action="set-outreach-status" data-id="${escapeHtml(e.id)}" data-status="${s}">${s}</button>`
            ).join("")}
          </div>
        </div>`
      )
      .join("");
    panel = `
      <section class="panel">
        <div class="mb-3 flex items-center justify-between gap-2">
          <p class="eyebrow mb-0">Pipeline</p>
          <button type="button" class="btn btn-primary gap-2 !min-h-11" data-action="add-outreach">
            ${icon("plus", "h-4 w-4")} Add log
          </button>
        </div>
        ${rows ? `<div class="plan-row-stack">${rows}</div>` : `<div class="py-4 text-center">
          <p class="text-sm" style="color:var(--mute)">Monday money block is empty = no outreach = no clients.</p>
          <button type="button" class="btn btn-primary mt-3 w-full" data-action="add-outreach">Log first touch</button>
        </div>`}
        ${renderPager(page, totalPages, "hustle")}
      </section>`;
  }

  return `
    <div class="mb-3 flex justify-end">
      <button type="button" class="btn !min-h-11 !text-xs" data-action="open-hustle-editor">Edit command center</button>
    </div>
    <section class="panel space-y-3">
      <div class="grid grid-cols-3 gap-3">
        <div>
          <p class="text-xs" style="color:var(--mute)">this week</p>
          <p class="display text-3xl" style="color:var(--build)">${sent}</p>
        </div>
        <div>
          <p class="text-xs" style="color:var(--mute)">replies+</p>
          <p class="display text-3xl">${replies}</p>
        </div>
        <div>
          <p class="text-xs" style="color:var(--mute)">won</p>
          <p class="display text-3xl">${won}</p>
        </div>
      </div>
      ${progressRail(flowDone, playbook.weeklyFlow.length, "Weekly flow")}
      ${progressRail(rampDone, playbook.ramp.length, "4-week ramp")}
    </section>

    <section class="panel-quiet">
      <p class="eyebrow mb-1">Brief</p>
      <p class="text-sm font-semibold">${escapeHtml(playbook.niche)}</p>
      <p class="mt-1 text-sm" style="color:var(--text-soft)">${escapeHtml(playbook.proofPrimary.line)}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <a class="btn !min-h-11 !text-xs" href="${escapeHtml(portfolio)}" target="_blank" rel="noopener">Portfolio</a>
        <a class="btn !min-h-11 !text-xs" href="${escapeHtml(linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </section>

    ${tabBar}
    ${panel}
  `;
}

export function renderFreelance(state, ui) {
  const focus = state.settings?.welcomeFocus;
  const fallbackView = focus === "schedule" ? "hustle" : "fitness";
  const view = ui.hustleView || fallbackView;
  const title = view === "fitness" ? "Growth" : "Command center";
  const subtitle = view === "fitness" ? "Fitness tracker" : "Hustle";

  // Both views are always reachable. The Hustle panel used to hide behind a
  // premium flag, so schedule-focus users tapped "Hustle" and got a workout log.
  const viewToggle = `
    <div class="segment mb-3" role="tablist" aria-label="Growth views">
      ${VIEW_TABS.map(
        (t) =>
          `<button type="button" class="segment-btn ${view === t.id ? "is-active accent" : ""}" data-action="hustle-view" data-view="${t.id}" role="tab" aria-selected="${view === t.id}">${t.label}</button>`
      ).join("")}
    </div>
  `;

  const body = view === "fitness" ? renderFitness(state, ui) : renderHustlePanel(state, ui);

  return `
    <section class="screen">
      <header class="page-header">
        <p class="eyebrow">${escapeHtml(subtitle)}</p>
        <h1 class="display">${escapeHtml(title)}</h1>
      </header>
      ${viewToggle}
      ${body}
    </section>
  `;
}

export { playbookSeed as hustlePlaybook };

export function renderOutreachEditorModal(ui) {
  const draft = ui.editingOutreach || {
    id: "",
    date: todayKey(),
    who: "",
    channel: "dm",
    status: "sent",
    note: "",
  };
  const isNew = !draft.id;
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="${isNew ? "Add outreach" : "Edit outreach"}" data-stop>
        <h2 class="display text-3xl">${isNew ? "Add log" : "Edit log"}</h2>
        <form class="mt-4 space-y-3" data-action="save-outreach">
          <input type="hidden" name="id" value="${escapeHtml(draft.id || "")}" />
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="out-who">Who</label>
            <input class="input" id="out-who" name="who" required placeholder="Name / business" value="${escapeHtml(draft.who || "")}" />
          </div>
          ${renderDateField({
            id: "out-date",
            name: "date",
            value: draft.date || todayKey(),
            required: true,
            label: "Date",
          })}
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="mb-1 block text-xs" style="color:var(--mute)" for="out-channel">Channel</label>
              <input class="input" id="out-channel" name="channel" placeholder="IG, Contra..." value="${escapeHtml(draft.channel || "")}" />
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-xs" style="color:var(--mute)" for="out-status">Status</label>
              <select class="input" id="out-status" name="status" aria-label="Status">
                ${STATUSES.map((s) => `<option value="${s}" ${draft.status === s ? "selected" : ""}>${s}</option>`).join("")}
              </select>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="out-note">Note</label>
            <input class="input" id="out-note" name="note" placeholder="Next step" value="${escapeHtml(draft.note || "")}" />
          </div>
          <div class="flex gap-2 pt-2">
            ${
              !isNew
                ? `<button type="button" class="btn btn-danger flex-1" data-action="delete-outreach" data-id="${escapeHtml(draft.id)}">Delete</button>`
                : `<button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>`
            }
            <button type="submit" class="btn btn-primary flex-1">Save</button>
          </div>
          ${!isNew ? `<button type="button" class="btn w-full" data-action="close-modal">Cancel</button>` : ""}
        </form>
      </div>
    </div>
  `;
}
