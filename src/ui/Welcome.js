import { escapeHtml, primaryBtn, icon } from "./dom.js";
import { copy } from "../copy/voice.js";
import { DAY_NAMES } from "../schedule.js";
import {
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  FITNESS_GOALS,
  WHY_YOU_TRAIN,
  defaultFitnessSettings,
} from "../fitness.js";

const BUILD_DEFAULT = [0, 1, 2];
export const WELCOME_NAME_MAX = 24;

const SETUP_TIPS = {
  schedule: "Track daily blocks and seal core to keep the streak honest. Soft tasks never break it.",
  fitness: "Log sessions, sets, and rest in one place. Progressive overload stays on this phone.",
  both: "Day structure plus training on the same track. One phone, two loops, one lock.",
  morning: "Front-loads deep work when focus is sharp. Then it opens space to train.",
  afternoon: "Keeps mid-day execution clean. Still leaves room for a shutdown ritual.",
  evening: "Protects a builder window after the job. Nights still move the needle.",
  simple: "Starts with Today, Train, and Profile. Proof appears after your first core check.",
  full: "Same three tabs on day one. Proof unlocks after a core check. Money only if that module is on.",
};

function setupCard({ id, label, detail, name, checked, tipId, openTip, radioAction = "", alwaysTip = false }) {
  const tipOpen = alwaysTip || openTip === tipId;
  const actionAttr = radioAction ? ` data-action="${escapeHtml(radioAction)}"` : name === "blockPreset" ? ' data-action="welcome-block-preset"' : "";
  return `
    <div class="setup-card-row space-y-1">
      <label class="plan-row !min-h-[4.75rem] flex w-full cursor-pointer items-start gap-3">
        <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(id)}" class="mt-1"${actionAttr} ${checked ? "checked" : ""} />
        <span class="min-w-0 flex-1">
          <span class="task-title !min-h-0">${escapeHtml(label)}</span>
          <span class="task-meta">${escapeHtml(detail)}</span>
        </span>
        ${
          alwaysTip
            ? ""
            : `<button type="button" class="icon-btn setup-tip-btn shrink-0" data-action="toggle-setup-tip" data-tip="${escapeHtml(tipId)}" aria-expanded="${tipOpen}" aria-label="About ${escapeHtml(label)}">${icon("info", "h-4 w-4")}</button>`
        }
      </label>
      ${tipOpen ? `<p class="setup-tip" role="status">${escapeHtml(SETUP_TIPS[tipId] || "")}</p>` : ""}
    </div>`;
}

