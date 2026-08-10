import { escapeHtml } from "../dom.js";
import { renderMuscleGroupPicker } from "./MuscleGroupPicker.js";

export function renderWorkoutBuilderModal(ui, state) {
  const selected = ui.selectedMuscleGroups || [];
  const count = selected.length;

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet modal-scroll-body workout-builder-modal" role="dialog" aria-modal="true" aria-label="Build workout" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <button type="button" class="btn !min-h-11 !px-3" data-action="close-modal">Cancel</button>
          <button type="button" class="btn btn-primary !min-h-11 !px-4" data-action="save-workout-plan" ${count ? "" : "disabled"}>
            Save${count ? ` · ${count}` : ""}
          </button>
        </div>
        <h2 class="display text-[1.75rem] leading-tight mt-4 shrink-0">Pick the muscle groups you want to work out:</h2>
        <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">We build a session from your equipment and recent training.</p>
        <div class="modal-scroll-inner scroll-touch mt-5">
          ${renderMuscleGroupPicker(ui, state)}
        </div>
        <div class="shrink-0 pt-4 space-y-2 border-t mt-4" style="border-color:var(--rail)">
          <button type="button" class="btn w-full" data-action="open-add-exercise-empty">Add single exercise instead</button>
        </div>
      </div>
    </div>
  `;
}
