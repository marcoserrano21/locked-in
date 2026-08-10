import { cloneSeedSchedule, CHALLENGE_META, uid } from "./schedule.js";
import { todayKey } from "./dates.js";
import eventsSeed from "../content/events.seed.json";
import { validateBackupText } from "./backup.js";
import { BLANK_DAY30 } from "./constants.js";
import {
  activeSessionForDate,
  defaultFitnessSettings,
  findExerciseCatalog,
  makeExercise,
  makeSet,
  makeWorkoutSession,
  sessionVolume,
  touchRecentExercise,
} from "./fitness.js";

const STORE_KEY = "marco-tracker-v4";
const LEGACY_V3 = "marco-tracker-v3";
const LEGACY_V2 = "marco-tracker-v2";
const LEGACY_V1 = "marco-tracker-v1";

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
  planMode: "template",
  selectedMuscleGroups: [],
  fitnessHistoryPage: 0,
  hustleLogPage: 0,
  milesPage: 0,
  openExerciseMenu: null,
  replaceExercise: null,
  fitnessSearch: "",
  fitnessMuscle: "all",
  fitnessAddSession: null,
};

function defaultProfileData() {
  return {
    challenge: null,
    schedule: cloneSeedSchedule(),
    dateSchedules: {},
    workOverrides: {
      "2026-08-09": { type: "work", start: "10:00 AM", end: "6:30 PM", note: "Sunday shift" },
      "2026-08-10": { type: "off", note: "Off - workout with coworker still on" },
      "2026-08-11": { type: "off", note: "Off" },
      "2026-08-12": { type: "work", start: "10:00 AM", end: "7:30 PM" },
      "2026-08-13": { type: "work", start: "10:00 AM", end: "7:30 PM" },
      "2026-08-14": { type: "work", start: "10:00 AM", end: "7:30 PM" },
      "2026-08-15": { type: "work", start: "10:00 AM", end: "7:30 PM" },
    },
    completions: {},
    uberLog: [],
    outreachLog: [],
    events: eventsSeed.map((e) => ({ ...e })),
    celebrations: {},
    hustleChecks: {},
    day30Answers: {},
    day30Questions: [...(CHALLENGE_META.reviewQuestions || [])],
    scheduleEdits: [],
    fitnessLog: [],
    fitnessSettings: defaultFitnessSettings(),
    settings: {
      uberCap: CHALLENGE_META.uberCap,
      uberSoftStop: CHALLENGE_META.uberSoftStop,
      yesterdayCatchUp: true,
      theme: "dark",
      displayName: "Marco",
      bio: "Product builder who turns messy operations into clear tools.",
      portfolioUrl: "https://marco-serrano.netlify.app/",
      linkedinUrl: "https://linkedin.com/in/marco-serrano25",
      lastBackupAt: null,
      installTipDismissed: false,
      challengeLength: 30,
      appMode: "full",
      tourStep: 0,
      tourCompleted: false,
      modulesUnlocked: { proof: true, miles: true },
      premiumUnlocked: false,
      hustlePlaybook: null,
    },
  };
}

function blankProfileData(displayName = "New track") {
  const base = defaultProfileData();
  return {
    ...base,
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
      modulesUnlocked: { proof: false, miles: false },
      premiumUnlocked: false,
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
    fitnessSettings: { ...defaultFitnessSettings(), ...(parsed.fitnessSettings || {}) },
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
  } catch (error) {
    console.warn("load failed", error);
  }

  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "marco";
  if (isDemo) {
    const profile = makeProfile("marco", "Marco", defaultProfileData());
    appRoot = { version: 4, activeProfileId: profile.id, profiles: { [profile.id]: profile } };
    syncActiveFromRoot();
    persist();
    return state;
  }

  needsWelcome = true;
  const profile = makeProfile("blank", "", blankProfileData(""));
  profile.settings.displayName = "";
  appRoot = { version: 4, activeProfileId: profile.id, profiles: { [profile.id]: profile } };
  syncActiveFromRoot();
  persist();
  return state;
}

export function listProfiles() {
  if (!appRoot) return [];
  return Object.values(appRoot.profiles).map((p) => ({
    id: p.id,
    preset: p.preset,
    displayName: p.settings?.displayName || "Profile",
    createdAt: p.createdAt,
    active: p.id === appRoot.activeProfileId,
  }));
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

export function addEvent(event) {
  patchState((s) => ({
    ...s,
    events: [...(s.events || []), { id: uid("evt"), recurYearly: true, type: "birthday", ...event }],
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
  const allowed = [7, 14, 30, 90];
  const lengthDays = allowed.includes(Number(days)) ? Number(days) : 30;
  patchState((s) => ({
    ...s,
    settings: { ...s.settings, challengeLength: lengthDays },
    challenge: s.challenge
      ? { ...s.challenge, lengthDays }
      : s.challenge,
  }));
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
          ? { proof: true, miles: true }
          : s.settings?.modulesUnlocked || { proof: false, miles: false },
    },
  }));
}

