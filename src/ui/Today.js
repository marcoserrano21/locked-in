import playbook from "../../content/freelance.playbook.json";
import { DAY_NAMES, DAY_NAMES_FULL, dayType } from "../schedule.js";
import {
  todayKey,
  yesterdayKey,
  nowMinutes,
  parseTimeToMinutes,
  weekDates,
  formatDisplayDate,
  daysBetween,
} from "../dates.js";
import { challengeDayNumber } from "../challenge.js";
import { computeStreak, completionForDate, isDone } from "../streaks.js";
import { describeOverride, resolveBlocksForDate, upcomingEvents } from "../work.js";
import { escapeHtml, icon, renderMetaRow } from "./dom.js";
import { renderPlan } from "./Plan.js";
import { renderFlash, renderInstallTip } from "./Install.js";
import { coachHints } from "../coach.js";

function findNowBlock(blocks, doneLookup) {
  const mins = nowMinutes();
  let current = null;
  let next = null;
  for (const b of blocks) {
    const start = parseTimeToMinutes(b.time);
    if (start == null) continue;
    if (start <= mins) current = b;
    if (start > mins && !next) next = b;
  }
  const focus =
    (current && !doneLookup[current.id] && current) ||
    next ||
    blocks.find((b) => !doneLookup[b.id]) ||
    blocks[0];
  const mode =
    current && focus?.id === current.id && !doneLookup[current.id]
      ? "now"
      : next && focus?.id === next.id
        ? "next"
        : "focus";
  return { focus, mode };
}

function modeToggle(todayMode) {
  return `
    <div class="segment" role="tablist" aria-label="Today mode">
      <button type="button" class="segment-btn accent ${todayMode === "track" ? "is-active" : ""}" data-action="today-mode" data-mode="track" role="tab" aria-selected="${todayMode === "track"}">Track</button>
      <button type="button" class="segment-btn accent ${todayMode === "edit" ? "is-active" : ""}" data-action="today-mode" data-mode="edit" role="tab" aria-selected="${todayMode === "edit"}">Edit</button>
    </div>
  `;
}

function renderCoachBanners(state) {
  const hints = coachHints(state, { playbook });
  if (!hints.length) return "";
  return hints
    .slice(0, 2)
    .map((h) => {
      const actionAttr =
        h.action === "set-tab"
          ? `data-action="set-tab" data-tab="${h.tab || "proof"}"`
          : h.action
            ? `data-action="${escapeHtml(h.action)}"`
            : "";
      return `
        <div class="banner banner-warn flex flex-col gap-2" role="status">
          <span class="flex gap-2">${icon("warning", "h-5 w-5")} <span>${escapeHtml(h.message)}</span></span>
          ${
            h.action
              ? `<button type="button" class="btn btn-primary w-full !min-h-11" ${actionAttr}>${escapeHtml(h.actionLabel || "Open")}</button>`
              : ""
          }
        </div>`;
    })
    .join("");
}

