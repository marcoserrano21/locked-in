import { cloneSeedSchedule, CHALLENGE_META, uid } from "./schedule.js";
import { todayKey, dateKey, addDays, parseDateKey } from "./dates.js";
import { validateBackupText } from "./backup.js";
import { BLANK_DAY30 } from "./constants.js";
import {
  activeSessionForDate,
  defaultFitnessSettings,
  findExerciseCatalog,
  makeExercise,
  makeSet,
  makeWorkoutSession,
  migrateTrainWhyIds,
  sessionVolume,
  suggestedNextLoad,
  touchRecentExercise,
  buildWorkoutCompletionPayload,
  buildWorkoutEndedPayload,
  advanceFocusAfterSession,
} from "./fitness.js";
import { getHustlePack } from "./hustle-packs.js";
import { BLOCK_PRESETS } from "./setup-presets.js";
import { startChallenge, resolveChallengeLength } from "./challenge.js";
import { resolveBlocksForDate } from "./work.js";
import { storeKeyForGuest, activeGuestId } from "./beta.js";

const STORE_KEY = storeKeyForGuest();
const LEGACY_V3 = "marco-tracker-v3";
const LEGACY_V2 = "marco-tracker-v2";
const LEGACY_V1 = "marco-tracker-v1";

/** Exported so UI can show which guest slot is active. */
export { activeGuestId };

const listeners = new Set();

/** @type {null | { version: number, activeProfileId: string, profiles: Record<string, object> }} */
let appRoot = null;

export let state = null;
export let needsWelcome = false;

export let ui = {
  tab: "today",
  todayMode: "track",
  hustleView: "fitness",
  hustleTab: "flow",
  fitnessTab: "today",
  day30Open: null,
  day30Coach: false,
  day30SectionOpen: null,
  toast: null,
  flash: null,
  selectedDay: new Date().getDay(),
  selectedDate: todayKey(),
  overrideDate: todayKey(),
  shiftWeekOffset: 0,
  modal: null,
  editingBlock: null,
  editingEvent: null,
  celebrate: null,
  theme: "dark",
  planMode: "date",
  selectedMuscleGroups: [],
  muscleMapSide: "front",
  workoutBuilderPreset: "custom",
  fitnessHistoryPage: 0,
  fitnessHistorySort: "recent",
  fitnessHistoryFocus: null,
  fitnessHistoryMuscle: null,
  fitnessSessionMenuOpen: false,
  fitnessRestPresetsOpen: false,
  proofShareScope: "week",
  hustleLogPage: 0,
  milesPage: 0,
  openExerciseMenu: null,
  openBlockMenuIndex: null,
  replaceExercise: null,
  fitnessSearch: "",
  fitnessMuscle: "all",
  fitnessListFilter: "all",
  profileChallengeOpen: true,
  profileDay30Open: null,
  fitnessAddSession: null,
  fitnessEquipmentOpen: false,
  fitnessOpenExerciseId: null,
  fitnessOpenMode: "multi",
  fitnessOpenIds: null,
  fitnessCollapsedPairIds: [],
  profileLimitsOpen: false,
  fitnessPrefsStep: 1,
  fitnessPrefsMode: "build",
  viewingWorkoutId: null,
  tipsTrack: null,
  welcomeStep: 1,
  welcomeName: "",
  welcomeFocus: null,
  welcomeAppMode: "simple",
  welcomeChallengeLength: 30,
  setupTipId: null,
  restTimer: null,
  fitnessWarmupChecked: [],
  fitnessWarmupCollapsed: false,
  fitnessUndo: null,
  fitnessCooldownChecked: [],
  fitnessCooldownSkipped: false,
  rebuildSessionId: null,
  todayView: "list",
  setupWizardStep: 1,
  setupBuildDays: [0, 1, 2],
  setupModules: { fitness: true, money: false, hustle: false },
  setupBlockPreset: "morning",
  setupHustlePack: "blank",
};

function shiftDateKey(baseKey, deltaDays) {
  return dateKey(addDays(parseDateKey(baseKey), deltaDays));
}

function sealCoreCompletions(partialState, date) {
  const blocks = resolveBlocksForDate(partialState, date);
  const done = {};
  for (const b of blocks) {
    if (!b.soft) done[b.id] = true;
  }
  return done;
}

function demoCompletedSession(date, exercisesSpec, note = "") {
  const started = new Date(`${date}T10:00:00`);
  const completed = new Date(`${date}T11:20:00`);
  const exercises = exercisesSpec.map((spec) => {
    const ex = makeExercise(
      spec.name,
      spec.muscleGroup,
      "lb",
      { weight: spec.weight ?? 0, reps: spec.reps ?? 10, unit: "lb" },
      { sets: spec.sets || 3, role: spec.role || "" }
    );
    ex.sets = (ex.sets || []).map((s) => ({
      ...s,
      done: true,
      weight: spec.weight ?? s.weight,
      reps: spec.reps ?? s.reps,
    }));
    return ex;
  });
  return {
    id: uid("ws"),
    date,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    exercises,
    notes: note,
  };
}

