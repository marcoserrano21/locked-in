import exercisesSeed from "../content/exercises.seed.json";
import { todayKey } from "./dates.js";
import { uid } from "./schedule.js";

export const EQUIPMENT_OPTIONS = [
  { id: "barbell", label: "Barbell" },
  { id: "dumbbell", label: "Dumbbell" },
  { id: "cable", label: "Cable" },
  { id: "machine", label: "Machine" },
  { id: "bodyweight", label: "Bodyweight" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "smith", label: "Smith" },
  { id: "bench", label: "Bench" },
];

export const MAIN_MUSCLE_GROUPS = [
  { id: "abs", label: "Abs" },
  { id: "back", label: "Back" },
  { id: "biceps", label: "Biceps" },
  { id: "chest", label: "Chest" },
  { id: "glutes", label: "Glutes" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "quads", label: "Quadriceps" },
  { id: "shoulders", label: "Shoulders" },
  { id: "triceps", label: "Triceps" },
  { id: "lower_back", label: "Lower Back" },
];

export const ACCESSORY_MUSCLE_GROUPS = [
  { id: "calves", label: "Calves" },
  { id: "traps", label: "Trapezius" },
  { id: "abductors", label: "Abductors" },
  { id: "adductors", label: "Adductors" },
  { id: "forearms", label: "Forearms" },
  { id: "neck", label: "Neck" },
];

export const MUSCLE_GROUPS = [
  { id: "all", label: "All" },
  ...MAIN_MUSCLE_GROUPS,
  ...ACCESSORY_MUSCLE_GROUPS,
];

const LEGACY_MUSCLE_MAP = {
  legs: "quads",
  arms: "biceps",
  core: "abs",
};

export function normalizeMuscleGroup(id = "") {
  const key = String(id || "").trim().toLowerCase();
  return LEGACY_MUSCLE_MAP[key] || key;
}

export function muscleLabel(id) {
  const key = normalizeMuscleGroup(id);
  return MUSCLE_GROUPS.find((g) => g.id === key)?.label || id || "General";
}

export function defaultFitnessSettings() {
  return {
    preferredUnit: "lb",
    bodyWeight: 170,
    recentExercises: [],
    favoriteExercises: [],
    equipmentAvailable: EQUIPMENT_OPTIONS.map((e) => e.id),
    blockedExercises: [],
    experienceLevel: "beginner",
    goal: "build_muscle",
    trainWhy: [],
    prefsCaptured: false,
    restSeconds: 90,
    splitType: "ppl",
    gymDaysPerWeek: 4,
    sessionMinutes: 60,
  };
}

export const SESSION_DURATIONS = [
  { id: 30, label: "30", detail: "4-6 exercises" },
  { id: 45, label: "45", detail: "6-8 exercises" },
  { id: 60, label: "60", detail: "8-10 exercises" },
  { id: 90, label: "90", detail: "12-14 exercises" },
];

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Beginner", detail: "Shorter end of session band" },
  { id: "intermediate", label: "Intermediate", detail: "Mid session band" },
  { id: "expert", label: "Expert", detail: "Fuller end of session band" },
];

/** Physical program drivers */
export const FITNESS_GOALS = [
  { id: "lose_weight", label: "Lose weight" },
  { id: "tone", label: "Tone" },
  { id: "build_muscle", label: "Build muscle" },
  { id: "strength", label: "Strength" },
  { id: "longevity", label: "Longevity" },
  { id: "rehab", label: "Rehab" },
  { id: "sport_prep", label: "Sport prep" },
  { id: "skill", label: "Skill" },
];

/** Identity / psychology reasons — multi-select up to 3 */
export const WHY_YOU_TRAIN = [
  { id: "mental_health", label: "Mental health", line: "Training as emotional architecture. Chemistry first." },
  { id: "structure", label: "Structure & routine", line: "The gym gives the day a spine." },
  { id: "energy", label: "More energy", line: "Train so the rest of the day feels lighter." },
  { id: "confidence", label: "Confidence", line: "Capability, not vanity. Hard things compound." },
  { id: "community", label: "Community", line: "Quiet camaraderie of shared effort." },
  { id: "habit", label: "Build the habit", line: "Not going feels wrong. Keep the momentum." },
  { id: "performance", label: "Performance", line: "What can this body do, and how does it adapt?" },
  { id: "discipline", label: "Discipline", line: "Show up even when you don’t feel like it." },
];

