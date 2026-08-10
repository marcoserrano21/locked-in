import playbookDefault from "../content/freelance.playbook.json";
import { challengeDayNumber } from "./challenge.js";
import { todayKey } from "./dates.js";
import { completionForDate, streakAtRisk } from "./streaks.js";
import { resolveBlocksForDate } from "./work.js";
import { totalMiles } from "./uber.js";
import { copy } from "./copy/voice.js";

function isWorkoutBlock(block) {
  if (!block) return false;
  const label = String(block.label || "").toLowerCase();
  const tags = (block.tags || []).map((t) => String(t.label || t).toLowerCase());
  return tags.includes("workout") || /workout|gym|lift|train/.test(label);
}

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
  const hour = new Date().getHours();
  const focusBlock = opts.focusBlock || null;

  const emptyWeek = Object.values(state.schedule || {}).every((day) => !(day || []).length);
  if (emptyWeek && !state.settings?.setupWizardCompleted && state.preset === "blank") {
    hints.push({
      id: "empty-wizard",
      message: copy.coach.emptyWizard,
      action: "open-edit",
      actionLabel: "Open Edit",
    });
  }

  if (blocks.length && isToday && streakAtRisk(state)) {
    hints.push({
      id: "streak-risk",
      message: copy.coach.streakRisk,
      action: null,
    });
  }

  if (dow === 1) {
    const flowIncomplete = (playbook.weeklyFlow || []).some((f) => !state.hustleChecks?.[f.id]);
    if (flowIncomplete) {
      hints.push({
        id: "monday-flow",
        message: copy.coach.mondayFlow,
        action: "open-hustle-flow",
        actionLabel: "Open Hustle Flow",
      });
    }
  }

  const workoutBlock = blocks.find((b) => isWorkoutBlock(b));
  const hasWorkoutToday = (state.fitnessLog || []).some(
    (s) => s.date === today && (s.completedAt || (s.exercises || []).length > 0)
  );
  const suppressWorkoutHint = focusBlock && isWorkoutBlock(focusBlock);
  if (workoutBlock && !hasWorkoutToday && isToday && !suppressWorkoutHint) {
    hints.push({
      id: "workout-block",
      message: hour >= 20 ? copy.coach.workoutLate : copy.coach.workoutBlock,
      action: "open-fitness-today",
      actionLabel: "Open Fitness",
    });
  }

  if (soft > 0 && used >= soft * 0.9) {
    hints.push({
      id: "miles-soft",
      message: copy.coach.milesSoft(Math.round((used / soft) * 100)),
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
      message: copy.coach.day30Early(dayNum, unanswered),
      action: "set-tab",
      actionLabel: "Open Proof",
      tab: "proof",
    });
  }
  if (dayNum >= 25 && unanswered / qCount >= 0.5) {
    hints.push({
      id: "day30-late",
      message: copy.coach.day30Late(dayNum),
      action: "set-tab",
      actionLabel: "Open Proof",
      tab: "proof",
    });
  }

  if (completion.complete) {
    return hints.filter(
      (h) =>
        h.id === "monday-flow" ||
        h.id === "miles-soft" ||
        h.id === "day30-early" ||
        h.id === "day30-late" ||
        h.id === "workout-block" ||
        h.id === "empty-wizard"
    );
  }

  return hints;
}

export { isWorkoutBlock };