export function renderToday(state, ui, opts = {}) {
  const todayMode = ui.todayMode || "track";
  const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
  const length = state.challenge?.lengthDays || 30;

  if (todayMode === "edit") {
    return `
      <section class="screen">
        <header class="page-header">
          <p class="eyebrow">Today · Edit</p>
          <h1 class="display">Edit the track</h1>
          <p class="mt-2 text-sm" style="color:var(--mute)">Day ${dayNum}/${length}. Change structure here. Check blocks in Track.</p>
        </header>
        ${modeToggle(todayMode)}
        ${renderFlash(ui.flash)}
        ${renderPlan(state, ui, { embedded: true })}
      </section>
    `;
  }

  const selectedDate = ui.selectedDate || todayKey();
  const selectedDay = new Date(`${selectedDate}T12:00:00`).getDay();
  const isToday = selectedDate === todayKey();
  const isYesterday = selectedDate === yesterdayKey();
  const canEdit = isToday || (isYesterday && state.settings.yesterdayCatchUp);
  const blocks = resolveBlocksForDate(state, selectedDate);
  const completion = completionForDate(state, selectedDate);
  const streak = computeStreak(state);
  const type = dayType(selectedDay);
  const doneLookup = state.completions?.[selectedDate] || {};
  const { focus, mode } = findNowBlock(blocks, doneLookup);
  const override = state.workOverrides?.[selectedDate];
  const pct = completion.coreCount ? Math.round((completion.doneCore / completion.coreCount) * 100) : 0;
  const events = upcomingEvents(state, todayKey(), 21)
    .filter((e) => e.type === "birthday")
    .slice(0, 3);
  const week = weekDates(todayKey(), 0);
  const displayName = String(state.settings?.displayName || "").trim() || "Marco";

  const pills = week
    .map((key) => {
      const dow = new Date(`${key}T12:00:00`).getDay();
      const c = completionForDate(state, key);
      const active = key === selectedDate;
      const sealed = c.complete;
      return `
        <button type="button" class="pill-day ${dayType(dow)} ${active ? "is-active" : ""} ${sealed ? "is-done" : ""}" data-action="select-date" data-date="${key}" data-day="${dow}" aria-label="${DAY_NAMES[dow]} ${formatDisplayDate(key)}${sealed ? ", sealed" : ""}" aria-pressed="${active}">
          <span class="block text-[10px] font-semibold">${DAY_NAMES[dow]}</span>
          <span class="block text-[11px]">${formatDisplayDate(key).slice(0, 5)}</span>
        </button>`;
    })
    .join("");

  const list = blocks
    .map((b) => {
      const done = isDone(state, selectedDate, b.id);
      return `
        <button type="button" class="task-row ${done ? "is-done" : ""}" data-action="toggle-block" data-id="${escapeHtml(b.id)}" data-date="${selectedDate}" ${canEdit ? "" : "disabled"} aria-pressed="${done}">
          <span class="check ${done ? "is-done" : ""}" aria-hidden="true">${done ? icon("check", "h-4 w-4") : ""}</span>
          <div class="min-w-0 text-left w-full">
            <p class="task-title">${escapeHtml(b.label)}</p>
            ${renderMetaRow(b.time, b.tags, b.soft)}
          </div>
        </button>`;
    })
    .join("");

  return `
    <section class="screen">
      <header class="page-header">
        <p class="eyebrow">Today · Day ${dayNum}/${length}</p>
        <h1 class="display">Stay locked in, ${escapeHtml(displayName)}</h1>
        <p class="mt-2 text-sm" style="color:var(--mute)">Streak ${streak}. Core blocks only. Soft targets do not count.</p>
      </header>

      ${modeToggle(todayMode)}
      ${renderFlash(ui.flash)}
      ${isToday ? renderCoachBanners(state) : ""}

      <section class="panel now-card">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="eyebrow mb-0">${mode === "now" ? "Now" : mode === "next" ? "Up next" : "Focus"}</p>
          <div class="flex gap-1">
            ${isYesterday ? '<span class="chip chip-soft">catch-up</span>' : ""}
            ${override ? `<span class="chip chip-maintain">${override.type === "work" ? "shift" : "off"}</span>` : ""}
          </div>
        </div>
        <h2 class="display text-[2rem] leading-[1.05]">${escapeHtml(focus?.label || "No blocks yet")}</h2>
        ${renderMetaRow(focus?.time || "", focus?.tags, focus?.soft)}
        ${focus?.details ? `<p class="mt-2 text-sm" style="color:var(--text-soft)">${escapeHtml(focus.details)}</p>` : ""}
        <button type="button" class="btn btn-primary mt-4 w-full gap-2" data-action="toggle-block" data-id="${escapeHtml(focus?.id || "")}" data-date="${selectedDate}" ${canEdit && focus ? "" : "disabled"}>
          ${icon("check", "h-5 w-5")}
          ${focus && doneLookup[focus.id] ? "Done - tap to undo" : "Check this block"}
        </button>
        ${!canEdit ? `<p class="mt-2 text-xs" style="color:var(--mute)">Preview only. Checking works for today and yesterday catch-up.</p>` : ""}
        ${completion.complete ? `<p class="mt-3 text-sm" style="color:var(--build)">Day sealed. Soft targets can wait.</p>` : ""}
        ${!focus ? `<button type="button" class="btn mt-3 w-full" data-action="today-mode" data-mode="edit">Open Edit to add blocks</button>` : ""}
      </section>

      <section class="panel">
        <div class="mb-2 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-snug">${DAY_NAMES_FULL[selectedDay]}</p>
            <p class="text-sm font-semibold leading-snug" style="color:var(--text-soft)">${override ? describeOverride(override) : type === "foundation" ? "Build day" : "Maintenance"}</p>
            <p class="text-sm font-semibold leading-snug" style="color:var(--mute)">${formatDisplayDate(selectedDate)}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <span class="chip chip-build">${completion.doneCore}/${completion.coreCount} core</span>
            <button type="button" class="icon-btn" data-action="refresh-today" aria-label="Refresh schedule">${icon("refresh", "h-4 w-4")}</button>
          </div>
        </div>
        <div class="day-rail mb-3"><div class="day-rail-fill" style="width:${pct}%"></div></div>
        <div class="mb-1 flex gap-1.5" role="group" aria-label="This week">${pills}</div>
        <div>${
          list ||
          `<div class="py-4 text-center">
            <p class="text-sm" style="color:var(--mute)">No blocks for this day.</p>
            <button type="button" class="btn btn-primary mt-3 w-full" data-action="today-mode" data-mode="edit">Open Edit</button>
          </div>`
        }</div>
      </section>

      ${
        events.length
          ? `<section class="panel" aria-label="Upcoming birthdays">
              <p class="eyebrow mb-3">Coming up</p>
              <ul class="upcoming-list">
                ${events
                  .map((e) => {
                    const delta = daysBetween(todayKey(), e.occursOn);
                    const when =
                      delta === 0 ? "Today" : delta === 1 ? "Tomorrow" : `In ${delta} days`;
                    return `<li class="upcoming-item">
                      <div class="upcoming-date" aria-hidden="true">${formatDisplayDate(e.occursOn)}</div>
                      <div class="upcoming-body">
                        <p class="upcoming-title">${escapeHtml(e.title)}</p>
                        <p class="upcoming-when">${when}</p>
                      </div>
                    </li>`;
                  })
                  .join("")}
              </ul>
            </section>`
          : ""
      }

      ${renderInstallTip(state, { canInstall: Boolean(opts.canInstall) })}
    </section>
  `;
}