/** Rich Marco demo seeds — blank profiles stay empty via blankProfileData(). */
function marcoDemoSeeds(schedule, workOverrides) {
  const today = todayKey();
  const partial = { schedule, workOverrides, dateSchedules: {} };
  const sealedOffsets = [-6, -5, -3, -2, -1];
  const completions = {};
  for (const off of sealedOffsets) {
    const key = shiftDateKey(today, off);
    completions[key] = sealCoreCompletions(partial, key);
  }

  const fitnessLog = [
    demoCompletedSession(shiftDateKey(today, -13), [
      { name: "Barbell Bench Press", muscleGroup: "chest", weight: 135, reps: 8, role: "compound" },
      { name: "Incline Dumbbell Press", muscleGroup: "chest", weight: 50, reps: 10 },
      { name: "Overhead Press", muscleGroup: "shoulders", weight: 75, reps: 8, role: "compound" },
      { name: "Tricep Pushdown", muscleGroup: "triceps", weight: 40, reps: 12 },
    ], "Push"),
    demoCompletedSession(shiftDateKey(today, -11), [
      { name: "Barbell Row", muscleGroup: "back", weight: 115, reps: 8, role: "compound" },
      { name: "Lat Pulldown", muscleGroup: "back", weight: 100, reps: 10 },
      { name: "Dumbbell Curl", muscleGroup: "biceps", weight: 30, reps: 12 },
      { name: "Face Pull", muscleGroup: "back", weight: 35, reps: 15 },
    ], "Pull"),
    demoCompletedSession(shiftDateKey(today, -9), [
      { name: "Barbell Back Squat", muscleGroup: "quads", weight: 185, reps: 6, role: "compound" },
      { name: "Romanian Deadlift", muscleGroup: "hamstrings", weight: 155, reps: 8, role: "compound" },
      { name: "Walking Lunge", muscleGroup: "quads", weight: 40, reps: 10 },
      { name: "Calf Raise", muscleGroup: "calves", weight: 90, reps: 15 },
    ], "Legs"),
    demoCompletedSession(shiftDateKey(today, -7), [
      { name: "Incline Dumbbell Press", muscleGroup: "chest", weight: 55, reps: 10 },
      { name: "Cable Fly", muscleGroup: "chest", weight: 25, reps: 12 },
      { name: "Lateral Raise", muscleGroup: "shoulders", weight: 20, reps: 12 },
      { name: "Skull Crusher", muscleGroup: "triceps", weight: 45, reps: 10 },
      { name: "Plank", muscleGroup: "abs", weight: 0, reps: 45 },
    ], "Upper volume"),
    demoCompletedSession(shiftDateKey(today, -5), [
      { name: "Pull-Up", muscleGroup: "back", weight: 0, reps: 8, role: "compound" },
      { name: "Seated Cable Row", muscleGroup: "back", weight: 110, reps: 10 },
      { name: "Hammer Curl", muscleGroup: "biceps", weight: 30, reps: 12 },
      { name: "Rear Delt Fly", muscleGroup: "shoulders", weight: 20, reps: 15 },
    ], "Pull 2"),
    demoCompletedSession(shiftDateKey(today, -4), [
      { name: "Leg Press", muscleGroup: "quads", weight: 270, reps: 10 },
      { name: "Hip Thrust", muscleGroup: "glutes", weight: 185, reps: 10, role: "compound" },
      { name: "Leg Curl", muscleGroup: "hamstrings", weight: 70, reps: 12 },
      { name: "Calf Raise", muscleGroup: "calves", weight: 100, reps: 15 },
    ], "Lower"),
    demoCompletedSession(shiftDateKey(today, -2), [
      { name: "Barbell Bench Press", muscleGroup: "chest", weight: 145, reps: 6, role: "compound" },
      { name: "Incline Dumbbell Press", muscleGroup: "chest", weight: 55, reps: 8 },
      { name: "Overhead Press", muscleGroup: "shoulders", weight: 85, reps: 6, role: "compound" },
      { name: "Tricep Pushdown", muscleGroup: "triceps", weight: 45, reps: 12 },
      { name: "Cable Crunch", muscleGroup: "abs", weight: 50, reps: 15 },
    ], "Push overload"),
    demoCompletedSession(shiftDateKey(today, -1), [
      { name: "Conventional Deadlift", muscleGroup: "back", weight: 225, reps: 5, role: "compound" },
      { name: "Lat Pulldown", muscleGroup: "back", weight: 110, reps: 10 },
      { name: "Dumbbell Curl", muscleGroup: "biceps", weight: 35, reps: 10 },
      { name: "Face Pull", muscleGroup: "back", weight: 40, reps: 15 },
    ], "Pull strength"),
  ];

  return {
    completions,
    fitnessLog,
    uberLog: [
      { id: uid("uber"), date: shiftDateKey(today, -6), miles: 42, earnings: 78 },
      { id: uid("uber"), date: shiftDateKey(today, -3), miles: 31, earnings: 56 },
      { id: uid("uber"), date: shiftDateKey(today, -1), miles: 28, earnings: 49 },
    ],
    outreachLog: [
      { id: uid("out"), date: shiftDateKey(today, -5), who: "Local cafe owner", channel: "dm", status: "sent", note: "Site refresh pitch" },
      { id: uid("out"), date: shiftDateKey(today, -2), who: "Alumni PM", channel: "email", status: "replied", note: "Intro to design lead" },
      { id: uid("out"), date: shiftDateKey(today, -1), who: "Gym owner", channel: "dm", status: "sent", note: "Booking page demo" },
    ],
    hustleChecks: {
      "flow-research": true,
      "flow-post": true,
      "flow-dm": true,
    },
    challenge: {
      startDate: shiftDateKey(today, -11),
      lengthDays: 30,
      status: "active",
    },
    fitnessSettings: {
      ...defaultFitnessSettings(),
      preferredUnit: "lb",
      bodyWeight: 175,
      prefsCaptured: true,
      experienceLevel: "intermediate",
      goal: "build_muscle",
      trainWhy: ["discipline", "structure", "energy"],
      splitType: "ppl",
      gymDaysPerWeek: 4,
      restSeconds: 120,
    },
    hustlePlaybook: getHustlePack("freelance"),
  };
}

function defaultProfileData() {
  const schedule = cloneSeedSchedule();
  const workOverrides = {
    "2026-08-09": { type: "work", start: "10:00 AM", end: "6:30 PM", note: "Sunday shift" },
    "2026-08-10": { type: "off", note: "Off - workout with coworker still on" },
    "2026-08-11": { type: "off", note: "Off" },
    "2026-08-12": { type: "work", start: "10:00 AM", end: "7:30 PM" },
    "2026-08-13": { type: "work", start: "10:00 AM", end: "7:30 PM" },
    "2026-08-14": { type: "work", start: "10:00 AM", end: "7:30 PM" },
    "2026-08-15": { type: "work", start: "10:00 AM", end: "7:30 PM" },
  };
  const demo = marcoDemoSeeds(schedule, workOverrides);
  return {
    challenge: demo.challenge,
    schedule,
    dateSchedules: {},
    workOverrides,
    completions: demo.completions,
    uberLog: demo.uberLog,
    outreachLog: demo.outreachLog,
    events: [],
    celebrations: {},
    hustleChecks: demo.hustleChecks,
    day30Answers: {},
    day30Questions: [...(CHALLENGE_META.reviewQuestions || [])],
    scheduleEdits: [],
    fitnessLog: demo.fitnessLog,
    fitnessSettings: demo.fitnessSettings,
    settings: {
      uberCap: CHALLENGE_META.uberCap,
      uberSoftStop: CHALLENGE_META.uberSoftStop,
      yesterdayCatchUp: true,
      theme: "dark",
      textSize: "default",
      displayName: "Marco",
      bio: "Product builder who turns messy operations into clear tools.",
      portfolioUrl: "https://marco-serrano.netlify.app/",
      linkedinUrl: "https://linkedin.com/in/marco-serrano25",
      lastBackupAt: null,
      installTipDismissed: false,
      challengeLength: 30,
      appMode: "full",
      tourStep: 0,
      tourCompleted: true,
      fitnessTourCompleted: true,
      modulesUnlocked: { proof: true, miles: true },
      premiumUnlocked: false,
      hustlePlaybook: demo.hustlePlaybook,
      blockReminders: false,
    },
  };
}

function blankProfileData(displayName = "New track") {
  const base = defaultProfileData();
  return {
    ...base,
    challenge: null,
    schedule: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    dateSchedules: {},
    workOverrides: {},
    completions: {},
    uberLog: [],
    outreachLog: [],
    events: [],
    celebrations: {},
    hustleChecks: {},
    day30Answers: {},
    day30Questions: [...BLANK_DAY30],
    scheduleEdits: [],
    fitnessLog: [],
    fitnessSettings: defaultFitnessSettings(),
    settings: {
      ...base.settings,
      displayName,
      bio: "",
      portfolioUrl: "",
      linkedinUrl: "",
      challengeLength: 30,
      appMode: "simple",
      tourStep: 0,
      tourCompleted: false,
      fitnessTourCompleted: false,
      modulesUnlocked: { proof: false, miles: false },
      premiumUnlocked: false,
      moneyMode: "hours",
      hustlePlaybook: null,
    },
  };
}

function migrateCompletions(raw) {
  const out = {};
  for (const [key, value] of Object.entries(raw || {})) {
    if (Array.isArray(value)) {
      out[key] = Object.fromEntries(value.map((id) => [id, true]));
    } else if (value && typeof value === "object") {
      out[key] = { ...value };
    }
  }
  return out;
}

