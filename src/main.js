import "./style.css";
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
  addEvent,
  updateEvent,
  deleteEvent,
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
  loadMarcoDemo,
  startWorkout,
  addExerciseToSession,
  addFitnessSet,
  updateFitnessSet,
  toggleFitnessSetDone,
  deleteFitnessSet,
  deleteFitnessExercise,
  completeWorkout,
  deleteWorkout,
  toggleEquipment,
  blockExercise,
  replaceExerciseInSession,
  setPremiumUnlocked,
  updateHustlePlaybook,
} from "./store.js";
import { startChallenge } from "./challenge.js";
import { blocksFor, uid } from "./schedule.js";
import { todayKey } from "./dates.js";
import { resolveBlocksForDate } from "./work.js";
import { activeSessionForDate, defaultFitnessSettings } from "./fitness.js";
import { generateWorkoutPlan } from "./fitness-plan.js";
import { mergePlaybook } from "./hustle-playbook.js";
import { completionForDate } from "./streaks.js";
import { applyTheme, cycleTheme, getStoredTheme } from "./theme.js";
import { renderNav } from "./ui/Nav.js";
import { renderToday } from "./ui/Today.js";
import { renderProof } from "./ui/Proof.js";
import { renderMiles, renderUberEditorModal } from "./ui/Miles.js";
import { renderFreelance, renderOutreachEditorModal } from "./ui/Freelance.js";
import { renderAddExerciseModal, renderFitnessCelebrate } from "./ui/Fitness.js";
import { renderWorkoutBuilderModal } from "./ui/fitness/WorkoutBuilderModal.js";
import { renderWelcomeModal } from "./ui/Welcome.js";
import {
  renderBlockEditorModal,
  renderEventEditorModal,
  renderEditConfirmModal,
  createBlockFromForm,
  renderShiftSheet,
} from "./ui/Plan.js";
import { shareProgress } from "./share.js";
import {
  renderProfile,
  renderResetConfirmModal,
  renderProfileEditorModal,
  renderDeleteProfileModal,
} from "./ui/Profile.js";
import { renderCommitModal } from "./ui/Commit.js";
import { renderCelebrate } from "./ui/Celebrate.js";
import { renderToast } from "./ui/Install.js";
import { renderPremiumUnlockModal, PREMIUM_TEST_PASSWORD } from "./ui/PremiumUnlock.js";
import { renderHustleEditorModal, makeFlowItem, makeRampWeek } from "./ui/HustleEditor.js";

const app = document.getElementById("app");
let pendingPlanAction = null;
let toastTimer = null;
let deferredInstallPrompt = null;
let canInstallPwa = false;

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

function showFlash(type, message) {
  setUi({ flash: { type, message }, tab: "profile" });
}

function renderBootError(message) {
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

function render() {
  if (!state) {
    renderBootError("Saved profile data is missing or corrupt.");
    return;
  }
  try {
  const needsCommit = !state.challenge?.startDate && ui.modal !== "welcome" && !needsWelcome;

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
  else if (ui.modal === "event-editor") modal = renderEventEditorModal(ui);
  else if (ui.modal === "uber-editor") modal = renderUberEditorModal(ui);
  else if (ui.modal === "outreach-editor") modal = renderOutreachEditorModal(ui);
  else if (ui.modal === "profile-editor") modal = renderProfileEditorModal(ui, listProfiles());
  else if (ui.modal === "delete-profile") modal = renderDeleteProfileModal(ui);
  else if (ui.modal === "reset-confirm") modal = renderResetConfirmModal(state);
  else if (ui.modal === "welcome") modal = renderWelcomeModal(ui);
  else if (ui.modal === "add-exercise") modal = renderAddExerciseModal(ui, state.fitnessSettings);
  else if (ui.modal === "workout-builder") modal = renderWorkoutBuilderModal(ui, state);
  else if (ui.modal === "premium-unlock") modal = renderPremiumUnlockModal(ui);
  else if (ui.modal === "hustle-editor") modal = renderHustleEditorModal(state, ui);
  else if (ui.modal === "shift-sheet") modal = renderShiftSheet(ui, state);

  const celebrate = ui.celebrate
    ? ui.celebrate.type === "fitness"
      ? renderFitnessCelebrate(ui.celebrate)
      : renderCelebrate(ui.celebrate, state)
    : "";
  const toast = renderToast(ui.toast);

  app.innerHTML = `
    ${body}
    ${needsCommit ? "" : renderNav(ui.tab, state)}
    ${modal}
    ${celebrate}
    ${toast}
  `;
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
    setUi({
      celebrate: {
        date,
        doneCore: c.doneCore,
        coreCount: c.coreCount,
      },
    });
  }
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
    fitnessSearch: "",
    fitnessMuscle: "all",
    shiftSheetType: null,
    replaceExercise: null,
    openExerciseMenu: null,
    premiumError: null,
    selectedMuscleGroups: ui.modal === "workout-builder" ? [] : ui.selectedMuscleGroups,
  });
}

