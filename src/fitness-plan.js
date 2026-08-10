/**
 * Rule-based workout plan: level + goal drive volume, 2–3 per muscle,
 * safe supersets / circuits.
 */
import {
  exercisesSeed,
  normalizeMuscleGroup,
  previousPerformance,
  musclesHitRecently,
} from "./fitness.js";

const LEVEL_PRESETS = {
  beginner: { min: 5, max: 6, perGroup: 2, sets: 3, reps: 12 },
  intermediate: { min: 7, max: 9, perGroup: 2, sets: 3, reps: 10 },
  expert: { min: 10, max: 12, perGroup: 3, sets: 4, reps: 8 },
};

const GOAL_PRESETS = {
  lose_weight: { repsBoost: 2, preferMetabolic: true, allowCircuit: true, allowSuperset: true },
  tone: { repsBoost: 2, preferMetabolic: true, allowCircuit: true, allowSuperset: true },
  build_muscle: { repsBoost: 0, preferMetabolic: false, allowCircuit: false, allowSuperset: true },
  strength: {
    repsBoost: -2,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: false,
    accessorySupersetOnly: true,
  },
  longevity: {
    repsBoost: 1,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: true,
    preferSafe: true,
    preferMobility: true,
    maxVolumeScale: 0.9,
  },
  rehab: {
    repsBoost: 2,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: false,
    preferSafe: true,
    preferMachine: true,
    avoidAxial: true,
    maxVolumeScale: 0.85,
  },
  sport_prep: {
    repsBoost: 0,
    preferMetabolic: true,
    allowCircuit: true,
    allowSuperset: true,
    preferCompound: true,
  },
  skill: {
    repsBoost: 0,
    preferMetabolic: false,
    allowCircuit: false,
    allowSuperset: true,
    preferCompound: true,
    varietyBump: true,
  },
};

function applyWhyModifiers(goalCfg, trainWhy = []) {
  const cfg = { ...goalCfg };
  const why = new Set(trainWhy || []);
  if (why.has("mental_reset") || why.has("energy") || why.has("catharsis")) {
    cfg.preferMetabolic = true;
    cfg.allowCircuit = cfg.allowCircuit !== false && !cfg.avoidAxial;
    cfg.maxVolumeScale = Math.min(cfg.maxVolumeScale ?? 1, 0.9);
  }
  if (why.has("fun") || why.has("curiosity")) {
    cfg.varietyBump = true;
  }
  if (why.has("skill") || why.has("identity")) {
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

/** Antagonist pairs safe for supersets */
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

export function levelVolumeHint(level = "beginner", groupCount = 1) {
  const preset = LEVEL_PRESETS[level] || LEVEL_PRESETS.beginner;
  const per = preset.perGroup;
  const raw = Math.max(groupCount, 1) * per;
  const target = Math.min(preset.max, Math.max(preset.min, raw));
  return {
    level,
    perGroup: per,
    min: preset.min,
    max: preset.max,
    predicted: Math.min(preset.max, Math.max(preset.min, Math.min(raw, preset.max))),
    sets: preset.sets,
    reps: preset.reps,
    label: `${level[0].toUpperCase()}${level.slice(1)} · ~${target} exercises · ${per} per group`,
  };
}

export function setSeedForLevelGoal(level = "beginner", goal = "build_muscle") {
  const preset = LEVEL_PRESETS[level] || LEVEL_PRESETS.beginner;
  const goalCfg = GOAL_PRESETS[goal] || GOAL_PRESETS.build_muscle;
  let reps = preset.reps + (goalCfg.repsBoost || 0);
  if (goal === "strength") reps = Math.max(5, Math.min(8, reps));
  if (goal === "lose_weight" || goal === "tone" || goal === "rehab") {
    reps = Math.max(10, Math.min(15, reps));
  }
  if (goal === "longevity") reps = Math.max(8, Math.min(12, reps));
  let sets = goal === "strength" ? Math.max(preset.sets, 4) : preset.sets;
  if (goal === "rehab") sets = Math.min(sets, 3);
  return { sets, reps };
}

/**
 * @returns {Array<{ name, muscleGroup, equipment, role, pairId?, pairType?, sets?, reps? }>}
 */
export function generateWorkoutPlan({
  selectedGroups = [],
  equipment = [],
  log = [],
  blocked = [],
  experienceLevel = "beginner",
  goal = "build_muscle",
  trainWhy = [],
  limitPerGroup,
  maxExercises,
} = {}) {
  const groups = [...new Set(selectedGroups.map(normalizeMuscleGroup).filter(Boolean))];
  if (!groups.length) return [];

  const level = LEVEL_PRESETS[experienceLevel] ? experienceLevel : "beginner";
  const preset = LEVEL_PRESETS[level];
  const goalCfg = applyWhyModifiers(GOAL_PRESETS[goal] || GOAL_PRESETS.build_muscle, trainWhy);
  const perGroup = limitPerGroup || preset.perGroup;
  const scale = goalCfg.maxVolumeScale ?? 1;
  const max = maxExercises || Math.max(preset.min, Math.round(preset.max * scale));
  const min = Math.min(preset.min, max);
  const seed = setSeedForLevelGoal(level, goal);

  const blockedSet = new Set((blocked || []).map((n) => String(n).trim().toLowerCase()));
  const hit = musclesHitRecently(log, 2);
  const usedNames = new Set();
  const picks = [];

  const ctx = { equipment, blockedSet, log, hit, goalCfg };

  // Always aim for at least 2 per group when catalog allows
  const targetPer = Math.max(2, perGroup);

  for (const group of groups) {
    if (picks.length >= max) break;
    const candidates = candidatesForGroup(group, ctx);
    let added = 0;
    for (const ex of candidates) {
      if (added >= targetPer) break;
      if (usedNames.has(ex.name.toLowerCase())) continue;
      // Prefer compounds first for strength
      picks.push({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment || [],
        role: isCompound(ex) ? "compound" : "accessory",
        sets: seed.sets,
        reps: seed.reps,
      });
      usedNames.add(ex.name.toLowerCase());
      added += 1;
      if (picks.length >= max) break;
    }
  }

  // Fill toward min if under-filled
  if (picks.length < min) {
    for (const group of groups) {
      if (picks.length >= min || picks.length >= max) break;
      for (const ex of candidatesForGroup(group, ctx)) {
        if (usedNames.has(ex.name.toLowerCase())) continue;
        picks.push({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment || [],
          role: isCompound(ex) ? "compound" : "accessory",
          sets: seed.sets,
          reps: seed.reps,
        });
        usedNames.add(ex.name.toLowerCase());
        if (picks.length >= min || picks.length >= max) break;
      }
    }
  }

  // Trim to max while keeping ≥2 per group when possible
  let result = picks.slice(0, max);

  // Pair supersets
  if (goalCfg.allowSuperset) {
    let pairIndex = 0;
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

  // Circuit for fat-loss / tone: mark 3–4 metabolic unpaired moves
  if (goalCfg.allowCircuit) {
    const circuitPool = result
      .filter((p) => !p.pairId && isMetabolic(p))
      .slice(0, 4);
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

export { LEVEL_PRESETS, GOAL_PRESETS };