function normalizeProfileData(parsed = {}) {
  const base = defaultProfileData();
  const merged = {
    ...base,
    ...parsed,
    completions: migrateCompletions(parsed.completions),
    schedule: parsed.schedule || cloneSeedSchedule(),
    dateSchedules: parsed.dateSchedules || {},
    workOverrides: { ...(parsed.workOverrides || {}) },
    outreachLog: Array.isArray(parsed.outreachLog) ? parsed.outreachLog : [],
    events: Array.isArray(parsed.events) ? parsed.events : base.events,
    celebrations: parsed.celebrations || {},
    hustleChecks: parsed.hustleChecks || {},
    day30Answers: parsed.day30Answers || {},
    day30Questions:
      Array.isArray(parsed.day30Questions) && parsed.day30Questions.length
        ? parsed.day30Questions
        : [...(CHALLENGE_META.reviewQuestions || [])],
    scheduleEdits: Array.isArray(parsed.scheduleEdits) ? parsed.scheduleEdits : [],
    fitnessLog: Array.isArray(parsed.fitnessLog) ? parsed.fitnessLog : [],
    fitnessSettings: {
      ...defaultFitnessSettings(),
      ...(parsed.fitnessSettings || {}),
      trainWhy: migrateTrainWhyIds(parsed.fitnessSettings?.trainWhy),
    },
    settings: { ...base.settings, ...(parsed.settings || {}) },
  };
  delete merged.version;
  delete merged.profiles;
  delete merged.activeProfileId;
  return merged;
}

function makeProfile(preset, displayName, data) {
  const id = uid("profile");
  return {
    ...normalizeProfileData({
      ...data,
      settings: {
        ...(data?.settings || {}),
        displayName: displayName || (preset === "marco" ? "Marco" : "New track"),
      },
    }),
    id,
    preset,
    createdAt: new Date().toISOString(),
  };
}

function syncActiveFromRoot() {
  if (!appRoot?.activeProfileId) return;
  state = appRoot.profiles[appRoot.activeProfileId];
}

function writeActiveIntoRoot() {
  if (!appRoot?.activeProfileId || !state) return;
  appRoot.profiles[appRoot.activeProfileId] = state;
}

function persist() {
  try {
    writeActiveIntoRoot();
    localStorage.setItem(STORE_KEY, JSON.stringify(appRoot));
  } catch (error) {
    console.warn("save failed", error);
  }
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persist();
  }, 75);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  schedulePersist();
  listeners.forEach((fn) => fn());
}

export function setUi(patch) {
  ui = { ...ui, ...patch };
  listeners.forEach((fn) => fn());
}

function bootFromV3(parsed) {
  const profile = makeProfile("marco", parsed?.settings?.displayName || "Marco", parsed);
  appRoot = {
    version: 4,
    activeProfileId: profile.id,
    profiles: { [profile.id]: profile },
  };
  syncActiveFromRoot();
}

export function loadState() {
  try {
    const rawV4 = localStorage.getItem(STORE_KEY);
    if (rawV4) {
      const parsed = JSON.parse(rawV4);
      if (parsed?.profiles && parsed.activeProfileId) {
        appRoot = {
          version: 4,
          activeProfileId: parsed.activeProfileId,
          profiles: Object.fromEntries(
            Object.entries(parsed.profiles).map(([id, p]) => [
              id,
              { ...normalizeProfileData(p), id: p.id || id, preset: p.preset || "marco", createdAt: p.createdAt || new Date().toISOString() },
            ])
          ),
        };
        if (!appRoot.profiles[appRoot.activeProfileId]) {
          appRoot.activeProfileId = Object.keys(appRoot.profiles)[0];
        }
        syncActiveFromRoot();
        if (state) {
          persist();
          return state;
        }
        console.warn("Invalid v4 profile store (no active profile), reinitializing");
      }
    }

    // Legacy keys only apply to the default (non-guest) store.
    if (!activeGuestId) {
      const rawV3 = localStorage.getItem(LEGACY_V3) || localStorage.getItem(LEGACY_V2);
      if (rawV3) {
        bootFromV3(JSON.parse(rawV3));
        persist();
        return state;
      }

      const legacy = localStorage.getItem(LEGACY_V1);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        bootFromV3({
          completions: parsed.completions,
          uberLog: (parsed.uberLog || []).map((e) => ({
            id: e.id || uid("uber"),
            date: e.date,
            miles: Number(e.miles) || 0,
            earnings: Number(e.earnings) || 0,
          })),
        });
        persist();
        return state;
      }
    }
  } catch (error) {
    console.warn("load failed", error);
  }

  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "marco";
  if (isDemo && !activeGuestId) {
    const profile = makeProfile("marco", "Marco", defaultProfileData());
    appRoot = { version: 4, activeProfileId: profile.id, profiles: { [profile.id]: profile } };
    syncActiveFromRoot();
    persist();
    return state;
  }

  needsWelcome = true;
  const blankName = activeGuestId ? `Beta ${activeGuestId.replace("beta-", "")}` : "";
  const profile = makeProfile("blank", blankName, blankProfileData(blankName));
  profile.settings.displayName = blankName;
  appRoot = { version: 4, activeProfileId: profile.id, profiles: { [profile.id]: profile } };
  syncActiveFromRoot();
  persist();
  return state;
}

export const MAX_PROFILES = 3;

