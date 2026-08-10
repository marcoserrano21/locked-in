import { escapeHtml } from "../dom.js";
import { EXPERIENCE_LEVELS, defaultFitnessSettings } from "../../fitness.js";
import { levelVolumeHint } from "../../fitness-plan.js";
import { renderMuscleGroupPicker } from "./MuscleGroupPicker.js";

const PRESETS = [
  { id: "custom", label: "Custom" },
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "lower", label: "Lower" },
];

export function renderWorkoutBuilderModal(ui, state) {
  const selected = ui.selectedMuscleGroups || [];
  const count = selected.length;
  const preset = ui.workoutBuilderPreset || "custom";
  const settings = { ...defaultFitnessSettings(), ...(state.fitnessSettings || {}) };
  const level = settings.experienceLevel || "beginner";
  const hint = levelVolumeHint(level, count || 1);

  return `
    <div class="modal-backdrop modal-enter" data-action="close-modal">
      <div class="modal-sheet modal-scroll-body workout-builder-modal sheet-enter" role="dialog" aria-modal="true" aria-label="Build workout" data-stop>
        <div class="flex items-center justify-end gap-3 shrink-0">
          <button type="button" class="btn !min-h-11 !px-4" data-action="close-modal">Cancel</button>
        </div>
        <h2 class="display text-[1.75rem] leading-tight mt-4 shrink-0">Build your session</h2>
        <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">${escapeHtml(hint.label)}. 2–3 moves per muscle when equipment allows.</p>

        <p class="mt-4 text-xs font-semibold uppercase tracking-wide shrink-0" style="color:var(--mute)">Level</p>
        <div class="segment mt-2 shrink-0" role="group" aria-label="Experience level">
          ${EXPERIENCE_LEVELS.map(
            (l) =>
              `<button type="button" class="segment-btn ${level === l.id ? "is-active accent" : ""}" data-action="set-fitness-level" data-level="${l.id}">${escapeHtml(l.label)}</button>`
          ).join("")}
        </div>

        <div class="segment mt-4 shrink-0" role="group" aria-label="Workout preset">
          ${PRESETS.map(
            (p) =>
              `<button type="button" class="segment-btn ${preset === p.id ? "is-active accent" : ""}" data-action="workout-builder-preset" data-preset="${p.id}">${escapeHtml(p.label)}</button>`
          ).join("")}
        </div>
        <div class="modal-scroll-inner scroll-touch mt-5">
          ${renderMuscleGroupPicker(ui, state)}
        </div>
        <div class="shrink-0 pt-4 border-t mt-4 flex items-center gap-2" style="border-color:var(--rail)">
          <button type="button" class="btn flex-1 !min-h-11 !px-3 !text-xs sm:!text-sm" data-action="open-add-exercise-empty">Add single exercise instead</button>
          <button type="button" class="btn btn-primary shrink-0 !min-h-11 !px-5" data-action="save-workout-plan" ${count ? "" : "disabled"}>
            Save${count ? ` · ${count}` : ""}
          </button>
        </div>
      </div>
    </div>
  `;
}