export function advanceTour() {
  patchState((s) => {
    const step = Number(s.settings?.tourStep || 0) + 1;
    const done = step >= 3;
    return {
      ...s,
      settings: {
        ...s.settings,
        tourStep: done ? 3 : step,
        tourCompleted: done,
      },
    };
  });
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

export function completeWelcome(displayName, focus = "both") {
  const name = String(displayName || "").trim() || "My track";
  patchState((s) => ({
    ...s,
    settings: { ...s.settings, displayName: name },
  }));
  if (appRoot?.profiles?.[appRoot.activeProfileId]) {
    appRoot.profiles[appRoot.activeProfileId].preset = "blank";
  }
  needsWelcome = false;
  const tab =
    focus === "fitness" ? "freelance" : focus === "schedule" ? "today" : "today";
  const hustleView = focus === "fitness" || focus === "both" ? "fitness" : "hustle";
  patchState((s) => ({
    ...s,
    settings: {
      ...s.settings,
      appMode: focus === "schedule" ? "simple" : focus === "fitness" ? "simple" : "simple",
      tourStep: 0,
      tourCompleted: false,
      modulesUnlocked: { proof: false, miles: false },
    },
  }));
  setUi({
    modal: null,
    welcomeStep: 1,
    welcomeName: "",
    welcomeFocus: "both",
    tab,
    hustleView,
    fitnessTab: "today",
    todayMode: focus === "schedule" ? "edit" : "track",
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

export function addExerciseToSession(sessionId, name, muscleGroup = "") {
  const trimmed = String(name || "").trim();
  if (!trimmed) return;
  const catalog = findExerciseCatalog(trimmed);
  patchState((s) => {
    const unitPref = s.fitnessSettings?.preferredUnit || "lb";
    const group = muscleGroup || catalog?.muscleGroup || "";
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        recentExercises: touchRecentExercise(s.fitnessSettings, trimmed),
      },
      fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) => ({
        ...session,
        exercises: [...(session.exercises || []), makeExercise(trimmed, group, unitPref)],
      })),
    };
  });
}

export function addFitnessSet(sessionId, exerciseId) {
  patchState((s) => {
    const unit = s.fitnessSettings?.preferredUnit || "lb";
    return {
      ...s,
      fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) =>
        mapExercise(session, exerciseId, (ex) => ({
          ...ex,
          sets: [...(ex.sets || []), makeSet(unit)],
        }))
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

export function completeWorkout(sessionId) {
  let payload = null;
  patchState((s) => {
    const unit = s.fitnessSettings?.preferredUnit || "lb";
    const session = (s.fitnessLog || []).find((w) => w.id === sessionId);
    if (!session) return s;
    payload = {
      volume: sessionVolume(session, unit),
      unit,
      exerciseCount: (session.exercises || []).length,
    };
    return {
      ...s,
      fitnessLog: (s.fitnessLog || []).map((w) =>
        w.id === sessionId ? { ...w, completedAt: new Date().toISOString() } : w
      ),
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
  if (!key) return;
  patchState((s) => {
    const current = s.fitnessSettings?.equipmentAvailable || defaultFitnessSettings().equipmentAvailable;
    const has = current.includes(key);
    const equipmentAvailable = has ? current.filter((x) => x !== key) : [...current, key];
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        equipmentAvailable,
      },
    };
  });
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

export function replaceExerciseInSession(sessionId, exerciseId, name, muscleGroup = "") {
  const trimmed = String(name || "").trim();
  if (!trimmed || !sessionId || !exerciseId) return;
  const catalog = findExerciseCatalog(trimmed);
  patchState((s) => {
    const unitPref = s.fitnessSettings?.preferredUnit || "lb";
    const group = muscleGroup || catalog?.muscleGroup || "";
    return {
      ...s,
      fitnessSettings: {
        ...defaultFitnessSettings(),
        ...s.fitnessSettings,
        recentExercises: touchRecentExercise(s.fitnessSettings, trimmed),
      },
      fitnessLog: mapFitnessLog(s.fitnessLog, sessionId, (session) =>
        mapExercise(session, exerciseId, () => makeExercise(trimmed, group, unitPref))
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
    planMode: "template",
    flash: null,
  });
  notify();
}
