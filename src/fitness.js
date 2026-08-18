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
  { id: "band", label: "Band" },
  { id: "rings", label: "Rings" },
  { id: "parallettes", label: "Parallettes" },
  { id: "battle_rope", label: "Battle rope" },
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
    bodyWeight: null,
    bodyWeightEntered: false,
    recentExercises: [],
    favoriteExercises: [],
    equipmentAvailable: EQUIPMENT_OPTIONS.map((e) => e.id),
    blockedExercises: [],
    experienceLevel: "beginner",
    goal: null,
    trainWhy: [],
    prefsCaptured: false,
    restSeconds: 90,
    splitType: "ppl",
    gymDaysPerWeek: 4,
    sessionMinutes: 60,
    focusExercise: null,
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
  { id: "conditioning", label: "HIIT conditioning" },
  { id: "skill", label: "Skill" },
];

/** Identity / psychology reasons — multi-select up to 3 */
export const WHY_YOU_TRAIN = [
  { id: "mental_health", label: "Mental health", line: "Training as emotional architecture. Chemistry first." },
  { id: "structure", label: "Structure & routine", line: "The gym gives the day a spine." },
  { id: "energy", label: "More energy", line: "Train so the rest of the day feels lighter." },
  { id: "confidence", label: "Confidence", line: "Proof you can finish hard sets when it counts." },
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
        if (set.duration != null) return sum;
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

/** Count of all sets (done + open) in a session. */
export function sessionTotalSetCount(session) {
  if (!session?.exercises?.length) return 0;
  return session.exercises.reduce((total, ex) => total + (ex.sets || []).length, 0);
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
    mode: "complete",
    tier,
    sessionId: session?.id || "",
    exerciseName: pr?.exerciseName,
    previousValue: pr?.previousValue,
    newValue: pr?.newValue,
    streakCount,
    exerciseCount: (session?.exercises || []).length,
    setCount: sessionSetCount(session),
    totalSets: sessionTotalSetCount(session),
    totalVolume: sessionVolume(session, unit),
    unit,
    durationMinutes: sessionDurationMinutes(session),
    muscleGroups: [...new Set((session?.exercises || []).map((ex) => ex.muscleGroup).filter(Boolean))],
  };
}

/**
 * Payload for ending a session early (partial seal).
 * Stats reflect done sets only; incomplete sets stay in the saved session.
 */
export function buildWorkoutEndedPayload(session, log = [], settings = {}) {
  const unit = settings?.preferredUnit || "lb";
  const doneSets = sessionSetCount(session);
  const totalSets = sessionTotalSetCount(session);
  const pr = doneSets > 0 ? detectSessionPr(session, log || []) : null;
  return {
    type: "fitness",
    mode: "ended",
    tier: pr ? "pr" : "standard",
    sessionId: session?.id || "",
    exerciseName: pr?.exerciseName,
    previousValue: pr?.previousValue,
    newValue: pr?.newValue,
    streakCount: workoutStreak(log || []),
    exerciseCount: (session?.exercises || []).length,
    setCount: doneSets,
    totalSets,
    totalVolume: sessionVolume(session, unit),
    unit,
    durationMinutes: sessionDurationMinutes(session),
    muscleGroups: [...new Set((session?.exercises || []).map((ex) => ex.muscleGroup).filter(Boolean))],
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

export function lastWorkingSet(log = [], exerciseName) {
  const name = String(exerciseName || "").trim().toLowerCase();
  if (!name) return null;
  const sessions = completedSessions(log).sort((a, b) => (b.date > a.date ? 1 : -1));
  for (const session of sessions) {
    for (const ex of session.exercises || []) {
      if (String(ex.name || "").trim().toLowerCase() !== name) continue;
      const sets = ex.sets || [];
      const doneSets = sets.filter((s) => s.done);
      if (!doneSets.length) continue;
      const last = doneSets[doneSets.length - 1];
      const allHit = sets.length > 0 && doneSets.length === sets.length;
      return {
        weight: Number(last.weight) || 0,
        reps: Number(last.reps) || 8,
        duration: last.duration != null ? Number(last.duration) || 0 : undefined,
        unit: last.unit || "lb",
        date: session.date,
        allHit,
        restSeconds: Number(last.restSeconds || ex.restSeconds) || null,
      };
    }
  }
  return null;
}

export function previousPerformance(log = [], exerciseName) {
  return lastWorkingSet(log, exerciseName);
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
      String(ex.category || "").toLowerCase().includes(q) ||
      String(ex.measurement || "").toLowerCase().includes(q) ||
      (ex.equipment || []).some((e) => e.includes(q))
    );
  });
}

