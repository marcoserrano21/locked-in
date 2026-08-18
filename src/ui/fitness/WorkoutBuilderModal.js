import { escapeHtml } from "../dom.js";
import { defaultFitnessSettings } from "../../fitness.js";
import { levelVolumeHint } from "../../fitness-plan.js";
import { renderMuscleGroupPicker } from "./MuscleGroupPicker.js";

const PPL_PRESETS_UI = [
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "legs", label: "Legs" },
];

const UL_PRESETS_UI = [
  { id: "upper", label: "Upper" },
  { id: "lower", label: "Lower" },
];

const CALISTHENICS_PRESETS_UI = [
  { id: "upper", label: "Upper" },
  { id: "lower", label: "Lower" },
  { id: "full_body", label: "Full body" },
];

const HIIT_PRESETS_UI = [
  { id: "full_body", label: "Full body" },
  { id: "lower_body", label: "Lower body" },
  { id: "core_engine", label: "Core engine" },
];

function presetsForSplit(splitType) {
  if (splitType === "ul") return UL_PRESETS_UI;
  if (splitType === "calisthenics") return CALISTHENICS_PRESETS_UI;
  if (splitType === "hiit") return HIIT_PRESETS_UI;
  return PPL_PRESETS_UI;
}

export function renderWorkoutBuilderModal(ui, state) {
  const selected = ui.selectedMuscleGroups || [];
  const count = selected.length;
  const preset = ui.workoutBuilderPreset || "custom";
  const settings = { ...defaultFitnessSettings(), ...(state.fitnessSettings || {}) };
  const level = settings.experienceLevel || "beginner";
  const splitType = ["ppl", "ul", "calisthenics", "hiit"].includes(settings.splitType)
    ? settings.splitType
    : "ppl";
  const hint = levelVolumeHint(level, count || 1, splitType, settings.sessionMinutes || 60);
  const presets = presetsForSplit(splitType);
  const isCustom = preset === "custom";
  const title = splitType === "hiit" ? "Pick interval zones" : splitType === "calisthenics" ? "Pick calisthenics focus" : "Pick muscles";
  const subtitle = splitType === "hiit"
    ? "3-5 rounds · 20-45s work · short controlled recovery."
    : splitType === "calisthenics"
      ? "Bodyweight progressions and skill-first strength."
      : `${hint.label}. Gear and prefs already locked in.`;

  return `
    <div class="modal-backdrop modal-enter">
      <div class="modal-sheet modal-scroll-body workout-builder-modal sheet-enter" role="dialog" aria-modal="true" aria-label="Build workout" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <button type="button" class="btn !min-h-11 !px-4" data-action="${ui.workoutBuilderFromSetup ? "workout-builder-back" : "close-modal"}">Back</button>
          <button type="button" class="btn !min-h-11 !px-4" data-action="close-modal">Cancel</button>
        </div>
        <h2 class="display text-[1.75rem] leading-tight mt-4 shrink-0">${title}</h2>
        <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">${escapeHtml(subtitle)}</p>

        <div class="segment mt-4 shrink-0" role="group" aria-label="Workout preset">
          ${presets
            .map(
              (p) =>
                `<button type="button" class="segment-btn ${preset === p.id ? "is-active accent" : ""}" data-action="workout-builder-preset" data-preset="${p.id}">${escapeHtml(p.label)}</button>`
            )
            .join("")}
        </div>
        <p class="mt-2 shrink-0">
          <button type="button" class="coach-strip-link !text-xs" data-action="workout-builder-preset" data-preset="custom" aria-pressed="${isCustom}">
            ${isCustom ? "Building custom ↓" : "or build custom ↓"}
          </button>
        </p>
        <div class="modal-scroll-inner scroll-touch mt-4 muscle-grid-scroll">
          ${renderMuscleGroupPicker(ui, state)}
        </div>
        <div class="shrink-0 pt-4 border-t mt-4 space-y-2" style="border-color:var(--rail)">
          <button type="button" class="btn btn-primary w-full !min-h-11" data-action="save-workout-plan" ${count ? "" : "disabled"}>
            Save${count ? ` · ${count}` : ""}
          </button>
          <button type="button" class="w-full text-center text-xs font-semibold py-2" style="color:var(--mute)" data-action="open-add-exercise-empty">Add single exercise instead</button>
        </div>
      </div>
    </div>
  `;
}
