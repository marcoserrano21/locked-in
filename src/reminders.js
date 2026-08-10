import { parseTimeToMinutes, todayKey } from "./dates.js";
import { resolveBlocksForDate } from "./work.js";
import { streakAtRisk } from "./streaks.js";
import { mergePlaybook } from "./hustle-playbook.js";

let timerId = null;
let scheduledKey = null;
let streakTimerId = null;
let mondayTimerId = null;
let streakFiredKey = null;
let mondayFiredKey = null;

export function clearBlockReminder() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  scheduledKey = null;
}

function clearExtraReminders() {
  if (streakTimerId) {
    clearTimeout(streakTimerId);
    streakTimerId = null;
  }
  if (mondayTimerId) {
    clearTimeout(mondayTimerId);
    mondayTimerId = null;
  }
}

export async function enableBlockReminders() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  try {
    const permission = await Notification.requestPermission();
    return { ok: permission === "granted", permission };
  } catch {
    return { ok: false, reason: "unsupported" };
  }
}

async function showNotification(title, body, tag) {
  const options = {
    body: String(body || "").slice(0, 120),
    tag: tag || "marco-reminder",
    renotify: true,
    data: { url: "./index.html#today" },
  };
  try {
    if (navigator.serviceWorker?.ready) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    }
  } catch (error) {
    console.warn("SW notification failed", error);
  }
  try {
    new Notification(title, options);
  } catch (error) {
    console.warn("Notification failed", error);
  }
}

async function showBlockNotification(block) {
  await showNotification(
    "Next block soon",
    String(block?.label || "Core block starting"),
    "marco-block-reminder"
  );
}

function msUntilLocalHour(hour, minute = 0) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) return -1;
  return target.getTime() - now.getTime();
}

function scheduleStreakAtRisk(state) {
  if (streakTimerId) {
    clearTimeout(streakTimerId);
    streakTimerId = null;
  }
  const key = todayKey();
  if (streakFiredKey === key) return;
  if (!streakAtRisk(state) && new Date().getHours() < 21) {
    const delay = msUntilLocalHour(21, 0);
    if (delay < 0 || delay > 16 * 60 * 60 * 1000) return;
    streakTimerId = setTimeout(() => {
      streakTimerId = null;
      if (streakAtRisk(state)) {
        streakFiredKey = key;
        showNotification(
          "Streak at risk",
          "Core still open. Midnight does not care about your mood.",
          "marco-streak-risk"
        );
      }
    }, delay);
    return;
  }
  if (streakAtRisk(state)) {
    streakFiredKey = key;
    showNotification(
      "Streak at risk",
      "Core still open. Midnight does not care about your mood.",
      "marco-streak-risk"
    );
  }
}

function scheduleMondayFlow(state) {
  if (mondayTimerId) {
    clearTimeout(mondayTimerId);
    mondayTimerId = null;
  }
  const now = new Date();
  if (now.getDay() !== 1) return;
  const key = todayKey();
  if (mondayFiredKey === key) return;

  const playbook = mergePlaybook(state.settings?.hustlePlaybook);
  const flowIncomplete = (playbook.weeklyFlow || []).some((f) => !state.hustleChecks?.[f.id]);
  if (!flowIncomplete) return;

  const fire = () => {
    mondayFiredKey = key;
    showNotification(
      "Monday money block",
      "Weekly Flow is still open. Research, post, send.",
      "marco-monday-flow"
    );
  };

  if (now.getHours() >= 12) {
    fire();
    return;
  }
  const delay = msUntilLocalHour(12, 0);
  if (delay < 0 || delay > 16 * 60 * 60 * 1000) return;
  mondayTimerId = setTimeout(() => {
    mondayTimerId = null;
    const stillOpen = (mergePlaybook(state.settings?.hustlePlaybook).weeklyFlow || []).some(
      (f) => !state.hustleChecks?.[f.id]
    );
    if (stillOpen) fire();
  }, delay);
}

/** Schedule a local reminder ~5 minutes before the next undone core block. */
export function scheduleNextBlockReminder(state, dateKey) {
  if (!state?.settings?.blockReminders) {
    clearBlockReminder();
    clearExtraReminders();
    return;
  }
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  scheduleStreakAtRisk(state);
  scheduleMondayFlow(state);

  const blocks = resolveBlocksForDate(state, dateKey) || [];
  const done = state.completions?.[dateKey] || {};
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const next = blocks
    .filter((b) => b && !b.soft && !done[b.id])
    .map((b) => ({ ...b, mins: parseTimeToMinutes(b.time) }))
    .filter((b) => Number.isFinite(b.mins) && b.mins - 5 >= nowMins)
    .sort((a, b) => a.mins - b.mins)[0];

  if (!next) {
    clearBlockReminder();
    return;
  }

  const key = `${dateKey}:${next.id}:${next.mins}`;
  if (key === scheduledKey && timerId) return;

  clearBlockReminder();

  const delayMs = (next.mins - 5 - nowMins) * 60 * 1000;
  if (delayMs < 0 || delayMs > 16 * 60 * 60 * 1000) return;

  scheduledKey = key;
  timerId = setTimeout(() => {
    timerId = null;
    showBlockNotification(next);
  }, delayMs);
}
