import {
  exercisesSeed,
  normalizeMuscleGroup,
  previousPerformance,
  musclesHitRecently,
} from "./fitness.js";

function equipmentMatch(exEquipment = [], available = []) {
  if (!exEquipment.length) return true;
  if (!available.length) return false;
  return exEquipment.some((eq) => available.includes(eq));
}

/**
 * Rule-based workout plan from selected muscle groups + equipment.
 * Returns ordered catalog exercises (max ~8).
 */
export function generateWorkoutPlan({
  selectedGroups = [],
  equipment = [],
  log = [],
  blocked = [],
  limitPerGroup = 1,
  maxExercises = 8,
} = {}) {
  const groups = [...new Set(selectedGroups.map(normalizeMuscleGroup).filter(Boolean))];
  if (!groups.length) return [];

  const blockedSet = new Set((blocked || []).map((n) => String(n).trim().toLowerCase()));
  const hit = musclesHitRecently(log, 2);
  const picks = [];
  const usedNames = new Set();

  for (const group of groups) {
    const candidates = exercisesSeed
      .filter((ex) => normalizeMuscleGroup(ex.muscleGroup) === group)
      .filter((ex) => !blockedSet.has(String(ex.name).toLowerCase()))
      .filter((ex) => equipmentMatch(ex.equipment || [], equipment))
      .map((ex) => {
        const hist = previousPerformance(log, ex.name);
        let score = 0;
        if (hist) score += 20;
        if (!hit.has(group)) score += 10;
        if ((ex.equipment || []).includes("bodyweight")) score += 1;
        return { ex, score };
      })
      .sort((a, b) => b.score - a.score);

    let added = 0;
    for (const { ex } of candidates) {
      if (added >= limitPerGroup) break;
      if (usedNames.has(ex.name.toLowerCase())) continue;
      picks.push(ex);
      usedNames.add(ex.name.toLowerCase());
      added += 1;
      if (picks.length >= maxExercises) return picks;
    }
  }

  // If some groups had no match (equipment gap), fill from remaining selected groups with 2nd pick
  if (picks.length < Math.min(groups.length, maxExercises)) {
    for (const group of groups) {
      if (picks.length >= maxExercises) break;
      const extras = exercisesSeed
        .filter((ex) => normalizeMuscleGroup(ex.muscleGroup) === group)
        .filter((ex) => !blockedSet.has(String(ex.name).toLowerCase()))
        .filter((ex) => equipmentMatch(ex.equipment || [], equipment))
        .filter((ex) => !usedNames.has(ex.name.toLowerCase()));
      for (const ex of extras) {
        picks.push(ex);
        usedNames.add(ex.name.toLowerCase());
        if (picks.length >= maxExercises) break;
      }
    }
  }

  return picks.slice(0, maxExercises);
}
