import seed from "../content/schedule.seed.json";
import challengeMeta from "../content/challenge.json";

export const DAY_NAMES = seed.dayNames;
export const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const DAY_TYPES = seed.dayTypes;
export const CHALLENGE_META = challengeMeta;

export function cloneSeedSchedule() {
  const days = {};
  for (const [key, blocks] of Object.entries(seed.days)) {
    days[key] = blocks.map((b) => ({ ...b }));
  }
  return days;
}

export function blocksFor(state, dayIdx) {
  const key = String(dayIdx);
  return state.schedule?.[key] || [];
}

export function dayType(dayIdx, state = null) {
  if (state?.settings?.buildDays && Array.isArray(state.settings.buildDays)) {
    return state.settings.buildDays.includes(Number(dayIdx)) ? "foundation" : "maintenance";
  }
  return DAY_TYPES[dayIdx] || "maintenance";
}

export function uid(prefix = "b") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
