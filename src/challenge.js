import { daysBetween, todayKey } from "./dates.js";
import { CHALLENGE_META } from "./schedule.js";

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
  const lengthDays = [7, 14, 30, 90].includes(Number(state.settings?.challengeLength))
    ? Number(state.settings.challengeLength)
    : CHALLENGE_META.lengthDays;
  return {
    ...state,
    challenge: {
      startDate: todayKey(),
      lengthDays,
      status: "active",
    },
  };
}
