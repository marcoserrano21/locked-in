import { CHALLENGE_META } from "../schedule.js";
import { ratePerMile, totalEarnings, totalMiles } from "../uber.js";
import { formatDisplayDate, todayKey } from "../dates.js";
import { escapeHtml, icon } from "./dom.js";
import { paginate, renderPager } from "./Pagination.js";

export function renderMiles(state, ui = {}) {
  const miles = totalMiles(state);
  const earn = totalEarnings(state);
  const cap = state.settings.uberCap || CHALLENGE_META.uberCap;
  const soft = state.settings.uberSoftStop || CHALLENGE_META.uberSoftStop;
  const remaining = Math.max(0, cap - miles);
  const rate = ratePerMile(state).toFixed(2);
  const fill = Math.min(100, (100 * miles) / cap);
  const softPct = Math.min(100, (100 * soft) / cap);
  const overSoft = miles >= soft;
  const overCap = miles > cap;
  const fillClass = overCap ? "danger" : overSoft ? "warn" : "";

  const all = (state.uberLog || []).slice().reverse();
  const { items: pageRows, page, totalPages } = paginate(all, ui.milesPage || 0);

  const rows = pageRows
    .map(
      (e) => `
      <div class="task-row !grid-cols-[1fr_auto]">
        <div>
          <p class="task-title !min-h-0">${formatDisplayDate(e.date)}</p>
          <div class="task-meta"><span>${escapeHtml(e.miles)} mi</span><span>$${escapeHtml(e.earnings)}</span></div>
        </div>
        <div class="flex items-center gap-1">
          <button type="button" class="btn !min-h-11 !min-w-11 !px-0" data-action="edit-uber" data-id="${escapeHtml(e.id)}" aria-label="Edit session">${icon("edit", "h-4 w-4")}</button>
          <button type="button" class="btn !min-h-11 !min-w-11 !px-0" data-action="delete-uber" data-id="${escapeHtml(e.id)}" aria-label="Delete session">${icon("trash", "h-4 w-4")}</button>
        </div>
      </div>`
    )
    .join("");

  const isMarco = state.preset === "marco";
  const title = isMarco ? "Miles" : "Money";
  const subtitle = isMarco
    ? `Model 3 RWD · FSD Supervised. Bridge income, not identity. ${CHALLENGE_META.uberNightsPerWeek} nights / week · ${CHALLENGE_META.uberWindow}`
    : `${escapeHtml(state.settings?.moneyLabel || "Side income")}. Soft stop then hard ceiling. Numbers, not vibes.`;
  const unitLabel = isMarco || state.settings?.moneyMode !== "hours" ? "miles used" : "units used";

  return `
    <section class="screen">
      <header class="page-header">
        <p class="eyebrow">${escapeHtml(title)}</p>
        <h1 class="display">Money truth</h1>
        <p class="mt-2 text-sm" style="color:var(--mute)">
          ${escapeHtml(subtitle)}
        </p>
      </header>

      <section class="panel grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs" style="color:var(--mute)">${escapeHtml(unitLabel)}</p>
          <p class="display text-4xl" style="color:${overCap ? "var(--danger)" : overSoft ? "var(--maintain)" : "var(--text)"}">${miles}</p>
          <p class="text-xs" style="color:var(--mute)">of ${cap} cap</p>
        </div>
        <div>
          <p class="text-xs" style="color:var(--mute)">earned</p>
          <p class="display text-4xl">$${earn}</p>
          <p class="text-xs" style="color:var(--mute)">~$${rate}/mi after energy</p>
        </div>
      </section>

      <section class="panel">
        <div class="relative">
          <div class="day-rail h-2"><div class="day-rail-fill ${fillClass}" style="width:${fill}%"></div></div>
          <div class="pointer-events-none absolute top-0 h-2 w-0.5" style="left:${softPct}%;background:var(--maintain)"></div>
        </div>
        <p class="mt-2 text-sm" style="color:var(--mute)">${remaining} miles remaining · soft stop at ${soft}</p>
        ${overSoft ? `<p class="mt-2 text-sm" style="color:var(--maintain)">${soft} miles. Stop and reassess with numbers, not vibes.</p>` : ""}
      </section>

      <section class="panel">
        <div class="mb-3 flex items-center justify-between gap-2">
          <p class="eyebrow mb-0">Sessions</p>
          <button type="button" class="btn btn-primary gap-2 !min-h-11" data-action="add-uber">
            ${icon("plus", "h-4 w-4")} Add session
          </button>
        </div>
        ${rows || `<p class="py-5 text-sm" style="color:var(--mute)">No sessions logged yet.</p>`}
        ${renderPager(page, totalPages, "miles")}
      </section>
    </section>
  `;
}

export function renderUberEditorModal(ui) {
  const draft = ui.editingUber || {
    id: "",
    date: todayKey(),
    miles: "",
    earnings: "",
  };
  const isNew = !draft.id;
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="${isNew ? "Add session" : "Edit session"}" data-stop>
        <h2 class="display text-3xl">${isNew ? "Add session" : "Edit session"}</h2>
        <form class="mt-4 space-y-3" data-action="save-uber">
          <input type="hidden" name="id" value="${escapeHtml(draft.id || "")}" />
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="uber-date">Date</label>
            <input class="input" id="uber-date" name="date" type="date" required value="${escapeHtml(draft.date || todayKey())}" />
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="mb-1 block text-xs" style="color:var(--mute)" for="uber-miles">Miles</label>
              <input class="input" id="uber-miles" name="miles" type="number" inputmode="decimal" min="0" step="0.1" required value="${escapeHtml(draft.miles ?? "")}" />
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-xs" style="color:var(--mute)" for="uber-earn">Earnings ($)</label>
              <input class="input" id="uber-earn" name="earnings" type="number" inputmode="decimal" min="0" step="0.01" value="${escapeHtml(draft.earnings ?? "")}" />
            </div>
          </div>
          <div class="flex gap-2 pt-2">
            ${
              !isNew
                ? `<button type="button" class="btn btn-danger flex-1" data-action="delete-uber" data-id="${escapeHtml(draft.id)}">Delete</button>`
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
