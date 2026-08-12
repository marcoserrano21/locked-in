import { daysBetween, todayKey } from "./dates.js";
import { CHALLENGE_META } from "./schedule.js";

const FREE_LENGTHS = [7, 14, 30];
const PREMIUM_PRESETS = [7, 14, 30, 90];

/** Resolve challenge length for free vs premium tier. Returns null if not allowed. */
export function resolveChallengeLength(days, premiumUnlocked = false) {
  const n = Number(days);
  if (!Number.isFinite(n)) return null;
  if (premiumUnlocked && n >= 7 && n <= 365) return Math.round(n);
  if (FREE_LENGTHS.includes(n)) return n;
  if (n === 90 && premiumUnlocked) return 90;
  return null;
}

export function challengeDayNumber(challenge) {
  if (!challenge?.startDate) return 0;
  const day = daysBetween(challenge.startDate, todayKey()) + 1;
  const length = challenge.lengthDays || CHALLENGE_META.lengthDays;
  return Math.min(Math.max(day, 1), length);
}

export function isChallengeUnlocked(challenge) {
  if (!challenge?.startDate) return false;
  const length = challenge.lengthDays || CHALLENGE_META.lengthDays;
  return daysBetween(challenge.startDate, todayKey()) + 1 >= length;
}

export function startChallenge(state) {
  const premium = Boolean(state.settings?.premiumUnlocked);
  const resolved = resolveChallengeLength(state.settings?.challengeLength, premium);
  const lengthDays = resolved ?? CHALLENGE_META.lengthDays;
  return {
    ...state,
    challenge: {
      startDate: todayKey(),
      lengthDays,
      status: "active",
    },
  };
}