const COMPOUND_NAME_RE = /deadlift|squat|good morning|hip thrust|romanian|press|row|pull-up|chin-up|dip|push-up/i;
const AXIAL_COMPOUND_RE = /deadlift|squat|good morning|hip thrust|romanian/i;

/** Shared compound heuristic for Focus lifts and plan roles. */
export function isCompoundLift(exOrName = {}) {
  const ex = typeof exOrName === "string" ? { name: exOrName } : exOrName || {};
  const name = String(ex.name || "");
  const eq = ex.equipment || findExerciseCatalog(name)?.equipment || [];
  if (ex.role === "compound") return true;
  if (AXIAL_COMPOUND_RE.test(name)) return true;
  if (eq.includes("barbell") && /press|row|squat|deadlift/i.test(name)) return true;
  if (/pull-up|chin-up|dip|push-up/i.test(name)) return true;
  if (COMPOUND_NAME_RE.test(name) && (eq.includes("barbell") || eq.includes("dumbbell") || !eq.length)) {
    return /press|row|squat|deadlift|pull-up|chin-up|dip|push-up|hip thrust/i.test(name);
  }
  return false;
}

export function normalizeFocusExercise(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || "").trim();
  if (!name) return null;
  const week = Math.min(4, Math.max(1, Number(raw.weekIndex) || 1));
  return {
    name,
    startedAt: String(raw.startedAt || todayKey()),
    weekIndex: week,
  };
}

export function focusWeekHint(weekIndex = 1) {
  switch (Number(weekIndex) || 1) {
    case 1:
      return "Week 1 · establish the load and own every set.";
    case 2:
      return "Week 2 · add a plate or reps if last week was clean.";
    case 3:
      return "Week 3 · push again if week 2 stuck.";
    case 4:
      return "Week 4 · hold or light deload, then the cycle resets.";
    default:
      return "";
  }
}

/** After a sealed session that logged the focus lift, advance the 4-week cycle. */
export function advanceFocusAfterSession(focusExercise, session) {
  const focus = normalizeFocusExercise(focusExercise);
  if (!focus || !session) return focus;
  const key = focus.name.toLowerCase();
  const logged = (session.exercises || []).some((ex) => {
    if (String(ex.name || "").trim().toLowerCase() !== key) return false;
    return (ex.sets || []).some((s) => s.done);
  });
  if (!logged) return focus;
  const week = Number(focus.weekIndex) || 1;
  if (week >= 4) {
    return { name: focus.name, startedAt: todayKey(), weekIndex: 1 };
  }
  return { ...focus, weekIndex: week + 1 };
}

/**
 * Pick Focus from a generated plan: keep previous if still present, else first compound.
 * @returns {null | { name, startedAt, weekIndex }}
 */
export function resolveFocusFromPlan(plan = [], previousFocus = null) {
  const prev = normalizeFocusExercise(previousFocus);
  const names = (plan || [])
    .map((ex) => ({
      name: String(ex?.name || "").trim(),
      role: ex?.role,
      equipment: ex?.equipment,
    }))
    .filter((ex) => ex.name);
  if (!names.length) return prev;

  if (prev) {
    const still = names.some((ex) => ex.name.toLowerCase() === prev.name.toLowerCase());
    if (still) return prev;
  }

  const compound =
    names.find((ex) => ex.role === "compound" || isCompoundLift(ex)) || names[0];
  if (!compound) return null;
  return {
    name: compound.name,
    startedAt: todayKey(),
    weekIndex: 1,
  };
}

export function isTimedExercise(exercise = {}) {
  const catalog = findExerciseCatalog(exercise.name) || {};
  return (
    exercise.measurement === "time" ||
    catalog.measurement === "time" ||
    Number(exercise.defaultDuration) > 0
  );
}