const LEGACY_WHY_MAP = {
  mental_reset: "mental_health",
  solitude: "mental_health",
  catharsis: "mental_health",
  curiosity: "performance",
  fun: "performance",
  skill: "performance",
  identity: "confidence",
};

export function migrateTrainWhyIds(trainWhy = []) {
  const valid = new Set(WHY_YOU_TRAIN.map((w) => w.id));
  const out = [];
  for (const id of trainWhy || []) {
    const mapped = LEGACY_WHY_MAP[id] || id;
    if (valid.has(mapped) && !out.includes(mapped)) out.push(mapped);
    if (out.length >= 3) break;
  }
  return out;
}

export function countExercisesForEquipment(equipmentAvailable = []) {
  const available = new Set(equipmentAvailable || []);
  return exercisesSeed.filter((ex) => {
    const eq = ex.equipment || [];
    return !eq.length || eq.some((e) => available.has(e));
  }).length;
}

export function trainWhyLine(trainWhy = []) {
  const first = (trainWhy || [])[0];
  if (!first) return "";
  return WHY_YOU_TRAIN.find((w) => w.id === first)?.line || "";
}

export function completedSessions(log = []) {
  return (log || []).filter((s) => s.completedAt);
}

export function activeSessionForDate(log = [], date = todayKey()) {
  return (log || []).find((s) => s.date === date && !s.completedAt) || null;
}

export function sessionVolume(session, unit = "lb") {
  if (!session?.exercises?.length) return 0;
  return session.exercises.reduce((total, ex) => {
    const sets = ex.sets || [];
    return (
      total +
      sets.reduce((sum, set) => {
        if (!set.done) return sum;
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        if (set.unit && set.unit !== unit) return sum + weight * reps;
        return sum + weight * reps;
      }, 0)
    );
  }, 0);
}

export function formatVolume(n) {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

/** Count of done sets in a session. */
export function sessionSetCount(session) {
  if (!session?.exercises?.length) return 0;
  return session.exercises.reduce((total, ex) => {
    return total + (ex.sets || []).filter((s) => s.done).length;
  }, 0);
}

/** Elapsed minutes from workout timer if used, else startedAt → completedAt. */
export function sessionDurationMinutes(session) {
  const timedMs = liveSessionElapsedMs(session, Date.now());
  if (timedMs > 0 || session?.timerStartedAt || Number(session?.timerElapsedMs) > 0) {
    return Math.max(1, Math.round(timedMs / 60000));
  }
  const start = session?.startedAt ? Date.parse(session.startedAt) : NaN;
  const end = session?.completedAt ? Date.parse(session.completedAt) : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return session?.completedAt ? 1 : 0;
  }
  return Math.max(1, Math.round((end - start) / 60000));
}

/** Active-time ms: paused accumulator + running segment. */
export function liveSessionElapsedMs(session, now = Date.now()) {
  const base = Math.max(0, Number(session?.timerElapsedMs) || 0);
  if (!session?.timerStartedAt) return base;
  const started = Date.parse(session.timerStartedAt);
  if (!Number.isFinite(started)) return base;
  return base + Math.max(0, now - started);
}

