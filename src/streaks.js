import { dateKey } from "./dates.js";
import { resolveBlocksForDate } from "./work.js";
import { dayType } from "./schedule.js";

function doneMap(state, key) {
  const raw = state.completions[key];
  if (!raw) return {};
  if (Array.isArray(raw)) {
    return Object.fromEntries(raw.map((id) => [id, true]));
  }
  return raw;
}

export function isDone(state, date, blockId) {
  return Boolean(doneMap(state, date)[blockId]);
}

export function dayCompletion(state, dayOffset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - dayOffset);
  const key = dateKey(d);
  const blocks = resolveBlocksForDate(state, key);
  const core = blocks.filter((b) => !b.soft);
  const done = doneMap(state, key);
  const doneCore = core.filter((b) => done[b.id]).length;
  return {
    date: key,
    dow: d.getDay(),
    type: dayType(d.getDay()),
    pct: core.length ? doneCore / core.length : 0,
    doneCore,
    coreCount: core.length,
    complete: core.length > 0 && doneCore === core.length,
  };
}

export function completionForDate(state, key) {
  const blocks = resolveBlocksForDate(state, key);
  const core = blocks.filter((b) => !b.soft);
  const done = doneMap(state, key);
  const doneCore = core.filter((b) => done[b.id]).length;
  return {
    date: key,
    pct: core.length ? doneCore / core.length : 0,
    doneCore,
    coreCount: core.length,
    complete: core.length > 0 && doneCore === core.length,
    blocks,
    core,
  };
}

export function computeStreak(state) {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const c = dayCompletion(state, i);
    if (i === 0 && !c.complete) continue;
    if (c.complete) streak++;
    else break;
  }
  return streak;
}

export function longestStreak(state) {
  let max = 0;
  let cur = 0;
  for (let i = 364; i >= 0; i--) {
    const c = dayCompletion(state, i);
    if (c.complete) {
      cur++;
      max = Math.max(max, cur);
    } else {
      cur = 0;
    }
  }
  return max;
}

export function heatShade(pct) {
  if (pct === 0) return "var(--rail)";
  if (pct < 0.5) return "color-mix(in srgb, var(--build) 28%, transparent)";
  if (pct < 1) return "color-mix(in srgb, var(--build) 55%, transparent)";
  return "var(--build)";
}

export function weekSplit(state) {
  let buildDone = 0;
  let buildTotal = 0;
  let maintainDone = 0;
  let maintainTotal = 0;
  for (let i = 0; i < 7; i++) {
    const c = dayCompletion(state, i);
    if (c.dow <= 2) {
      buildDone += c.doneCore;
      buildTotal += c.coreCount;
    } else {
      maintainDone += c.doneCore;
      maintainTotal += c.coreCount;
    }
  }
  return {
    buildPct: buildTotal ? buildDone / buildTotal : 0,
    maintainPct: maintainTotal ? maintainDone / maintainTotal : 0,
  };
}

export function streakAtRisk(state) {
  const c = dayCompletion(state, 0);
  if (c.complete || c.coreCount === 0) return false;
  const hour = new Date().getHours();
  return hour >= 20 && c.pct < 1;
}
