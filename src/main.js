import "./style.css";
import { inject } from "@vercel/analytics";
import {
  loadState,
  subscribe,
  state,
  ui,
  setUi,
  toggleBlock,
  addUberEntry,
  updateUberEntry,
  deleteUberEntry,
  updateDayBlocks,
  updateDateBlocks,
  exportBackup,
  importBackup,
  markBackupExported,
  resetScheduleToSeed,
  patchState,
  addOutreach,
  updateOutreach,
  deleteOutreach,
  setWorkOverride,
  markCelebrated,
  setThemeSetting,
  setTextSizeSetting,
  toggleHustleCheck,
  resetToTodayUi,
  updateSettings,
  setDay30Answer,
  resetApp,
  listProfiles,
  switchProfile,
  createProfile,
  renameProfile,
  deleteProfile,
  setChallengeLength,
  setDay30Questions,
  addDay30Question,
  removeDay30Question,
  reorderDay30Question,
  setAppMode,
  advanceTour,
  unlockModule,
  needsWelcome,
  completeWelcome,
  finishOnboarding,
  loadMarcoDemo,
  startWorkout,
  addExerciseToSession,
  replaceSessionExercises,
  addFitnessSet,
  updateFitnessSet,
  toggleFitnessSetDone,
  deleteFitnessSet,
  deleteFitnessExercise,
  reorderFitnessUnits,
  cloneSessionExercises,
  restoreSessionExercises,
  removeExerciseFromPair,
  dissolveFitnessPair,
  completeWorkout,
  endWorkoutSession,
  deleteWorkout,
  toggleEquipment,
  blockExercise,
  replaceExerciseInSession,
  setPremiumUnlocked,
  updateHustlePlaybook,
  restartFromOnboarding,
  toggleFavoriteExercise,
  unblockExercise,
  patchFitnessSettings,
  toggleTrainWhy,
  toggleSessionTimer,
} from "./store.js";
import { startChallenge, challengeDayNumber, isChallengeUnlocked } from "./challenge.js";
import { blocksFor, uid } from "./schedule.js";
import { todayKey, snapTimeInputValue } from "./dates.js";
import { resolveBlocksForDate } from "./work.js";
import { renderDateCal, formatDateFieldDisplay } from "./ui/DatePicker.js";
import {
  activeSessionForDate,
  canCompleteWorkout,
  defaultFitnessSettings,
  PPL_PRESETS,
  UL_PRESETS,
  CALISTHENICS_PRESETS,
  HIIT_PRESETS,
  restSecondsForGoal,
  shouldAutoStartRest,
  normalizeFocusExercise,
  resolveFocusFromPlan,
} from "./fitness.js";
import { generateWorkoutPlan } from "./fitness-plan.js";
import { mergePlaybookFor } from "./hustle-playbook.js";
import { completionForDate } from "./streaks.js";
import { applyTheme, applyTextSize, cycleTheme, getStoredTheme } from "./theme.js";
import { enableBlockReminders, scheduleNextBlockReminder } from "./reminders.js";
import { hapticCheck, hapticSuccess, playRestChime } from "./haptics.js";
import { renderNav, visibleTabs } from "./ui/Nav.js";
import { renderToday, patchTodayTrack } from "./ui/Today.js";
import { renderProof } from "./ui/Proof.js";
import { renderMiles, renderUberEditorModal } from "./ui/Miles.js";
import { renderFreelance, renderOutreachEditorModal } from "./ui/Freelance.js";
import {
  renderAddExerciseModal,
  renderFitnessCelebrate,
  renderWorkoutDetailModal,
  patchFitnessExpandState,
  patchFitnessSetCommit,
  patchAddExerciseResults,
  patchSessionTimerClock,
} from "./ui/Fitness.js";
import { renderWorkoutBuilderModal } from "./ui/fitness/WorkoutBuilderModal.js";
import { renderFitnessPrefsModal } from "./ui/fitness/FitnessPrefsModal.js";
import { renderWelcomeModal } from "./ui/Welcome.js";
import { renderTipsModal } from "./ui/Tips.js";
import {
  renderBlockEditorModal,
  renderEditConfirmModal,
  createBlockFromForm,
  isSaveBlockEnabled,
  renderShiftSheet,
} from "./ui/Plan.js";
import { shareProgress } from "./share.js";
import {
  renderProfile,
  renderResetConfirmModal,
  renderRestartOnboardingModal,
  renderProfileEditorModal,
  renderDeleteProfileModal,
} from "./ui/Profile.js";
import { renderCommitModal } from "./ui/Commit.js";
import { renderCelebrate } from "./ui/Celebrate.js";
import { renderToast } from "./ui/Install.js";

import { renderHustleEditorModal, makeFlowItem, makeRampWeek } from "./ui/HustleEditor.js";
import { computeStreak } from "./streaks.js";
import { listBetaGuestLinks } from "./beta.js";

const app = document.getElementById("app");
let pendingPlanAction = null;
let toastTimer = null;
/** When true, next subscribe render tries Today region patch instead of full remount. */
let preferTodayPatch = false;
/** When true, next subscribe render patches Fitness expand state instead of full remount. */
let preferFitnessPatch = false;
/** Skip remount after set weight/reps commit so the caret stays put. */
let preferFitnessSetPatch = false;
/** Patch add-exercise results without remounting the search field. */
let preferAddExerciseSearchPatch = false;
/** Skip remount after body-weight commit so the caret stays put. */
let preferBodyWeightSkip = false;
let deferredInstallPrompt = null;
let canInstallPwa = false;
let lastTab = null;
let splashDismissed = false;

function currentTheme() {
  return state?.settings?.theme || getStoredTheme();
}

function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  setUi({ toast: { message } });
  toastTimer = setTimeout(() => {
    setUi({ toast: null });
    toastTimer = null;
  }, 2200);
}

function focusExerciseSearch() {
  requestAnimationFrame(() => {
    document.getElementById("add-exercise-search")?.focus({ preventScroll: true });
  });
}

function exerciseHasLoggedSets(sessionId, exerciseId) {
  const session = (state.fitnessLog || []).find((item) => item.id === sessionId);
  const exercise = (session?.exercises || []).find((item) => item.id === exerciseId);
  return (exercise?.sets || []).some((set) => set.done);
}

function confirmExerciseReplace(sessionId, exerciseId) {
  if (!exerciseHasLoggedSets(sessionId, exerciseId)) return true;
  return window.confirm(
    "Replace this exercise? Its completed sets will be cleared. The rest of today's session stays unchanged."
  );
}

function addCustomExerciseFromSearch(sessionId, name) {
  const trimmed = String(name || "").trim();
  if (!sessionId || !trimmed) return false;
  const replacing = ui.replaceExercise;
  if (replacing?.sessionId && replacing?.exerciseId) {
    if (!confirmExerciseReplace(replacing.sessionId, replacing.exerciseId)) return false;
    replaceExerciseInSession(replacing.sessionId, replacing.exerciseId, trimmed);
  } else {
    addExerciseToSession(sessionId, trimmed);
  }
  clearModalState();
  showToast(replacing ? "Exercise replaced" : "Exercise added");
  return true;
}

function convertBodyWeight(value, fromUnit, toUnit) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (fromUnit === toUnit) return n;
  if (fromUnit === "lb" && toUnit === "kg") return Math.round((n / 2.20462) * 10) / 10;
  return Math.round(n * 2.20462);
}

function showFlash(type, message) {
  setUi({ flash: { type, message }, tab: "profile" });
}

function renderBootError(message) {
  dismissSplash();
  app.innerHTML = `
    <section class="screen p-4">
      <p class="eyebrow" style="color:var(--danger)">Startup error</p>
      <h1 class="display text-3xl mt-1">Could not load your track</h1>
      <p class="mt-3 text-sm" style="color:var(--mute)">${String(message || "Unknown error").replace(/[<>&]/g, "")}</p>
      <button type="button" class="btn btn-primary mt-5 w-full" id="boot-reset">Clear saved data & reload</button>
    </section>`;
  document.getElementById("boot-reset")?.addEventListener("click", () => {
    localStorage.removeItem("marco-tracker-v4");
    localStorage.removeItem("marco-tracker-v3");
    localStorage.removeItem("marco-tracker-v2");
    localStorage.removeItem("marco-tracker-v1");
    location.reload();
  });
}

function dismissSplash() {
  if (splashDismissed) return;
  splashDismissed = true;
  const splash = document.getElementById("app-splash");
  if (!splash) return;
  splash.classList.add("is-leaving");
  const remove = () => splash.remove();
  splash.addEventListener("transitionend", remove, { once: true });
  setTimeout(remove, 500);
}

function ensureTipsModal() {
  // Tips open only via explicit user action (open-tips).
}

function render() {
  if (fitnessPointerDragging) return;
  if (!state) {
    renderBootError("Saved profile data is missing or corrupt.");
    return;
  }
  try {
  const needsCommit =
    !state.challenge?.startDate &&
    ui.modal !== "welcome" &&
    !needsWelcome &&
    ui.modal !== "tips" &&
    !state.settings?.onboardingCompleted;

  if (
    preferTodayPatch &&
    !needsCommit &&
    !ui.celebrate &&
    !ui.modal &&
    ui.tab === "today" &&
    (ui.todayMode || "track") === "track"
  ) {
    preferTodayPatch = false;
    if (patchTodayTrack(app, state, ui, { canInstall: canInstallPwa })) {
      scheduleNextBlockReminder(state, ui.selectedDate || todayKey());
      return;
    }
  }
  preferTodayPatch = false;

  if (
    preferFitnessPatch &&
    !needsCommit &&
    !ui.celebrate &&
    !ui.modal &&
    ui.tab === "freelance" &&
    (ui.hustleView || "fitness") === "fitness"
  ) {
    preferFitnessPatch = false;
    if (patchFitnessExpandState(app, state, ui)) return;
  }
  preferFitnessPatch = false;

  if (
    preferFitnessSetPatch &&
    !needsCommit &&
    !ui.celebrate &&
    !ui.modal &&
    ui.tab === "freelance" &&
    (ui.hustleView || "fitness") === "fitness"
  ) {
    preferFitnessSetPatch = false;
    if (patchFitnessSetCommit(app, state, ui)) return;
  }
  preferFitnessSetPatch = false;

  if (preferAddExerciseSearchPatch && ui.modal === "add-exercise") {
    preferAddExerciseSearchPatch = false;
    if (patchAddExerciseResults(app, ui, state.fitnessSettings)) return;
  }
  preferAddExerciseSearchPatch = false;

  if (preferBodyWeightSkip) {
    preferBodyWeightSkip = false;
    return;
  }

  const tabChanged = lastTab != null && lastTab !== ui.tab;
  lastTab = ui.tab;

  let body = "";
  if (ui.tab === "proof") body = renderProof(state, ui);
  else if (ui.tab === "miles") body = renderMiles(state, ui);
  else if (ui.tab === "freelance") body = renderFreelance(state, ui);
  else if (ui.tab === "profile") body = renderProfile(state, ui, listProfiles());
  else body = renderToday(state, ui, { canInstall: canInstallPwa });

  let modal = "";
  if (needsCommit) modal = renderCommitModal(state);
  else if (ui.modal === "edit-confirm") modal = renderEditConfirmModal();
  else if (ui.modal === "block-editor") modal = renderBlockEditorModal(ui);
  else if (ui.modal === "uber-editor") modal = renderUberEditorModal(ui, state);
  else if (ui.modal === "outreach-editor") modal = renderOutreachEditorModal(ui);
  else if (ui.modal === "profile-editor") modal = renderProfileEditorModal(ui, listProfiles());
  else if (ui.modal === "delete-profile") modal = renderDeleteProfileModal(ui);
  else if (ui.modal === "reset-confirm") modal = renderResetConfirmModal(state);
  else if (ui.modal === "restart-onboarding") modal = renderRestartOnboardingModal(state);
  else if (ui.modal === "welcome") modal = renderWelcomeModal(ui, state);
  else if (ui.modal === "tips") modal = renderTipsModal(state, ui);
  else if (ui.modal === "add-exercise") modal = renderAddExerciseModal(ui, state.fitnessSettings);
  else if (ui.modal === "fitness-prefs" || ui.modal === "workout-setup")
    modal = renderFitnessPrefsModal(ui, state);
  else if (ui.modal === "workout-builder") modal = renderWorkoutBuilderModal(ui, state);
  else if (ui.modal === "workout-detail") modal = renderWorkoutDetailModal(state, ui);

  else if (ui.modal === "hustle-editor") modal = renderHustleEditorModal(state, ui);
  else if (ui.modal === "shift-sheet") modal = renderShiftSheet(ui, state);

  const celebrate = ui.celebrate
    ? ui.celebrate.type === "fitness"
      ? renderFitnessCelebrate(ui.celebrate, ui)
      : renderCelebrate(ui.celebrate, state)
    : "";
  const toast = renderToast(ui.toast);

  const scrollModals = new Set(["workout-setup", "fitness-prefs", "workout-builder", "add-exercise"]);
  let savedModalScroll = null;
  if (scrollModals.has(ui.modal)) {
    const scroller = app.querySelector(".modal-scroll-inner");
    if (scroller) savedModalScroll = scroller.scrollTop;
  }

  const focusSnap = captureFocus();
  const modalJustOpened = ui.modal !== lastTrappedModal;

  app.innerHTML = `
    <div class="screen-fade ${tabChanged ? "is-entering" : ""}" data-app-body>
    ${body}
    </div>
    ${needsCommit ? "" : renderNav(ui.tab, state)}
    ${modal}
    ${celebrate}
    ${toast}
  `;

  if (savedModalScroll != null && scrollModals.has(ui.modal)) {
    const nextScroller = app.querySelector(".modal-scroll-inner");
    if (nextScroller) nextScroller.scrollTop = savedModalScroll;
  }

  restoreFocus(focusSnap);
  trapModalFocus({
    focusFirst: modalJustOpened && Boolean(ui.modal) && ui.modal !== "add-exercise",
  });
  lastTrappedModal = ui.modal || null;

  scheduleNextBlockReminder(state, ui.selectedDate || todayKey());
  ensureTipsModal();
  requestAnimationFrame(() => dismissSplash());
  } catch (error) {
    console.error("render failed", error);
    renderBootError(error?.message || "Render failed");
  }
}