export function listProfiles() {
  if (!appRoot) return [];
  const rows = Object.values(appRoot.profiles).map((p) => ({
    id: p.id,
    preset: p.preset,
    displayName: p.settings?.displayName || "Profile",
    createdAt: p.createdAt,
    active: p.id === appRoot.activeProfileId,
  }));
  return rows.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export function getActiveProfileId() {
  return appRoot?.activeProfileId || null;
}

export function switchProfile(id) {
  if (!appRoot?.profiles?.[id]) return;
  writeActiveIntoRoot();
  appRoot.activeProfileId = id;
  syncActiveFromRoot();
  resetToTodayUi();
  setUi({ tab: "today", todayMode: "track", flash: null });
  notify();
}

export function createProfile(kind = "blank", displayName = "") {
  if (!appRoot?.profiles) return null;
  if (Object.keys(appRoot.profiles).length >= MAX_PROFILES) return null;
  writeActiveIntoRoot();
  const name = displayName.trim() || (kind === "marco" ? "Marco" : "New track");
  const data = kind === "marco" ? defaultProfileData() : blankProfileData(name);
  const profile = makeProfile(kind === "marco" ? "marco" : "blank", name, data);
  appRoot.profiles[profile.id] = profile;
  appRoot.activeProfileId = profile.id;
  syncActiveFromRoot();
  resetToTodayUi();
  setUi({ tab: "today", todayMode: kind === "blank" ? "edit" : "track", flash: null });
  notify();
  return profile.id;
}

export function renameProfile(id, displayName) {
  const name = String(displayName || "").trim();
  if (!name || !appRoot?.profiles?.[id]) return false;
  writeActiveIntoRoot();
  const profile = appRoot.profiles[id];
  profile.settings = { ...(profile.settings || {}), displayName: name };
  if (id === appRoot.activeProfileId) {
    state = {
      ...state,
      settings: { ...state.settings, displayName: name },
    };
  }
  notify();
  return true;
}

export function deleteProfile(id) {
  if (!appRoot || Object.keys(appRoot.profiles).length <= 1) return false;
  if (!appRoot.profiles[id]) return false;
  writeActiveIntoRoot();
  delete appRoot.profiles[id];
  if (appRoot.activeProfileId === id) {
    appRoot.activeProfileId = Object.keys(appRoot.profiles)[0];
    syncActiveFromRoot();
    resetToTodayUi();
    setUi({ tab: "profile", todayMode: "track", flash: null });
  }
  notify();
  return true;
}

export function patchState(mutator) {
  if (!state) return;
  state = mutator(state);
  notify();
}

export function toggleBlock(date, blockId) {
  patchState((s) => {
    const day = { ...(s.completions[date] || {}) };
    if (day[blockId]) delete day[blockId];
    else day[blockId] = true;
    return {
      ...s,
      completions: { ...s.completions, [date]: day },
    };
  });
}

export function markCelebrated(date) {
  patchState((s) => ({
    ...s,
    celebrations: { ...s.celebrations, [date]: true },
  }));
}

export function addUberEntry(miles, earnings, date = todayKey()) {
  patchState((s) => ({
    ...s,
    uberLog: [
      ...s.uberLog,
      {
        id: uid("uber"),
        date: date || todayKey(),
        miles,
        earnings: earnings || 0,
      },
    ],
  }));
}

export function updateUberEntry(id, patch) {
  patchState((s) => ({
    ...s,
    uberLog: s.uberLog.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  }));
}

export function deleteUberEntry(id) {
  patchState((s) => ({
    ...s,
    uberLog: s.uberLog.filter((e) => e.id !== id),
  }));
}

export function addOutreach(entry) {
  patchState((s) => ({
    ...s,
    outreachLog: [
      {
        id: uid("out"),
        date: entry.date || todayKey(),
        who: entry.who,
        channel: entry.channel || "dm",
        status: entry.status || "sent",
        note: entry.note || "",
      },
      ...s.outreachLog,
    ],
  }));
}

export function updateOutreach(id, patch) {
  patchState((s) => ({
    ...s,
    outreachLog: s.outreachLog.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  }));
}

export function deleteOutreach(id) {
  patchState((s) => ({
    ...s,
    outreachLog: s.outreachLog.filter((e) => e.id !== id),
  }));
}

export function setWorkOverride(date, override) {
  patchState((s) => {
    const workOverrides = { ...s.workOverrides };
    if (!override) delete workOverrides[date];
    else workOverrides[date] = override;
    return {
      ...s,
      workOverrides,
      scheduleEdits: [
        ...s.scheduleEdits,
        { at: new Date().toISOString(), note: `Work override ${date}: ${override?.type || "cleared"}` },
      ],
    };
  });
}

export function updateDayBlocks(dayIdx, blocks, note) {
  patchState((s) => ({
    ...s,
    schedule: { ...s.schedule, [String(dayIdx)]: blocks },
    scheduleEdits: note
      ? [...s.scheduleEdits, { at: new Date().toISOString(), note }]
      : s.scheduleEdits,
  }));
}

export function updateDateBlocks(dateKey, blocks, note) {
  patchState((s) => ({
    ...s,
    dateSchedules: { ...s.dateSchedules, [dateKey]: blocks },
    scheduleEdits: note
      ? [...s.scheduleEdits, { at: new Date().toISOString(), note }]
      : s.scheduleEdits,
  }));
}

export function exportBackup() {
  writeActiveIntoRoot();
  return JSON.stringify(appRoot, null, 2);
}

export function markBackupExported() {
  patchState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      lastBackupAt: new Date().toISOString(),
    },
  }));
}

export function importBackup(jsonText) {
  const parsed = validateBackupText(jsonText);
  if (parsed.profiles && parsed.activeProfileId) {
    appRoot = {
      version: 4,
      activeProfileId: parsed.activeProfileId,
      profiles: Object.fromEntries(
        Object.entries(parsed.profiles).map(([id, p]) => [
          id,
          {
            ...normalizeProfileData(p),
            id: p.id || id,
            preset: p.preset || "marco",
            createdAt: p.createdAt || new Date().toISOString(),
          },
        ])
      ),
    };
    syncActiveFromRoot();
  } else {
    bootFromV3(parsed);
  }
  notify();
}

export function resetScheduleToSeed() {
  patchState((s) => ({
    ...s,
    schedule: cloneSeedSchedule(),
    dateSchedules: {},
    scheduleEdits: [
      ...s.scheduleEdits,
      { at: new Date().toISOString(), note: "Reset schedule to seed" },
    ],
  }));
}

export function setThemeSetting(theme) {
  patchState((s) => ({
    ...s,
    settings: { ...s.settings, theme },
  }));
}

export function setTextSizeSetting(size) {
  const textSize = ["default", "medium", "large"].includes(size) ? size : "default";
  patchState((s) => ({
    ...s,
    settings: { ...s.settings, textSize },
  }));
}

export function addEvent(event) {
  patchState((s) => ({
    ...s,
    events: [...(s.events || []), { id: uid("evt"), ...event }],
  }));
}

export function updateEvent(id, patch) {
  patchState((s) => ({
    ...s,
    events: (s.events || []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
  }));
}

export function deleteEvent(id) {
  patchState((s) => ({
    ...s,
    events: (s.events || []).filter((e) => e.id !== id),
  }));
}

export function toggleHustleCheck(id) {
  patchState((s) => {
    const hustleChecks = { ...(s.hustleChecks || {}) };
    if (hustleChecks[id]) delete hustleChecks[id];
    else hustleChecks[id] = true;
    return { ...s, hustleChecks };
  });
}

export function resetToTodayUi() {
  const key = todayKey();
  setUi({
    selectedDate: key,
    selectedDay: new Date().getDay(),
    overrideDate: key,
    todayMode: "track",
  });
}

export function updateSettings(patch) {
  patchState((s) => ({
    ...s,
    settings: { ...s.settings, ...patch },
  }));
}

export function setChallengeLength(days) {
  const premium = Boolean(state?.settings?.premiumUnlocked);
  const resolved = resolveChallengeLength(days, premium);
  if (resolved == null) return false;
  patchState((s) => ({
    ...s,
    settings: { ...s.settings, challengeLength: resolved },
    challenge: s.challenge ? { ...s.challenge, lengthDays: resolved } : s.challenge,
  }));
  return true;
}

export function setDay30Questions(questions) {
  patchState((s) => ({
    ...s,
    day30Questions: (questions || []).map((q) => String(q).trim()).filter(Boolean).slice(0, 12),
  }));
}

export function addDay30Question(text) {
  const q = String(text || "").trim();
  if (!q) return;
  patchState((s) => {
    const list = [...(s.day30Questions || [])];
    if (list.length >= 12) return s;
    return { ...s, day30Questions: [...list, q] };
  });
}

export function removeDay30Question(index) {
  patchState((s) => {
    const list = [...(s.day30Questions || [])];
    list.splice(Number(index), 1);
    return { ...s, day30Questions: list };
  });
}

export function reorderDay30Question(index, dir) {
  patchState((s) => {
    const list = [...(s.day30Questions || [])];
    const i = Number(index);
    const j = i + Number(dir);
    if (j < 0 || j >= list.length) return s;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...s, day30Questions: list };
  });
}

export function setAppMode(mode) {
  const appMode = mode === "full" ? "full" : "simple";
  patchState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      appMode,
      modulesUnlocked:
        appMode === "full"
          ? { ...(s.settings?.modulesUnlocked || {}), miles: true }
          : { ...(s.settings?.modulesUnlocked || {}), miles: false },
    },
  }));
}

