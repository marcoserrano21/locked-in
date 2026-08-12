import { escapeHtml } from "./dom.js";
import { mergePlaybook } from "../hustle-playbook.js";
import { uid } from "../schedule.js";

const SCRIPT_KEYS = [
  { key: "warmDm", label: "Warm DM" },
  { key: "contraHeadline", label: "Contra headline" },
  { key: "socialPost", label: "Social post" },
  { key: "discoveryOpener", label: "Discovery opener" },
];

export function renderHustleEditorModal(state, ui) {
  const playbook = mergePlaybook(state.settings?.hustlePlaybook);
  const tab = ui.hustleEditorTab || "brief";
  const tabs = [
    { id: "brief", label: "Brief" },
    { id: "flow", label: "Flow" },
    { id: "ramp", label: "Ramp" },
    { id: "scripts", label: "Scripts" },
  ];

  let body = "";
  if (tab === "brief") {
    body = `
      <form class="space-y-3" data-action="save-hustle-brief">
        <div>
          <label class="mb-1 block text-xs" style="color:var(--mute)" for="h-niche">Niche</label>
          <input class="input" id="h-niche" name="niche" value="${escapeHtml(playbook.niche || "")}" />
        </div>
        <div>
          <label class="mb-1 block text-xs" style="color:var(--mute)" for="h-pos">Positioning</label>
          <textarea class="input min-h-[88px] py-3" id="h-pos" name="positioning">${escapeHtml(playbook.positioning || "")}</textarea>
        </div>
        <div>
          <label class="mb-1 block text-xs" style="color:var(--mute)" for="h-money">Money block note</label>
          <input class="input" id="h-money" name="moneyBlock" value="${escapeHtml(playbook.moneyBlock || "")}" />
        </div>
        <div>
          <label class="mb-1 block text-xs" style="color:var(--mute)" for="h-port">Portfolio URL</label>
          <input class="input" id="h-port" name="portfolioUrl" value="${escapeHtml(state.settings?.portfolioUrl || "")}" />
        </div>
        <div>
          <label class="mb-1 block text-xs" style="color:var(--mute)" for="h-li">LinkedIn URL</label>
          <input class="input" id="h-li" name="linkedinUrl" value="${escapeHtml(state.settings?.linkedinUrl || "")}" />
        </div>
        <button type="submit" class="btn btn-primary w-full">Save brief</button>
      </form>`;
  } else if (tab === "flow") {
    const rows = (playbook.weeklyFlow || [])
      .map(
        (f, i) => `
        <div class="plan-row !min-h-[5rem]">
          <p class="task-title !min-h-0">${escapeHtml(f.label)}</p>
          <p class="task-meta">${escapeHtml(f.detail || "")}</p>
          <div class="plan-actions mt-2">
            <button type="button" class="btn flex-1 !text-xs" data-action="hustle-flow-move" data-index="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""}>Up</button>
            <button type="button" class="btn flex-1 !text-xs" data-action="hustle-flow-move" data-index="${i}" data-dir="1" ${i === playbook.weeklyFlow.length - 1 ? "disabled" : ""}>Down</button>
            <button type="button" class="btn btn-danger !text-xs" data-action="hustle-flow-delete" data-index="${i}">Delete</button>
          </div>
        </div>`
      )
      .join("");
    body = `
      <div class="space-y-2">${rows || `<p class="text-sm" style="color:var(--mute)">No flow items.</p>`}</div>
      <form class="mt-4 space-y-2" data-action="hustle-flow-add">
        <input class="input" name="label" placeholder="Flow label" required />
        <input class="input" name="detail" placeholder="Detail (optional)" />
        <button type="submit" class="btn btn-primary w-full">Add flow item</button>
      </form>`;
  } else if (tab === "ramp") {
    const rows = (playbook.ramp || [])
      .map(
        (w, i) => `
        <div class="rounded-2xl px-3 py-3" style="background:var(--bg-elev)">
          <div class="flex items-center justify-between gap-2 mb-2">
            <p class="text-sm font-semibold">${escapeHtml(w.label)}</p>
            <button type="button" class="btn btn-danger !text-xs !min-h-10" data-action="hustle-ramp-delete" data-index="${i}">Delete</button>
          </div>
          <ul class="space-y-1 text-sm" style="color:var(--text-soft)">
            ${(w.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>`
      )
      .join("");
    body = `
      <div class="space-y-2">${rows || `<p class="text-sm" style="color:var(--mute)">No ramp weeks.</p>`}</div>
      <form class="mt-4 space-y-2" data-action="hustle-ramp-add">
        <input class="input" name="label" placeholder="Week label" required />
        <textarea class="input min-h-[72px] py-3" name="items" placeholder="One item per line" required></textarea>
        <button type="submit" class="btn btn-primary w-full">Add ramp week</button>
      </form>`;
  } else {
    body = `
      <form class="space-y-3" data-action="save-hustle-scripts">
        ${SCRIPT_KEYS.map(
          (s) => `
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="script-${s.key}">${escapeHtml(s.label)}</label>
            <textarea class="input min-h-[96px] py-3" id="script-${s.key}" name="${s.key}">${escapeHtml(playbook.scripts?.[s.key] || "")}</textarea>
          </div>`
        ).join("")}
        <button type="submit" class="btn btn-primary w-full">Save scripts</button>
      </form>`;
  }

  return `
    <div class="modal-backdrop">
      <div class="modal-sheet modal-scroll-body" role="dialog" aria-modal="true" aria-label="Edit command center" data-stop>
        <div class="flex items-center justify-between gap-2 shrink-0">
          <h2 class="display text-3xl">Edit command center</h2>
          <button type="button" class="btn !min-h-11 !px-3" data-action="close-modal">Close</button>
        </div>
        <div class="segment mt-4 shrink-0" role="tablist">
          ${tabs
            .map(
              (t) =>
                `<button type="button" class="segment-btn ${tab === t.id ? "is-active accent" : ""}" data-action="hustle-editor-tab" data-tab="${t.id}">${t.label}</button>`
            )
            .join("")}
        </div>
        <div class="modal-scroll-inner scroll-touch mt-4 space-y-3">${body}</div>
        <button type="button" class="btn w-full mt-3 shrink-0" data-action="close-modal">Done</button>
      </div>
    </div>
  `;
}

export function makeFlowItem(label, detail = "") {
  return {
    id: uid("flow"),
    label: String(label || "").trim(),
    detail: String(detail || "").trim(),
  };
}

export function makeRampWeek(label, items = []) {
  return {
    id: uid("ramp"),
    label: String(label || "").trim(),
    items: (items || []).map((x) => String(x).trim()).filter(Boolean),
  };
}
