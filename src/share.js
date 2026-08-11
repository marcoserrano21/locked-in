import { formatDisplayDate, weekDates, todayKey } from "./dates.js";
import { completionForDate, computeStreak } from "./streaks.js";
import { challengeDayNumber } from "./challenge.js";
import { completedSessions, formatVolume, sessionVolume } from "./fitness.js";

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

export function buildWeekShareText(state, weekOffset = 0) {
  const name = state.settings?.displayName || "Me";
  const streak = computeStreak(state);
  const keys = weekDates(todayKey(), weekOffset);
  let sealed = 0;
  keys.forEach((k) => {
    if (completionForDate(state, k).complete) sealed += 1;
  });
  const workouts = completedSessions(state.fitnessLog || []).filter((s) => keys.includes(s.date)).length;
  const label = weekOffset < 0 ? "Last week" : "This week";
  return `${label}: ${sealed}/7 days sealed · ${workouts} workouts logged.\nStreak: ${streak}.\nProof over vibes.\n— ${name}, via Locked-In`;
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

export function buildFitnessShareText(state, date = todayKey(), extras = null) {
  const name = state.settings?.displayName || "Me";
  const unit = state.fitnessSettings?.preferredUnit || "lb";
  const session =
    (extras?.sessionId && (state.fitnessLog || []).find((s) => s.id === extras.sessionId)) ||
    (state.fitnessLog || []).find((s) => s.date === date && s.completedAt) ||
    completedSessions(state.fitnessLog || [])[0];
  if (!session) {
    return `Training logged.\nProof over vibes.\n— ${name}, via Locked-In`;
  }
  const vol = formatVolume(sessionVolume(session, unit));
  const count = (session.exercises || []).length;
  if (extras?.tier === "pr" && extras.exerciseName) {
    const prLine =
      extras.previousValue && extras.newValue
        ? `New PR: ${extras.exerciseName} · ${extras.previousValue} → ${extras.newValue}.`
        : `New PR: ${extras.exerciseName}.`;
    return `${prLine}\n${count} exercises · ${vol} ${unit}.\n${formatDisplayDate(session.date)}\nProof over vibes.\n— ${name}, via Locked-In`;
  }
  if (extras?.tier === "streak-milestone" && extras.streakCount) {
    return `${extras.streakCount}-day streak. Let's go.\n${count} exercises · ${vol} ${unit}.\n${formatDisplayDate(session.date)}\nProof over vibes.\n— ${name}, via Locked-In`;
  }
  return `Workout sealed · ${count} exercises · ${vol} ${unit}.\n${formatDisplayDate(session.date)}\nProof over vibes.\n— ${name}, via Locked-In`;
}

function cardCopy(state, scope, date) {
  const streak = computeStreak(state);
  const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
  const length = state.challenge?.lengthDays || 30;
  const name = state.settings?.displayName || "Locked-In";

  if (scope === "fitness") {
    const unit = state.fitnessSettings?.preferredUnit || "lb";
    const session =
      (state.fitnessLog || []).find((s) => s.date === date && s.completedAt) ||
      completedSessions(state.fitnessLog || [])[0];
    const vol = session ? formatVolume(sessionVolume(session, unit)) : "0";
    const count = session ? (session.exercises || []).length : 0;
    return {
      brand: "LOCKED-IN",
      metric: session ? `${vol} ${unit}` : "Lift logged",
      line: session ? `${count} exercises · ${formatDisplayDate(session.date)}` : "Training proof",
      coach: "Show up. Log it. Repeat.",
      name,
      streak,
      accent: true,
    };
  }

  if (scope === "week" || scope === "last-week") {
    const offset = scope === "last-week" ? -1 : 0;
    const keys = weekDates(todayKey(), offset);
    let sealedCount = 0;
    keys.forEach((k) => {
      if (completionForDate(state, k).complete) sealedCount += 1;
    });
    const workouts = completedSessions(state.fitnessLog || []).filter((s) => keys.includes(s.date)).length;
    return {
      brand: "LOCKED-IN",
      metric: `${sealedCount}/7`,
      line: `${offset < 0 ? "Last week" : "This week"} · ${workouts} workouts`,
      coach: "Proof over vibes.",
      name,
      streak,
      accent: sealedCount >= 5,
    };
  }

  if (scope === "month") {
    return {
      brand: "LOCKED-IN",
      metric: `${streak}`,
      line: "Day streak · last 30 days",
      coach: "Proof over vibes.",
      name,
      streak,
      accent: streak >= 7,
    };
  }

  const c = completionForDate(state, date);
  const sealed = scope === "sealed" || c.complete;
  return {
    brand: "LOCKED-IN",
    metric: sealed ? "SEALED" : `${c.doneCore}/${c.coreCount}`,
    line: sealed
      ? `Day ${dayNum}/${length} · ${formatDisplayDate(date)}`
      : `Day ${dayNum}/${length} · in progress`,
    coach: sealed ? "All core blocks done." : "One block at a time.",
    name,
    streak,
    accent: sealed,
  };
}

function downloadPng(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal viral Locked-In share card. */
export async function renderShareCardBlob(state, scope = "day", date = todayKey()) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  const copy = cardCopy(state, scope, date);

  // Atmosphere: deep navy + soft build glow
  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#070A10");
  bg.addColorStop(0.55, "#0C1220");
  bg.addColorStop(1, "#08140F");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(62, 207, 142, 0.08)";
  ctx.beginPath();
  ctx.arc(900, 180, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3ECF8E";
  ctx.font = "700 36px Barlow, system-ui, sans-serif";
  ctx.fillText(copy.brand, 72, 110);

  ctx.fillStyle = "#8B93A7";
  ctx.font = "500 28px Barlow, system-ui, sans-serif";
  ctx.fillText(`Streak ${copy.streak}`, 72, 160);

  ctx.fillStyle = copy.accent ? "#B8F248" : "#F2F4F8";
  ctx.font = "700 120px 'Barlow Condensed', Barlow, system-ui, sans-serif";
  const metricY = 420;
  ctx.fillText(copy.metric, 72, metricY);

  ctx.fillStyle = "#F2F4F8";
  ctx.font = "600 40px Barlow, system-ui, sans-serif";
  wrapText(ctx, copy.line, 72, 500, 900, 52);

  ctx.fillStyle = "#8B93A7";
  ctx.font = "500 34px Barlow, system-ui, sans-serif";
  wrapText(ctx, copy.coach, 72, 640, 900, 46);

  ctx.strokeStyle = "rgba(139, 147, 167, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, 1180);
  ctx.lineTo(1008, 1180);
  ctx.stroke();

  ctx.fillStyle = "#F2F4F8";
  ctx.font = "600 32px Barlow, system-ui, sans-serif";
  ctx.fillText(`— ${copy.name}`, 72, 1240);

  ctx.fillStyle = "#3ECF8E";
  ctx.font = "600 24px Barlow, system-ui, sans-serif";
  ctx.fillText("locked-in", 72, 1290);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export async function shareProgress(state, scope = "day", date = todayKey(), extras = null) {
  const text =
    scope === "week"
      ? buildWeekShareText(state, 0)
      : scope === "last-week"
        ? buildWeekShareText(state, -1)
        : scope === "month"
          ? buildMonthShareText(state)
          : scope === "fitness"
            ? buildFitnessShareText(state, date, extras)
            : buildDayShareText(state, date);

  const blob = await renderShareCardBlob(state, scope, date);
  if (!blob) {
    await navigator.clipboard?.writeText(text);
    return { ok: true, method: "clipboard" };
  }

  const file = new File([blob], `locked-in-${scope}.png`, { type: "image/png" });

  try {
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Locked-In proof",
        text,
        files: [file],
      });
      return { ok: true, method: "share" };
    }
  } catch (err) {
    if (err?.name === "AbortError") return { ok: false, method: "abort" };
  }

  // Prefer PNG download over text-only share
  downloadPng(blob, `locked-in-${scope}.png`);
  return { ok: true, method: "download" };
}