export function renderWelcomeModal(ui, state) {
  const step = ui.welcomeStep || 1;
  const name = ui.welcomeName || "";
  const focus = ui.welcomeFocus || null;
  const appMode = ui.welcomeAppMode || "simple";
  const buildDays = Array.isArray(ui.setupBuildDays) ? ui.setupBuildDays : BUILD_DEFAULT;
  const blockPreset = ui.setupBlockPreset || "morning";
  const length = Number(state?.settings?.challengeLength || ui.welcomeChallengeLength || 30);
  const premium = Boolean(state?.settings?.premiumUnlocked);
  const openTip = ui.setupTipId || null;
  const hasCoach = focus === "fitness" || focus === "both";
  const appModeStep = hasCoach ? 5 : 4;
  const finalStep = hasCoach ? 6 : 5;
  const coachGoal = ui.welcomeFitnessGoal || null;
  const coachStyle = ui.welcomeFitnessStyle || null;
  const coachLevel = ui.welcomeFitnessLevel || null;
  const coachWhy = ui.welcomeTrainWhy || [];
  const coachEquipment = Array.isArray(ui.welcomeEquipment)
    ? ui.welcomeEquipment
    : defaultFitnessSettings().equipmentAvailable;
  const coachOk =
    Boolean(coachGoal) && Boolean(coachStyle) && Boolean(coachLevel) && coachWhy.length > 0 && coachEquipment.length > 0;
  const nameOk = name.trim().length > 0 && name.trim().length <= WELCOME_NAME_MAX;
  const focusOk = Boolean(focus);
  const buildDaysOk = buildDays.length > 0;
  const blockPresetOk = Boolean(blockPreset);
  const appModeOk = Boolean(appMode);
  const lengthOk = Number.isFinite(length) && length >= 7;

  if (step === 1) {
    return `
      <div class="modal-backdrop modal-enter" data-stop>
        <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Welcome">
          <p class="eyebrow" style="color:var(--build)">Setup · 1 of 5</p>
          <h2 class="display text-4xl mt-1">${copy.welcome.step1Title}</h2>
          <p class="mt-2 help-text">${copy.welcome.step1Subtitle}</p>
          <form class="mt-5 space-y-3" data-action="welcome-name">
            <div>
              <label class="mb-1.5 block text-sm font-semibold" style="color:var(--text-soft)" for="welcome-name">What should we call you?</label>
              <input class="input input-welcome" id="welcome-name" name="displayName" required maxlength="${WELCOME_NAME_MAX}" placeholder="Your name" value="${escapeHtml(name)}" autocomplete="nickname" data-action="welcome-name-input" />
            </div>
            ${primaryBtn("Continue", { disabled: !nameOk, type: "submit", className: "w-full" })}
          </form>
          <button type="button" class="text-link" data-action="welcome-demo">Try Marco demo instead</button>
        </div>
      </div>
    `;
  }

  if (step === 2) {
    return `
      <div class="modal-backdrop modal-enter" data-stop>
        <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Choose focus">
          <p class="eyebrow">Setup · 2 of 5</p>
          <h2 class="display text-4xl mt-1">${copy.welcome.step2Title}</h2>
          <p class="mt-2 help-text">${copy.welcome.step2Subtitle}</p>
          <form class="mt-5 space-y-3" data-action="welcome-focus">
            <input type="hidden" name="displayName" value="${escapeHtml(name)}" />
            <div class="space-y-2">
              ${[
                { id: "schedule", label: "Schedule", detail: "Track daily blocks and streaks" },
                { id: "fitness", label: "Fitness", detail: "Log workouts, sets, and progress" },
                { id: "both", label: "Both", detail: "Schedule plus fitness growth" },
              ]
                .map((opt) =>
                  setupCard({
                    ...opt,
                    name: "focus",
                    checked: focus === opt.id,
                    tipId: opt.id,
                    openTip,
                    radioAction: "welcome-focus-pick",
                    alwaysTip: true,
                  })
                )
                .join("")}
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button" class="btn flex-1" data-action="welcome-back" data-step="1">Back</button>
              ${primaryBtn("Continue", { disabled: !focusOk, type: "submit", className: "flex-1" })}
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (step === 3) {
    return `
      <div class="modal-backdrop modal-enter" data-stop>
        <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Week shape">
          <p class="eyebrow">Setup · 3 of 5</p>
          <h2 class="display text-4xl mt-1">Shape your week</h2>
          <p class="mt-2 help-text">${copy.welcome.step3Subtitle}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            ${DAY_NAMES.map((dayName, idx) => {
              const on = buildDays.includes(idx);
              return `<button type="button" class="chip ${on ? "chip-build" : ""}" data-action="welcome-toggle-build-day" data-day="${idx}" aria-pressed="${on}">${escapeHtml(dayName)}</button>`;
            }).join("")}
          </div>
          <p class="mt-4 help-text">First-day template</p>
          <div class="mt-2 space-y-2">
            ${[
              { id: "morning", label: "Morning focus", detail: "Wake, deep work, move" },
              { id: "afternoon", label: "Afternoon grind", detail: "Work block, admin, wind down" },
              { id: "evening", label: "Evening builder", detail: "Job / side project after hours" },
            ]
              .map((p) =>
                setupCard({
                  ...p,
                  name: "blockPreset",
                  checked: blockPreset === p.id,
                  tipId: p.id,
                  openTip,
                })
              )
              .join("")}
          </div>
          <div class="flex gap-2 mt-5">
            <button type="button" class="btn flex-1" data-action="welcome-back" data-step="2">Back</button>
            ${primaryBtn("Continue", { disabled: !buildDaysOk || !blockPresetOk, className: "flex-1", attrs: `data-action="welcome-next" data-step="${hasCoach ? 4 : appModeStep}"` })}
          </div>
        </div>
      </div>
    `;
  }

  if (step === 4 && hasCoach) {
    return `
      <div class="modal-backdrop modal-enter" data-stop>
        <div class="modal-sheet modal-scroll-body sheet-enter" role="dialog" aria-modal="true" aria-label="Coach setup">
          <p class="eyebrow shrink-0">Setup · 4 of ${finalStep}</p>
          <h2 class="display text-4xl mt-1 shrink-0">Coach your first plan</h2>
          <p class="mt-2 help-text shrink-0">Modern hybrid setup. Pick a direction now; every path stays available later.</p>
          <div class="modal-scroll-inner scroll-touch mt-5 space-y-6">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Main outcome</p>
              <div class="prefs-grid" role="group" aria-label="Main outcome">
                ${FITNESS_GOALS.map(
                  (goal) => `<button type="button" class="prefs-tile ${coachGoal === goal.id ? "is-selected" : ""}" data-action="welcome-fitness-goal" data-goal="${goal.id}" aria-pressed="${coachGoal === goal.id}">${escapeHtml(goal.label)}</button>`
                ).join("")}
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Training style</p>
              <div class="segment flex-wrap" role="group" aria-label="Training style">
                ${[
                  ["ppl", "PPL"],
                  ["ul", "Upper / Lower"],
                  ["calisthenics", "Calisthenics"],
                  ["hiit", "HIIT"],
                ]
                  .map(
                    ([id, label]) => `<button type="button" class="segment-btn ${coachStyle === id ? "is-active accent" : ""}" data-action="welcome-fitness-style" data-style="${id}" aria-pressed="${coachStyle === id}">${label}</button>`
                  )
                  .join("")}
              </div>
              <p class="mt-2 help-text">Strength, bodyweight, and conditioning can all coexist. This only changes the first recommendation.</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Equipment</p>
              <div class="flex flex-wrap gap-1.5" role="group" aria-label="Available equipment">
                ${EQUIPMENT_OPTIONS.map((opt) => {
                  const on = coachEquipment.includes(opt.id);
                  return `<button type="button" class="chip ${on ? "chip-build" : ""}" data-action="welcome-fitness-equipment" data-id="${opt.id}" aria-pressed="${on}">${escapeHtml(opt.label)}</button>`;
                }).join("")}
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Experience</p>
              <div class="segment" role="group" aria-label="Experience">
                ${EXPERIENCE_LEVELS.map(
                  (level) => `<button type="button" class="segment-btn ${coachLevel === level.id ? "is-active accent" : ""}" data-action="welcome-fitness-level" data-level="${level.id}" aria-pressed="${coachLevel === level.id}">${escapeHtml(level.label)}</button>`
                ).join("")}
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Why now?</p>
              <div class="prefs-grid" role="group" aria-label="Why now">
                ${WHY_YOU_TRAIN.map((why) => {
                  const on = coachWhy.includes(why.id);
                  const locked = !on && coachWhy.length >= 3;
                  return `<button type="button" class="prefs-tile ${on ? "is-selected" : ""} ${locked ? "is-disabled" : ""}" data-action="welcome-train-why" data-why="${why.id}" aria-pressed="${on}" ${locked ? "disabled" : ""}>${escapeHtml(why.label)}</button>`;
                }).join("")}
              </div>
              <p class="mt-2 help-text">Pick up to 3. This tunes density, rest, and recommendations.</p>
            </div>
          </div>
          <div class="flex gap-2 pt-4 shrink-0 border-t mt-4" style="border-color:var(--rail)">
            <button type="button" class="btn flex-1" data-action="welcome-back" data-step="3">Back</button>
            ${primaryBtn("Continue", { disabled: !coachOk, className: "flex-1", attrs: `data-action="welcome-next" data-step="${appModeStep}"` })}
          </div>
        </div>
      </div>
    `;
  }

  if (step === appModeStep) {
    return `
      <div class="modal-backdrop modal-enter" data-stop>
        <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Choose app mode">
          <p class="eyebrow">Setup · ${appModeStep} of ${finalStep}</p>
          <h2 class="display text-4xl mt-1">${copy.welcome.step4Title}</h2>
          <p class="mt-2 help-text">${copy.welcome.step4Subtitle}</p>
          <form class="mt-5 space-y-3" data-action="welcome-mode">
            <input type="hidden" name="displayName" value="${escapeHtml(name)}" />
            <input type="hidden" name="focus" value="${escapeHtml(focus || "")}" />
            <div class="space-y-2">
              ${[
                { id: "simple", label: "Simple app", detail: "Fewer tabs. Unlock Proof after your first core check." },
                { id: "full", label: "Complete app", detail: "Same three tabs to start. Proof unlocks after a core check. Money only if that module is on." },
              ]
                .map((opt) =>
                  setupCard({
                    ...opt,
                    name: "appMode",
                    checked: appMode === opt.id,
                    tipId: opt.id,
                    openTip,
                  })
                )
                .join("")}
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button" class="btn flex-1" data-action="welcome-back" data-step="${hasCoach ? 4 : 3}">Back</button>
              ${primaryBtn("Continue", { disabled: !appModeOk, type: "submit", className: "flex-1" })}
            </div>
          </form>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop modal-enter" data-stop>
      <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Lock in">
        <p class="eyebrow">Setup · ${finalStep} of ${finalStep}</p>
        <h2 class="display text-4xl mt-1">${copy.welcome.step5Title}</h2>
        <p class="mt-2 help-text">${copy.welcome.step5Subtitle}</p>
        <div class="mt-4">
          <p class="mb-2 help-text">Challenge length</p>
          <div class="segment flex-wrap" role="group" aria-label="Challenge length">
            ${[7, 14, 30]
              .map(
                (d) =>
                  `<button type="button" class="segment-btn ${length === d ? "is-active accent" : ""}" data-action="welcome-challenge-length" data-days="${d}">${d} Days</button>`
              )
              .join("")}
            ${
              premium
                ? `<button type="button" class="segment-btn ${length === 90 ? "is-active accent" : ""}" data-action="welcome-challenge-length" data-days="90">90 Days</button>`
                : `<button type="button" class="segment-btn challenge-length-locked" data-action="welcome-challenge-length" data-days="90" title="${escapeHtml(copy.challenge.locked90)}">90 Days · Beta</button>`
            }
          </div>
          ${
            premium
              ? `
          <form class="challenge-custom-row" data-action="welcome-custom-challenge">
            <input class="input" type="number" name="days" min="7" max="365" placeholder="${copy.challenge.customLabel}" value="${length > 90 || ![7, 14, 30, 90].includes(length) ? length : ""}" />
            <button type="submit" class="btn shrink-0 !text-xs">${copy.challenge.customSave}</button>
          </form>`
              : ""
          }
        </div>
        <div class="flex gap-2 mt-5">
          <button type="button" class="btn flex-1" data-action="welcome-back" data-step="${appModeStep}">Back</button>
          ${primaryBtn("Start my track", { disabled: !lengthOk, className: "flex-1", attrs: 'data-action="welcome-finish"' })}
        </div>
      </div>
    </div>
  `;
}