export function advanceTour() {
  let done = false;
  patchState((s) => {
    const track = typeof ui !== "undefined" && ui?.tipsTrack === "fitness" ? "fitness" : "today";
    if (track === "fitness") {
      const step = Number(s.settings?.fitnessTourStep || 0) + 1;
      done = step >= 3;
      return {
        ...s,
        settings: {
          ...s.settings,
          fitnessTourStep: done ? 3 : step,
          fitnessTourCompleted: done || Boolean(s.settings?.fitnessTourCompleted),
        },
      };
    }
    const step = Number(s.settings?.tourStep || 0) + 1;
    done = step >= 3;
    return {
      ...s,
      settings: {
        ...s.settings,
        tourStep: done ? 3 : step,
        tourCompleted: done,
      },
    };
  });
  if (done) setUi({ modal: null, tipsTrack: null });
}

export function unlockModule(name) {
  patchState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      modulesUnlocked: { ...(s.settings?.modulesUnlocked || {}), [name]: true },
    },
  }));
}

export function setDay30Answer(questionId, answer) {
  patchState((s) => ({
    ...s,
    day30Answers: {
      ...(s.day30Answers || {}),
      [questionId]: {
        ...answer,
        updatedAt: new Date().toISOString(),
      },
    },
  }));
}

export function completeWelcome(displayName, focus = "both", appMode = "simple") {
  const name = String(displayName || "").trim().slice(0, 24) || "My track";
  const mode = appMode === "full" ? "full" : "simple";
  if (appRoot?.profiles?.[appRoot.activeProfileId]) {
    appRoot.profiles[appRoot.activeProfileId].preset = "blank";
  }
  const modulesFromFocus = {
    fitness: focus === "fitness" || focus === "both",
    money: mode === "full",
    hustle: focus !== "fitness",
  };
  patchState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      displayName: name,
      appMode: mode,
      welcomeFocus: focus,
      modulesUnlocked:
        mode === "full"
          ? { proof: false, miles: true }
          : { proof: false, miles: false },
    },
  }));
  setUi({
    welcomeName: name,
    welcomeFocus: focus,
    welcomeAppMode: mode,
    setupModules: modulesFromFocus,
  });
  persist();
  notify();
}

export function finishOnboarding({
  displayName,
  focus = "both",
  appMode = "simple",
  buildDays = [0, 1, 2],
  blockPreset = "morning",
  challengeLength = 30,
} = {}) {
  const name = String(displayName || "").trim().slice(0, 24) || "My track";
  const mode = appMode === "full" ? "full" : "simple";
  needsWelcome = false;
  if (appRoot?.profiles?.[appRoot.activeProfileId]) {
    appRoot.profiles[appRoot.activeProfileId].preset = "blank";
  }
  const modules = {
    fitness: focus === "fitness" || focus === "both",
    money: mode === "full",
    hustle: focus !== "fitness",
  };
  const lengthDays =
    resolveChallengeLength(challengeLength, false) ??
    resolveChallengeLength(30, false) ??
    30;
  const tab = focus === "fitness" ? "freelance" : "today";
  const hustleView = focus === "fitness" || focus === "both" ? "fitness" : "hustle";

  applySetupWizard({ buildDays, modules, blockPreset, hustlePack: "blank" });

  patchState((s) => {
    const withSettings = {
      ...s,
      settings: {
        ...s.settings,
        displayName: name,
        appMode: mode,
        welcomeFocus: focus,
        challengeLength: lengthDays,
        tourCompleted: true,
        tourStep: 3,
        onboardingCompleted: true,
        modulesUnlocked:
          mode === "full"
            ? { ...(s.settings?.modulesUnlocked || {}), proof: Boolean(s.settings?.modulesUnlocked?.proof), miles: true }
            : { ...(s.settings?.modulesUnlocked || {}), proof: Boolean(s.settings?.modulesUnlocked?.proof), miles: false },
      },
    };
    return startChallenge(withSettings);
  });

  setUi({
    modal: null,
    welcomeStep: 1,
    tab,
    hustleView,
    fitnessTab: "today",
    todayMode: "track",
  });
  persist();
  notify();
}

export function applySetupWizard({
  buildDays = [0, 1, 2],
  modules = {},
  blockPreset = "morning",
  hustlePack = "blank",
} = {}) {
  const presetBlocks = BLOCK_PRESETS[blockPreset] || BLOCK_PRESETS.morning;
  const schedule = {};
  for (let d = 0; d < 7; d++) {
    schedule[String(d)] = presetBlocks.map((b) => ({
      ...b,
      id: uid("blk"),
      tags: b.tags ? b.tags.map((t) => ({ ...t })) : [],
    }));
  }
  const pack = modules.hustle ? getHustlePack(hustlePack) : null;
  patchState((s) => ({
    ...s,
    schedule,
    settings: {
      ...s.settings,
      buildDays: [...buildDays],
      moneyLabel: modules.money ? s.settings?.moneyLabel || "Side income" : s.settings?.moneyLabel,
      moneyMode: s.preset === "marco" ? "miles" : s.settings?.moneyMode || "hours",
      setupWizardCompleted: true,
      modulesUnlocked: {
        proof: Boolean(s.settings?.modulesUnlocked?.proof),
        miles: Boolean(modules.money),
        hustle: Boolean(modules.hustle),
        fitness: modules.fitness !== false,
      },
      hustlePlaybook: pack
        ? {
            niche: pack.niche,
            positioning: pack.positioning,
            moneyBlock: pack.moneyBlock,
            weeklyFlow: (pack.weeklyFlow || []).map((f) => ({ ...f })),
            ramp: (pack.ramp || []).map((w) => ({
              ...w,
              id: w.id || uid("ramp"),
              items: [...(w.items || [])],
            })),
            scripts: { ...(pack.scripts || {}) },
          }
        : s.settings?.hustlePlaybook,
    },
  }));
  setUi({
    modal: null,
    setupWizardStep: 1,
    tab: "today",
    todayMode: "track",
    hustleView: modules.fitness ? "fitness" : modules.hustle ? "hustle" : "fitness",
  });
}

export function restartFromOnboarding() {
  try {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(LEGACY_V3);
    localStorage.removeItem(LEGACY_V2);
    localStorage.removeItem(LEGACY_V1);
  } catch (error) {
    console.warn("restart clear failed", error);
  }
  needsWelcome = true;
  const profile = makeProfile("blank", "", blankProfileData(""));
  profile.settings.displayName = "";
  appRoot = { version: 4, activeProfileId: profile.id, profiles: { [profile.id]: profile } };
  syncActiveFromRoot();
  setUi({
    tab: "today",
    todayMode: "track",
    hustleView: "fitness",
    hustleTab: "flow",
    fitnessTab: "today",
    selectedDay: new Date().getDay(),
    selectedDate: todayKey(),
    overrideDate: todayKey(),
    shiftWeekOffset: 0,
    modal: "welcome",
    welcomeStep: 1,
    welcomeName: "",
    welcomeFocus: null,
    welcomeAppMode: "simple",
    editingBlock: null,
    editingEvent: null,
    celebrate: null,
    planMode: "date",
    flash: null,
  });
  persist();
  notify();
}

export function loadMarcoDemo() {
  const profile = makeProfile("marco", "Marco", defaultProfileData());
  appRoot = { version: 4, activeProfileId: profile.id, profiles: { [profile.id]: profile } };
  syncActiveFromRoot();
  needsWelcome = false;
  setUi({ modal: null, tab: "today", todayMode: "track", hustleView: "hustle" });
  persist();
  notify();
}

