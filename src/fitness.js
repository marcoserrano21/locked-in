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
    recentExercises: [],
    equipmentAvailable: EQUIPMENT_OPTIONS.map((e) => e.id),
    blockedExercises: [],
  };
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

export function filterExercises(query = "", muscleGroup = "all") {
  const q = String(query || "").trim().toLowerCase();
  const group = normalizeMuscleGroup(muscleGroup);
  return exercisesSeed.filter((ex) => {
    const exGroup = normalizeMuscleGroup(ex.muscleGroup);
    if (group !== "all" && exGroup !== group) return false;
    if (!q) return true;
    return ex.name.toLowerCase().includes(q) || exGroup.includes(q) || muscleLabel(exGroup).toLowerCase().includes(q);
  });
}

export function makeSet(unit = "lb") {
  return {
    id: uid("set"),
    reps: 8,
    weight: 0,
    unit,
    done: false,
  };
}

export function makeExercise(name, muscleGroup = "", unit = "lb") {
  return {
    id: uid("ex"),
    name: String(name || "").trim(),
    muscleGroup: normalizeMuscleGroup(muscleGroup) || "",
    sets: [makeSet(unit), makeSet(unit), makeSet(unit)],
  };
}

export function makeWorkoutSession(date = todayKey()) {
  return {
    id: uid("ws"),
    date,
    startedAt: new Date().toISOString(),
    completedAt: null,
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
