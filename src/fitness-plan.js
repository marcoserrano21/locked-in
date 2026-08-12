/**
 * Science-backed PPL / Upper-Lower plan generator.
 * Session duration drives exercise count; level + goal fine-tune within the band.
 */
import {
  exercisesSeed,
  normalizeMuscleGroup,
  previousPerformance,
  musclesHitRecently,
  suggestedNextLoad,
  restSecondsForGoal,
} from "./fitness.js";

/** Legacy level floors — duration is the primary driver now. */
const SPLIT_VOLUME = {
  ppl: {
    beginner: { min: 4, max: 5 },
    intermediate: { min: 5, max: 6 },
    expert: { min: 6, max: 8 },
  },
  ul: {
    beginner: { min: 4, max: 4 },
    intermediate: { min: 5, max: 6 },
    expert: { min: 6, max: 7 },
  },
};

/** Research-backed volume by session length (hypertrophy rest 60–180s). */
export const DURATION_VOLUME = {
  30: { min: 4, max: 6 },
  45: { min: 6, max: 8 },
  60: { min: 8, max: 10 },
  90: { min: 12, max: 14 },
};

export function normalizeSessionMinutes(mins) {
  const n = Number(mins);
  if (n <= 30) return 30;
  if (n <= 45) return 45;
  if (n <= 60) return 60;
  return 90;
}

/** Slot recipes: preferred muscle order for a session type (long enough for 90-min fills) */
const SLOT_RECIPES = {
  push: [
    "chest", "shoulders", "triceps", "chest", "shoulders", "triceps", "abs", "chest",
    "shoulders", "triceps", "chest", "abs", "shoulders", "triceps",
  ],
  pull: [
    "back", "biceps", "back", "traps", "biceps", "forearms", "back", "biceps",
    "back", "traps", "biceps", "forearms", "back", "biceps",
  ],
  legs: [
    "quads", "hamstrings", "glutes", "calves", "quads", "hamstrings", "lower_back", "glutes",
    "quads", "calves", "hamstrings", "glutes", "abs", "quads",
  ],
  upper: [
    "chest", "back", "shoulders", "biceps", "triceps", "chest", "back",
    "shoulders", "biceps", "triceps", "chest", "back", "abs", "shoulders",
  ],
  lower: [
    "quads", "hamstrings", "glutes", "calves", "lower_back", "abs", "quads",
    "hamstrings", "glutes", "calves", "quads", "hamstrings", "abs", "glutes",
  ],
};

const GOAL_PRESETS = {
  lose_weight: {
    repsMin: 8,
    repsMax: 12,
    preferMetabolic: true,
    allowCircuit: true,
    allowSuperset: true,
    restCompound: 45,
    restIsolation: 30,
  },
  tone: {
    repsMin: 8,
    repsMax: 12,
    preferMetabolic: true,
    allowCircuit: true,
    allowSuperset: true,
    restCompound: 60,
    restIsolation: 45,
  },
  build_muscle: {
    repsMin: 8,
    repsMax: 12,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: true,
    restCompound: 120,
    restIsolation: 75,
  },
  strength: {
    repsMin: 1,
    repsMax: 5,
    /** Density nudge within duration band — never hard-cap below a 60-min session. */
    durationMaxDelta: -1,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: false,
    accessorySupersetOnly: true,
    preferCompound: true,
    restCompound: 240,
    restIsolation: 180,
  },
  longevity: {
    repsMin: 8,
    repsMax: 12,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: true,
    preferSafe: true,
    preferMobility: true,
    maxVolumeScale: 0.95,
    restCompound: 90,
    restIsolation: 60,
  },
  rehab: {
    repsMin: 15,
    repsMax: 20,
    durationMaxDelta: -2,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: false,
    preferSafe: true,
    preferMachine: true,
    preferIsolation: true,
    avoidAxial: true,
    maxVolumeScale: 0.9,
    restCompound: 75,
    restIsolation: 60,
  },
  sport_prep: {
    repsMin: 6,
    repsMax: 10,
    preferMetabolic: true,
    allowCircuit: true,
    allowSuperset: true,
    preferCompound: true,
    restCompound: 120,
    restIsolation: 60,
  },
  skill: {
    repsMin: 5,
    repsMax: 8,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: true,
    preferCompound: true,
    varietyBump: true,
    restCompound: 120,
    restIsolation: 75,
  },
  /** Circuit-style endurance (mapped from high-rep fat-loss / tone when why pushes it) */
  endurance: {
    repsMin: 15,
    repsMax: 25,
    preferMetabolic: true,
    allowCircuit: true,
    allowSuperset: true,
    restCompound: 45,
    restIsolation: 30,
  },
};

