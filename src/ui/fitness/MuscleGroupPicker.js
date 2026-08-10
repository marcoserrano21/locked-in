import {
  MAIN_MUSCLE_GROUPS,
  ACCESSORY_MUSCLE_GROUPS,
  musclesHitRecently,
  normalizeMuscleGroup,
} from "../../fitness.js";
import { escapeHtml } from "../dom.js";
import { renderMuscleGridIcon } from "../MuscleMap.js";

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
      <span class="muscle-pick-hint">${recent ? "recent" : "100%"}</span>
    </button>`;
}

export function renderMuscleGroupPicker(ui, state) {
  const selected = ui.selectedMuscleGroups || [];
  const hit = musclesHitRecently(state.fitnessLog || [], 2);

  return `
    <div class="muscle-picker space-y-5">
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