app.addEventListener("click", (event) => {
  const backdrop = event.target.closest(".modal-backdrop");
  if (backdrop && event.target === backdrop) {
    clearModalState();
    return;
  }

  const t = event.target.closest("[data-action]");
  if (!t) return;
  const action = t.dataset.action;

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
    setUi({ fitnessTab: t.dataset.tab, fitnessHistoryPage: 0 });
    return;
  }

  if (action === "start-workout") {
    startWorkout();
    showToast("Workout started");
    return;
  }

  if (action === "open-workout-builder") {
    setUi({ modal: "workout-builder", selectedMuscleGroups: [] });
    return;
  }

  if (action === "toggle-muscle-group") {
    const group = t.dataset.group;
    const current = ui.selectedMuscleGroups || [];
    const next = current.includes(group) ? current.filter((g) => g !== group) : [...current, group];
    setUi({ selectedMuscleGroups: next });
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
    });
    startWorkout();
    const session = activeSessionForDate(state.fitnessLog);
    if (session?.id) {
      plan.forEach((ex) => addExerciseToSession(session.id, ex.name, ex.muscleGroup));
    }
    clearModalState();
    showToast(plan.length ? `Built ${plan.length} exercises` : "No matches for your equipment");
    return;
  }

  if (action === "open-add-exercise-empty") {
    startWorkout();
    const session = activeSessionForDate(state.fitnessLog);
    setUi({
      modal: "add-exercise",
      fitnessAddSession: session?.id || "",
      fitnessSearch: "",
      fitnessMuscle: "all",
      replaceExercise: null,
      selectedMuscleGroups: [],
    });
    return;
  }

  if (action === "open-add-exercise") {
    setUi({
      modal: "add-exercise",
      fitnessAddSession: t.dataset.session,
      fitnessSearch: "",
      fitnessMuscle: "all",
      replaceExercise: null,
    });
    return;
  }

  if (action === "pick-exercise") {
    addExerciseToSession(t.dataset.session, t.dataset.name, t.dataset.muscle || "");
    clearModalState();
    showToast("Exercise added");
    return;
  }

  if (action === "replace-pick-exercise") {
    const target = ui.replaceExercise;
    if (target?.sessionId && target?.exerciseId) {
      replaceExerciseInSession(target.sessionId, target.exerciseId, t.dataset.name, t.dataset.muscle || "");
      clearModalState();
      showToast("Exercise replaced");
    }
    return;
  }

  if (action === "open-exercise-menu") {
    setUi({
      openExerciseMenu: {
        sessionId: t.dataset.session,
        exerciseId: t.dataset.exercise,
        setId: t.dataset.set || "",
        name: t.dataset.name || "",
      },
    });
    return;
  }

  if (action === "close-exercise-menu") {
    setUi({ openExerciseMenu: null });
    return;
  }

  if (action === "exercise-menu-replace") {
    setUi({
      openExerciseMenu: null,
      modal: "add-exercise",
      fitnessAddSession: t.dataset.session,
      replaceExercise: { sessionId: t.dataset.session, exerciseId: t.dataset.exercise },
      fitnessSearch: "",
      fitnessMuscle: "all",
    });
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
    } else {
      deleteFitnessExercise(t.dataset.session, t.dataset.exercise);
    }
    setUi({ openExerciseMenu: null });
    showToast("Deleted");
    return;
  }

  if (action === "toggle-equipment") {
    toggleEquipment(t.dataset.id);
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

  if (action === "open-premium-unlock") {
    setUi({ modal: "premium-unlock", premiumError: null });
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
    const playbook = mergePlaybook(state.settings?.hustlePlaybook);
    const weeklyFlow = [...(playbook.weeklyFlow || [])];
    weeklyFlow.splice(Number(t.dataset.index), 1);
    updateHustlePlaybook({ weeklyFlow });
    return;
  }

  if (action === "hustle-flow-move") {
    const playbook = mergePlaybook(state.settings?.hustlePlaybook);
    const weeklyFlow = [...(playbook.weeklyFlow || [])];
    const i = Number(t.dataset.index);
    const j = i + Number(t.dataset.dir);
    if (j < 0 || j >= weeklyFlow.length) return;
    [weeklyFlow[i], weeklyFlow[j]] = [weeklyFlow[j], weeklyFlow[i]];
    updateHustlePlaybook({ weeklyFlow });
    return;
  }

  if (action === "hustle-ramp-delete") {
    const playbook = mergePlaybook(state.settings?.hustlePlaybook);
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
    return;
  }

  if (action === "delete-fitness-set") {
    deleteFitnessSet(t.dataset.session, t.dataset.exercise, t.dataset.set);
    return;
  }

  if (action === "delete-fitness-exercise") {
    deleteFitnessExercise(t.dataset.session, t.dataset.exercise);
    showToast("Exercise removed");
    return;
  }

  if (action === "complete-workout") {
    const payload = completeWorkout(t.dataset.session);
    if (payload) {
      setUi({
        celebrate: { type: "fitness", ...payload },
        fitnessTab: "today",
      });
    }
    return;
  }

  if (action === "delete-workout") {
    deleteWorkout(t.dataset.session);
    showToast("Workout removed");
    return;
  }

  if (action === "dismiss-fitness-celebrate") {
    setUi({ celebrate: null, fitnessTab: "history" });
    return;
  }

  if (action === "welcome-demo") {
    loadMarcoDemo();
    showToast("Marco demo loaded");
    return;
  }

  if (action === "welcome-back") {
    setUi({ welcomeStep: 1 });
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
    setUi({ selectedDay: Number(t.dataset.day) });
    return;
  }

  if (action === "select-date") {
    setUi({
      selectedDate: t.dataset.date,
      selectedDay: Number(t.dataset.day),
    });
    return;
  }

  if (action === "refresh-today") {
    const key = ui.selectedDate || todayKey();
    setUi({
      selectedDate: key,
      selectedDay: new Date(`${key}T12:00:00`).getDay(),
    });
    return;
  }

  if (action === "plan-mode") {
    setUi({ planMode: t.dataset.mode });
    return;
  }

  if (action === "shift-week") {
    setUi({ shiftWeekOffset: (ui.shiftWeekOffset || 0) + Number(t.dataset.dir) });
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
    shareProgress(state, t.dataset.scope || "day", ui.selectedDate || todayKey())
      .then((r) => showToast(r.method === "clipboard" ? "Copied to clipboard" : "Shared"))
      .catch(() => showToast("Share cancelled"));
    return;
  }

  if (action === "tour-next") {
    advanceTour();
    return;
  }

  if (action === "set-app-mode") {
    setAppMode(t.dataset.mode);
    showToast(t.dataset.mode === "full" ? "Full app unlocked" : "Simple mode on");
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
    switchProfile(t.dataset.id);
    showToast("Profile switched");
    return;
  }

  if (action === "create-profile") {
    createProfile(t.dataset.kind || "blank");
    showToast(t.dataset.kind === "marco" ? "Marco preset added" : "Blank profile added");
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
    setChallengeLength(t.dataset.days);
    showToast(`Challenge length ${t.dataset.days} days`);
    return;
  }

  if (action === "copy-script") {
    const playbook = mergePlaybook(state.settings?.hustlePlaybook);
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
    toggleBlock(date, id);
    if (!wasDone && !state.settings?.modulesUnlocked?.proof) {
      const block = resolveBlocksForDate(state, date).find((b) => b.id === id);
      if (block && !block.soft) unlockModule("proof");
    }
    maybeCelebrate(date);
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

  if (action === "add-event") {
    withPlanFriction(() => {
      setUi({
        modal: "event-editor",
        editingEvent: { id: "", title: "", date: todayKey(), recurYearly: true },
      });
    });
    return;
  }

  if (action === "edit-event") {
    const ev = (state.events || []).find((e) => e.id === t.dataset.id);
    if (!ev) return;
    withPlanFriction(() => {
      setUi({ modal: "event-editor", editingEvent: { ...ev } });
    });
    return;
  }

  if (action === "delete-event") {
    withPlanFriction(() => deleteEvent(t.dataset.id));
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

app.addEventListener("change", async (event) => {
  const input = event.target;
  if (input?.dataset?.action === "set-override-date") {
    setUi({ overrideDate: input.value });
    return;
  }
  if (input?.dataset?.action === "toggle-catchup") {
    updateSettings({ yesterdayCatchUp: Boolean(input.checked) });
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
  if (el?.dataset?.action === "set-override-date") {
    setUi({ overrideDate: el.value });
    return;
  }
  if (el?.dataset?.action === "fitness-set-field") {
    const value = el.dataset.field === "reps" ? parseInt(el.value, 10) : parseFloat(el.value);
    updateFitnessSet(el.dataset.session, el.dataset.exercise, el.dataset.set, {
      [el.dataset.field]: Number.isFinite(value) ? value : 0,
    });
    return;
  }
  if (el?.name === "query" && el.closest('[data-action="search-exercise"]')) {
    setUi({ fitnessSearch: el.value });
  }
});

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
    updateSettings({
      displayName: form.displayName.value.trim() || "Marco",
      bio: form.bio.value.trim(),
      portfolioUrl: form.portfolioUrl.value.trim(),
      linkedinUrl: form.linkedinUrl.value.trim(),
    });
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
    updateSettings({
      uberSoftStop: Number.isFinite(soft) && soft > 0 ? soft : 400,
      uberCap: Number.isFinite(cap) && cap > 0 ? cap : 500,
    });
    showToast("Mile limits saved");
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

  if (form.dataset.action === "save-event") {
    const id = form.id.value;
    const payload = {
      title: form.title.value.trim(),
      date: form.date.value,
      type: "birthday",
      recurYearly: Boolean(form.recurYearly?.checked),
    };
    if (id) updateEvent(id, payload);
    else addEvent(payload);
    clearModalState();
    return;
  }

  if (form.dataset.action === "save-block") {
    const day = Number(form.day.value);
    const date = form.date.value;
    const mode = form.mode.value || "template";
    const index = Number(form.index.value);
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
    clearModalState();
    return;
  }

  if (form.dataset.action === "welcome-name") {
    const name = form.displayName.value.trim();
    if (!name) return;
    setUi({ welcomeStep: 2, welcomeName: name, modal: "welcome" });
    return;
  }

  if (form.dataset.action === "welcome-focus") {
    const name = form.displayName.value.trim();
    const focus = form.focus.value || "both";
    completeWelcome(name, focus);
    showToast(`Welcome, ${name.split(" ")[0]}`);
    return;
  }

  if (form.dataset.action === "search-exercise") {
    setUi({ fitnessSearch: form.query.value });
    return;
  }

  if (form.dataset.action === "unlock-premium") {
    const password = form.password.value;
    if (password === PREMIUM_TEST_PASSWORD) {
      setPremiumUnlocked(true);
      clearModalState();
      setUi({ hustleView: "hustle" });
      showToast("Premium unlocked");
    } else {
      setUi({ premiumError: "Wrong password. Try again." });
    }
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
    const playbook = mergePlaybook(state.settings?.hustlePlaybook);
    const item = makeFlowItem(form.label.value, form.detail.value);
    if (!item.label) return;
    updateHustlePlaybook({ weeklyFlow: [...(playbook.weeklyFlow || []), item] });
    form.reset();
    showToast("Flow item added");
    return;
  }

  if (form.dataset.action === "hustle-ramp-add") {
    const playbook = mergePlaybook(state.settings?.hustlePlaybook);
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
    const name = form.name.value.trim();
    if (!sessionId || !name) return;
    const replacing = ui.replaceExercise;
    if (replacing?.sessionId && replacing?.exerciseId) {
      replaceExerciseInSession(replacing.sessionId, replacing.exerciseId, name);
    } else {
      addExerciseToSession(sessionId, name);
    }
    clearModalState();
    showToast(replacing ? "Exercise replaced" : "Exercise added");
  }
});

applyTheme(getStoredTheme(), { force: true });
loadState();
if (state?.settings?.theme) applyTheme(state.settings.theme, { force: true });
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