export function formatSessionClock(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function isStreakMilestone(n) {
  return [7, 30, 100].includes(Number(n));
}

function isBodyweightForPr(exercise) {
  const cat = findExerciseCatalog(exercise?.name) || {};
  const eq = cat.equipment || exercise?.equipment || [];
  const name = String(exercise?.name || "");
  return (
    (eq.includes("bodyweight") &&
      !eq.some((e) => ["barbell", "dumbbell", "machine", "cable", "kettlebell"].includes(e))) ||
    /pull-up|chin-up|dip|push-up|plank|hanging|burpee|air squat/i.test(name)
  );
}

function formatPrLoad(weight, reps, unit, bodyweight) {
  if (bodyweight) return `${Number(reps) || 0} reps`;
  return `${Number(weight) || 0} ${unit || "lb"}`;
}

function bestDoneSet(sets = [], bodyweight = false) {
  const done = (sets || []).filter((s) => s.done);
  if (!done.length) return null;
  return done.reduce((acc, set) => {
    const w = Number(set.weight) || 0;
    const r = Number(set.reps) || 0;
    const aw = Number(acc.weight) || 0;
    const ar = Number(acc.reps) || 0;
    if (bodyweight) return r > ar ? set : acc;
    if (w > aw) return set;
    if (w === aw && r > ar) return set;
    return acc;
  }, done[0]);
}

/** All-time best done set for an exercise across completed sessions (optional exclude). */
export function bestHistoricalSet(log = [], exerciseName, { excludeSessionId = null } = {}) {
  const name = String(exerciseName || "")
    .trim()
    .toLowerCase();
  if (!name) return null;
  let best = null;
  let bodyweight = false;
  for (const session of completedSessions(log)) {
    if (excludeSessionId && session.id === excludeSessionId) continue;
    for (const ex of session.exercises || []) {
      if (String(ex.name || "").trim().toLowerCase() !== name) continue;
      const bw = isBodyweightForPr(ex);
      const set = bestDoneSet(ex.sets, bw);
      if (!set) continue;
      if (!best) {
        best = { ...set, unit: set.unit || "lb", bodyweight: bw };
        bodyweight = bw;
        continue;
      }
      const w = Number(set.weight) || 0;
      const r = Number(set.reps) || 0;
      const bwBest = Number(best.weight) || 0;
      const br = Number(best.reps) || 0;
      if (bw || bodyweight) {
        if (r > br) best = { ...set, unit: set.unit || best.unit, bodyweight: true };
      } else if (w > bwBest || (w === bwBest && r > br)) {
        best = { ...set, unit: set.unit || best.unit, bodyweight: false };
      }
    }
  }
  return best;
}

/**
 * Strongest PR in this session vs prior history.
 * @returns {{ exerciseName, previousValue, newValue, weightDelta, repsDelta } | null}
 */
export function detectSessionPr(session, log = []) {
  if (!session?.exercises?.length) return null;
  let winner = null;
  for (const ex of session.exercises) {
    const bw = isBodyweightForPr(ex);
    const current = bestDoneSet(ex.sets, bw);
    if (!current) continue;
    const hist = bestHistoricalSet(log, ex.name, { excludeSessionId: session.id });
    const unit = current.unit || hist?.unit || "lb";
    const cw = Number(current.weight) || 0;
    const cr = Number(current.reps) || 0;
    if (!hist) continue;
    const hw = Number(hist.weight) || 0;
    const hr = Number(hist.reps) || 0;
    const isPr = bw ? cr > hr : cw > hw || (cw === hw && cr > hr);
    if (!isPr) continue;
    const candidate = {
      exerciseName: ex.name,
      previousValue: formatPrLoad(hw, hr, hist.unit || unit, bw),
      newValue: formatPrLoad(cw, cr, unit, bw),
      weightDelta: bw ? 0 : cw - hw,
      repsDelta: bw ? cr - hr : cw === hw ? cr - hr : 0,
      bodyweight: bw,
    };
    if (
      !winner ||
      candidate.weightDelta > winner.weightDelta ||
      (candidate.weightDelta === winner.weightDelta && candidate.repsDelta > winner.repsDelta)
    ) {
      winner = candidate;
    }
  }
  return winner;
}

/**
 * Payload for the full-screen workout completion celebrate.
 * `session` should already include completedAt; `log` should include that session.
 */
export function buildWorkoutCompletionPayload(session, log = [], settings = {}) {
  const unit = settings?.preferredUnit || "lb";
  const sealedLog = log || [];
  const pr = detectSessionPr(session, sealedLog);
  const streakCount = workoutStreak(sealedLog);
  let tier = "standard";
  if (pr) tier = "pr";
  else if (isStreakMilestone(streakCount)) tier = "streak-milestone";

  return {
    type: "fitness",
    tier,
    sessionId: session?.id || "",
    exerciseName: pr?.exerciseName,
    previousValue: pr?.previousValue,
    newValue: pr?.newValue,
    streakCount,
    exerciseCount: (session?.exercises || []).length,
    setCount: sessionSetCount(session),
    totalVolume: sessionVolume(session, unit),
    unit,
    durationMinutes: sessionDurationMinutes(session),
  };
}

export function weekSessionKeys() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
}

export function sessionsThisWeek(log = []) {
  const keys = weekSessionKeys();
  return completedSessions(log).filter((s) => keys.includes(s.date));
}