function mapFitnessLog(log, sessionId, mapper) {
  return (log || []).map((session) => {
    if (session.id !== sessionId) return session;
    return mapper(session);
  });
}

function mapExercise(session, exerciseId, mapper) {
  return {
    ...session,
    exercises: (session.exercises || []).map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return mapper(ex);
    }),
  };
}

export function startWorkout(date = todayKey()) {
  patchState((s) => {
    const log = s.fitnessLog || [];
    if (activeSessionForDate(log, date)) return s;
    return {
      ...s,
      fitnessLog: [makeWorkoutSession(date), ...log],
    };
  });
}

export function toggleSessionTimer(sessionId) {
  if (!sessionId) return;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      if (session.completedAt) return session;
      if (session.timerStartedAt) {
        const started = Date.parse(session.timerStartedAt);
        const add = Number.isFinite(started) ? Math.max(0, Date.now() - started) : 0;
        return {
          ...session,
          timerStartedAt: null,
          timerElapsedMs: Math.max(0, Number(session.timerElapsedMs) || 0) + add,
        };
      }
      return { ...session, timerStartedAt: new Date().toISOString() };
    }),
  }));
}

export function addExerciseToSession(sessionId, name, muscleGroup = "", planMeta = {}) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return;
  const catalog = findExerciseCatalog(trimmed);
  patchState((s) => {
    const unitPref = s.fitnessSettings?.preferredUnit || "lb";
    const group = muscleGroup || catalog?.muscleGroup || "";
    const hint = suggestedNextLoad(
      s.fitnessLog,
      trimmed,
      unitPref,
      s.fitnessSettings?.goal,
      s.fitnessSettings?.focusExercise
    );
    const reps = planMeta.reps != null ? Number(planMeta.reps) : hint.reps;
    const weight = planMeta.weight != null ? Number(planMeta.weight) : hint.weight;
    const seed = {
      ...hint,
      reps: Number.isFinite(reps) ? reps : hint.reps,
      weight: Number.isFinite(weight) ? weight : hint.weight,
    };
    const seeded = makeExercise(trimmed, group, unitPref, seed, {
      sets: planMeta.sets,
      pairId: planMeta.pairId,
      pairType: planMeta.pairType,
      role: planMeta.role,
      restSeconds: planMeta.restSeconds ?? hint.restSeconds,
    });
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        recentExercises: touchRecentExercise(s.fitnessSettings, trimmed),
      },
      fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => ({
        ...session,
        exercises: normalizePairContiguity([...(session.exercises || []), seeded]),
      })),
    };
  });
}

/** Replace all exercises on an active session with a new plan (live regen). */
export function replaceSessionExercises(sessionId, plan = []) {
  if (!sessionId) return;
  patchState((s) => {
    const unitPref = s.fitnessSettings?.preferredUnit || "lb";
    const exercises = (plan || []).map((ex) => {
      const hint = suggestedNextLoad(
        s.fitnessLog,
        ex.name,
        unitPref,
        s.fitnessSettings?.goal,
        s.fitnessSettings?.focusExercise
      );
      const reps = ex.reps != null ? Number(ex.reps) : hint.reps;
      const weight = ex.weight != null ? Number(ex.weight) : hint.weight;
      return makeExercise(ex.name, ex.muscleGroup || "", unitPref, {
        ...hint,
        reps: Number.isFinite(reps) ? reps : hint.reps,
        weight: Number.isFinite(weight) ? weight : hint.weight,
      }, {
        sets: ex.sets,
        pairId: ex.pairId,
        pairType: ex.pairType,
        role: ex.role,
        restSeconds: ex.restSeconds ?? hint.restSeconds,
      });
    });
    return {
      ...s,
      fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => ({
        ...session,
        exercises,
      })),
    };
  });
}

export function patchFitnessSettings(patch) {
  patchState((s) => ({
    ...s,
    fitnessSettings: {
      ...defaultFitnessSettings(),
      ...s.fitnessSettings,
      ...patch,
    },
  }));
}

export function toggleTrainWhy(id) {
  const key = String(id || "").trim();
  if (!key) return;
  patchState((s) => {
    const prev = Array.isArray(s.fitnessSettings?.trainWhy) ? [...s.fitnessSettings.trainWhy] : [];
    const has = prev.includes(key);
    let trainWhy;
    if (has) {
      trainWhy = prev.filter((x) => x !== key);
    } else if (prev.length >= 3) {
      trainWhy = prev;
    } else {
      trainWhy = [...prev, key];
    }
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        trainWhy,
      },
    };
  });
}

export function addFitnessSet(sessionId, exerciseId) {
  patchState((s) => {
    const unit = s.fitnessSettings?.preferredUnit || "lb";
    return {
      ...s,
      fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) =>
        mapExercise(session, exerciseId, (ex) => {
          const last = (ex.sets || [])[(ex.sets || []).length - 1];
          const hint = suggestedNextLoad(
            s.fitnessLog,
            ex.name,
            unit,
            s.fitnessSettings?.goal,
            s.fitnessSettings?.focusExercise
          );
          const seed = last
            ? { weight: Number(last.weight) || 0, reps: Number(last.reps) || hint.reps || 8, unit: last.unit || unit }
            : hint;
          return {
            ...ex,
            sets: [...(ex.sets || []), makeSet(unit, seed)],
          };
        })
      ),
    };
  });
}

export function updateFitnessSet(sessionId, exerciseId, setId, patch) {
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) =>
      mapExercise(session, exerciseId, (ex) => ({
        ...ex,
        sets: (ex.sets || []).map((set) => (set.id === setId ? { ...set, ...patch } : set)),
      }))
    ),
  }));
}

export function toggleFitnessSetDone(sessionId, exerciseId, setId) {
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) =>
      mapExercise(session, exerciseId, (ex) => ({
        ...ex,
        sets: (ex.sets || []).map((set) =>
          set.id === setId ? { ...set, done: !set.done } : set
        ),
      }))
    ),
  }));
}

export function deleteFitnessSet(sessionId, exerciseId, setId) {
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) =>
      mapExercise(session, exerciseId, (ex) => ({
        ...ex,
        sets: (ex.sets || []).filter((set) => set.id !== setId),
      }))
    ),
  }));
}

export function deleteFitnessExercise(sessionId, exerciseId) {
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => ({
      ...session,
      exercises: (session.exercises || []).filter((ex) => ex.id !== exerciseId),
    })),
  }));
}

/** Reorder an exercise within a session by moving fromId near toId.
 * Dropping onto a superset/circuit member joins that pair and keeps members contiguous.
 */
export function reorderFitnessExercise(sessionId, fromId, toId, { joinPair = true, forcePair = null, leavePair = false, insertAfter = false } = {}) {
  if (!sessionId || !fromId || !toId || fromId === toId) return false;
  let moved = false;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      const list = [...(session.exercises || [])].map((ex) => ({ ...ex }));
      const fromIdx = list.findIndex((ex) => ex.id === fromId);
      const toIdx = list.findIndex((ex) => ex.id === toId);
      if (fromIdx < 0 || toIdx < 0) return session;
      const [item] = list.splice(fromIdx, 1);
      const targetIdx = list.findIndex((ex) => ex.id === toId);
      if (targetIdx < 0) return session;
      const target = list[targetIdx];

      if (forcePair?.pairId) {
        item.pairId = forcePair.pairId;
        item.pairType = forcePair.pairType || "superset";
      } else if (leavePair || !(joinPair && target?.pairId && target?.pairType)) {
        item.pairId = null;
        item.pairType = null;
      } else if (joinPair && target?.pairId && target?.pairType) {
        item.pairId = target.pairId;
        item.pairType = target.pairType;
      }

      const insertAt = insertAfter ? targetIdx + 1 : targetIdx;
      list.splice(insertAt, 0, item);
      moved = true;
      return { ...session, exercises: cleanupOrphanPairs(normalizePairContiguity(list)) };
    }),
  }));
  return moved;
}

