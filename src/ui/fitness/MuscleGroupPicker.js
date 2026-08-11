import {
  MAIN_MUSCLE_GROUPS,
  ACCESSORY_MUSCLE_GROUPS,
  musclesHitRecently,
  normalizeMuscleGroup,
} from "../../fitness.js";
import { escapeHtml } from "../dom.js";
import { renderInteractiveBodyMap, renderMuscleGridIcon } from "../MuscleMap.js";

function renderGroupCell(group, selected, hit) {
  const active = selected.includes(group.id);
  const recent = hit.has(normalizeMuscleGroup(group.id));
  return `
    <button type="button"
      class="muscle-pick-cell ${active ? "is-selected" : ""}"
      data-action="toggle-muscle-group"
      data-group="${escapeHtml(group.id)}"
      aria-pressed="${active}">
      <div class="muscle-pick-icon">${renderMuscleGridIcon(group.id)}</div>
      <span class="muscle-pick-label">${escapeHtml(group.label)}</span>
      ${recent ? `<span class="muscle-pick-hint">recent</span>` : ""}
    </button>`;
}

export function renderMuscleGroupPicker(ui, state) {
  const selected = ui.selectedMuscleGroups || [];
  const hit = musclesHitRecently(state.fitnessLog || [], 2);
  const side = ui.muscleMapSide === "back" ? "back" : "front";

  return `
    <div class="muscle-picker space-y-5">
      <div class="muscle-body-panel">
        <div class="segment" role="group" aria-label="Body view">
          <button type="button" class="segment-btn ${side === "front" ? "is-active accent" : ""}" data-action="muscle-map-side" data-side="front">Front</button>
          <button type="button" class="segment-btn ${side === "back" ? "is-active accent" : ""}" data-action="muscle-map-side" data-side="back">Back</button>
        </div>
        <div class="muscle-body-stage mt-3">
          ${renderInteractiveBodyMap(selected, side)}
        </div>
        <p class="mt-2 text-center text-xs" style="color:var(--mute)">Tap a region to add or remove it.</p>
        ${
          selected.length
            ? `<div class="mt-3 flex flex-wrap justify-center gap-1.5">${selected
                .map(
                  (id) =>
                    `<button type="button" class="chip chip-build" data-action="toggle-muscle-group" data-group="${escapeHtml(id)}">${escapeHtml(id.replace(/_/g, " "))}</button>`
                )
                .join("")}</div>`
            : ""
        }
      </div>
      <div>
        <p class="muscle-section-label">Main muscle groups</p>
        <div class="muscle-pick-grid">
          ${MAIN_MUSCLE_GROUPS.map((g) => renderGroupCell(g, selected, hit)).join("")}
        </div>
      </div>
      <div>
        <p class="muscle-section-label">Accessory muscle groups</p>
        <div class="muscle-pick-grid">
          ${ACCESSORY_MUSCLE_GROUPS.map((g) => renderGroupCell(g, selected, hit)).join("")}
        </div>
      </div>
    </div>
  `;
}