export function workoutStreak(log = []) {
  const dates = [...new Set(completedSessions(log).map((s) => s.date))].sort().reverse();
  if (!dates.length) return 0;
  let streak = 0;
  let cursor = new Date(`${todayKey()}T12:00:00`);
  for (let i = 0; i < 365; i++) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    if (dates.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function previousPerformance(log = [], exerciseName) {
  const name = String(exerciseName || "").trim().toLowerCase();
  if (!name) return null;
  const sessions = completedSessions(log).sort((a, b) => (b.date > a.date ? 1 : -1));
  for (const session of sessions) {
    for (const ex of session.exercises || []) {
      if (String(ex.name || "").trim().toLowerCase() !== name) continue;
      const doneSets = (ex.sets || []).filter((s) => s.done);
      if (!doneSets.length) continue;
      const best = doneSets.reduce((acc, set) => {
        const vol = (Number(set.weight) || 0) * (Number(set.reps) || 0);
        const accVol = (Number(acc.weight) || 0) * (Number(acc.reps) || 0);
        return vol > accVol ? set : acc;
      }, doneSets[0]);
      return {
        weight: best.weight,
        reps: best.reps,
        unit: best.unit || "lb",
        date: session.date,
      };
    }
  }
  return null;
}

/** Last N session volumes for an exercise (oldest → newest). */
export function exerciseVolumeHistory(log = [], exerciseName, limit = 5) {
  const name = String(exerciseName || "").trim().toLowerCase();
  if (!name) return [];
  const sessions = completedSessions(log).sort((a, b) => (a.date > b.date ? 1 : -1));
  const points = [];
  for (const session of sessions) {
    for (const ex of session.exercises || []) {
      if (String(ex.name || "").trim().toLowerCase() !== name) continue;
      const vol = (ex.sets || [])
        .filter((s) => s.done)
        .reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
      points.push({ date: session.date, volume: vol });
    }
  }
  return points.slice(-limit);
}

export function sparklinePath(values = [], width = 120, height = 36) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  return values
    .map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Session volume points oldest → newest for History analytics. */
export function sessionVolumeHistory(log = [], limit = 8, unit = "lb") {
  return completedSessions(log)
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-limit)
    .map((s) => ({
      id: s.id,
      date: s.date,
      volume: sessionVolume(s, unit),
    }));
}

/** Muscle group hit counts across recent completed sessions. */
export function muscleBalanceCounts(log = [], limitSessions = 24) {
  const sessions = completedSessions(log)
    .slice()
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, limitSessions);
  const counts = {};
  sessions.forEach((s) => {
    (s.exercises || []).forEach((ex) => {
      const g = normalizeMuscleGroup(ex.muscleGroup);
      if (!g) return;
      counts[g] = (counts[g] || 0) + 1;
    });
  });
  return counts;
}

export function filterExercises(query = "", muscleGroup = "all", opts = {}) {
  const q = String(query || "").trim().toLowerCase();
  const group = normalizeMuscleGroup(muscleGroup);
  const equipment = opts.equipment || null;
  const blocked = new Set((opts.blocked || []).map((n) => String(n).trim().toLowerCase()));
  const favorites = new Set((opts.favorites || []).map((n) => String(n).trim().toLowerCase()));
  const recent = (opts.recent || []).map((n) => String(n).trim().toLowerCase());
  const listFilter = opts.listFilter || "all";

  return exercisesSeed.filter((ex) => {
    const nameKey = ex.name.toLowerCase();
    if (blocked.has(nameKey)) return false;
    const exGroup = normalizeMuscleGroup(ex.muscleGroup);
    if (group !== "all" && exGroup !== group) return false;
    if (equipment && Array.isArray(equipment)) {
      const eq = ex.equipment || [];
      if (eq.length && !eq.some((e) => equipment.includes(e))) return false;
    }
    if (listFilter === "favorites" && !favorites.has(nameKey)) return false;
    if (listFilter === "recent" && !recent.includes(nameKey)) return false;
    if (!q) return true;
    return (
      nameKey.includes(q) ||
      exGroup.includes(q) ||
      muscleLabel(exGroup).toLowerCase().includes(q) ||
      (ex.equipment || []).some((e) => e.includes(q))
    );
  });
}

export function suggestedNextLoad(log, exerciseName, unit = "lb") {
  const prev = previousPerformance(log, exerciseName);
  if (!prev) return { weight: 0, reps: 8 };
  const isBodyweight = Number(prev.weight) === 0;
  const prevReps = Number(prev.reps) || 8;
  // Alternate bias: +5 lb when loaded, else +1–2 reps for bodyweight / stalled loads
  if (isBodyweight) {
    return { weight: 0, reps: prevReps + 1, unit: prev.unit || unit };
  }
  return {
    weight: Math.round((Number(prev.weight) || 0) + 5),
    reps: prevReps,
    unit: prev.unit || unit,
  };
}

/** Default rest timer length by training outcome (seconds). */
export function restSecondsForGoal(goal = "build_muscle") {
  switch (goal) {
    case "strength":
      return 240;
    case "lose_weight":
    case "tone":
      return 45;
    case "rehab":
      return 60;
    case "longevity":
      return 75;
    case "sport_prep":
    case "skill":
      return 90;
    case "build_muscle":
    default:
      return 90;
  }
}

