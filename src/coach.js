import playbookDefault from "../content/freelance.playbook.json";
import { challengeDayNumber } from "./challenge.js";
import { todayKey } from "./dates.js";
import { completionForDate, streakAtRisk } from "./streaks.js";
import { resolveBlocksForDate } from "./work.js";
import { totalMiles } from "./uber.js";

/**
 * Rule-based Coach Brain. Deterministic, on-device, no cloud ML.
 */
export function coachHints(state, opts = {}) {
  const playbook = opts.playbook || playbookDefault;
  const hints = [];
  const today = todayKey();
  const isToday = true;
  const dow = new Date().getDay();
  const blocks = resolveBlocksForDate(state, today);
  const completion = completionForDate(state, today);
  const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
  const soft = Number(state.settings?.uberSoftStop || 400);
  const used = totalMiles(state);

  if (!blocks.length) {
    hints.push({
      id: "empty-day",
      message: "No blocks on today. Open Edit and build the track.",
      action: "open-edit",
      actionLabel: "Open Edit",
    });
  }

  if (isToday && streakAtRisk(state)) {
    hints.push({
      id: "streak-risk",
      message: "Core still open. Midnight does not care about your mood.",
      action: null,
    });
  }

  if (dow === 1) {
    const flowIncomplete = (playbook.weeklyFlow || []).some((f) => !state.hustleChecks?.[f.id]);
    if (flowIncomplete) {
      hints.push({
        id: "monday-flow",
        message: "Monday money block. Weekly Flow is still open.",
        action: "open-hustle-flow",
        actionLabel: "Open Hustle Flow",
      });
    }
  }

  if (soft > 0 && used >= soft * 0.9) {
    hints.push({
      id: "miles-soft",
      message: `Miles at ${Math.round((used / soft) * 100)}% of soft stop. Respect the bridge.`,
      action: "open-miles",
      actionLabel: "Open Miles",
    });
  }

  const questions = state.day30Questions || [];
  const answers = state.day30Answers || {};
  const qCount = questions.length || 5;
  let unanswered = 0;
  for (let i = 0; i < qCount; i++) {
    if (!answers[`q${i}`]?.status) unanswered += 1;
  }
  if (dayNum >= 21 && unanswered > 0) {
    hints.push({
      id: "day30-early",
      message: `Day ${dayNum}. ${unanswered} Day 30 answers still open. Early beats surprise.`,
      action: "set-tab",
      actionLabel: "Open Proof",
      tab: "proof",
    });
  }

  if (completion.complete) {
    return hints.filter((h) => h.id === "monday-flow" || h.id === "miles-soft" || h.id === "day30-early");
  }

  return hints;
}
