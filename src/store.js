import { cloneSeedSchedule, CHALLENGE_META, uid } from "./schedule.js";
import { todayKey } from "./dates.js";
import eventsSeed from "../content/events.seed.json";
import { validateBackupText } from "./backup.js";

const STORE_KEY = "marco-tracker-v4";
const LEGACY_V3 = "marco-tracker-v3";
const LEGACY_V2 = "marco-tracker-v2";
const LEGACY_V1 = "marco-tracker-v1";

const listeners = new Set();

/** @type {null | { version: number, activeProfileId: string, profiles: Record<string, object> }} */
let appRoot = null;

export let state = null;
export let ui = {
  tab: "today",
  todayMode: "track",
  hustleTab: "flow",
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
    scheduleEdits: [],
    settings: {
      ...base.settings,
      displayName,
      bio: "",
      portfolioUrl: "",
      linkedinUrl: "",
      challengeLength: 30,
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
        persist();
        return state;
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

  const profile = makeProfile("marco", "Marco", defaultProfileData());
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
  setUi({
    tab: "today",
    todayMode: "track",
    hustleTab: "flow",
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