function applyWhyModifiers(goalCfg, trainWhy = []) {
  const cfg = { ...goalCfg };
  const why = new Set(trainWhy || []);
  if (why.has("mental_reset") || why.has("energy") || why.has("catharsis") || why.has("mental_health")) {
    cfg.preferMetabolic = true;
    cfg.allowCircuit = cfg.allowCircuit !== false && !cfg.avoidAxial;
    cfg.maxVolumeScale = Math.min(cfg.maxVolumeScale ?? 1, 0.9);
  }
  if (why.has("fun") || why.has("curiosity") || why.has("performance")) {
    cfg.varietyBump = true;
  }
  if (why.has("skill") || why.has("identity") || why.has("confidence")) {
    cfg.preferCompound = true;
  }
  if (why.has("discipline") || why.has("habit") || why.has("structure")) {
    cfg.preferCompound = true;
  }
  return cfg;
}

function isSafeEquipment(ex) {
  const eq = ex.equipment || [];
  return eq.some((e) => ["machine", "cable", "bodyweight", "dumbbell"].includes(e));
}

function isMobilityFriendly(ex) {
  return /raise|bridge|plank|extension|curl|fly|lunge|step|carry|bird|dead bug|rollout/i.test(
    String(ex.name || "")
  );
}

const SUPERSET_PAIRS = [
  ["chest", "back"],
  ["back", "chest"],
  ["biceps", "triceps"],
  ["triceps", "biceps"],
  ["quads", "hamstrings"],
  ["hamstrings", "quads"],
  ["shoulders", "back"],
];

const AXIAL_LOAD_NAMES = /deadlift|squat|good morning|hip thrust|romanian/i;

function equipmentMatch(exEquipment = [], available = []) {
  if (!exEquipment.length) return true;
  if (!available.length) return false;
  return exEquipment.some((eq) => available.includes(eq));
}

function isCompound(ex) {
  const name = String(ex.name || "");
  const eq = ex.equipment || [];
  if (AXIAL_LOAD_NAMES.test(name)) return true;
  if (eq.includes("barbell") && /press|row|squat|deadlift/i.test(name)) return true;
  if (/pull-up|chin-up|dip|push-up/i.test(name)) return true;
  return false;
}

function isAxialHeavy(ex) {
  return AXIAL_LOAD_NAMES.test(String(ex.name || ""));
}

function isMetabolic(ex) {
  const eq = ex.equipment || [];
  return (
    eq.includes("bodyweight") ||
    eq.includes("kettlebell") ||
    eq.includes("cable") ||
    eq.includes("dumbbell") ||
    /swing|carry|burpee|jump|crunch|plank|raise/i.test(ex.name || "")
  );
}