/** Move an entire superset/circuit block before another exercise (block stays grouped). */
export function reorderFitnessPairBlock(sessionId, fromPairId, beforeExerciseId) {
  if (!sessionId || !fromPairId || !beforeExerciseId) return false;
  let moved = false;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      const list = (session.exercises || []).map((ex) => ({ ...ex }));
      const block = list.filter((ex) => ex.pairId === fromPairId);
      if (!block.length) return session;
      const target = list.find((ex) => ex.id === beforeExerciseId);
      if (!target || target.pairId === fromPairId) return session;
      const without = list.filter((ex) => ex.pairId !== fromPairId);
      const insertAt = without.findIndex((ex) => ex.id === beforeExerciseId);
      if (insertAt < 0) return session;
      without.splice(insertAt, 0, ...block);
      moved = true;
      return { ...session, exercises: cleanupOrphanPairs(normalizePairContiguity(without)) };
    }),
  }));
  return moved;
}

/** Append a solo exercise after the last item in the session. */
export function moveFitnessExerciseToEnd(sessionId, fromId, { leavePair = true } = {}) {
  if (!sessionId || !fromId) return false;
  let moved = false;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      const list = (session.exercises || []).map((ex) => ({ ...ex }));
      const fromIdx = list.findIndex((ex) => ex.id === fromId);
      if (fromIdx < 0) return session;
      if (fromIdx === list.length - 1) {
        const item = list[fromIdx];
        if (!leavePair || (!item.pairId && !item.pairType)) return session;
      }
      const [item] = list.splice(fromIdx, 1);
      if (leavePair) {
        item.pairId = null;
        item.pairType = null;
      }
      moved = true;
      return { ...session, exercises: cleanupOrphanPairs(normalizePairContiguity([...list, item])) };
    }),
  }));
  return moved;
}

/** Rebuild session exercise order from list units (solo cards + pair groups). */
export function reorderFitnessUnits(sessionId, orderedUnitKeys) {
  if (!sessionId || !Array.isArray(orderedUnitKeys) || !orderedUnitKeys.length) return false;
  let moved = false;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      const list = (session.exercises || []).map((ex) => ({ ...ex }));
      const byId = new Map(list.map((ex) => [ex.id, ex]));
      const used = new Set();
      const next = [];
      for (const key of orderedUnitKeys) {
        if (key?.type === "pair" && key.pairId) {
          for (const member of list.filter((ex) => ex.pairId === key.pairId)) {
            if (used.has(member.id)) continue;
            next.push(member);
            used.add(member.id);
          }
        } else if (key?.id) {
          const item = byId.get(key.id);
          if (!item || used.has(item.id)) continue;
          next.push(item);
          used.add(item.id);
        }
      }
      for (const ex of list) {
        if (used.has(ex.id)) continue;
        next.push(ex);
      }
      const same = next.length === list.length && next.every((ex, i) => ex.id === list[i].id);
      if (same) return session;
      moved = true;
      return { ...session, exercises: cleanupOrphanPairs(normalizePairContiguity(next)) };
    }),
  }));
  return moved;
}

/** Append an entire pair block after the last exercise (end of list). */
export function moveFitnessPairBlockToEnd(sessionId, fromPairId) {
  if (!sessionId || !fromPairId) return false;
  let moved = false;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      const list = (session.exercises || []).map((ex) => ({ ...ex }));
      const block = list.filter((ex) => ex.pairId === fromPairId);
      if (!block.length) return session;
      const without = list.filter((ex) => ex.pairId !== fromPairId);
      if (without.length === list.length - block.length && list.slice(-block.length).every((ex, i) => ex.id === block[i]?.id)) {
        return session;
      }
      moved = true;
      return { ...session, exercises: cleanupOrphanPairs(normalizePairContiguity([...without, ...block])) };
    }),
  }));
  return moved;
}

export function cloneSessionExercises(sessionId) {
  const session = (state.fitnessLog || []).find((w) => w.id === sessionId);
  if (!session) return null;
  try {
    return JSON.parse(JSON.stringify(session.exercises || []));
  } catch {
    return (session.exercises || []).map((ex) => ({
      ...ex,
      sets: (ex.sets || []).map((set) => ({ ...set })),
    }));
  }
}

export function restoreSessionExercises(sessionId, exercises) {
  if (!sessionId || !Array.isArray(exercises)) return false;
  let ok = false;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      ok = true;
      return {
        ...session,
        exercises: cleanupOrphanPairs(normalizePairContiguity(exercises.map((ex) => ({ ...ex })))),
      };
    }),
  }));
  return ok;
}

/** Keep paired exercises contiguous in list order. */
function normalizePairContiguity(exercises = []) {
  const result = [];
  const consumed = new Set();
  for (const ex of exercises) {
    if (consumed.has(ex.id)) continue;
    if (!ex.pairId) {
      result.push(ex);
      consumed.add(ex.id);
      continue;
    }
    for (const member of exercises.filter((e) => e.pairId === ex.pairId)) {
      if (consumed.has(member.id)) continue;
      result.push(member);
      consumed.add(member.id);
    }
  }
  return result;
}

function cleanupOrphanPairs(exercises = []) {
  const counts = {};
  for (const ex of exercises) {
    if (!ex.pairId) continue;
    counts[ex.pairId] = (counts[ex.pairId] || 0) + 1;
  }
  return exercises.map((ex) => {
    if (!ex.pairId) return ex;
    if ((counts[ex.pairId] || 0) < 2) return { ...ex, pairId: null, pairType: null };
    return ex;
  });
}

export function removeExerciseFromPair(sessionId, exerciseId) {
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => {
      const list = (session.exercises || []).map((ex) => ({ ...ex }));
      const target = list.find((ex) => ex.id === exerciseId);
      if (!target?.pairId) return session;
      const pairId = target.pairId;
      target.pairId = null;
      target.pairType = null;
      const remaining = list.filter((ex) => ex.pairId === pairId);
      if (remaining.length < 2) {
        remaining.forEach((ex) => {
          ex.pairId = null;
          ex.pairType = null;
        });
      }
      return { ...session, exercises: list };
    }),
  }));
}

export function dissolveFitnessPair(sessionId, pairId) {
  if (!pairId) return;
  patchState((s) => ({
    ...s,
    fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => ({
      ...session,
      exercises: (session.exercises || []).map((ex) =>
        ex.pairId === pairId ? { ...ex, pairId: null, pairType: null } : ex
      ),
    })),
  }));
}

