import { escapeHtml } from "../dom.js";

export function renderExerciseMenu(menu) {
  if (!menu) return "";
  const { sessionId, exerciseId, setId, name, pairId, pairType } = menu;
  const inPair = Boolean(pairId);
  const pairWord = pairType === "circuit" ? "circuit" : "superset";
  return `
    <div class="modal-backdrop exercise-menu-backdrop" data-action="close-exercise-menu">
      <div class="exercise-menu-sheet" role="menu" aria-label="Exercise actions" data-stop>
        <p class="text-xs font-semibold mb-3" style="color:var(--mute)">${escapeHtml(name || "Exercise")}</p>
        <button type="button" class="btn w-full text-left justify-start" role="menuitem"
          data-action="exercise-menu-replace"
          data-session="${escapeHtml(sessionId)}"
          data-exercise="${escapeHtml(exerciseId)}">Replace</button>
        ${
          inPair
            ? `<button type="button" class="btn w-full text-left justify-start mt-2" role="menuitem"
          data-action="exercise-menu-leave-pair"
          data-session="${escapeHtml(sessionId)}"
          data-exercise="${escapeHtml(exerciseId)}">Remove from ${escapeHtml(pairWord)}</button>`
            : ""
        }
        <button type="button" class="btn w-full text-left justify-start mt-2" role="menuitem"
          data-action="exercise-menu-block"
          data-session="${escapeHtml(sessionId)}"
          data-exercise="${escapeHtml(exerciseId)}"
          data-name="${escapeHtml(name || "")}">Don't recommend again</button>
        <button type="button" class="btn btn-danger w-full text-left justify-start mt-2" role="menuitem"
          data-action="exercise-menu-delete"
          data-session="${escapeHtml(sessionId)}"
          data-exercise="${escapeHtml(exerciseId)}"
          data-set="${escapeHtml(setId || "")}">Delete</button>
        <button type="button" class="btn w-full mt-3" data-action="close-exercise-menu">Cancel</button>
      </div>
    </div>
  `;
}
