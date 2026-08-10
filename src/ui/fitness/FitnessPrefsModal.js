import { escapeHtml } from "../dom.js";
import {
  FITNESS_GOALS,
  WHY_YOU_TRAIN,
  trainWhyLine,
  defaultFitnessSettings,
} from "../../fitness.js";
import { copy } from "../../copy/voice.js";

export function renderFitnessPrefsModal(ui, state) {
  const settings = { ...defaultFitnessSettings(), ...(state.fitnessSettings || {}) };
  const step = Number(ui.fitnessPrefsStep) === 2 ? 2 : 1;
  const mode = ui.fitnessPrefsMode === "edit" ? "edit" : "build";
  const goal = settings.goal || "build_muscle";
  const trainWhy = settings.trainWhy || [];
  const whyLine = trainWhyLine(trainWhy);
  const canContinue = Boolean(goal);
  const canSave = trainWhy.length > 0;

  const outcomeTiles = FITNESS_GOALS.map(
    (g) =>
      `<button type="button" class="prefs-tile ${goal === g.id ? "is-selected" : ""}" data-action="set-fitness-goal-radio" data-goal="${g.id}" aria-pressed="${goal === g.id}">${escapeHtml(g.label)}</button>`
  ).join("");

  const whyTiles = WHY_YOU_TRAIN.map(
    (w) =>
      `<button type="button" class="prefs-tile ${trainWhy.includes(w.id) ? "is-selected" : ""}" data-action="toggle-train-why" data-why="${w.id}" aria-pressed="${trainWhy.includes(w.id)}">${escapeHtml(w.label)}</button>`
  ).join("");

  return `
    <div class="modal-backdrop modal-enter" data-action="close-modal">
      <div class="modal-sheet modal-scroll-body sheet-enter" role="dialog" aria-modal="true" aria-label="Training prefs" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <p class="eyebrow mb-0">${copy.fitness.prefsEyebrow(step)}</p>
          <button type="button" class="btn !min-h-11 !px-4" data-action="close-modal">Cancel</button>
        </div>
        ${
          step === 1
            ? `
          <h2 class="display text-[1.75rem] leading-tight mt-4 shrink-0">${copy.fitness.outcomeTitle}</h2>
          <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">${copy.fitness.outcomeSubtitle}</p>
          <div class="mt-5 prefs-grid shrink-0" role="radiogroup" aria-label="Training outcome">
            ${outcomeTiles}
          </div>
          <div class="shrink-0 pt-4 border-t mt-6" style="border-color:var(--rail)">
            <button type="button" class="btn btn-primary w-full !min-h-11" data-action="fitness-prefs-continue" ${canContinue ? "" : "disabled"}>Continue</button>
          </div>`
            : `
          <h2 class="display text-[1.75rem] leading-tight mt-4 shrink-0">${copy.fitness.whyTitle}</h2>
          <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">${copy.fitness.whySubtitle}</p>
          <div class="mt-5 prefs-grid shrink-0" role="group" aria-label="Why you train">
            ${whyTiles}
          </div>
          ${whyLine ? `<p class="mt-3 text-xs shrink-0" style="color:var(--build)">${escapeHtml(whyLine)}</p>` : ""}
          <div class="shrink-0 pt-4 border-t mt-6 flex gap-2" style="border-color:var(--rail)">
            <button type="button" class="btn flex-1 !min-h-11" data-action="fitness-prefs-back">Back</button>
            <button type="button" class="btn btn-primary flex-1 !min-h-11" data-action="fitness-prefs-save" ${canSave ? "" : "disabled"}>
              ${mode === "edit" ? "Save" : "Save & build"}
            </button>
          </div>`
        }
      </div>
    </div>
  `;
}