export function formatDurationSeconds(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (!mins) return `${secs}s`;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function suggestedNextLoad(log, exerciseName, unit = "lb", goal = "build_muscle", focusExercise = null) {
  const prev = lastWorkingSet(log, exerciseName) || previousPerformance(log, exerciseName);
  if (!prev) {
    const catalog = findExerciseCatalog(exerciseName);
    return catalog?.measurement === "time"
      ? { weight: 0, reps: 0, duration: Number(catalog.defaultDuration) || 30 }
      : { weight: 0, reps: 8 };
  }
  const timed = prev.duration != null || findExerciseCatalog(exerciseName)?.measurement === "time";
  const isBodyweight = Number(prev.weight) === 0;
  const prevReps = Number(prev.reps) || 8;
  const prevWeight = Number(prev.weight) || 0;
  const plate = unit === "kg" ? 2.5 : 5;
  const rest = Number(prev.restSeconds) || restSecondsForGoal(goal);
  const focus = normalizeFocusExercise(focusExercise);
  const isFocus =
    focus &&
    String(exerciseName || "").trim().toLowerCase() === String(focus.name).trim().toLowerCase();
  const week = isFocus ? Number(focus.weekIndex) || 1 : 0;

  if (timed) {
    const prevDuration = Number(prev.duration) || Number(findExerciseCatalog(exerciseName)?.defaultDuration) || 30;
    const nextDuration = prev.allHit ? Math.min(120, prevDuration + 5) : prevDuration;
    return {
      weight: 0,
      reps: 0,
      duration: nextDuration,
      unit: prev.unit || unit,
      restSeconds: rest,
    };
  }

  // Focus week 1: establish / repeat successful load (no auto-progression).
  if (isFocus && week === 1) {
    return { weight: prevWeight, reps: prevReps, unit: prev.unit || unit, restSeconds: rest };
  }

  // Focus week 4: hold or light deload (~7.5%), cycle advances separately after seal.
  if (isFocus && week === 4) {
    if (isBodyweight) {
      return {
        weight: 0,
        reps: Math.max(1, prevReps - 1),
        unit: prev.unit || unit,
        restSeconds: rest,
      };
    }
    const cut = prevWeight * 0.075;
    const stepped = Math.round((prevWeight - cut) / plate) * plate;
    return {
      weight: Math.max(0, stepped),
      reps: prevReps,
      unit: prev.unit || unit,
      restSeconds: rest,
    };
  }

  if (goal === "longevity" || goal === "rehab") {
    return { weight: prevWeight, reps: prevReps, unit: prev.unit || unit, restSeconds: rest };
  }

  if (goal === "lose_weight") {
    return {
      weight: prevWeight,
      reps: prevReps,
      unit: prev.unit || unit,
      restSeconds: Math.max(30, rest - 15),
    };
  }

  if (goal === "strength") {
    if (prev.allHit && !isBodyweight) {
      return { weight: prevWeight + plate, reps: prevReps, unit: prev.unit || unit, restSeconds: rest };
    }
    if (prev.allHit && isBodyweight) {
      return { weight: 0, reps: prevReps + 1, unit: prev.unit || unit, restSeconds: rest };
    }
    return { weight: prevWeight, reps: prevReps, unit: prev.unit || unit, restSeconds: rest };
  }

  if (isBodyweight) {
    return { weight: 0, reps: prev.allHit ? prevReps + 1 : prevReps, unit: prev.unit || unit, restSeconds: rest };
  }
  if (prev.allHit) {
    return { weight: prevWeight + plate, reps: prevReps, unit: prev.unit || unit, restSeconds: rest };
  }
  return { weight: prevWeight, reps: prevReps, unit: prev.unit || unit, restSeconds: rest };
}

/** Default rest timer length by training outcome (seconds). */
export function restSecondsForGoal(goal = "build_muscle") {
  switch (goal) {
    case "strength":
      return 240;
    case "lose_weight":
    case "tone":
      return 45;
    case "conditioning":
      return 30;
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
    case "conditioning":
      return [15, 20, 30];
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
    if (done.length !== sets.length) {
      return { ok: false, reason: `Finish every set on ${ex.name}` };
    }
    for (const set of sets) {
      if (set.duration != null) {
        const duration = Number(set.duration);
        if (!Number.isFinite(duration) || duration <= 0) {
          return { ok: false, reason: `Set an interval for ${ex.name}` };
        }
        continue;
      }
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

export const CALISTHENICS_PRESETS = {
  upper: ["chest", "back", "shoulders", "triceps", "abs"],
  lower: ["quads", "hamstrings", "glutes", "calves", "abs"],
  full_body: ["chest", "back", "quads", "glutes", "abs"],
};

export const HIIT_PRESETS = {
  full_body: ["quads", "chest", "back", "shoulders", "abs"],
  lower_body: ["quads", "hamstrings", "glutes", "calves"],
  core_engine: ["abs", "lower_back", "glutes", "shoulders"],
};

export function makeSet(unit = "lb", overrides = {}) {
  return {
    id: uid("set"),
    reps: overrides.reps != null ? Number(overrides.reps) || 0 : 8,
    weight: overrides.weight != null ? Number(overrides.weight) || 0 : 0,
    duration: overrides.duration != null ? Number(overrides.duration) || 0 : undefined,
    unit: overrides.unit || unit,
    done: false,
    restSeconds: overrides.restSeconds != null ? Number(overrides.restSeconds) : undefined,
  };
}

export function makeExercise(name, muscleGroup = "", unit = "lb", setSeed = null, opts = {}) {
  const catalog = findExerciseCatalog(name);
  const seed = setSeed || { weight: 0, reps: 8, unit };
  const timed =
    opts.measurement === "time" ||
    catalog?.measurement === "time" ||
    seed.duration != null;
  const timedSeed = timed
    ? {
        ...seed,
        reps: 0,
        weight: 0,
        duration:
          seed.duration != null
            ? Number(seed.duration) || 30
            : Number(catalog?.defaultDuration) || 30,
      }
    : seed;
  const setCount = Math.max(1, Number(opts.sets) || 3);
  const restSeconds = opts.restSeconds != null ? Number(opts.restSeconds) : undefined;
  const sets = Array.from({ length: setCount }, () =>
    makeSet(unit, restSeconds != null ? { ...timedSeed, restSeconds } : timedSeed)
  );
  return {
    id: uid("ex"),
    name: String(name || "").trim(),
    muscleGroup: normalizeMuscleGroup(muscleGroup) || "",
    sets,
    pairId: opts.pairId || null,
    pairType: opts.pairType || null,
    role: opts.role || "",
    measurement: timed ? "time" : undefined,
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

const EACH_SIDE_RE = /lunge|curl|single|one-arm|one arm|unilateral|split squat/i;

export function isEachSideExercise(name = "", catalog = null) {
  const row = catalog || findExerciseCatalog(name);
  if (row?.laterality === "each") return true;
  return EACH_SIDE_RE.test(String(name || ""));
}

export const DYNAMIC_WARMUP = [
  { id: "leg-swings", name: "Leg swings", seconds: 40 },
  { id: "worlds-greatest", name: "World's greatest", seconds: 45 },
  { id: "band-dislocates", name: "Band dislocates", seconds: 40 },
  { id: "arm-circles", name: "Arm circles", seconds: 30 },
  { id: "bodyweight-squats", name: "Bodyweight squats", seconds: 40 },
];

export const STATIC_COOLDOWN = [
  { id: "hip-flexor", name: "Hip flexor hold", seconds: 45, tags: ["quads", "glutes", "hamstrings"] },
  { id: "hamstring", name: "Hamstring hold", seconds: 45, tags: ["hamstrings", "quads"] },
  { id: "chest-opener", name: "Chest opener", seconds: 40, tags: ["chest", "shoulders"] },
  { id: "lat-stretch", name: "Lat stretch", seconds: 40, tags: ["back", "lats"] },
  { id: "figure-four", name: "Figure-four hold", seconds: 45, tags: ["glutes", "quads"] },
];

function sessionMuscleSet(session) {
  return new Set((session?.exercises || []).map((ex) => normalizeMuscleGroup(ex.muscleGroup)).filter(Boolean));
}

export function warmupMovesForSession(session) {
  const groups = sessionMuscleSet(session);
  const legs = groups.has("quads") || groups.has("hamstrings") || groups.has("glutes") || groups.has("calves");
  const upper = groups.has("chest") || groups.has("back") || groups.has("shoulders");
  if (legs && !upper) {
    return DYNAMIC_WARMUP.filter((m) => m.id !== "band-dislocates").slice(0, 4);
  }
  if (upper && !legs) {
    return DYNAMIC_WARMUP.filter((m) => m.id !== "leg-swings").slice(0, 4);
  }
  return DYNAMIC_WARMUP.slice(0, 5);
}

export function cooldownMovesForSession(session) {
  const groups = sessionMuscleSet(session);
  const tagged = STATIC_COOLDOWN.filter((m) => (m.tags || []).some((t) => groups.has(t)));
  const picks = tagged.length ? tagged : STATIC_COOLDOWN;
  return picks.slice(0, 4);
}

export function shouldAutoStartRest(session, exerciseId, setId) {
  const exercises = session?.exercises || [];
  const ex = exercises.find((e) => e.id === exerciseId);
  if (!ex) return false;
  const sets = ex.sets || [];
  const set = sets.find((s) => s.id === setId);
  if (!set?.done) return false;
  const timed = set.duration != null;
  const filled = timed
    ? Number(set.duration) > 0
    : Number(set.reps) > 0 && Number.isFinite(Number(set.weight)) && Number(set.weight) >= 0;
  if (!filled) return false;
  const setIndex = sets.findIndex((s) => s.id === setId);
  if (setIndex < 0) return false;

  const workLeft = (list) =>
    list.some((e) => (e.sets || []).some((s) => !s.done));

  if (!ex.pairId) {
    return workLeft(exercises);
  }

  const members = exercises.filter((e) => e.pairId === ex.pairId);
  const roundDone = members.every((m) => {
    const row = (m.sets || [])[setIndex];
    if (!row?.done) return false;
    if (row.duration != null) return Number(row.duration) > 0;
    const reps = Number(row.reps);
    const weight = Number(row.weight);
    return Number.isFinite(reps) && reps > 0 && Number.isFinite(weight) && weight >= 0;
  });
  if (!roundDone) return false;

  const lastRound = members.every((m) => setIndex >= (m.sets || []).length - 1);
  if (lastRound) {
    const others = exercises.filter((e) => e.pairId !== ex.pairId);
    return workLeft(others);
  }
  return true;
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

export function progressiveOverloadHint(log, exerciseName, unit = "lb", goal = "build_muscle", focusExercise = null) {
  const prev = lastWorkingSet(log, exerciseName) || previousPerformance(log, exerciseName);
  if (!prev) return null;
  const timed = prev.duration != null || findExerciseCatalog(exerciseName)?.measurement === "time";
  const focus = normalizeFocusExercise(focusExercise);
  const isFocus =
    focus &&
    String(exerciseName || "").trim().toLowerCase() === String(focus.name).trim().toLowerCase();
  const next = suggestedNextLoad(log, exerciseName, unit, goal, focus);
  if (timed) {
    const current = formatDurationSeconds(prev.duration || 0);
    const target = formatDurationSeconds(next.duration || prev.duration || 0);
    return Number(next.duration) > Number(prev.duration)
      ? `Try ${target}. Last time: ${current}.`
      : `Repeat ${target}.`;
  }
  if (isFocus) {
    const weekHint = focusWeekHint(focus.weekIndex);
    const same =
      Number(next.weight) === Number(prev.weight) && Number(next.reps) === Number(prev.reps);
    const loadLine = same
      ? `Repeat ${next.weight || 0} ${next.unit || unit} × ${next.reps}`
      : Number(next.weight) === 0
        ? `Try ${next.reps} reps`
        : `Try ${next.weight} ${next.unit || unit} × ${next.reps}`;
    return `${loadLine}. ${weekHint}`;
  }
  const same =
    Number(next.weight) === Number(prev.weight) && Number(next.reps) === Number(prev.reps);
  if (same) {
    if (goal === "lose_weight") return `Keep ${next.weight} ${next.unit || unit} × ${next.reps}. Shorter rest.`;
    if (goal === "longevity" || goal === "rehab") return `Repeat ${next.weight} ${next.unit || unit} × ${next.reps}`;
    return `Repeat ${next.weight} ${next.unit || unit} × ${next.reps}`;
  }
  if (Number(next.weight) === 0) return `Try ${next.reps} reps`;
  return `Try ${next.weight} ${next.unit || unit} × ${next.reps}`;
}

export { exercisesSeed };
