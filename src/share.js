import { formatDisplayDate, weekDates, todayKey } from "./dates.js";
import { completionForDate, computeStreak } from "./streaks.js";
import { challengeDayNumber } from "./challenge.js";
import { completedSessions, formatVolume, sessionVolume, sessionsThisWeek } from "./fitness.js";

export function buildDayShareText(state, date = todayKey()) {
  const name = state.settings?.displayName || "Me";
  const c = completionForDate(state, date);
  const streak = computeStreak(state);
  const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
  const length = state.challenge?.lengthDays || 30;
  const session = (state.fitnessLog || []).find((s) => s.date === date && s.completedAt);
  const unit = state.fitnessSettings?.preferredUnit || "lb";
  let workoutLine = "";
  if (session) {
    const vol = formatVolume(sessionVolume(session, unit));
    const count = (session.exercises || []).length;
    workoutLine = `\nWorkout: ${count} exercises · ${vol} ${unit} volume.`;
  }
  const sealed = c.complete ? "sealed" : "in progress";
  return `Day ${dayNum}/${length} ${sealed}. ${c.doneCore}/${c.coreCount} core blocks.${workoutLine}\nStreak: ${streak}. Proof over vibes.\n— ${name}, via Locked-In`;
}

export function buildWeekShareText(state) {
  const name = state.settings?.displayName || "Me";
  const streak = computeStreak(state);
  const keys = weekDates(todayKey(), 0);
  let sealed = 0;
  keys.forEach((k) => {
    if (completionForDate(state, k).complete) sealed += 1;
  });
  const workouts = sessionsThisWeek(state.fitnessLog || []).length;
  return `This week: ${sealed}/7 days sealed · ${workouts} workouts logged.\nStreak: ${streak}.\nProof over vibes.\n— ${name}, via Locked-In`;
}

export function buildMonthShareText(state) {
  const name = state.settings?.displayName || "Me";
  const streak = computeStreak(state);
  let sealed = 0;
  let workouts = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    if (completionForDate(state, key).complete) sealed += 1;
  }
  workouts = completedSessions(state.fitnessLog || []).filter((s) => {
    const d = new Date(`${s.date}T12:00:00`);
    const diff = (Date.now() - d.getTime()) / 86400000;
    return diff <= 30;
  }).length;
  return `Last 30 days: ${sealed} core days sealed · ${workouts} workouts.\nStreak: ${streak}.\nProof over vibes.\n— ${name}, via Locked-In`;
}

export async function renderShareCardBlob(state, scope = "day", date = todayKey()) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 960;
  const ctx = canvas.getContext("2d");
  const name = state.settings?.displayName || "Locked-In";
  const streak = computeStreak(state);
  const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
  const length = state.challenge?.lengthDays || 30;

  ctx.fillStyle = "#070A10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#3ECF8E";
  ctx.font = "600 28px Barlow, sans-serif";
  ctx.fillText("LOCKED-IN", 48, 72);

  ctx.fillStyle = "#F2F4F8";
  ctx.font = "700 64px Barlow Condensed, sans-serif";

  let headline = "";
  let sub = "";
  if (scope === "week") {
    const keys = weekDates(todayKey(), 0);
    let sealed = 0;
    keys.forEach((k) => {
      if (completionForDate(state, k).complete) sealed += 1;
    });
    headline = `${sealed}/7 sealed`;
    sub = `${sessionsThisWeek(state.fitnessLog || []).length} workouts this week`;
  } else if (scope === "month") {
    headline = `${streak} day streak`;
    sub = "Last 30 days of proof";
  } else {
    const c = completionForDate(state, date);
    headline = c.complete ? "Day sealed" : "In progress";
    sub = `${c.doneCore}/${c.coreCount} core · Day ${dayNum}/${length}`;
  }

  ctx.fillText(headline, 48, 200);
  ctx.fillStyle = "#8B93A7";
  ctx.font = "500 32px Barlow, sans-serif";
  ctx.fillText(sub, 48, 260);
  ctx.fillText(`Streak ${streak}`, 48, 320);
  ctx.fillStyle = "#F2F4F8";
  ctx.font = "600 36px Barlow, sans-serif";
  ctx.fillText("Proof over vibes.", 48, 420);
  ctx.fillStyle = "#8B93A7";
  ctx.font = "500 28px Barlow, sans-serif";
  ctx.fillText(`— ${name}`, 48, 880);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function shareProgress(state, scope = "day", date = todayKey()) {
  const text =
    scope === "week"
      ? buildWeekShareText(state)
      : scope === "month"
        ? buildMonthShareText(state)
        : buildDayShareText(state, date);
  const blob = await renderShareCardBlob(state, scope, date);
  const file = new File([blob], `locked-in-${scope}.png`, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "Locked-In proof",
      text,
      files: [file],
    });
    return { ok: true, method: "share" };
  }

  if (navigator.share) {
    await navigator.share({ title: "Locked-In proof", text });
    return { ok: true, method: "share-text" };
  }

  await navigator.clipboard?.writeText(text);
  return { ok: true, method: "clipboard" };
}
