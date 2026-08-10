import { escapeHtml } from "./dom.js";
import { DAY_NAMES } from "../schedule.js";
import { HUSTLE_PACKS } from "../hustle-packs.js";

const BUILD_DEFAULT = [0, 1, 2];

export function renderSetupWizard(state, ui) {
  const step = Number(ui.setupWizardStep || 1);
  const buildDays = Array.isArray(ui.setupBuildDays) ? ui.setupBuildDays : BUILD_DEFAULT;
  const modules = ui.setupModules || { fitness: true, money: false, hustle: false };
  const packId = ui.setupHustlePack || "blank";
  const blockPreset = ui.setupBlockPreset || "morning";

  if (step === 1) {
    return `
      <div class="modal-backdrop" data-stop>
        <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Week shape">
          <p class="eyebrow">Setup · 1 of 4</p>
          <h2 class="display text-4xl mt-1">Shape your week</h2>
          <p class="mt-2 text-sm" style="color:var(--mute)">Pick build days. The rest are maintenance. You can edit blocks later.</p>
          <div class="mt-4 flex flex-wrap gap-2">
            ${DAY_NAMES.map((name, idx) => {
              const on = buildDays.includes(idx);
              return `<button type="button" class="chip ${on ? "chip-build" : ""}" data-action="setup-toggle-build-day" data-day="${idx}" aria-pressed="${on}">${escapeHtml(name)}</button>`;
            }).join("")}
          </div>
          <div class="flex gap-2 mt-5">
            <button type="button" class="btn btn-primary flex-1" data-action="setup-wizard-next">Continue</button>
          </div>
        </div>
      </div>`;
  }

  if (step === 2) {
    return `
      <div class="modal-backdrop" data-stop>
        <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Modules">
          <p class="eyebrow">Setup · 2 of 4</p>
          <h2 class="display text-4xl mt-1">What are you tracking?</h2>
          <p class="mt-2 text-sm" style="color:var(--mute)">Schedule is always on. Unlock the rest when you need them.</p>
          <div class="mt-4 space-y-2">
            ${[
              { id: "fitness", label: "Fitness", detail: "Workouts, sets, volume" },
              { id: "money", label: "Money", detail: "Side income with soft and hard caps" },
              { id: "hustle", label: "Hustle", detail: "Weekly flow, ramp, outreach log" },
            ]
              .map(
                (m) => `
              <label class="plan-row !min-h-[4.5rem] flex cursor-pointer items-start gap-3">
                <input type="checkbox" data-action="setup-toggle-module" data-module="${m.id}" class="mt-1" ${modules[m.id] ? "checked" : ""} />
                <span>
                  <span class="task-title !min-h-0">${escapeHtml(m.label)}</span>
                  <span class="task-meta">${escapeHtml(m.detail)}</span>
                </span>
              </label>`
              )
              .join("")}
          </div>
          <div class="flex gap-2 mt-5">
            <button type="button" class="btn flex-1" data-action="setup-wizard-back">Back</button>
            <button type="button" class="btn btn-primary flex-1" data-action="setup-wizard-next">Continue</button>
          </div>
        </div>
      </div>`;
  }

  if (step === 3) {
    const showPacks = Boolean(modules.hustle);
    return `
      <div class="modal-backdrop" data-stop>
        <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Starter blocks">
          <p class="eyebrow">Setup · 3 of 4</p>
          <h2 class="display text-4xl mt-1">First-day template</h2>
          <p class="mt-2 text-sm" style="color:var(--mute)">We seed a few blocks on every day. Edit anytime.</p>
          <div class="mt-4 space-y-2">
            ${[
              { id: "morning", label: "Morning focus", detail: "Wake, deep work, move" },
              { id: "afternoon", label: "Afternoon grind", detail: "Work block, admin, wind down" },
              { id: "evening", label: "Evening builder", detail: "Job / side project after hours" },
            ]
              .map(
                (p) => `
              <label class="plan-row !min-h-[4.5rem] flex cursor-pointer items-start gap-3">
                <input type="radio" name="blockPreset" data-action="setup-block-preset" value="${p.id}" class="mt-1" ${blockPreset === p.id ? "checked" : ""} />
                <span>
                  <span class="task-title !min-h-0">${escapeHtml(p.label)}</span>
                  <span class="task-meta">${escapeHtml(p.detail)}</span>
                </span>
              </label>`
              )
              .join("")}
          </div>
          ${
            showPacks
              ? `<div class="mt-4">
            <p class="mb-2 text-xs" style="color:var(--mute)">Hustle pack</p>
            <div class="flex flex-wrap gap-2">
              ${Object.values(HUSTLE_PACKS)
                .map(
                  (p) =>
                    `<button type="button" class="chip ${packId === p.id ? "chip-build" : ""}" data-action="setup-hustle-pack" data-pack="${escapeHtml(p.id)}">${escapeHtml(p.label)}</button>`
                )
                .join("")}
            </div>
          </div>`
              : ""
          }
          <div class="flex gap-2 mt-5">
            <button type="button" class="btn flex-1" data-action="setup-wizard-back">Back</button>
            <button type="button" class="btn btn-primary flex-1" data-action="setup-wizard-next">Continue</button>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="modal-backdrop" data-stop>
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Ready to lock in">
        <p class="eyebrow">Setup · 4 of 4</p>
        <h2 class="display text-4xl mt-1">Ready to lock in</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">
          Your week is shaped. Next you commit to a challenge length. Proof over vibes.
        </p>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="flex gap-2"><span style="color:var(--build)">01</span> Build days: ${escapeHtml(buildDays.map((d) => DAY_NAMES[d]).join(", ") || "none")}</li>
          <li class="flex gap-2"><span style="color:var(--build)">02</span> Modules: Schedule${modules.fitness ? " · Fitness" : ""}${modules.money ? " · Money" : ""}${modules.hustle ? " · Hustle" : ""}</li>
          <li class="flex gap-2"><span style="color:var(--build)">03</span> Template: ${escapeHtml(blockPreset)}</li>
        </ul>
        <div class="flex gap-2 mt-5">
          <button type="button" class="btn flex-1" data-action="setup-wizard-back">Back</button>
          <button type="button" class="btn btn-primary flex-1" data-action="setup-wizard-finish">Finish setup</button>
        </div>
      </div>
    </div>`;
}