export function completeWorkout(sessionId) {
  let payload = null;
  patchState((s) => {
    const unit = s.fitnessSettings?.preferredUnit || "lb";
    const session = (s.fitnessLog || []).find((w) => w.id === sessionId);
    if (!session || session.completedAt) return s;
    let sealed = { ...session, completedAt: new Date().toISOString() };
    if (sealed.timerStartedAt) {
      const started = Date.parse(sealed.timerStartedAt);
      const add = Number.isFinite(started) ? Math.max(0, Date.now() - started) : 0;
      sealed = {
        ...sealed,
        timerStartedAt: null,
        timerElapsedMs: Math.max(0, Number(sealed.timerElapsedMs) || 0) + add,
      };
    }
    const nextLog = (s.fitnessLog || []).map((w) => (w.id === sessionId ? sealed : w));
    payload = buildWorkoutCompletionPayload(sealed, nextLog, {
      ...defaultFitnessSettings(),
      ...s.fitnessSettings,
      preferredUnit: unit,
    });
    const nextFocus = advanceFocusAfterSession(s.fitnessSettings?.focusExercise, sealed);
    return {
      ...s,
      settings: {
        ...s.settings,
        fitnessTourCompleted: true,
      },
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        focusExercise: nextFocus,
      },
      fitnessLog: nextLog,
    };
  });
  return payload;
}

/** Seal an active session early. Counts done sets; keeps incomplete sets in history. */
export function endWorkoutSession(sessionId) {
  let payload = null;
  patchState((s) => {
    const unit = s.fitnessSettings?.preferredUnit || "lb";
    const session = (s.fitnessLog || []).find((w) => w.id === sessionId);
    if (!session || session.completedAt) return s;
    const doneSets = (session.exercises || []).some((ex) => (ex.sets || []).some((set) => set.done));
    if (!doneSets && !(session.exercises || []).length) return s;
    let sealed = { ...session, completedAt: new Date().toISOString(), endedEarly: true };
    if (sealed.timerStartedAt) {
      const started = Date.parse(sealed.timerStartedAt);
      const add = Number.isFinite(started) ? Math.max(0, Date.now() - started) : 0;
      sealed = {
        ...sealed,
        timerStartedAt: null,
        timerElapsedMs: Math.max(0, Number(sealed.timerElapsedMs) || 0) + add,
      };
    }
    const nextLog = (s.fitnessLog || []).map((w) => (w.id === sessionId ? sealed : w));
    payload = buildWorkoutEndedPayload(sealed, nextLog, {
      ...defaultFitnessSettings(),
      ...s.fitnessSettings,
      preferredUnit: unit,
    });
    const nextFocus = advanceFocusAfterSession(s.fitnessSettings?.focusExercise, sealed);
    return {
      ...s,
      settings: {
        ...s.settings,
        fitnessTourCompleted: true,
      },
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        focusExercise: nextFocus,
      },
      fitnessLog: nextLog,
    };
  });
  return payload;
}

export function deleteWorkout(sessionId) {
  patchState((s) => ({
    ...s,
    fitnessLog: (s.fitnessLog || []).filter((w) => w.id !== sessionId),
  }));
}

export function setEquipmentAvailable(list) {
  const next = Array.isArray(list) ? list.map(String) : [];
  patchState((s) => ({
    ...s,
    fitnessSettings: {
      ...defaultFitnessSettings(),
      ...s.fitnessSettings,
      equipmentAvailable: next,
    },
  }));
}

export function toggleEquipment(id) {
  const key = String(id || "").trim();
  if (!key) return 0;
  let removed = 0;
  patchState((s) => {
    const current = s.fitnessSettings?.equipmentAvailable || defaultFitnessSettings().equipmentAvailable;
    const has = current.includes(key);
    const equipmentAvailable = has ? current.filter((x) => x !== key) : [...current, key];
    const available = new Set(equipmentAvailable);
    const date = todayKey();
    const log = s.fitnessLog || [];
    const session = log.find((w) => w.date === date && !w.completedAt);
    let nextLog = log;
    if (session?.exercises?.length) {
      const kept = [];
      for (const ex of session.exercises) {
        const cat = findExerciseCatalog(ex.name);
        const eq = cat?.equipment || [];
        if (!eq.length || eq.some((e) => available.has(e))) kept.push(ex);
        else removed += 1;
      }
      if (removed) {
        nextLog = log.map((w) =>
          w.id === session.id ? { ...w, exercises: kept } : w
        );
      }
    }
    return {
      ...s,
      fitnessLog: nextLog,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        equipmentAvailable,
      },
    };
  });
  return removed;
}

export function blockExercise(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return;
  patchState((s) => {
    const prev = s.fitnessSettings?.blockedExercises || [];
    if (prev.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return s;
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        blockedExercises: [...prev, trimmed],
      },
    };
  });
}

export function unblockExercise(name) {
  const trimmed = String(name || "").trim().toLowerCase();
  if (!trimmed) return;
  patchState((s) => ({
    ...s,
    fitnessSettings: {
      ...defaultFitnessSettings(),
      ...s.fitnessSettings,
      blockedExercises: (s.fitnessSettings?.blockedExercises || []).filter(
        (n) => n.toLowerCase() !== trimmed
      ),
    },
  }));
}

export function toggleFavoriteExercise(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return;
  patchState((s) => {
    const prev = s.fitnessSettings?.favoriteExercises || [];
    const has = prev.some((n) => n.toLowerCase() === trimmed.toLowerCase());
    const favoriteExercises = has
      ? prev.filter((n) => n.toLowerCase() !== trimmed.toLowerCase())
      : [...prev, trimmed];
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        favoriteExercises,
      },
    };
  });
}

export function replaceExerciseInSession(sessionId, exerciseId, name, muscleGroup = "") {
  const trimmed = String(name || "").trim();
  if (!trimmed || !sessionId || !exerciseId) return;
  const catalog = findExerciseCatalog(trimmed);
  patchState((s) => {
    const unitPref = s.fitnessSettings?.preferredUnit || "lb";
    const group = muscleGroup || catalog?.muscleGroup || "";
    const hint = suggestedNextLoad(
      s.fitnessLog,
      trimmed,
      unitPref,
      s.fitnessSettings?.goal,
      s.fitnessSettings?.focusExercise
    );
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        recentExercises: touchRecentExercise(s.fitnessSettings, trimmed),
      },
      fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) =>
        mapExercise(session, exerciseId, () =>
          makeExercise(trimmed, group, unitPref, hint, { restSeconds: hint.restSeconds })
        )
      ),
    };
  });
}

export function setPremiumUnlocked(unlocked) {
  patchState((s) => ({
    ...s,
    settings: { ...s.settings, premiumUnlocked: Boolean(unlocked) },
  }));
}

export function updateHustlePlaybook(patch) {
  patchState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      hustlePlaybook: {
        ...(s.settings?.hustlePlaybook || {}),
        ...patch,
      },
    },
  }));
}

export function resetApp() {
  try {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(LEGACY_V3);
    localStorage.removeItem(LEGACY_V2);
    localStorage.removeItem(LEGACY_V1);
  } catch (error) {
    console.warn("reset clear failed", error);
  }
  const profile = makeProfile("marco", "Marco", defaultProfileData());
  appRoot = { version: 4, activeProfileId: profile.id, profiles: { [profile.id]: profile } };
  syncActiveFromRoot();
  needsWelcome = false;
  setUi({
    tab: "today",
    todayMode: "track",
    hustleView: "fitness",
    hustleTab: "flow",
    fitnessTab: "today",
    selectedDay: new Date().getDay(),
    selectedDate: todayKey(),
    overrideDate: todayKey(),
    shiftWeekOffset: 0,
    modal: null,
    editingBlock: null,
    editingEvent: null,
    celebrate: null,
    planMode: "date",
    flash: null,
  });
  notify();
}