function scoreExercise(ex, { group, hit, log, goalCfg }) {
  const hist = previousPerformance(log, ex.name);
  let score = 0;
  if (hist) score += 20;
  if (!hit.has(group)) score += 10;
  if (isCompound(ex)) score += 8;
  if (goalCfg.preferIsolation && !isCompound(ex)) score += 10;
  if (goalCfg.preferMetabolic && isMetabolic(ex)) score += 6;
  if (goalCfg.preferMetabolic === false && isCompound(ex)) score += 4;
  if (goalCfg.preferCompound && isCompound(ex)) score += 5;
  if (goalCfg.preferMachine && isSafeEquipment(ex)) score += 8;
  if (goalCfg.preferMobility && isMobilityFriendly(ex)) score += 6;
  if (goalCfg.avoidAxial && isAxialHeavy(ex)) score -= 20;
  if (goalCfg.preferSafe && isAxialHeavy(ex)) score -= 8;
  if (goalCfg.varietyBump && !hist) score += 4;
  if ((ex.equipment || []).includes("bodyweight")) score += 1;
  return score;
}

function candidatesForGroup(group, { equipment, blockedSet, log, hit, goalCfg }) {
  return exercisesSeed
    .filter((ex) => normalizeMuscleGroup(ex.muscleGroup) === group)
    .filter((ex) => !blockedSet.has(String(ex.name).toLowerCase()))
    .filter((ex) => equipmentMatch(ex.equipment || [], equipment))
    .map((ex) => ({ ex, score: scoreExercise(ex, { group, hit, log, goalCfg }) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.ex);
}

function findAntagonist(group) {
  const hit = SUPERSET_PAIRS.find((p) => p[0] === group);
  return hit ? hit[1] : null;
}

function canSuperset(a, b, goalCfg) {
  if (!a || !b) return false;
  if (isAxialHeavy(a) && isAxialHeavy(b)) return false;
  if (isAxialHeavy(a) && isCompound(b)) return false;
  if (isAxialHeavy(b) && isCompound(a)) return false;
  if (goalCfg.accessorySupersetOnly) {
    const accessory = (ex) =>
      ["biceps", "triceps", "calves", "forearms", "abs", "shoulders"].includes(
        normalizeMuscleGroup(ex.muscleGroup)
      );
    return accessory(a) && accessory(b);
  }
  const ga = normalizeMuscleGroup(a.muscleGroup);
  const gb = normalizeMuscleGroup(b.muscleGroup);
  return SUPERSET_PAIRS.some((p) => p[0] === ga && p[1] === gb);
}

function inferSessionRecipe(groups = [], splitType = "ppl") {
  const set = new Set(groups.map(normalizeMuscleGroup));
  if (splitType === "ul") {
    const upperHits = ["chest", "back", "shoulders", "biceps", "triceps"].filter((g) => set.has(g)).length;
    const lowerHits = ["quads", "hamstrings", "glutes", "calves", "lower_back", "abs"].filter((g) =>
      set.has(g)
    ).length;
    return upperHits >= lowerHits ? "upper" : "lower";
  }
  const pushHits = ["chest", "shoulders", "triceps"].filter((g) => set.has(g)).length;
  const pullHits = ["back", "biceps", "traps", "forearms"].filter((g) => set.has(g)).length;
  const legHits = ["quads", "hamstrings", "glutes", "calves", "lower_back"].filter((g) => set.has(g)).length;
  if (legHits >= pushHits && legHits >= pullHits) return "legs";
  if (pullHits >= pushHits) return "pull";
  return "push";
}

function resolveVolume(splitType, level, goalCfg, sessionMinutes = 60) {
  const mins = normalizeSessionMinutes(sessionMinutes);
  const dur = DURATION_VOLUME[mins] || DURATION_VOLUME[60];
  let min = dur.min;
  let max = dur.max;

  // Level nudge inside the duration band
  if (level === "beginner") {
    max = Math.max(min, max - 1);
  } else if (level === "expert") {
    min = Math.min(max, min + 1);
  }

  if (goalCfg.maxVolumeScale != null) {
    min = Math.max(dur.min, Math.round(min * goalCfg.maxVolumeScale));
    max = Math.max(min, Math.round(max * goalCfg.maxVolumeScale));
  }
  if (goalCfg.durationMaxDelta != null) {
    max = Math.max(min, max + goalCfg.durationMaxDelta);
  }
  // Soft legacy overrides only when they don't crush a 60+ min session below duration min
  if (goalCfg.exerciseMin != null && mins < 60) min = goalCfg.exerciseMin;
  if (goalCfg.exerciseMax != null && mins < 60) max = goalCfg.exerciseMax;

  // Keep floor at duration min for full sessions
  if (mins >= 60) min = Math.max(min, dur.min);

  return { min, max, sessionMinutes: mins };
}

export function isBodyweightExercise(ex = {}) {
  const eq = ex.equipment || [];
  const name = String(ex.name || "");
  return (
    (eq.includes("bodyweight") &&
      !eq.some((e) => ["barbell", "dumbbell", "machine", "cable", "kettlebell"].includes(e))) ||
    /pull-up|chin-up|dip|push-up|plank|hanging|burpee|air squat/i.test(name)
  );
}

function setSeedForGoal(goal, goalCfg, level) {
  const mid = Math.round(((goalCfg.repsMin || 8) + (goalCfg.repsMax || 12)) / 2);
  let sets = level === "expert" ? 4 : 3;
  if (goal === "strength") sets = 4;
  if (goal === "rehab") sets = 3;
  if (goal === "lose_weight" || goal === "tone") sets = 3;
  return { sets, reps: mid, repsMin: goalCfg.repsMin, repsMax: goalCfg.repsMax };
}

function restForExercise(ex, goalCfg, goal, bwKg = null) {
  const compound = isCompound(ex);
  let rest;
  if (goalCfg.restCompound != null && compound) rest = goalCfg.restCompound;
  else if (goalCfg.restIsolation != null && !compound) rest = goalCfg.restIsolation;
  else {
    const base = restSecondsForGoal(goal);
    rest = compound ? Math.round(base * 1.25) : Math.round(base * 0.75);
  }
  // Heavier bodyweight → slightly longer rest on compounds
  if (compound && bwKg != null && Number.isFinite(bwKg)) {
    if (bwKg >= 95) rest = Math.round(rest * 1.12);
    else if (bwKg >= 85) rest = Math.round(rest * 1.06);
  }
  return rest;
}

/** Convert stored body weight to kg for formulas. */
function toKg(bodyWeight, preferredUnit = "lb") {
  const n = Number(bodyWeight);
  if (!Number.isFinite(n) || n <= 0) return null;
  return preferredUnit === "kg" ? n : n / 2.20462;
}

function kgToDisplay(kg, preferredUnit = "lb") {
  if (kg == null || !Number.isFinite(kg)) return 0;
  if (preferredUnit === "kg") return Math.round(kg * 2) / 2;
  return Math.round(kg * 2.20462 / 5) * 5; // round to 5 lb
}

/**
 * Seed compound loads as % bodyweight by movement + level.
 * Bodyweight-only moves stay 0. Overload history wins when present.
 */
function seedWeightForExercise(ex, { bwKg, level, preferredUnit, overloadWeight }) {
  if (overloadWeight != null && Number(overloadWeight) > 0) return Number(overloadWeight);
  const eq = ex.equipment || [];
  const name = String(ex.name || "");
  const bwOnly = isBodyweightExercise(ex);
  if (bwOnly || bwKg == null) return 0;

  const levelMul = level === "expert" ? 1.45 : level === "intermediate" ? 1.2 : 1;
  let pct = 0.35;
  if (/squat|leg press|lunge|step/i.test(name)) pct = 0.55;
  else if (/deadlift|rdl|romanian|hip thrust|good morning|hinge/i.test(name)) pct = 0.65;
  else if (/bench|chest press/i.test(name)) pct = 0.45;
  else if (/row|pulldown|pull-down/i.test(name)) pct = 0.4;
  else if (/overhead|shoulder press|ohp/i.test(name)) pct = 0.3;
  else if (/curl|extension|fly|raise|kickback/i.test(name)) pct = 0.15;
  else if (isCompound(ex)) pct = 0.4;
  else pct = 0.18;

  // Clamp dumbbells / machines lower than barbell compounds
  if (eq.includes("dumbbell") && !eq.includes("barbell")) pct *= 0.55;
  if (eq.includes("machine") || eq.includes("cable")) pct *= 0.75;

  const kgLoad = bwKg * pct * levelMul;
  // Equipment reality clamps (kg)
  const maxKg = eq.includes("dumbbell") ? 45 : eq.includes("kettlebell") ? 40 : 180;
  return kgToDisplay(Math.min(kgLoad, maxKg), preferredUnit);
}

function repsBiasForBw(seed, bwKg, goalCfg) {
  if (bwKg == null || !Number.isFinite(bwKg)) return seed.reps;
  let reps = seed.reps;
  // Lighter BW → bias slightly higher reps within goal band
  if (bwKg < 70) {
    reps = Math.min(seed.repsMax || seed.reps, reps + 1);
  }
  return Math.min(seed.repsMax || reps, Math.max(seed.repsMin || reps, reps));
}

export function levelVolumeHint(level = "beginner", groupCount = 1, splitType = "ppl", sessionMinutes = 60) {
  const goalCfg = GOAL_PRESETS.build_muscle;
  const volume = resolveVolume(splitType, level, goalCfg, sessionMinutes);
  const target = Math.min(volume.max, Math.max(volume.min, Math.max(groupCount, 1) * 2));
  return {
    level,
    min: volume.min,
    max: volume.max,
    predicted: target,
    sessionMinutes: volume.sessionMinutes,
    sets: level === "expert" ? 4 : 3,
    reps: 10,
    label: `${level[0].toUpperCase()}${level.slice(1)} · ${volume.sessionMinutes}m · ${volume.min}-${volume.max} exercises`,
  };
}

export function setSeedForLevelGoal(level = "beginner", goal = "build_muscle") {
  const goalCfg = GOAL_PRESETS[goal] || GOAL_PRESETS.build_muscle;
  return setSeedForGoal(goal, goalCfg, level);
}

/**
 * @returns {Array<{ name, muscleGroup, equipment, role, pairId?, pairType?, sets?, reps?, weight?, restSeconds? }>}
 */
export function generateWorkoutPlan({
  selectedGroups = [],
  equipment = [],
  log = [],
  blocked = [],
  experienceLevel = "beginner",
  goal = "build_muscle",
  trainWhy = [],
  splitType = "ppl",
  gymDaysPerWeek = 4,
  sessionMinutes = 60,
  bodyWeight = null,
  preferredUnit = "lb",
  limitPerGroup,
  maxExercises,
} = {}) {
  const groups = [...new Set(selectedGroups.map(normalizeMuscleGroup).filter(Boolean))];
  if (!groups.length) return [];

  const level = ["beginner", "intermediate", "expert"].includes(experienceLevel)
    ? experienceLevel
    : "beginner";
  const goalCfg = applyWhyModifiers(GOAL_PRESETS[goal] || GOAL_PRESETS.build_muscle, trainWhy);
  const volume = resolveVolume(splitType, level, goalCfg, sessionMinutes);
  const max = maxExercises || volume.max;
  const min = Math.min(volume.min, max);
  const seed = setSeedForGoal(goal, goalCfg, level);
  const bwKg = toKg(bodyWeight, preferredUnit);
  const unit = preferredUnit === "kg" ? "kg" : "lb";
  const recipeKey = inferSessionRecipe(groups, splitType);
  const recipe = SLOT_RECIPES[recipeKey] || groups;

  const blockedSet = new Set((blocked || []).map((n) => String(n).trim().toLowerCase()));
  const hit = musclesHitRecently(log, 2);
  const usedNames = new Set();
  const picks = [];
  const ctx = { equipment, blockedSet, log, hit, goalCfg };

  const buildPick = (ex) => {
    const overload = suggestedNextLoad(log, ex.name);
    const compound = isCompound(ex);
    const reps = repsBiasForBw(
      {
        ...seed,
        reps: Math.min(seed.repsMax || seed.reps, Math.max(seed.repsMin || seed.reps, overload.reps || seed.reps)),
      },
      bwKg,
      goalCfg
    );
    return {
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment || [],
      role: compound ? "compound" : "accessory",
      sets: seed.sets,
      reps,
      weight: seedWeightForExercise(ex, {
        bwKg,
        level,
        preferredUnit: unit,
        overloadWeight: overload.weight,
      }),
      restSeconds: restForExercise(ex, goalCfg, goal, bwKg),
    };
  };

  // Prefer recipe slots that intersect selected groups, then fill remaining groups
  const slotOrder = [
    ...recipe.filter((g) => groups.includes(g)),
    ...groups.filter((g) => !recipe.includes(g)),
  ];

  const perGroupCap =
    limitPerGroup ||
    Math.max(goalCfg.preferIsolation ? 2 : 3, Math.ceil(max / Math.max(groups.length, 1)));

  for (const group of slotOrder) {
    if (picks.length >= max) break;
    const already = picks.filter((p) => normalizeMuscleGroup(p.muscleGroup) === group).length;
    if (already >= perGroupCap) continue;
    const candidates = candidatesForGroup(group, ctx);
    for (const ex of candidates) {
      if (usedNames.has(ex.name.toLowerCase())) continue;
      if (goalCfg.preferIsolation && isCompound(ex) && picks.length >= min) continue;
      picks.push(buildPick(ex));
      usedNames.add(ex.name.toLowerCase());
      break;
    }
  }

  // Fill toward min, then toward max when duration allows more volume
  const fillTarget = max;
  if (picks.length < fillTarget) {
    for (const group of [...slotOrder, ...groups]) {
      if (picks.length >= fillTarget) break;
      for (const ex of candidatesForGroup(group, ctx)) {
        if (usedNames.has(ex.name.toLowerCase())) continue;
        picks.push(buildPick(ex));
        usedNames.add(ex.name.toLowerCase());
        if (picks.length >= fillTarget) break;
      }
    }
  }

  // Soft trim only on short sessions with dense weekly training
  let result = picks.slice(0, max);
  if (volume.sessionMinutes < 60 && gymDaysPerWeek >= 5 && result.length > min) {
    result = result.slice(0, Math.max(min, result.length - 1));
  }

  if (goalCfg.allowSuperset) {
    let pairIndex = 1;
    const unpaired = result.filter((p) => !p.pairId);
    for (let i = 0; i < unpaired.length; i++) {
      const a = unpaired[i];
      if (a.pairId) continue;
      const anti = findAntagonist(normalizeMuscleGroup(a.muscleGroup));
      if (!anti) continue;
      const b = unpaired.find(
        (x) =>
          x !== a &&
          !x.pairId &&
          normalizeMuscleGroup(x.muscleGroup) === anti &&
          canSuperset(a, x, goalCfg)
      );
      if (!b) continue;
      const pairId = `ss-${pairIndex++}`;
      a.pairId = pairId;
      a.pairType = "superset";
      b.pairId = pairId;
      b.pairType = "superset";
    }
  }

  if (goalCfg.allowCircuit) {
    const circuitPool = result.filter((p) => !p.pairId && isMetabolic(p)).slice(0, 4);
    if (circuitPool.length >= 3) {
      const pairId = "circuit-1";
      circuitPool.forEach((p) => {
        p.pairId = pairId;
        p.pairType = "circuit";
      });
    }
  }

  return result;
}

export { SPLIT_VOLUME as LEVEL_PRESETS, GOAL_PRESETS };