export function restPresetsForGoal(goal = "build_muscle") {
  switch (goal) {
    case "strength":
      return [180, 240, 300];
    case "lose_weight":
    case "tone":
      return [30, 45, 60];
    case "rehab":
      return [45, 60, 90];
    default:
      return [60, 90, 180];
  }
}

export function canCompleteWorkout(session) {
  const exercises = session?.exercises || [];
  if (!exercises.length) return { ok: false, reason: "Add at least one exercise" };
  for (const ex of exercises) {
    const sets = ex.sets || [];
    if (!sets.length) return { ok: false, reason: `Add sets for ${ex.name}` };
    const done = sets.filter((s) => s.done);
    if (!done.length) return { ok: false, reason: `Mark at least one set done on ${ex.name}` };
    for (const set of sets) {
      const reps = Number(set.reps);
      const weight = Number(set.weight);
      if (!Number.isFinite(reps) || reps <= 0) {
        return { ok: false, reason: "Fill reps on every set" };
      }
      if (!Number.isFinite(weight) || weight < 0) {
        return { ok: false, reason: "Fill weight on every set (0 ok for bodyweight)" };
      }
    }
  }
  return { ok: true };
}

export const PPL_PRESETS = {
  push: ["chest", "shoulders", "triceps", "abs"],
  pull: ["back", "biceps", "traps", "forearms"],
  legs: ["quads", "hamstrings", "glutes", "calves", "lower_back"],
  lower: ["quads", "hamstrings", "glutes", "calves", "lower_back"],
};

export const UL_PRESETS = {
  upper: ["chest", "back", "shoulders", "biceps", "triceps"],
  lower: ["quads", "hamstrings", "glutes", "calves", "lower_back", "abs"],
};

export function makeSet(unit = "lb", overrides = {}) {
  return {
    id: uid("set"),
    reps: overrides.reps != null ? Number(overrides.reps) || 0 : 8,
    weight: overrides.weight != null ? Number(overrides.weight) || 0 : 0,
    unit: overrides.unit || unit,
    done: false,
    restSeconds: overrides.restSeconds != null ? Number(overrides.restSeconds) : undefined,
  };
}

export function makeExercise(name, muscleGroup = "", unit = "lb", setSeed = null, opts = {}) {
  const seed = setSeed || { weight: 0, reps: 8, unit };
  const setCount = Math.max(1, Number(opts.sets) || 3);
  const restSeconds = opts.restSeconds != null ? Number(opts.restSeconds) : undefined;
  const sets = Array.from({ length: setCount }, () =>
    makeSet(unit, restSeconds != null ? { ...seed, restSeconds } : seed)
  );
  return {
    id: uid("ex"),
    name: String(name || "").trim(),
    muscleGroup: normalizeMuscleGroup(muscleGroup) || "",
    sets,
    pairId: opts.pairId || null,
    pairType: opts.pairType || null,
    role: opts.role || "",
    restSeconds: restSeconds ?? null,
  };
}

export function makeWorkoutSession(date = todayKey()) {
  return {
    id: uid("ws"),
    date,
    startedAt: new Date().toISOString(),
    completedAt: null,
    timerStartedAt: null,
    timerElapsedMs: 0,
    exercises: [],
    notes: "",
  };
}

export function touchRecentExercise(settings, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return settings?.recentExercises || [];
  const prev = settings?.recentExercises || [];
  return [trimmed, ...prev.filter((n) => n.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
}

export function findExerciseCatalog(name) {
  const q = String(name || "").trim().toLowerCase();
  return exercisesSeed.find((ex) => ex.name.toLowerCase() === q) || null;
}

export function musclesHitRecently(log = [], withinSessions = 3) {
  const sessions = completedSessions(log).slice(0, withinSessions);
  const hit = new Set();
  sessions.forEach((s) => {
    (s.exercises || []).forEach((ex) => {
      if (ex.muscleGroup) hit.add(normalizeMuscleGroup(ex.muscleGroup));
    });
  });
  return hit;
}

export function progressiveOverloadHint(log, exerciseName, unit = "lb") {
  const prev = previousPerformance(log, exerciseName);
  if (!prev) return null;
  const nextWeight = Math.round((Number(prev.weight) || 0) + 5);
  return `Try ${nextWeight} ${prev.unit || unit} × ${prev.reps}`;
}

export { exercisesSeed };