function withPlanFriction(action) {
  if (state.challenge?.status === "active") {
    pendingPlanAction = action;
    setUi({ modal: "edit-confirm" });
    return;
  }
  action();
}

function getBlocksContext(mode, day, date) {
  if (mode === "date") return resolveBlocksForDate(state, date).map((b) => ({ ...b }));
  return blocksFor(state, day).map((b) => ({ ...b }));
}

function saveBlocksContext(mode, day, date, blocks, note) {
  if (mode === "date") updateDateBlocks(date, blocks, note);
  else updateDayBlocks(day, blocks, note);
}

function maybeCelebrate(date) {
  const c = completionForDate(state, date);
  if (c.complete && !state.celebrations?.[date]) {
    hapticSuccess();
    if (!state.settings?.tourCompleted) {
      updateSettings({ tourCompleted: true });
    }
    setUi({
      celebrate: {
        date,
        doneCore: c.doneCore,
        coreCount: c.coreCount,
      },
    });
  }
}

/** Seal a fitness session and open the full-screen completion screen. */
function sealFitnessSession(sessionId) {
  if (!sessionId) return false;
  if (ui.celebrate?.type === "fitness") return false;
  const session = (state.fitnessLog || []).find((w) => w.id === sessionId);
  if (!session || session.completedAt) {
    showToast("Workout already sealed");
    return false;
  }
  const gate = canCompleteWorkout(session);
  if (!gate.ok) {
    showToast(gate.reason || "Fill weight and reps on every set");
    return false;
  }
  const payload = completeWorkout(sessionId);
  if (!payload) return false;
  hapticSuccess();
  setUi({
    celebrate: payload,
    fitnessTab: "today",
    restTimer: null,
    fitnessOpenExerciseId: null,
    fitnessOpenMode: "multi",
    fitnessOpenIds: [],
    fitnessCooldownChecked: [],
    fitnessCooldownSkipped: false,
  });
  return true;
}

/** End session early with partial celebrate. */
function endFitnessSessionEarly(sessionId) {
  if (!sessionId) return false;
  if (ui.celebrate?.type === "fitness") return false;
  const session = (state.fitnessLog || []).find((w) => w.id === sessionId);
  if (!session || session.completedAt) {
    showToast("Workout already sealed");
    return false;
  }
  const hasWork =
    (session.exercises || []).some((ex) => (ex.sets || []).some((s) => s.done)) ||
    (session.exercises || []).length > 0;
  if (!hasWork) {
    showToast("Nothing to seal yet");
    return false;
  }
  if (!window.confirm("End session now? Logged sets are saved. Incomplete sets stay incomplete.")) {
    return false;
  }
  const payload = endWorkoutSession(sessionId);
  if (!payload) return false;
  hapticSuccess();
  setUi({
    celebrate: payload,
    fitnessTab: "today",
    restTimer: null,
    fitnessOpenExerciseId: null,
    fitnessOpenMode: "multi",
    fitnessOpenIds: [],
    fitnessCooldownChecked: [],
    fitnessCooldownSkipped: false,
  });
  return true;
}

