import { escapeHtml } from "../dom.js";
import {
  FITNESS_GOALS,
  WHY_YOU_TRAIN,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  SESSION_DURATIONS,
  trainWhyLine,
  defaultFitnessSettings,
  countExercisesForEquipment,
} from "../../fitness.js";
import { copy } from "../../copy/voice.js";

export function renderFitnessPrefsModal(ui, state) {
  const settings = { ...defaultFitnessSettings(), ...(state.fitnessSettings || {}) };
  const mode = ui.fitnessPrefsMode === "edit" ? "edit" : "build";
  const goal = settings.goal || "build_muscle";
  const trainWhy = settings.trainWhy || [];
  const whyLine = trainWhyLine(trainWhy);
  const level = settings.experienceLevel || "beginner";
  const unit = settings.preferredUnit === "kg" ? "kg" : "lb";
  const bodyWeight = Number(settings.bodyWeight) || (unit === "kg" ? 77 : 170);
  const available = new Set(settings.equipmentAvailable || []);
  const splitType = settings.splitType === "ul" ? "ul" : "ppl";
  const gymDays = Number(settings.gymDaysPerWeek) || 4;
  const sessionMinutes = [30, 45, 60, 90].includes(Number(settings.sessionMinutes))
    ? Number(settings.sessionMinutes)
    : 60;
  const matchCount = countExercisesForEquipment(settings.equipmentAvailable || []);
  const whyAtMax = trainWhy.length >= 3;
  const canContinue =
    Boolean(goal) && trainWhy.length > 0 && available.size > 0;

  const outcomeTiles = FITNESS_GOALS.map((g) => {
    const selected = goal === g.id;
    const muted = Boolean(goal) && !selected;
    return `<button type="button" class="prefs-tile ${selected ? "is-selected" : ""} ${muted ? "is-disabled" : ""}" data-action="set-fitness-goal-radio" data-goal="${g.id}" aria-pressed="${selected}">${escapeHtml(g.label)}</button>`;
  }).join("");

  const whyTiles = WHY_YOU_TRAIN.map((w) => {
    const selected = trainWhy.includes(w.id);
    const lockedOut = whyAtMax && !selected;
    return `<button type="button" class="prefs-tile ${selected ? "is-selected" : ""} ${lockedOut ? "is-disabled" : ""}" data-action="toggle-train-why" data-why="${w.id}" aria-pressed="${selected}" ${lockedOut ? "disabled" : ""}>${escapeHtml(w.label)}</button>`;
  }).join("");

  const equipmentChips = EQUIPMENT_OPTIONS.map(
    (opt) =>
      `<button type="button" class="chip ${available.has(opt.id) ? "chip-build" : ""}" data-action="toggle-equipment" data-id="${opt.id}" aria-pressed="${available.has(opt.id)}">${escapeHtml(opt.label)}</button>`
  ).join("");

  return `
    <div class="modal-backdrop modal-enter">
      <div class="modal-sheet modal-scroll-body sheet-enter" role="dialog" aria-modal="true" aria-label="Workout setup" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <p class="eyebrow mb-0">${copy.fitness.setupEyebrow}</p>
          <button type="button" class="btn !min-h-11 !px-4" data-action="close-modal">Cancel</button>
        </div>
        <h2 class="display text-[1.75rem] leading-tight mt-4 shrink-0">${copy.fitness.setupTitle}</h2>
        <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">${copy.fitness.setupSubtitle}</p>

        <div class="modal-scroll-inner scroll-touch mt-5 space-y-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Body weight</p>
            <div class="flex items-center gap-2">
              <div class="segment shrink-0" role="group" aria-label="Weight unit">
                <button type="button" class="segment-btn ${unit === "lb" ? "is-active accent" : ""}" data-action="set-fitness-unit" data-unit="lb">LB</button>
                <button type="button" class="segment-btn ${unit === "kg" ? "is-active accent" : ""}" data-action="set-fitness-unit" data-unit="kg">KG</button>
              </div>
              <label class="sr-only" for="fitness-body-weight">Body weight</label>
              <input
                class="input flex-1"
                id="fitness-body-weight"
                type="number"
                min="1"
                step="0.1"
                inputmode="decimal"
                value="${bodyWeight || ""}"
                data-action="set-body-weight"
                placeholder="${unit === "kg" ? "77" : "170"}"
              />
            </div>
            <p class="mt-2 text-xs" style="color:var(--mute)">Seeds starting loads from your bodyweight. Adjust every set.</p>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Session length</p>
            <div class="segment" role="group" aria-label="Session minutes">
              ${SESSION_DURATIONS.map(
                (d) =>
                  `<button type="button" class="segment-btn ${sessionMinutes === d.id ? "is-active accent" : ""}" data-action="set-session-minutes" data-minutes="${d.id}" title="${escapeHtml(d.detail)}">${d.label}m</button>`
              ).join("")}
            </div>
            <p class="mt-2 text-xs" style="color:var(--mute)">${SESSION_DURATIONS.find((d) => d.id === sessionMinutes)?.detail || ""}</p>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Level</p>
            <div class="segment" role="group" aria-label="Experience level">
              ${EXPERIENCE_LEVELS.map(
                (l) =>
                  `<button type="button" class="segment-btn ${level === l.id ? "is-active accent" : ""}" data-action="set-fitness-level" data-level="${l.id}">${escapeHtml(l.label)}</button>`
              ).join("")}
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Equipment</p>
            <div class="flex flex-wrap gap-1.5">${equipmentChips}</div>
            <p class="mt-2 text-xs" style="color:var(--mute)">${available.size} selected · ${matchCount} exercises match</p>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-1" style="color:var(--mute)">${copy.fitness.outcomeTitle}</p>
            <p class="text-xs mb-2" style="color:var(--mute)">${copy.fitness.outcomeSubtitle}</p>
            <div class="prefs-grid" role="radiogroup" aria-label="Training outcome">
              ${outcomeTiles}
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-1" style="color:var(--mute)">${copy.fitness.whyTitle}</p>
            <p class="text-xs mb-2" style="color:var(--mute)">${copy.fitness.whySubtitle}</p>
            <div class="prefs-grid" role="group" aria-label="Why you train">
              ${whyTiles}
            </div>
            ${whyLine ? `<p class="mt-2 text-xs" style="color:var(--build)">${escapeHtml(whyLine)}</p>` : ""}
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Split</p>
            <div class="segment" role="group" aria-label="Training split">
              <button type="button" class="segment-btn ${splitType === "ppl" ? "is-active accent" : ""}" data-action="set-split-type" data-split="ppl">Push / Pull / Legs</button>
              <button type="button" class="segment-btn ${splitType === "ul" ? "is-active accent" : ""}" data-action="set-split-type" data-split="ul">Upper / Lower</button>
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Gym days / week</p>
            <div class="segment" role="group" aria-label="Gym days per week">
              ${[2, 3, 4, 5, 6]
                .map(
                  (d) =>
                    `<button type="button" class="segment-btn ${gymDays === d ? "is-active accent" : ""}" data-action="set-gym-days" data-days="${d}">${d}</button>`
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="shrink-0 pt-4 border-t mt-4" style="border-color:var(--rail)">
          <button type="button" class="btn btn-primary w-full !min-h-11" data-action="workout-setup-continue" ${canContinue ? "" : "disabled"}>
            ${mode === "edit" ? "Save setup" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  `;
}