function downloadExport() {
  const blob = new Blob([exportBackup()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `marco-locked-in-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  markBackupExported();
  showToast("Backup exported");
}

function closeDateField(field) {
  if (!field) return;
  field.classList.remove("is-open");
  const trigger = field.querySelector(".date-field-trigger");
  const popover = field.querySelector(".date-popover");
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  if (popover) popover.hidden = true;
}

function closeAllDateFields(except = null) {
  app.querySelectorAll(".date-field.is-open").forEach((field) => {
    if (except && field === except) return;
    closeDateField(field);
  });
}

function openDateField(field) {
  if (!field) return;
  closeAllDateFields(field);
  const input = field.querySelector(".date-field-input");
  const popover = field.querySelector(".date-popover");
  const trigger = field.querySelector(".date-field-trigger");
  const selected = input?.value || todayKey();
  const [y, m] = selected.split("-").map(Number);
  if (popover) {
    popover.innerHTML = renderDateCal({
      selected,
      viewYear: y,
      viewMonth: m - 1,
    });
    popover.hidden = false;
  }
  field.classList.add("is-open");
  if (trigger) trigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => {
    const focusDay =
      popover?.querySelector(".date-cal-day.is-selected") ||
      popover?.querySelector(".date-cal-day.is-today") ||
      popover?.querySelector(".date-cal-day:not(.is-outside)");
    try {
      focusDay?.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  });
}

function refreshDateCal(field, viewYear, viewMonth) {
  const popover = field?.querySelector(".date-popover");
  const input = field?.querySelector(".date-field-input");
  if (!popover) return;
  popover.innerHTML = renderDateCal({
    selected: input?.value || todayKey(),
    viewYear,
    viewMonth,
  });
  requestAnimationFrame(() => {
    const focusDay =
      popover.querySelector(".date-cal-day.is-selected") ||
      popover.querySelector(".date-cal-day.is-today:not(.is-outside)") ||
      popover.querySelector(".date-cal-day:not(.is-outside)");
    try {
      focusDay?.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  });
}

function commitDateFieldValue(field, key) {
  if (!field || !key) return;
  const input = field.querySelector(".date-field-input");
  const valueEl = field.querySelector(".date-field-value");
  if (input) input.value = key;
  if (valueEl) valueEl.textContent = formatDateFieldDisplay(key);
  closeDateField(field);
  const action = input?.dataset?.action;
  if (action === "set-override-date") {
    const day = new Date(`${key}T12:00:00`).getDay();
    setUi({ overrideDate: key, selectedDay: day });
    return;
  }
  if (action === "select-today-date") {
    const day = new Date(`${key}T12:00:00`).getDay();
    setUi({
      selectedDate: key,
      selectedDay: day,
      openBlockMenuIndex: null,
    });
    return;
  }
  if (input) {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function clearModalState() {
  pendingPlanAction = null;
  setUi({
    modal: null,
    editingBlock: null,
    editingEvent: null,
    editingUber: null,
    editingOutreach: null,
    editingProfile: null,
    deletingProfile: null,
    fitnessAddSession: null,
    fitnessAddPairId: null,
    fitnessAddPairType: null,
    fitnessSearch: "",
    fitnessMuscle: "all",
    fitnessListFilter: "all",
    fitnessEquipmentFilter: null,
    viewingWorkoutId: null,
    shiftSheetType: null,
    replaceExercise: null,
    openExerciseMenu: null,
    openBlockMenuIndex: null,

    tipsTrack: null,
    rebuildSessionId: null,
    selectedMuscleGroups: ui.modal === "workout-builder" ? [] : ui.selectedMuscleGroups,
  });
}

let modalFocusHandler = null;
let lastTrappedModal = null;
let fitnessSearchTimer = null;

function captureFocus() {
  const el = document.activeElement;
  if (!el || el === document.body || !app.contains(el)) return null;
  const tag = el.tagName;
  if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !el.isContentEditable) return null;
  return {
    id: el.id || null,
    name: el.getAttribute("name") || null,
    action: el.dataset?.action || null,
    field: el.dataset?.field || null,
    session: el.dataset?.session || null,
    exercise: el.dataset?.exercise || null,
    set: el.dataset?.set || null,
    value: el.value,
    start: typeof el.selectionStart === "number" ? el.selectionStart : null,
    end: typeof el.selectionEnd === "number" ? el.selectionEnd : null,
  };
}

function restoreFocus(snap) {
  if (!snap) return;
  let next = null;
  if (snap.id) next = app.querySelector(`#${CSS.escape(snap.id)}`);
  if (!next && snap.action === "fitness-set-field" && snap.session && snap.exercise && snap.set && snap.field) {
    next = app.querySelector(
      `[data-action="fitness-set-field"][data-session="${CSS.escape(snap.session)}"][data-exercise="${CSS.escape(snap.exercise)}"][data-set="${CSS.escape(snap.set)}"][data-field="${CSS.escape(snap.field)}"]`
    );
  }
  if (!next && snap.name) {
    next = app.querySelector(`[name="${CSS.escape(snap.name)}"]`);
  }
  if (!next && snap.action) {
    next = app.querySelector(`[data-action="${CSS.escape(snap.action)}"]`);
  }
  if (!next) return;
  try {
    next.focus({ preventScroll: true });
    const len = String(next.value ?? "").length;
    if (typeof next.setSelectionRange === "function") {
      try {
        if (snap.start != null) {
          next.setSelectionRange(Math.min(snap.start, len), Math.min(snap.end ?? snap.start, len));
        } else {
          next.setSelectionRange(len, len);
        }
      } catch {
        try {
          next.setSelectionRange(len, len);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

function patchRestTimerBar() {
  const bar = app.querySelector(".rest-timer-bar .rest-timer-count");
  const timer = ui.restTimer;
  if (!bar || !timer?.endsAt) return false;
  const left = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  const mm = String(Math.floor(left / 60));
  const ss = String(left % 60).padStart(2, "0");
  bar.textContent = `${mm}:${ss}`;
  return true;
}

function commitFitnessSetField(el) {
  if (!el?.dataset?.session || !el.dataset.exercise || !el.dataset.set || !el.dataset.field) return;
  const value = el.dataset.field === "reps" ? parseInt(el.value, 10) : parseFloat(el.value);
  preferFitnessSetPatch = true;
  updateFitnessSet(el.dataset.session, el.dataset.exercise, el.dataset.set, {
    [el.dataset.field]: Number.isFinite(value) ? value : 0,
  });
}

function commitBodyWeight(el) {
  const raw = String(el?.value || "").trim();
  const n = parseFloat(raw);
  preferBodyWeightSkip = true;
  if (!raw || !Number.isFinite(n) || n <= 0) {
    patchFitnessSettings({ bodyWeight: null, bodyWeightEntered: false });
    return;
  }
  patchFitnessSettings({ bodyWeight: n, bodyWeightEntered: true });
}

function placeCaretAtEnd(el) {
  if (!el || typeof el.setSelectionRange !== "function") return;
  const len = String(el.value ?? "").length;
  try {
    el.setSelectionRange(len, len);
  } catch {
    /* ignore */
  }
}

function trapModalFocus({ focusFirst = false } = {}) {
  if (modalFocusHandler) {
    document.removeEventListener("keydown", modalFocusHandler);
    modalFocusHandler = null;
  }
  const sheet = app.querySelector('[role="dialog"]');
  if (!sheet) return;
  const focusable = [...sheet.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeInside = sheet.contains(document.activeElement);
  if (focusFirst && !activeInside) {
    requestAnimationFrame(() => {
      try {
        first.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    });
  }
  modalFocusHandler = (e) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", modalFocusHandler);
}

app.addEventListener("click", (event) => {
  // Modals close only via Cancel / Back / close-modal — not empty backdrop taps.
  const t = event.target.closest("[data-action]");
  if (!t) {
    if (!event.target.closest(".date-field")) closeAllDateFields();
    return;
  }
  const action = t.dataset.action;
  if (action === "set-body-weight" || action === "fitness-set-field") return;

  if (action === "toggle-date-picker") {
    const field = t.closest(".date-field");
    if (!field) return;
    if (field.classList.contains("is-open")) closeDateField(field);
    else openDateField(field);
    return;
  }

  if (action === "date-cal-prev" || action === "date-cal-next") {
    const field = t.closest(".date-field");
    const cal = t.closest(".date-cal");
    if (!field || !cal) return;
    let y = Number(cal.dataset.viewYear);
    let m = Number(cal.dataset.viewMonth);
    if (action === "date-cal-prev") {
      m -= 1;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
    } else {
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    refreshDateCal(field, y, m);
    return;
  }

  if (action === "date-cal-today") {
    const field = t.closest(".date-field");
    commitDateFieldValue(field, todayKey());
    return;
  }

  if (action === "date-pick") {
    const field = t.closest(".date-field");
    commitDateFieldValue(field, t.dataset.date);
    return;
  }

  if (!t.closest(".date-field")) closeAllDateFields();

  if (action === "close-modal") {
    clearModalState();
    return;
  }

  if (action === "set-tab") {
    if (t.dataset.tab === "today") {
      resetToTodayUi();
      setUi({ tab: "today" });
    } else if (t.dataset.tab === "plan") {
      setUi({ tab: "today", todayMode: "edit" });
    } else {
      setUi({ tab: t.dataset.tab });
    }
    return;
  }

  if (action === "today-mode") {
    setUi({ todayMode: t.dataset.mode, tab: "today" });
    return;
  }

  if (action === "hustle-tab") {
    setUi({ hustleTab: t.dataset.tab, hustleLogPage: 0 });
    return;
  }

  if (action === "hustle-view") {
    setUi({ hustleView: t.dataset.view });
    return;
  }

  if (action === "fitness-tab") {
    setUi({ fitnessTab: t.dataset.tab, fitnessHistoryPage: 0, fitnessHistoryFocus: null });
    return;
  }

  if (action === "fitness-history-focus") {
    const next = t.dataset.focus || null;
    setUi({ fitnessHistoryFocus: ui.fitnessHistoryFocus === next ? null : next });
    return;
  }

  if (action === "start-workout") {
    startWorkout();
    showToast("Workout started");
    return;
  }

  if (action === "open-workout-builder") {
    const settings = state.fitnessSettings || defaultFitnessSettings();
    const prefs = Boolean(settings.prefsCaptured);
    setUi({
      modal: prefs ? "workout-builder" : "workout-setup",
      fitnessPrefsMode: "build",
      selectedMuscleGroups: [],
      workoutBuilderPreset: "custom",
      workoutBuilderFromSetup: false,
    });
    if (prefs) {
      requestAnimationFrame(() => {
        const scroller = document.querySelector(".modal-scroll-inner");
        if (scroller) scroller.scrollTop = 0;
        document.getElementById("muscle-picker-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    return;
  }

  if (action === "workout-builder-back") {
    setUi({
      modal: "workout-setup",
      fitnessPrefsMode: "build",
      workoutBuilderFromSetup: false,
    });
    return;
  }

  if (action === "open-fitness-prefs") {
    setUi({
      modal: "workout-setup",
      fitnessPrefsMode: "edit",
      fitnessSessionMenuOpen: false,
      fitnessRestPresetsOpen: false,
    });
    return;
  }

  if (action === "fitness-prefs-continue" || action === "workout-setup-continue") {
    const settings = state.fitnessSettings || defaultFitnessSettings();
    const why = settings.trainWhy || [];
    if (!settings.goal) {
      showToast("Pick an outcome");
      return;
    }
    if (!why.length) {
      showToast("Pick at least one why");
      return;
    }
    if (!(settings.equipmentAvailable || []).length) {
      showToast("Pick at least one piece of equipment");
      return;
    }
    const restSeconds = restSecondsForGoal(settings.goal);
    patchFitnessSettings({ prefsCaptured: true, restSeconds });
    if (ui.fitnessPrefsMode === "edit") {
      setUi({ modal: null });
      showToast("Training setup saved · active workout kept");
      return;
    }
    setUi({
      modal: "workout-builder",
      selectedMuscleGroups: [],
      workoutBuilderPreset: "custom",
      workoutBuilderFromSetup: true,
    });
    requestAnimationFrame(() => {
      const scroller = document.querySelector(".modal-scroll-inner");
      if (scroller) scroller.scrollTop = 0;
      document.getElementById("muscle-picker-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return;
  }

  if (action === "set-split-type") {
    const split = ["ppl", "ul", "calisthenics", "hiit"].includes(t.dataset.split)
      ? t.dataset.split
      : "ppl";
    patchFitnessSettings({ splitType: split });
    return;
  }

  if (action === "set-gym-days") {
    const days = Math.min(6, Math.max(2, Number(t.dataset.days) || 4));
    patchFitnessSettings({ gymDaysPerWeek: days });
    return;
  }

  if (action === "set-session-minutes") {
    const mins = Number(t.dataset.minutes);
    const sessionMinutes = [30, 45, 60, 90].includes(mins) ? mins : 60;
    patchFitnessSettings({ sessionMinutes });
    return;
  }

  if (action === "toggle-fitness-exercise") {
    const id = t.dataset.exercise || "";
    const expanded = t.getAttribute("aria-expanded") === "true";
    preferFitnessPatch = true;
    const openFromDom = [...app.querySelectorAll('[data-action="toggle-fitness-exercise"][aria-expanded="true"]')]
      .map((btn) => btn.dataset.exercise)
      .filter(Boolean);
    let next;
    if (expanded) {
      next = openFromDom.filter((x) => x !== id);
    } else {
      next = [...new Set([...openFromDom, id])];
    }
    setUi({ fitnessOpenMode: "multi", fitnessOpenIds: next, fitnessOpenExerciseId: id });
    return;
  }

  if (action === "toggle-fitness-pair") {
    const pairId = t.dataset.pairId || "";
    if (!pairId) return;
    const collapsed = ui.fitnessCollapsedPairIds || [];
    const next = collapsed.includes(pairId)
      ? collapsed.filter((id) => id !== pairId)
      : [...collapsed, pairId];
    setUi({ fitnessCollapsedPairIds: next });
    return;
  }

  if (action === "fitness-expand-all") {
    preferFitnessPatch = true;
    setUi({ fitnessOpenMode: "all", fitnessOpenIds: [], fitnessCollapsedPairIds: [] });
    return;
  }

  if (action === "fitness-collapse-all") {
    preferFitnessPatch = true;
    setUi({ fitnessOpenMode: "none", fitnessOpenIds: [] });
    return;
  }

  if (action === "toggle-session-timer") {
    toggleSessionTimer(t.dataset.session);
    return;
  }

  if (action === "workout-builder-preset") {
    const preset = t.dataset.preset || "custom";
    const settings = state.fitnessSettings || defaultFitnessSettings();
    const split = ["ppl", "ul", "calisthenics", "hiit"].includes(settings.splitType)
      ? settings.splitType
      : "ppl";
    const map =
      split === "ul"
        ? UL_PRESETS
        : split === "calisthenics"
          ? CALISTHENICS_PRESETS
          : split === "hiit"
            ? HIIT_PRESETS
            : PPL_PRESETS;
    const groups = preset === "custom" ? ui.selectedMuscleGroups || [] : [...(map[preset] || [])];
    setUi({ workoutBuilderPreset: preset, selectedMuscleGroups: groups });
    if (preset === "custom") {
      requestAnimationFrame(() => {
        const scroller = document.querySelector(".modal-scroll-inner");
        if (scroller) scroller.scrollTop = 0;
        document.getElementById("muscle-picker-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    return;
  }

  if (action === "toggle-muscle-group") {
    const group = t.dataset.group;
    const current = ui.selectedMuscleGroups || [];
    const next = current.includes(group) ? current.filter((g) => g !== group) : [...current, group];
    setUi({ selectedMuscleGroups: next, workoutBuilderPreset: "custom" });
    return;
  }

  if (action === "muscle-map-side") {
    setUi({ muscleMapSide: t.dataset.side === "back" ? "back" : "front" });
    return;
  }

  if (action === "save-workout-plan") {
    const groups = ui.selectedMuscleGroups || [];
    if (!groups.length) {
      showToast("Pick at least one muscle group");
      return;
    }
    const settings = state.fitnessSettings || defaultFitnessSettings();
    const plan = generateWorkoutPlan({
      selectedGroups: groups,
      equipment: settings.equipmentAvailable || defaultFitnessSettings().equipmentAvailable,
      log: state.fitnessLog || [],
      blocked: settings.blockedExercises || [],
      experienceLevel: settings.experienceLevel || "beginner",
      goal: settings.goal || "build_muscle",
      trainWhy: settings.trainWhy || [],
      splitType: settings.splitType || "ppl",
      gymDaysPerWeek: settings.gymDaysPerWeek || 4,
      sessionMinutes: settings.sessionMinutes || 60,
      bodyWeight: settings.bodyWeight,
      preferredUnit: settings.preferredUnit || "lb",
      focusExercise: settings.focusExercise || null,
    });
    const rebuildId = ui.rebuildSessionId || null;
    const existing =
      (rebuildId && (state.fitnessLog || []).find((w) => w.id === rebuildId && !w.completedAt)) ||
      activeSessionForDate(state.fitnessLog);
    if (existing?.id) {
      const hasLoggedWork = (existing.exercises || []).some((ex) => (ex.sets || []).some((set) => set.done));
      if (hasLoggedWork && !window.confirm("Replace today's workout plan? Completed exercise logs will be cleared.")) return;
      replaceSessionExercises(existing.id, plan);
    } else {
      startWorkout();
      const session = activeSessionForDate(state.fitnessLog);
      if (session?.id) {
        plan.forEach((ex) =>
          addExerciseToSession(session.id, ex.name, ex.muscleGroup, {
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            duration: ex.duration,
            measurement: ex.measurement,
            pairId: ex.pairId,
            pairType: ex.pairType,
            role: ex.role,
            restSeconds: ex.restSeconds,
          })
        );
      }
    }
    const nextFocus = resolveFocusFromPlan(plan, settings.focusExercise);
    patchFitnessSettings({
      focusExercise: nextFocus,
      ...(settings.goal ? { restSeconds: restSecondsForGoal(settings.goal) } : {}),
    });
    clearModalState();
    showToast(plan.length ? `Built ${plan.length} exercises` : "No matches for your equipment");
    return;
  }

  if (action === "open-add-exercise-empty") {
    startWorkout();
    const session = activeSessionForDate(state.fitnessLog);
    const settings = state.fitnessSettings || defaultFitnessSettings();
    setUi({
      modal: "add-exercise",
      fitnessAddSession: session?.id || "",
      fitnessSearch: "",
      fitnessMuscle: "all",
      fitnessListFilter: "all",
      fitnessEquipmentFilter: [...(settings.equipmentAvailable || defaultFitnessSettings().equipmentAvailable)],
      replaceExercise: null,
      selectedMuscleGroups: [],
    });
    focusExerciseSearch();
    return;
  }

  if (action === "open-add-exercise") {
    const settings = state.fitnessSettings || defaultFitnessSettings();
    setUi({
      modal: "add-exercise",
      fitnessAddSession: t.dataset.session,
      fitnessSearch: "",
      fitnessMuscle: "all",
      fitnessListFilter: "all",
      fitnessEquipmentFilter: [...(settings.equipmentAvailable || defaultFitnessSettings().equipmentAvailable)],
      replaceExercise: null,
      fitnessAddPairId: t.dataset.pairId || null,
      fitnessAddPairType: t.dataset.pairType || null,
    });
    focusExerciseSearch();
    return;
  }

  if (action === "fitness-list-filter") {
    setUi({ fitnessListFilter: t.dataset.filter || "all" });
    return;
  }

  if (action === "toggle-favorite-exercise") {
    toggleFavoriteExercise(t.dataset.name);
    return;
  }

  if (action === "unblock-exercise") {
    unblockExercise(t.dataset.name);
    showToast("Exercise unblocked");
    return;
  }

  if (action === "toggle-equipment-panel") {
    setUi({ fitnessEquipmentOpen: !ui.fitnessEquipmentOpen });
    return;
  }

  if (action === "fitness-equipment-more") {
    setUi({ fitnessEquipmentMore: !ui.fitnessEquipmentMore });
    return;
  }

  if (action === "open-workout-detail") {
    setUi({ modal: "workout-detail", viewingWorkoutId: t.dataset.session });
    return;
  }

  if (action === "pick-exercise") {
    const pairMeta =
      ui.fitnessAddPairId && ui.fitnessAddPairType
        ? { pairId: ui.fitnessAddPairId, pairType: ui.fitnessAddPairType }
        : {};
    addExerciseToSession(t.dataset.session, t.dataset.name, t.dataset.muscle || "", pairMeta);
    clearModalState();
    showToast(pairMeta.pairId ? "Added to group" : "Exercise added");
    return;
  }

  if (action === "replace-pick-exercise") {
    const target = ui.replaceExercise;
    if (target?.sessionId && target?.exerciseId) {
      if (!confirmExerciseReplace(target.sessionId, target.exerciseId)) return;
      replaceExerciseInSession(target.sessionId, target.exerciseId, t.dataset.name, t.dataset.muscle || "");
      clearModalState();
      showToast("Exercise replaced");
    }
    return;
  }

  if (action === "add-search-custom-exercise") {
    addCustomExerciseFromSearch(t.dataset.session, t.dataset.name);
    return;
  }

  if (action === "open-exercise-menu") {
    setUi({
      openExerciseMenu: {
        sessionId: t.dataset.session,
        exerciseId: t.dataset.exercise,
        setId: t.dataset.set || "",
        name: t.dataset.name || "",
        pairId: t.dataset.pairId || "",
        pairType: t.dataset.pairType || "",
      },
    });
    return;
  }

  if (action === "toggle-block-menu") {
    const idx = Number(t.dataset.index);
    setUi({ openBlockMenuIndex: ui.openBlockMenuIndex === idx ? null : idx });
    return;
  }

  if (action === "close-exercise-menu") {
    setUi({ openExerciseMenu: null });
    return;
  }

  if (action === "exercise-menu-replace") {
    const settings = state.fitnessSettings || defaultFitnessSettings();
    setUi({
      openExerciseMenu: null,
      modal: "add-exercise",
      fitnessAddSession: t.dataset.session,
      replaceExercise: { sessionId: t.dataset.session, exerciseId: t.dataset.exercise },
      fitnessSearch: "",
      fitnessMuscle: "all",
      fitnessEquipmentFilter: [...(settings.equipmentAvailable || defaultFitnessSettings().equipmentAvailable)],
    });
    focusExerciseSearch();
    return;
  }

  if (action === "exercise-menu-block") {
    const name = t.dataset.name || "";
    blockExercise(name);
    deleteFitnessExercise(t.dataset.session, t.dataset.exercise);
    setUi({ openExerciseMenu: null });
    showToast("Won't recommend again");
    return;
  }

  if (action === "exercise-menu-delete") {
    if (t.dataset.set) {
      deleteFitnessSet(t.dataset.session, t.dataset.exercise, t.dataset.set);
      setUi({ openExerciseMenu: null });
      showToast("Deleted");
      return;
    }
    if (!window.confirm("Delete this exercise and its sets from today's session?")) return;
    offerFitnessUndo(t.dataset.session, "Exercise removed");
    deleteFitnessExercise(t.dataset.session, t.dataset.exercise);
    setUi({ openExerciseMenu: null });
    return;
  }

  if (action === "exercise-menu-leave-pair") {
    removeExerciseFromPair(t.dataset.session, t.dataset.exercise);
    setUi({ openExerciseMenu: null });
    showToast("Removed from group");
    return;
  }

  if (action === "exercise-menu-make-focus") {
    const name = String(t.dataset.name || "").trim();
    if (!name) return;
    const prev = normalizeFocusExercise(state.fitnessSettings?.focusExercise);
    const same = prev && prev.name.toLowerCase() === name.toLowerCase();
    patchFitnessSettings({
      focusExercise: same
        ? prev
        : { name, startedAt: todayKey(), weekIndex: 1 },
    });
    setUi({ openExerciseMenu: null });
    showToast(same ? `Focus · Week ${prev.weekIndex}` : `Focus · ${name}`);
    return;
  }

  if (action === "exercise-menu-clear-focus") {
    patchFitnessSettings({ focusExercise: null });
    setUi({ openExerciseMenu: null });
    showToast("Focus cleared");
    return;
  }

  if (action === "dissolve-fitness-pair") {
    offerFitnessUndo(t.dataset.session, "Group ungrouped");
    dissolveFitnessPair(t.dataset.session, t.dataset.pairId);
    return;
  }

  if (action === "fitness-undo") {
    const undo = ui.fitnessUndo;
    if (!undo?.sessionId || !undo.exercises) { setUi({ fitnessUndo: null }); return; }
    const ok = restoreSessionExercises(undo.sessionId, undo.exercises);
    if (fitnessUndoTimer) {
      clearTimeout(fitnessUndoTimer);
      fitnessUndoTimer = null;
    }
    setUi({ fitnessUndo: null });
    showToast(ok ? "Undone" : "Nothing to undo");
    return;
  }

  if (action === "toggle-equipment") {
    const affected = toggleEquipment(t.dataset.id);
    if (affected > 0) {
      showToast(`${affected} active exercise${affected === 1 ? "" : "s"} kept. New plans will use updated gear.`);
    } else {
      showToast("Equipment updated");
    }
    return;
  }

  if (action === "toggle-picker-equipment") {
    const key = String(t.dataset.id || "");
    if (!key) return;
    const settings = state.fitnessSettings || defaultFitnessSettings();
    const current = ui.fitnessEquipmentFilter || settings.equipmentAvailable || defaultFitnessSettings().equipmentAvailable;
    const fitnessEquipmentFilter = current.includes(key)
      ? current.filter((id) => id !== key)
      : [...current, key];
    preferAddExerciseSearchPatch = true;
    setUi({ fitnessEquipmentFilter });
    return;
  }

  if (action === "history-page") {
    const dir = Number(t.dataset.dir) || 0;
    const tab = t.dataset.tab;
    if (tab === "fitness") setUi({ fitnessHistoryPage: Math.max(0, (ui.fitnessHistoryPage || 0) + dir) });
    else if (tab === "hustle") setUi({ hustleLogPage: Math.max(0, (ui.hustleLogPage || 0) + dir) });
    else if (tab === "miles") setUi({ milesPage: Math.max(0, (ui.milesPage || 0) + dir) });
    return;
  }

  if (action === "open-hustle-editor") {
    setUi({ modal: "hustle-editor", hustleEditorTab: "brief" });
    return;
  }

  if (action === "hustle-editor-tab") {
    setUi({ hustleEditorTab: t.dataset.tab });
    return;
  }

  if (action === "hustle-flow-delete") {
    const playbook = mergePlaybookFor(state);
    const weeklyFlow = [...(playbook.weeklyFlow || [])];
    weeklyFlow.splice(Number(t.dataset.index), 1);
    updateHustlePlaybook({ weeklyFlow });
    return;
  }

  if (action === "hustle-flow-move") {
    const playbook = mergePlaybookFor(state);
    const weeklyFlow = [...(playbook.weeklyFlow || [])];
    const i = Number(t.dataset.index);
    const j = i + Number(t.dataset.dir);
    if (j < 0 || j >= weeklyFlow.length) return;
    [weeklyFlow[i], weeklyFlow[j]] = [weeklyFlow[j], weeklyFlow[i]];
    updateHustlePlaybook({ weeklyFlow });
    return;
  }

  if (action === "hustle-ramp-delete") {
    const playbook = mergePlaybookFor(state);
    const ramp = [...(playbook.ramp || [])];
    ramp.splice(Number(t.dataset.index), 1);
    updateHustlePlaybook({ ramp });
    return;
  }

  if (action === "fitness-muscle") {
    setUi({ fitnessMuscle: t.dataset.muscle });
    return;
  }

  if (action === "add-fitness-set") {
    addFitnessSet(t.dataset.session, t.dataset.exercise);
    return;
  }

  if (action === "toggle-fitness-set") {
    toggleFitnessSetDone(t.dataset.session, t.dataset.exercise, t.dataset.set);
    hapticCheck();
    const session = (state.fitnessLog || []).find((w) => w.id === t.dataset.session);
    if (session && shouldAutoStartRest(session, t.dataset.exercise, t.dataset.set)) {
      const seconds = Number(state.fitnessSettings?.restSeconds || restSecondsForGoal(state.fitnessSettings?.goal));
      setUi({ restTimer: { endsAt: Date.now() + seconds * 1000, seconds, phase: "run" } });
    }
    return;
  }

  if (action === "start-rest-timer") {
    const seconds = Number(t.dataset.seconds) || 90;
    setUi({
      restTimer: { endsAt: Date.now() + seconds * 1000, seconds, phase: "run" },
      fitnessRestPresetsOpen: false,
      fitnessSessionMenuOpen: false,
    });
    return;
  }

  if (action === "clear-rest-timer") {
    setUi({ restTimer: null });
    return;
  }

  if (action === "toggle-warmup-move") {
    const id = t.dataset.id;
    const prev = ui.fitnessWarmupChecked || [];
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    setUi({ fitnessWarmupChecked: next });
    return;
  }

  if (action === "toggle-warmup-collapse") {
    setUi({ fitnessWarmupCollapsed: !ui.fitnessWarmupCollapsed });
    return;
  }

  if (action === "toggle-cooldown-move") {
    const id = t.dataset.id;
    const prev = ui.fitnessCooldownChecked || [];
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    setUi({ fitnessCooldownChecked: next });
    return;
  }

  if (action === "skip-cooldown") {
    setUi({ fitnessCooldownSkipped: true });
    return;
  }

  if (action === "delete-fitness-set") {
    deleteFitnessSet(t.dataset.session, t.dataset.exercise, t.dataset.set);
    return;
  }

  if (action === "delete-fitness-exercise") {
    if (!window.confirm("Delete this exercise and its sets from today's session?")) return;
    offerFitnessUndo(t.dataset.session, "Exercise removed");
    deleteFitnessExercise(t.dataset.session, t.dataset.exercise);
    return;
  }

  if (action === "complete-workout") {
    sealFitnessSession(t.dataset.session);
    return;
  }

  if (action === "end-workout-session") {
    endFitnessSessionEarly(t.dataset.session);
    return;
  }

  if (action === "delete-workout") {
    if (!window.confirm("Delete this workout from history? This cannot be undone.")) return;
    deleteWorkout(t.dataset.session);
    if (ui.modal === "workout-detail") clearModalState();
    showToast("Workout removed");
    return;
  }

  if (action === "dismiss-fitness-celebrate") {
    setUi({ celebrate: null, fitnessTab: "today" });
    return;
  }

  if (action === "view-fitness-session") {
    const sessionId = t.dataset.session || ui.celebrate?.sessionId || "";
    setUi({
      celebrate: null,
      fitnessTab: "history",
      modal: sessionId ? "workout-detail" : null,
      viewingWorkoutId: sessionId || null,
    });
    return;
  }

  if (action === "welcome-demo") {
    loadMarcoDemo();
    showToast("Marco demo loaded");
    return;
  }

  if (action === "toggle-setup-tip") {
    event.preventDefault();
    event.stopPropagation();
    const tip = t.dataset.tip || null;
    setUi({ setupTipId: ui.setupTipId === tip ? null : tip });
    return;
  }

  if (action === "welcome-focus-pick") {
    const focus = t.value || t.dataset.focus || null;
    if (!focus) return;
    setUi({ welcomeFocus: focus });
    return;
  }

  if (action === "welcome-fitness-goal") {
    setUi({ welcomeFitnessGoal: t.dataset.goal || null });
    return;
  }

  if (action === "welcome-fitness-style") {
    setUi({ welcomeFitnessStyle: t.dataset.style || null });
    return;
  }

  if (action === "welcome-fitness-level") {
    setUi({ welcomeFitnessLevel: t.dataset.level || null });
    return;
  }

  if (action === "welcome-fitness-equipment") {
    const key = String(t.dataset.id || "");
    if (!key) return;
    const current = Array.isArray(ui.welcomeEquipment)
      ? ui.welcomeEquipment
      : defaultFitnessSettings().equipmentAvailable;
    const next = current.includes(key) ? current.filter((id) => id !== key) : [...current, key];
    setUi({ welcomeEquipment: next });
    return;
  }

  if (action === "welcome-train-why") {
    const key = String(t.dataset.why || "");
    if (!key) return;
    const current = Array.isArray(ui.welcomeTrainWhy) ? ui.welcomeTrainWhy : [];
    const next = current.includes(key)
      ? current.filter((id) => id !== key)
      : current.length >= 3
        ? current
        : [...current, key];
    setUi({ welcomeTrainWhy: next });
    return;
  }

  if (action === "welcome-back") {
    const step = Number(t.dataset.step) || Math.max(1, (ui.welcomeStep || 1) - 1);
    setUi({ welcomeStep: step });
    return;
  }

  if (action === "welcome-back-mode") {
    setUi({ welcomeStep: 4 });
    return;
  }

  if (action === "welcome-next") {
    setUi({ welcomeStep: Number(t.dataset.step) || (ui.welcomeStep || 1) + 1 });
    return;
  }

  if (action === "welcome-toggle-build-day") {
    const day = Number(t.dataset.day);
    const current = ui.setupBuildDays || [0, 1, 2];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    setUi({ setupBuildDays: next.length ? next : [day] });
    return;
  }

  if (action === "welcome-block-preset") {
    setUi({ setupBlockPreset: t.value || "morning" });
    return;
  }

  if (action === "welcome-challenge-length") {
    const days = Number(t.dataset.days);
    if (days === 90 && !state.settings?.premiumUnlocked) {
      showToast("90-day challenges need beta preview. Turn it on under Profile, Beta.");
      return;
    }
    if (!setChallengeLength(days)) {
      showToast("That length needs beta preview");
      return;
    }
    setUi({ welcomeChallengeLength: days });
    return;
  }

  if (action === "welcome-finish") {
    const focus = ui.welcomeFocus || state.settings?.welcomeFocus || "both";
    finishOnboarding({
      displayName: ui.welcomeName || state.settings?.displayName,
      focus,
      appMode: ui.welcomeAppMode || state.settings?.appMode || "simple",
      buildDays: ui.setupBuildDays || [0, 1, 2],
      blockPreset: ui.setupBlockPreset || "morning",
      challengeLength: ui.welcomeChallengeLength || state.settings?.challengeLength || 30,
    });
    if (focus === "fitness" || focus === "both") {
      const defaults = defaultFitnessSettings();
      patchFitnessSettings({
        goal: ui.welcomeFitnessGoal || defaults.goal,
        splitType: ui.welcomeFitnessStyle || defaults.splitType,
        experienceLevel: ui.welcomeFitnessLevel || defaults.experienceLevel,
        equipmentAvailable:
          Array.isArray(ui.welcomeEquipment) && ui.welcomeEquipment.length
            ? ui.welcomeEquipment
            : defaults.equipmentAvailable,
        trainWhy: Array.isArray(ui.welcomeTrainWhy) ? ui.welcomeTrainWhy.slice(0, 3) : defaults.trainWhy,
        prefsCaptured: true,
        restSeconds: restSecondsForGoal(ui.welcomeFitnessGoal || defaults.goal || "build_muscle"),
      });
    }
    showToast(`Welcome, ${String(ui.welcomeName || "friend").split(" ")[0]}`);
    return;
  }

  if (action === "open-tips") {
    const track = t.dataset.track === "fitness" ? "fitness" : "today";
    setUi({ modal: "tips", tipsTrack: track });
    return;
  }

  if (action === "rebuild-workout") {
    const sessionId = t.dataset.session;
    if (!sessionId) return;
    if (!window.confirm("Replace today's workout? Current exercises stay until you save a new plan.")) return;
    setUi({
      fitnessOpenExerciseId: null,
      fitnessOpenMode: "one",
      modal: "workout-setup",
      fitnessPrefsMode: "build",
      selectedMuscleGroups: [],
      workoutBuilderPreset: "custom",
      fitnessSessionMenuOpen: false,
      fitnessRestPresetsOpen: false,
      rebuildSessionId: sessionId,
    });
    showToast("Confirm setup, then pick muscles. Cancel keeps your plan.");
    return;
  }

  if (action === "set-fitness-goal-radio") {
    const goal = t.dataset.goal || "";
    const current = state.fitnessSettings?.goal || null;
    if (current === goal) {
      patchFitnessSettings({ goal: null });
    } else if (goal) {
      patchFitnessSettings({ goal, restSeconds: restSecondsForGoal(goal) });
    }
    return;
  }

  if (action === "open-restart-onboarding") {
    setUi({ modal: "restart-onboarding" });
    return;
  }

  if (action === "confirm-restart-onboarding") {
    restartFromOnboarding();
    showToast("Welcome back to square one");
    return;
  }

  if (action === "toggle-block-reminders") {
    const enabled = Boolean(t.checked);
    if (enabled) {
      enableBlockReminders().then((result) => {
        if (!result.ok) {
          updateSettings({ blockReminders: false });
          showToast(result.reason === "unsupported" ? "Notifications not supported here" : "Permission needed for reminders");
          return;
        }
        updateSettings({ blockReminders: true });
        scheduleNextBlockReminder(state, ui.selectedDate || todayKey());
        showToast("Block reminders on");
      });
      return;
    }
    updateSettings({ blockReminders: false });
    showToast("Block reminders off");
    return;
  }

  if (action === "disable-premium-preview") {
    setPremiumUnlocked(false);
    showToast("Beta preview off");
    return;
  }

  if (action === "toggle-premium-beta") {
    const on = Boolean(t.checked);
    setPremiumUnlocked(on);
    showToast(on ? "Beta preview on" : "Beta preview off");
    return;
  }

  if (action === "toggle-day30-section") {
    const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
    const lengthDays = state.challenge?.lengthDays || state.settings?.challengeLength || 30;
    const unlocked = isChallengeUnlocked(state.challenge);
    const nearEnd = dayNum >= Math.ceil(lengthDays * 0.7);
    const currentlyOpen =
      ui.day30SectionOpen != null ? Boolean(ui.day30SectionOpen) : unlocked || nearEnd;
    setUi({ day30SectionOpen: !currentlyOpen });
    return;
  }

  if (action === "toggle-profile-challenge") {
    setUi({ profileChallengeOpen: !Boolean(ui.profileChallengeOpen) });
    return;
  }

  if (action === "toggle-profile-limits") {
    setUi({ profileLimitsOpen: !ui.profileLimitsOpen });
    return;
  }

  if (action === "copy-guest-link") {
    const url = t.dataset.url || "";
    if (!url) return;
    navigator.clipboard?.writeText(url).then(
      () => showToast("Guest link copied"),
      () => showToast("Could not copy link")
    );
    return;
  }

  if (action === "copy-all-beta-links") {
    const urls = listBetaGuestLinks()
      .map((l) => l.url)
      .join("\n");
    if (!urls) return;
    navigator.clipboard?.writeText(urls).then(
      () => showToast("All beta links copied"),
      () => showToast("Could not copy links")
    );
    return;
  }

  if (action === "toggle-profile-day30") {
    const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
    const currentlyOpen =
      ui.profileDay30Open != null ? Boolean(ui.profileDay30Open) : dayNum >= 21;
    setUi({ profileDay30Open: !currentlyOpen });
    return;
  }

  if (action === "open-fitness-today") {
    setUi({ tab: "freelance", hustleView: "fitness", fitnessTab: "today", modal: null });
    return;
  }

  if (action === "open-hustle-flow") {
    setUi({ tab: "freelance", hustleView: "hustle", hustleTab: "flow", modal: null });
    return;
  }

  if (action === "select-day") {
    setUi({ selectedDay: Number(t.dataset.day), openBlockMenuIndex: null });
    return;
  }

  if (action === "select-date") {
    setUi({
      selectedDate: t.dataset.date,
      selectedDay: Number(t.dataset.day),
      openBlockMenuIndex: null,
    });
    return;
  }

  if (action === "plan-mode") {
    setUi({ planMode: t.dataset.mode, openBlockMenuIndex: null });
    return;
  }

  if (action === "shift-week") {
    setUi({ shiftWeekOffset: (ui.shiftWeekOffset || 0) + Number(t.dataset.dir) });
    return;
  }

  if (action === "pick-override-date") {
    const date = t.dataset.date;
    const day = t.dataset.day != null ? Number(t.dataset.day) : new Date(`${date}T12:00:00`).getDay();
    setUi({ overrideDate: date, selectedDay: day });
    return;
  }

  if (action === "pick-shift-day") {
    const date = t.dataset.date;
    const ov = state.workOverrides?.[date];
    setUi({
      overrideDate: date,
      planMode: "shifts",
      modal: "shift-sheet",
      shiftSheetDate: date,
      shiftSheetType: ov?.type || "work",
    });
    return;
  }

  if (action === "open-shift-sheet") {
    const date = t.dataset.date;
    const ov = state.workOverrides?.[date];
    setUi({
      modal: "shift-sheet",
      shiftSheetDate: date,
      overrideDate: date,
      shiftSheetType: ov?.type || "work",
    });
    return;
  }

  if (action === "shift-type-pick") {
    setUi({ shiftSheetType: t.dataset.type });
    return;
  }

  if (action === "share-progress") {
    const fromCelebrate = t.dataset.fromCelebrate === "1" && ui.celebrate?.type === "fitness";
    const celebrate = fromCelebrate ? ui.celebrate : null;
    const fitnessDate =
      celebrate?.sessionId
        ? (state.fitnessLog || []).find((s) => s.id === celebrate.sessionId)?.date
        : null;
    const date = fitnessDate || ui.selectedDate || todayKey();
    shareProgress(state, t.dataset.scope || "day", date, celebrate || undefined)
      .then((r) => {
        if (!r?.ok) return;
        if (r.method === "download") showToast("Card saved");
        else if (r.method === "clipboard") showToast("Copied to clipboard");
        else showToast("Shared");
        if (fromCelebrate) {
          setUi({ celebrate: null, fitnessTab: "today" });
        }
      })
      .catch(() => showToast("Share cancelled"));
    return;
  }

  if (action === "tour-next") {
    advanceTour();
    return;
  }

  if (action === "set-app-mode") {
    setAppMode(t.dataset.mode);
    const tabs = visibleTabs(state);
    if (!tabs.some((tab) => tab.id === ui.tab)) {
      setUi({ tab: "today" });
    }
    showToast(t.dataset.mode === "full" ? "Full app unlocked" : "Simple mode on");
    return;
  }

  if (action === "set-fitness-level") {
    const level = t.dataset.level || "beginner";
    patchFitnessSettings({ experienceLevel: level });
    showToast(`Level saved · ${level}`);
    return;
  }

  if (action === "set-fitness-unit") {
    const next = t.dataset.unit === "kg" ? "kg" : "lb";
    const settings = state.fitnessSettings || defaultFitnessSettings();
    const prev = settings.preferredUnit === "kg" ? "kg" : "lb";
    if (next === prev) return;
    const entered = settings.prefsCaptured || settings.bodyWeightEntered;
    const bodyWeight = entered ? convertBodyWeight(settings.bodyWeight, prev, next) : null;
    patchFitnessSettings({ preferredUnit: next, bodyWeight });
    return;
  }

  if (action === "set-fitness-goal") {
    const goal = t.dataset.goal || "build_muscle";
    patchFitnessSettings({ goal, restSeconds: restSecondsForGoal(goal) });
    return;
  }

  if (action === "toggle-train-why") {
    toggleTrainWhy(t.dataset.why);
    return;
  }

  if (action === "day30-delete") {
    removeDay30Question(t.dataset.index);
    showToast("Question removed");
    return;
  }

  if (action === "day30-move") {
    reorderDay30Question(t.dataset.index, t.dataset.dir);
    return;
  }

  if (action === "smart-start") {
    return;
  }

  if (action === "cycle-theme") {
    const next = cycleTheme(currentTheme());
    setThemeSetting(next);
    applyTheme(next);
    return;
  }

  if (action === "set-theme") {
    const next = t.dataset.theme;
    if (!next) return;
    setThemeSetting(next);
    applyTheme(next);
    return;
  }

  if (action === "set-text-size") {
    const size = t.dataset.size || "default";
    setTextSizeSetting(size);
    applyTextSize(size, { force: true });
    showToast(size === "default" ? "Text size default" : `Text size ${size}`);
    return;
  }

  if (action === "toggle-catchup") {
    updateSettings({ yesterdayCatchUp: Boolean(t.checked) });
    return;
  }

  if (action === "open-reset") {
    setUi({ modal: "reset-confirm" });
    return;
  }

  if (action === "confirm-reset") {
    resetApp();
    return;
  }

  if (action === "dismiss-flash") {
    setUi({ flash: null });
    return;
  }

  if (action === "dismiss-install") {
    updateSettings({ installTipDismissed: true });
    return;
  }

  if (action === "install-pwa") {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(() => {
      deferredInstallPrompt = null;
      canInstallPwa = false;
      updateSettings({ installTipDismissed: true });
    });
    return;
  }

  if (action === "open-miles") {
    setUi({ tab: "miles", modal: null });
    return;
  }

  if (action === "open-edit") {
    setUi({ tab: "today", todayMode: "edit", modal: null });
    return;
  }

  if (action === "switch-profile") {
    const id = t.dataset.id;
    const profile = listProfiles().find((p) => p.id === id);
    const name = profile?.displayName || "this profile";
    if (
      !window.confirm(
        `Switch to ${name}? Unsaved UI state stays on this device track.`
      )
    ) {
      return;
    }
    switchProfile(id);
    showToast("Profile switched");
    return;
  }

  if (action === "create-profile") {
    const id = createProfile(t.dataset.kind || "blank");
    if (!id) {
      showToast("Max 3 profiles on this device");
      return;
    }
    showToast(t.dataset.kind === "marco" ? "Marco preset added" : "Blank profile added");
    return;
  }

  if (action === "fitness-history-sort") {
    const sort = t.dataset.sort === "oldest" ? "oldest" : "recent";
    setUi({ fitnessHistorySort: sort, fitnessHistoryPage: 0 });
    return;
  }

  if (action === "toggle-fitness-session-menu") {
    setUi({ fitnessSessionMenuOpen: !ui.fitnessSessionMenuOpen, fitnessRestPresetsOpen: false });
    return;
  }

  if (action === "open-rest-presets") {
    setUi({ fitnessRestPresetsOpen: true, fitnessSessionMenuOpen: false });
    return;
  }

  if (action === "fitness-history-muscle") {
    const muscle = t.dataset.muscle || null;
    const next = ui.fitnessHistoryMuscle === muscle ? null : muscle;
    setUi({ fitnessHistoryMuscle: next, fitnessHistoryPage: 0, fitnessHistoryFocus: "balance" });
    return;
  }

  if (action === "proof-share-scope") {
    setUi({ proofShareScope: t.dataset.scope === "month" ? "month" : "week" });
    return;
  }

  if (action === "edit-profile") {
    const profiles = listProfiles();
    const profile = profiles.find((p) => p.id === t.dataset.id);
    if (!profile) return;
    setUi({
      modal: "profile-editor",
      editingProfile: { id: profile.id, displayName: profile.displayName },
    });
    return;
  }

  if (action === "delete-profile") {
    const profiles = listProfiles();
    if (profiles.length <= 1) {
      showToast("Keep at least one profile");
      return;
    }
    const profile = profiles.find((p) => p.id === t.dataset.id);
    if (!profile) return;
    setUi({
      modal: "delete-profile",
      deletingProfile: { id: profile.id, displayName: profile.displayName },
    });
    return;
  }

  if (action === "confirm-delete-profile") {
    const ok = deleteProfile(t.dataset.id);
    clearModalState();
    showToast(ok ? "Profile removed" : "Could not remove profile");
    return;
  }

  if (action === "set-challenge-length") {
    const days = Number(t.dataset.days);
    if (days === 90 && !state.settings?.premiumUnlocked) {
      showToast("90-day challenges need beta preview. Turn it on under Profile, Beta.");
      return;
    }
    const ok = setChallengeLength(days);
    if (!ok) {
      showToast("That length needs beta preview");
      return;
    }
    showToast(`Challenge length ${days} days`);
    return;
  }

  if (action === "copy-script") {
    const playbook = mergePlaybookFor(state);
    const text = playbook.scripts?.[t.dataset.script] || "";
    if (!text) return;
    navigator.clipboard
      ?.writeText(text)
      .then(() => showToast("Copied"))
      .catch(() => showToast("Copy failed"));
    return;
  }

  if (action === "day30-open") {
    setUi({ day30Open: ui.day30Open === t.dataset.id ? null : t.dataset.id });
    return;
  }

  if (action === "day30-status") {
    const id = t.dataset.id;
    const prev = state.day30Answers?.[id] || {};
    setDay30Answer(id, { status: t.dataset.status, note: prev.note || "" });
    return;
  }

  if (action === "day30-coach") {
    setUi({ day30Coach: !ui.day30Coach });
    return;
  }

  if (action === "toggle-block") {
    const date = t.dataset.date;
    const id = t.dataset.id;
    if (!id) return;
    const wasDone = Boolean(state.completions?.[date]?.[id]);
    preferTodayPatch = true;
    toggleBlock(date, id);
    if (!wasDone) hapticCheck();
    if (!wasDone && !state.settings?.modulesUnlocked?.proof) {
      const block = resolveBlocksForDate(state, date).find((b) => b.id === id);
      if (block && !block.soft) unlockModule("proof");
    }
    maybeCelebrate(date);
    return;
  }

  if (action === "dismiss-backup-nudge") {
    updateSettings({ backupNudgeDismissed: true });
    preferTodayPatch = true;
    return;
  }

  if (action === "today-view") {
    const view = t.dataset.view === "timeline" ? "timeline" : "list";
    updateSettings({ todayView: view });
    setUi({ todayView: view });
    return;
  }

  if (action === "setup-toggle-build-day") {
    const day = Number(t.dataset.day);
    const current = Array.isArray(ui.setupBuildDays) ? [...ui.setupBuildDays] : [0, 1, 2];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    setUi({ setupBuildDays: next });
    return;
  }

  if (action === "setup-toggle-module") {
    const mod = t.dataset.module;
    const modules = { ...(ui.setupModules || {}) };
    modules[mod] = Boolean(t.checked);
    setUi({ setupModules: modules });
    return;
  }

  if (action === "setup-block-preset") {
    setUi({ setupBlockPreset: t.value || t.dataset.preset || "morning" });
    return;
  }

  if (action === "setup-hustle-pack") {
    setUi({ setupHustlePack: t.dataset.pack || "blank" });
    return;
  }

  if (action === "dismiss-celebrate") {
    const date = ui.celebrate?.date || todayKey();
    markCelebrated(date);
    setUi({ celebrate: null });
    return;
  }

  if (action === "start-challenge") {
    patchState((s) => startChallenge(s));
    return;
  }

  if (action === "delete-uber") {
    if (!window.confirm("Delete this miles session log?")) return;
    deleteUberEntry(t.dataset.id);
    clearModalState();
    showToast("Session removed");
    return;
  }

  if (action === "add-uber") {
    setUi({
      modal: "uber-editor",
      editingUber: { id: "", date: todayKey(), miles: "", earnings: "" },
    });
    return;
  }

  if (action === "edit-uber") {
    const entry = (state.uberLog || []).find((e) => e.id === t.dataset.id);
    if (!entry) return;
    setUi({ modal: "uber-editor", editingUber: { ...entry } });
    return;
  }

  if (action === "delete-outreach") {
    if (!window.confirm("Delete this outreach log?")) return;
    deleteOutreach(t.dataset.id);
    clearModalState();
    showToast("Log removed");
    return;
  }

  if (action === "add-outreach") {
    setUi({
      modal: "outreach-editor",
      editingOutreach: {
        id: "",
        date: todayKey(),
        who: "",
        channel: "dm",
        status: "sent",
        note: "",
      },
      hustleTab: "log",
      tab: "freelance",
    });
    return;
  }

  if (action === "edit-outreach") {
    const entry = (state.outreachLog || []).find((e) => e.id === t.dataset.id);
    if (!entry) return;
    setUi({ modal: "outreach-editor", editingOutreach: { ...entry } });
    return;
  }

  if (action === "set-outreach-status") {
    updateOutreach(t.dataset.id, { status: t.dataset.status });
    return;
  }

  if (action === "toggle-hustle") {
    toggleHustleCheck(t.dataset.id);
    return;
  }

  if (action === "clear-override") {
    withPlanFriction(() => setWorkOverride(t.dataset.date, null));
    return;
  }

  if (action === "add-block") {
    const day = Number(t.dataset.day);
    const date = t.dataset.date;
    const mode = t.dataset.mode || "template";
    withPlanFriction(() => {
      setUi({
        modal: "block-editor",
        editingBlock: {
          day,
          date,
          mode,
          index: -1,
          label: "",
          time: "",
          details: "",
          soft: false,
          tags: "",
        },
      });
    });
    return;
  }

  if (action === "edit-block") {
    const day = Number(t.dataset.day);
    const date = t.dataset.date;
    const mode = t.dataset.mode || "template";
    const index = Number(t.dataset.index);
    const block = getBlocksContext(mode, day, date)[index];
    withPlanFriction(() => {
      setUi({
        modal: "block-editor",
        openBlockMenuIndex: null,
        editingBlock: {
          day,
          date,
          mode,
          index,
          label: block.label,
          time: block.time,
          details: block.details || "",
          soft: Boolean(block.soft),
          tags: block.tags || [],
        },
      });
    });
    return;
  }

  if (action === "delete-block") {
    const day = Number(t.dataset.day);
    const date = t.dataset.date;
    const mode = t.dataset.mode || "template";
    const index = Number(t.dataset.index);
    withPlanFriction(() => {
      const blocks = getBlocksContext(mode, day, date);
      blocks.splice(index, 1);
      saveBlocksContext(mode, day, date, blocks, `Deleted block (${mode})`);
    });
    return;
  }

  if (action === "move-block") {
    const day = Number(t.dataset.day);
    const date = t.dataset.date;
    const mode = t.dataset.mode || "template";
    const index = Number(t.dataset.index);
    const dir = Number(t.dataset.dir);
    withPlanFriction(() => {
      const blocks = getBlocksContext(mode, day, date);
      const target = index + dir;
      if (target < 0 || target >= blocks.length) return;
      const copy = [...blocks];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      saveBlocksContext(mode, day, date, copy, `Reordered blocks (${mode})`);
    });
    return;
  }

  if (action === "confirm-plan-edit") {
    const fn = pendingPlanAction;
    pendingPlanAction = null;
    setUi({ modal: null });
    if (fn) fn();
    return;
  }

  if (action === "export-backup") {
    downloadExport();
    hapticSuccess();
    return;
  }

  if (action === "update-today-from-template") {
    withPlanFriction(() => {
      const key = todayKey();
      const dow = new Date().getDay();
      const blocks = blocksFor(state, dow).map((b) => ({ ...b, tags: b.tags ? [...b.tags] : [] }));
      updateDateBlocks(key, blocks, "Updated today from week template");
      setUi({
        tab: "today",
        todayMode: "track",
        selectedDate: key,
        selectedDay: dow,
        planMode: "template",
      });
      showToast("Today updated from template");
    });
    return;
  }

  if (action === "reset-seed") {
    withPlanFriction(() => resetScheduleToSeed());
  }
});

function syncBlockEditorSaveButton(fromEl) {
  const form = fromEl?.closest?.('form[data-action="save-block"]') || fromEl;
  if (!form || form.dataset?.action !== "save-block") return;
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = !isSaveBlockEnabled(form, ui.editingBlock);
}

app.addEventListener("change", async (event) => {
  const input = event.target;
  if (input?.dataset?.action === "fitness-set-field") {
    commitFitnessSetField(input);
    return;
  }
  if (input?.dataset?.action === "set-override-date") {
    setUi({ overrideDate: input.value });
    return;
  }
  if (input?.dataset?.action === "set-body-weight") {
    commitBodyWeight(input);
    return;
  }
  if (input?.dataset?.action === "toggle-catchup") {
    updateSettings({ yesterdayCatchUp: Boolean(input.checked) });
    return;
  }
  if (input?.dataset?.action === "toggle-premium-beta") {
    setPremiumUnlocked(Boolean(input.checked));
    showToast(input.checked ? "Beta preview on" : "Beta preview off");
    return;
  }
  if (input?.dataset?.action === "setup-toggle-module") {
    const mod = input.dataset.module;
    const modules = { ...(ui.setupModules || {}) };
    modules[mod] = Boolean(input.checked);
    setUi({ setupModules: modules });
    return;
  }
  if (input?.dataset?.action === "setup-block-preset") {
    setUi({ setupBlockPreset: input.value || "morning" });
    return;
  }
  if (input?.dataset?.action === "welcome-focus-pick") {
    setUi({ welcomeFocus: input.value || null });
    return;
  }
  if (input?.dataset?.action === "welcome-block-preset") {
    setUi({ setupBlockPreset: input.value || "morning" });
    return;
  }
  if (input?.closest?.('form[data-action="save-block"]')) {
    syncBlockEditorSaveButton(input);
    return;
  }
  if (input?.dataset?.action !== "import-backup") return;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 2_000_000) {
    showFlash("error", "Backup file is too large (max 2 MB).");
    input.value = "";
    return;
  }
  try {
    const text = await file.text();
    importBackup(text);
    setUi({
      flash: { type: "ok", message: "Backup imported. Streak data restored on this device." },
      tab: "profile",
    });
    showToast("Import complete");
  } catch (error) {
    console.warn(error);
    showFlash("error", error?.message || "Could not import that backup file.");
  } finally {
    input.value = "";
  }
});

app.addEventListener("input", (event) => {
  const el = event.target;
  if (el?.dataset?.action === "welcome-name-input") {
    const btn = el.closest("form")?.querySelector('button[type="submit"]');
    if (btn) btn.disabled = !String(el.value || "").trim();
    return;
  }
  if (el?.closest?.('form[data-action="save-block"]')) {
    syncBlockEditorSaveButton(el);
    return;
  }
  if (el?.dataset?.action === "set-override-date") {
    // Commit on change/blur only — avoid remounting while typing the date.
    return;
  }
  if (el?.dataset?.action === "fitness-set-field") {
    // Commit on change/blur only so focus survives keystrokes.
    return;
  }
  if (el?.dataset?.action === "set-body-weight") {
    return;
  }
  if (el?.name === "query" && el.closest('[data-action="search-exercise"]')) {
    const q = el.value;
    clearTimeout(fitnessSearchTimer);
    fitnessSearchTimer = setTimeout(() => {
      if (ui.fitnessSearch === q) return;
      preferAddExerciseSearchPatch = true;
      setUi({ fitnessSearch: q });
    }, 280);
  }
});

app.addEventListener("blur", (event) => {
  const el = event.target;
  if (el?.dataset?.action === "fitness-set-field") {
    commitFitnessSetField(el);
    return;
  }
  if (el?.dataset?.action === "set-body-weight") {
    commitBodyWeight(el);
    return;
  }
  if (el?.dataset?.action === "set-override-date" && el.value && el.value !== ui.overrideDate) {
    setUi({ overrideDate: el.value });
  }
}, true);

app.addEventListener("focusin", (event) => {
  const el = event.target;
  if (el?.id === "fitness-body-weight" || el?.dataset?.action === "fitness-set-field") {
    requestAnimationFrame(() => placeCaretAtEnd(el));
  }
});

function announceFitnessDnD(message) {
  const live = app.querySelector("#fitness-dnd-live");
  if (live) live.textContent = message;
}

let fitnessPointerDragging = false;
let fitnessDragSessionId = null;
let fitnessDragKind = null;
let fitnessDragFromId = null;
let fitnessDragPairId = null;
let fitnessGhost = null;
let fitnessPlaceholder = null;
let fitnessList = null;
let fitnessDragOffsetY = 0;
let fitnessDragStartIndex = -1;
let fitnessDragLastIndex = -1;
let fitnessDragAnnounceAt = 0;
let fitnessSuppressClick = false;
let fitnessUndoTimer = null;
let fitnessAutoScrollRaf = null;
let fitnessLastClientY = 0;

function fitnessUnitKey(el) {
  if (!el) return null;
  if (el.matches?.("[data-pair-group]")) {
    return { type: "pair", pairId: el.dataset.pairId || "" };
  }
  if (el.matches?.("[data-exercise-card]")) {
    return { type: "solo", id: el.dataset.exerciseId || "" };
  }
  return null;
}

function fitnessListUnits(list) {
  if (!list) return [];
  return [...list.children].filter(
    (el) => el !== fitnessGhost && el !== fitnessPlaceholder && el.matches?.("[data-exercise-card], [data-pair-group]")
  );
}

function fitnessPlaceholderIndex() {
  if (!fitnessList || !fitnessPlaceholder) return -1;
  let index = 0;
  for (const el of fitnessList.children) {
    if (el === fitnessGhost) continue;
    if (el === fitnessPlaceholder) return index;
    if (el.matches?.("[data-exercise-card], [data-pair-group]")) index += 1;
  }
  return index;
}

function updateFitnessDragBadge(fromIndex, toIndex, total) {
  const el = fitnessGhost;
  if (!el || fromIndex < 0 || total < 1) return;
  let badge = el.querySelector(":scope > .fitness-dnd-badge") || el.querySelector(".fitness-dnd-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "fitness-dnd-badge";
    badge.setAttribute("aria-hidden", "true");
    el.appendChild(badge);
  }
  const pos = Math.max(1, Math.min(total, (toIndex >= 0 ? toIndex : fromIndex) + 1));
  const arrow = toIndex > fromIndex ? "↓" : toIndex < fromIndex ? "↑" : "·";
  badge.textContent = `${arrow} ${pos} / ${total}`;
}

function positionFitnessGhost(clientY) {
  if (!fitnessGhost) return;
  const top = clientY - fitnessDragOffsetY;
  fitnessGhost.style.top = `${top}px`;
}

function moveFitnessPlaceholder(clientY) {
  if (!fitnessList || !fitnessPlaceholder) return;
  const units = fitnessListUnits(fitnessList);
  let placed = false;
  for (const unit of units) {
    const rect = unit.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      if (unit.previousElementSibling !== fitnessPlaceholder) {
        fitnessList.insertBefore(fitnessPlaceholder, unit);
      }
      placed = true;
      break;
    }
  }
  if (!placed && fitnessPlaceholder.parentNode === fitnessList) {
    fitnessList.appendChild(fitnessPlaceholder);
  }
}

function fitnessDragScrollDelta(clientY) {
  const edge = 64;
  const vh = window.innerHeight;
  if (clientY < edge) return -12;
  if (clientY > vh - edge) return 12;
  return 0;
}

function stopFitnessAutoScroll() {
  if (fitnessAutoScrollRaf) {
    cancelAnimationFrame(fitnessAutoScrollRaf);
    fitnessAutoScrollRaf = null;
  }
}

function tickFitnessDrag(clientY) {
  fitnessLastClientY = clientY;
  positionFitnessGhost(clientY);
  const dy = fitnessDragScrollDelta(clientY);
  if (dy) window.scrollBy(0, dy);
  moveFitnessPlaceholder(clientY);
  const total = fitnessListUnits(fitnessList).length + 1;
  const toIndex = fitnessPlaceholderIndex();
  updateFitnessDragBadge(fitnessDragStartIndex, toIndex, total);
  if (toIndex !== fitnessDragLastIndex && Date.now() - fitnessDragAnnounceAt > 400) {
    fitnessDragLastIndex = toIndex;
    fitnessDragAnnounceAt = Date.now();
    const arrow = toIndex > fitnessDragStartIndex ? "down" : toIndex < fitnessDragStartIndex ? "up" : "same";
    announceFitnessDnD(`Position ${toIndex + 1} of ${total}, ${arrow}`);
  }
  if (dy) {
    stopFitnessAutoScroll();
    fitnessAutoScrollRaf = requestAnimationFrame(() => tickFitnessDrag(fitnessLastClientY));
  } else {
    stopFitnessAutoScroll();
  }
}

function collectFitnessUnitKeys() {
  if (!fitnessList || !fitnessGhost) return [];
  const keys = [];
  for (const el of fitnessList.children) {
    if (el === fitnessPlaceholder) {
      const key = fitnessUnitKey(fitnessGhost);
      if (key) keys.push(key);
      continue;
    }
    if (el === fitnessGhost) continue;
    const key = fitnessUnitKey(el);
    if (key) keys.push(key);
  }
  return keys;
}

function restoreFitnessGhostToList() {
  if (!fitnessGhost) return;
  fitnessGhost.classList.remove("fitness-drag-ghost");
  fitnessGhost.style.cssText = "";
  if (fitnessPlaceholder?.parentNode) {
    fitnessPlaceholder.parentNode.insertBefore(fitnessGhost, fitnessPlaceholder);
  }
  fitnessPlaceholder?.remove();
  fitnessGhost.querySelectorAll(".fitness-dnd-badge").forEach((node) => node.remove());
}

function resetFitnessDragState() {
  stopFitnessAutoScroll();
  document.documentElement.classList.remove("is-fitness-dragging");
  fitnessPointerDragging = false;
  fitnessDragSessionId = null;
  fitnessDragKind = null;
  fitnessDragFromId = null;
  fitnessDragPairId = null;
  fitnessGhost = null;
  fitnessPlaceholder = null;
  fitnessList = null;
  fitnessDragOffsetY = 0;
  fitnessDragStartIndex = -1;
  fitnessDragLastIndex = -1;
}

function abortFitnessDrag() {
  restoreFitnessGhostToList();
  resetFitnessDragState();
}

function startFitnessGripDrag(event, unit, kind) {
  const list = unit.closest("[data-fitness-list]");
  if (!list) return;
  event.preventDefault();
  const rect = unit.getBoundingClientRect();
  fitnessPointerDragging = true;
  fitnessList = list;
  fitnessGhost = unit;
  fitnessDragKind = kind;
  fitnessDragSessionId = kind === "pair" ? unit.dataset.session : unit.dataset.sessionId;
  fitnessDragPairId = kind === "pair" ? unit.dataset.pairId : null;
  fitnessDragFromId = kind === "exercise" ? unit.dataset.exerciseId : null;
  fitnessDragOffsetY = event.clientY - rect.top;
  fitnessLastClientY = event.clientY;

  const placeholder = document.createElement("div");
  placeholder.className = "fitness-drag-placeholder";
  placeholder.style.height = `${rect.height}px`;
  placeholder.setAttribute("aria-hidden", "true");
  fitnessPlaceholder = placeholder;
  list.insertBefore(placeholder, unit);

  unit.classList.add("fitness-drag-ghost");
  unit.style.position = "fixed";
  unit.style.left = `${rect.left}px`;
  unit.style.width = `${rect.width}px`;
  unit.style.top = `${rect.top}px`;
  unit.style.zIndex = "80";
  unit.style.margin = "0";
  unit.style.pointerEvents = "none";

  const unitsBeforeLift = [...list.children].filter(
    (el) => el !== placeholder && el.matches?.("[data-exercise-card], [data-pair-group]")
  );
  fitnessDragStartIndex = Math.max(0, unitsBeforeLift.indexOf(unit));
  if (fitnessDragStartIndex < 0) fitnessDragStartIndex = 0;
  fitnessDragLastIndex = fitnessDragStartIndex;
  document.documentElement.classList.add("is-fitness-dragging");
  try {
    unit.setPointerCapture?.(event.pointerId);
  } catch {
    /* ignore */
  }
  hapticCheck();
  const label =
    kind === "pair" ? unit.dataset.pairType || "group" : unit.dataset.exerciseName || "exercise";
  announceFitnessDnD(`Picked up ${label}. Drag to reorder.`);
  positionFitnessGhost(event.clientY);
  updateFitnessDragBadge(fitnessDragStartIndex, fitnessDragStartIndex, unitsBeforeLift.length);
}

function finishFitnessGripDrop() {
  if (!fitnessPointerDragging || !fitnessDragSessionId) {
    abortFitnessDrag();
    return;
  }
  const sessionId = fitnessDragSessionId;
  const snapshot = cloneSessionExercises(sessionId);
  const keys = collectFitnessUnitKeys();
  const toIndex = fitnessPlaceholderIndex();
  restoreFitnessGhostToList();
  resetFitnessDragState();
  fitnessSuppressClick = true;
  setTimeout(() => {
    fitnessSuppressClick = false;
  }, 320);

  if (!keys.length) {
    announceFitnessDnD("Reorder cancelled");
    return;
  }
  const ok = reorderFitnessUnits(sessionId, keys);
  if (ok && snapshot) {
    if (fitnessUndoTimer) {
      clearTimeout(fitnessUndoTimer);
      fitnessUndoTimer = null;
    }
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    setUi({
      fitnessUndo: { sessionId, exercises: snapshot },
      toast: { message: "Exercise order updated", action: "fitness-undo" },
    });
    fitnessUndoTimer = setTimeout(() => {
      setUi({ fitnessUndo: null, toast: null });
      fitnessUndoTimer = null;
    }, 8000);
    announceFitnessDnD(`Moved to position ${toIndex + 1}`);
  } else {
    announceFitnessDnD("Reorder cancelled");
  }
}

function offerFitnessUndo(sessionId, label) {
  if (!sessionId) return;
  const exercises = cloneSessionExercises(sessionId);
  if (!exercises) return;
  if (fitnessUndoTimer) {
    clearTimeout(fitnessUndoTimer);
    fitnessUndoTimer = null;
  }
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  setUi({
    fitnessUndo: { sessionId, exercises },
    toast: { message: label || "Done", action: "fitness-undo" },
  });
  fitnessUndoTimer = setTimeout(() => {
    setUi({ fitnessUndo: null, toast: null });
    fitnessUndoTimer = null;
  }, 8000);
}

app.addEventListener(
  "pointerdown",
  (event) => {
    if (event.button != null && event.button !== 0) return;
    if (fitnessPointerDragging) return;
    const pairGrip = event.target.closest?.("[data-long-press-drag-pair]");
    const cardGrip = event.target.closest?.("[data-long-press-drag-handle]");
    if (pairGrip) {
      const pairGroup = pairGrip.closest("[data-pair-group]");
      if (pairGroup) startFitnessGripDrag(event, pairGroup, "pair");
      return;
    }
    if (cardGrip) {
      const card = cardGrip.closest("[data-exercise-card]");
      if (card) startFitnessGripDrag(event, card, "exercise");
    }
  },
  { passive: false }
);

app.addEventListener(
  "pointermove",
  (event) => {
    if (!fitnessPointerDragging) return;
    event.preventDefault();
    tickFitnessDrag(event.clientY);
  },
  { passive: false }
);

app.addEventListener("pointerup", () => {
  if (fitnessPointerDragging) finishFitnessGripDrop();
});

app.addEventListener("pointercancel", () => {
  if (fitnessPointerDragging) abortFitnessDrag();
});

app.addEventListener(
  "click",
  (event) => {
    if (!fitnessSuppressClick) return;
    if (event.target.closest("[data-exercise-card], [data-pair-group]")) {
      event.preventDefault();
      event.stopPropagation();
    }
  },
  true
);

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-action]");
  if (!form) return;
  event.preventDefault();

  if (form.dataset.action === "uber-form") {
    const miles = parseFloat(form.miles.value);
    const earnings = parseFloat(form.earnings.value);
    if (!miles || Number.isNaN(miles)) return;
    addUberEntry(miles, Number.isNaN(earnings) ? 0 : earnings);
    return;
  }

  if (form.dataset.action === "save-uber") {
    const miles = parseFloat(form.miles.value);
    const earnings = parseFloat(form.earnings.value);
    if (!miles || Number.isNaN(miles)) return;
    const payload = {
      date: form.date.value || todayKey(),
      miles,
      earnings: Number.isNaN(earnings) ? 0 : earnings,
    };
    const id = form.id.value;
    if (id) updateUberEntry(id, payload);
    else addUberEntry(payload.miles, payload.earnings, payload.date);
    clearModalState();
    showToast(id ? "Session updated" : "Session logged");
    return;
  }

  if (form.dataset.action === "outreach-form") {
    addOutreach({
      who: form.who.value.trim(),
      channel: form.channel.value.trim() || "dm",
      status: form.status.value || "sent",
      note: form.note.value.trim(),
    });
    form.reset();
    return;
  }

  if (form.dataset.action === "save-outreach") {
    const payload = {
      who: form.who.value.trim(),
      date: form.date.value || todayKey(),
      channel: form.channel.value.trim() || "dm",
      status: form.status.value || "sent",
      note: form.note.value.trim(),
    };
    if (!payload.who) return;
    const id = form.id.value;
    if (id) updateOutreach(id, payload);
    else addOutreach(payload);
    clearModalState();
    showToast(id ? "Log updated" : "Log saved");
    return;
  }

  if (form.dataset.action === "save-profile") {
    const id = form.id.value;
    const name = form.displayName.value.trim();
    if (!id || !name) return;
    const ok = renameProfile(id, name);
    clearModalState();
    showToast(ok ? "Profile updated" : "Could not update profile");
    return;
  }

  if (form.dataset.action === "profile-identity") {
    const name = form.displayName.value.trim() || "Marco";
    updateSettings({
      displayName: name,
      bio: form.bio.value.trim(),
      portfolioUrl: form.portfolioUrl.value.trim(),
      linkedinUrl: form.linkedinUrl.value.trim(),
    });
    const activeId = listProfiles().find((p) => p.active)?.id;
    if (activeId) renameProfile(activeId, name);
    showToast("Identity saved");
    return;
  }

  if (form.dataset.action === "day30-add") {
    const q = form.question.value.trim();
    if (!q) return;
    addDay30Question(q);
    form.reset();
    showToast("Question added");
    return;
  }

  if (form.dataset.action === "profile-day30-questions") {
    const lines = String(form.questions.value || "")
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);
    setDay30Questions(lines);
    showToast("Day 30 questions saved");
    return;
  }

  if (form.dataset.action === "profile-miles") {
    const soft = Number(form.uberSoftStop.value);
    const cap = Number(form.uberCap.value);
    const moneyLabel = form.moneyLabel?.value?.trim();
    updateSettings({
      uberSoftStop: Number.isFinite(soft) && soft > 0 ? soft : 400,
      uberCap: Number.isFinite(cap) && cap > 0 ? cap : 500,
      ...(moneyLabel ? { moneyLabel } : {}),
    });
    showToast(state.preset === "marco" ? "Mile limits saved" : "Money limits saved");
    return;
  }

  if (form.dataset.action === "day30-note") {
    const id = form.dataset.id;
    const prev = state.day30Answers?.[id] || {};
    setDay30Answer(id, {
      status: prev.status || "partial",
      note: form.note.value.trim(),
    });
    return;
  }

  if (form.dataset.action === "override-form") {
    const date = form.date.value;
    const type = form.type.value;
    withPlanFriction(() => {
      setWorkOverride(date, {
        type,
        start: form.start.value.trim() || "10:00 AM",
        end: form.end.value.trim() || "7:30 PM",
        note: form.note.value.trim(),
      });
      setUi({ overrideDate: date });
    });
    return;
  }

  if (form.dataset.action === "save-block") {
    if (!isSaveBlockEnabled(form, ui.editingBlock)) return;
    const day = Number(form.day.value);
    const date = form.date.value;
    const mode = form.mode.value || "template";
    const index = Number(form.index.value);
    const hour = form.hour?.value;
    const minute = form.minute?.value;
    const rawTime =
      hour != null && minute != null && hour !== "" && minute !== ""
        ? `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        : form.time?.value || "";
    const wasSnapped = rawTime && snapTimeInputValue(rawTime) !== rawTime;
    const draft = createBlockFromForm(form);
    const blocks = getBlocksContext(mode, day, date);
    if (index < 0) {
      blocks.push(draft);
      saveBlocksContext(mode, day, date, blocks, `Added block (${mode})`);
    } else {
      const prev = blocks[index];
      blocks[index] = { ...prev, ...draft, id: prev.id || uid("custom") };
      saveBlocksContext(mode, day, date, blocks, `Edited block (${mode})`);
    }
    if (wasSnapped) showToast("Time snapped to 15-minute increment");
    clearModalState();
    return;
  }

  if (form.dataset.action === "set-custom-challenge-length" || form.dataset.action === "welcome-custom-challenge") {
    if (!state.settings?.premiumUnlocked) {
      showToast("Custom lengths need beta preview. Turn it on under Profile, Beta.");
      return;
    }
    const days = Number(form.days?.value);
    if (!setChallengeLength(days)) {
      showToast("Use 7 to 365 days");
      return;
    }
    if (form.dataset.action === "welcome-custom-challenge") {
      setUi({ welcomeChallengeLength: days });
    }
    showToast(`Challenge length ${days} days`);
    return;
  }

  if (form.dataset.action === "welcome-name") {
    const name = form.displayName.value.trim().slice(0, 24);
    if (!name) return;
    setUi({ welcomeStep: 2, welcomeName: name, welcomeFocus: null, modal: "welcome" });
    return;
  }

  if (form.dataset.action === "welcome-focus") {
    const name = form.displayName.value.trim().slice(0, 24);
    const focus = form.focus?.value || ui.welcomeFocus;
    if (!focus) {
      showToast("Pick a starting lane");
      return;
    }
    const modulesFromFocus = {
      fitness: focus === "fitness" || focus === "both",
      money: false,
      hustle: focus !== "fitness",
    };
    setUi({
      welcomeStep: 3,
      welcomeName: name,
      welcomeFocus: focus,
      setupModules: modulesFromFocus,
      modal: "welcome",
    });
    return;
  }

  if (form.dataset.action === "welcome-mode") {
    const name = form.displayName.value.trim().slice(0, 24);
    const focus = form.focus?.value || ui.welcomeFocus || "both";
    const appMode = form.appMode.value === "full" ? "full" : "simple";
    const hasCoach = focus === "fitness" || focus === "both";
    completeWelcome(name, focus, appMode);
    setUi({
      welcomeStep: hasCoach ? 6 : 5,
      welcomeName: name,
      welcomeFocus: focus,
      welcomeAppMode: appMode,
      setupModules: {
        ...ui.setupModules,
        money: appMode === "full",
      },
      modal: "welcome",
    });
    return;
  }

  if (form.dataset.action === "search-exercise") {
    setUi({ fitnessSearch: form.query.value });
    return;
  }

  if (form.dataset.action === "save-hustle-brief") {
    updateHustlePlaybook({
      niche: form.niche.value.trim(),
      positioning: form.positioning.value.trim(),
      moneyBlock: form.moneyBlock.value.trim(),
    });
    updateSettings({
      portfolioUrl: form.portfolioUrl.value.trim(),
      linkedinUrl: form.linkedinUrl.value.trim(),
    });
    showToast("Brief saved");
    return;
  }

  if (form.dataset.action === "hustle-flow-add") {
    const playbook = mergePlaybookFor(state);
    const item = makeFlowItem(form.label.value, form.detail.value);
    if (!item.label) return;
    updateHustlePlaybook({ weeklyFlow: [...(playbook.weeklyFlow || []), item] });
    form.reset();
    showToast("Flow item added");
    return;
  }

  if (form.dataset.action === "hustle-ramp-add") {
    const playbook = mergePlaybookFor(state);
    const items = String(form.items.value || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    const week = makeRampWeek(form.label.value, items);
    if (!week.label || !week.items.length) return;
    updateHustlePlaybook({ ramp: [...(playbook.ramp || []), week] });
    form.reset();
    showToast("Ramp week added");
    return;
  }

  if (form.dataset.action === "save-hustle-scripts") {
    updateHustlePlaybook({
      scripts: {
        warmDm: form.warmDm.value,
        contraHeadline: form.contraHeadline.value,
        socialPost: form.socialPost.value,
        discoveryOpener: form.discoveryOpener.value,
      },
    });
    showToast("Scripts saved");
    return;
  }

  if (form.dataset.action === "custom-exercise") {
    const sessionId = form.sessionId.value;
    addCustomExerciseFromSearch(sessionId, form.name.value);
  }
});

applyTheme(getStoredTheme(), { force: true });
inject();
loadState();
if (state?.settings?.theme) applyTheme(state.settings.theme, { force: true });
applyTextSize(state?.settings?.textSize || "default", { force: true });
resetToTodayUi();
setUi({
  tab: "today",
  theme: state?.settings?.theme || getStoredTheme(),
  hustleView: "fitness",
  fitnessTab: "today",
  ...(needsWelcome ? { modal: "welcome", welcomeStep: 1 } : {}),
});
subscribe(render);
render();

/** Tick rest timer + live session clock (DOM patch — no full remount). */
setInterval(() => {
  const onFitness = ui.tab === "freelance" && (ui.hustleView || "fitness") === "fitness";
  const timer = ui.restTimer;
  if (timer?.phase === "done") {
    if (Date.now() >= (timer.doneUntil || 0)) setUi({ restTimer: null });
    return;
  }
  if (timer?.endsAt) {
    if (Date.now() >= timer.endsAt) {
      playRestChime();
      setUi({ restTimer: { phase: "done", doneUntil: Date.now() + 4000 } });
      return;
    }
    if (onFitness) patchRestTimerBar();
  }
  if (onFitness) {
    const running = app.querySelector("[data-session-timer][data-running='1']");
    if (running) patchSessionTimerClock(app, state);
  }
}, 1000);

function syncKeyboardInset() {
  const vv = window.visualViewport;
  if (!vv) {
    document.documentElement.style.setProperty("--keyboard-inset", "0px");
    return;
  }
  const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
}
syncKeyboardInset();
window.visualViewport?.addEventListener("resize", syncKeyboardInset);
window.visualViewport?.addEventListener("scroll", syncKeyboardInset);
window.addEventListener("resize", syncKeyboardInset);

/** Sunday weekly share nudge when streak ≥ 7. */
(function maybeWeeklySharePrompt() {
  if (!state) return;
  if (new Date().getDay() !== 0) return;
  if (state.settings?.weeklySharePromptedAt === todayKey()) return;
  const streak = computeStreak(state);
  if (streak < 7) return;
  updateSettings({ weeklySharePromptedAt: todayKey() });
  setTimeout(() => {
    showToast(`Streak ${streak}. Share the week?`);
  }, 1200);
})();

(function applyLaunchHash() {
  const hash = (location.hash || "").replace(/^#/, "");
  if (!hash || needsWelcome) return;
  if (hash === "fitness") {
    const settings = state.fitnessSettings || defaultFitnessSettings();
    setUi({
      tab: "freelance",
      hustleView: "fitness",
      fitnessTab: "today",
      modal: settings.prefsCaptured ? "workout-builder" : "fitness-prefs",
      fitnessPrefsStep: 1,
      fitnessPrefsMode: "build",
      selectedMuscleGroups: [],
      workoutBuilderPreset: "custom",
    });
  } else if (hash === "today") {
    setUi({ tab: "today", todayMode: "track" });
  } else if (hash === "share") {
    setUi({ tab: "today", todayMode: "track" });
  }
})();

/** Accessible arrow-key navigation for role=tablist segments. */
app.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const open = app.querySelector(".date-field.is-open");
    if (open) {
      event.preventDefault();
      closeDateField(open);
      open.querySelector(".date-field-trigger")?.focus();
      return;
    }
  }

  const dayBtn = event.target?.closest?.(".date-cal-day");
  if (dayBtn && app.contains(dayBtn)) {
    const grid = dayBtn.closest(".date-cal-grid");
    const days = grid ? [...grid.querySelectorAll(".date-cal-day")] : [];
    const idx = days.indexOf(dayBtn);
    if (idx >= 0) {
      let next = -1;
      if (event.key === "ArrowLeft") next = idx - 1;
      else if (event.key === "ArrowRight") next = idx + 1;
      else if (event.key === "ArrowUp") next = idx - 7;
      else if (event.key === "ArrowDown") next = idx + 7;
      else if (event.key === "Home") next = idx - (idx % 7);
      else if (event.key === "End") next = idx - (idx % 7) + 6;
      if (next >= 0 && next < days.length) {
        event.preventDefault();
        days[next].focus();
        return;
      }
    }
  }

  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
    return;
  }
  const tab = event.target?.closest?.('[role="tab"]');
  const tablist = tab?.closest?.('[role="tablist"]');
  if (!tab || !tablist || !app.contains(tablist)) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  if (tabs.length < 2) return;
  const idx = tabs.indexOf(tab);
  if (idx < 0) return;
  event.preventDefault();
  let next = idx;
  if (event.key === "ArrowRight") next = (idx + 1) % tabs.length;
  else if (event.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  const target = tabs[next];
  target?.focus();
  target?.click();
});

/** Vanilla hover/focus preview for Today hybrid rows (no Radix). */
(function initHybridHoverPreview() {
  let openTimer = null;
  let closeTimer = null;
  let card = null;
  let activeRow = null;
  const OPEN_MS = 300;
  const CLOSE_MS = 160;

  function ensureCard() {
    if (card) return card;
    card = document.createElement("div");
    card.className = "hybrid-preview";
    card.setAttribute("role", "tooltip");
    card.hidden = true;
    document.body.appendChild(card);
    card.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);
      closeTimer = null;
    });
    card.addEventListener("mouseleave", () => scheduleClose());
    return card;
  }

  function escapeText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function positionCard(row) {
    const el = ensureCard();
    const rect = row.getBoundingClientRect();
    const pad = 8;
    const width = Math.min(288, window.innerWidth - pad * 2);
    let left = Math.min(Math.max(pad, rect.left), window.innerWidth - width - pad);
    let top = rect.bottom + 6;
    el.style.width = `${width}px`;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    requestAnimationFrame(() => {
      const cr = el.getBoundingClientRect();
      if (cr.bottom > window.innerHeight - pad) {
        el.style.top = `${Math.max(pad, rect.top - cr.height - 6)}px`;
      }
    });
  }

  function renderCard(row) {
    const el = ensureCard();
    const label = row.dataset.previewLabel || row.querySelector(".hybrid-label")?.textContent || "Block";
    const time = row.dataset.previewTime || "";
    const tags = String(row.dataset.previewTags || "").trim();
    const soft = row.dataset.previewSoft === "1";
    const details = String(row.dataset.previewDetails || "").trim();
    const metaBits = [time, soft ? "Soft" : "Core"];
    if (tags && tags !== "[object Object]") metaBits.push(tags);
    el.innerHTML = `
      <p class="hybrid-preview-title">${escapeText(label)}</p>
      <p class="hybrid-preview-meta">${escapeText(metaBits.join(" · "))}</p>
      ${details ? `<p class="hybrid-preview-details">${escapeText(details)}</p>` : ""}
    `;
  }

  function openFor(row) {
    if (!row || row.disabled) return;
    clearTimeout(closeTimer);
    closeTimer = null;
    if (activeRow && activeRow !== row) {
      activeRow.removeAttribute("aria-describedby");
    }
    activeRow = row;
    renderCard(row);
    const el = ensureCard();
    const id = `hybrid-preview-${row.dataset.blockId || "row"}`;
    el.id = id;
    row.setAttribute("aria-describedby", id);
    el.hidden = false;
    el.classList.remove("is-leaving");
    positionCard(row);
    requestAnimationFrame(() => el.classList.add("is-open"));
  }

  function scheduleOpen(row) {
    clearTimeout(openTimer);
    openTimer = setTimeout(() => openFor(row), OPEN_MS);
  }

  function hideCard() {
    const el = ensureCard();
    el.classList.remove("is-open");
    el.classList.add("is-leaving");
    if (activeRow) activeRow.removeAttribute("aria-describedby");
    setTimeout(() => {
      if (!el.classList.contains("is-open")) {
        el.hidden = true;
        el.classList.remove("is-leaving");
      }
    }, CLOSE_MS);
    activeRow = null;
  }

  function scheduleClose() {
    clearTimeout(openTimer);
    openTimer = null;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(hideCard, CLOSE_MS);
  }

  function rowFromEvent(event) {
    const row = event.target?.closest?.(".hybrid-row");
    if (!row || !app.contains(row)) return null;
    return row;
  }

  app.addEventListener(
    "pointerover",
    (event) => {
      const row = rowFromEvent(event);
      if (!row) return;
      if (activeRow === row) {
        clearTimeout(closeTimer);
        return;
      }
      scheduleOpen(row);
    },
    true
  );

  app.addEventListener(
    "pointerout",
    (event) => {
      const row = rowFromEvent(event);
      if (!row) return;
      const related = event.relatedTarget;
      if (related && (row.contains(related) || card?.contains(related))) return;
      scheduleClose();
    },
    true
  );

  app.addEventListener(
    "focusin",
    (event) => {
      const row = rowFromEvent(event);
      if (!row) return;
      scheduleOpen(row);
    },
    true
  );

  app.addEventListener(
    "focusout",
    (event) => {
      const row = rowFromEvent(event);
      if (!row) return;
      const related = event.relatedTarget;
      if (related && (row.contains(related) || card?.contains(related))) return;
      scheduleClose();
    },
    true
  );

  window.addEventListener("scroll", () => {
    if (activeRow) positionCard(activeRow);
  }, true);
})();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  canInstallPwa = true;
  render();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  canInstallPwa = false;
  updateSettings({ installTipDismissed: true });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((error) => {
        console.warn("SW registration failed", error);
      });
  });
}
