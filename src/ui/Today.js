import playbookSeed from "../../content/freelance.playbook.json";
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
import { renderScheduleTimeline } from "./plan/ScheduleTimeline.js";
import { renderPlan } from "./Plan.js";
import { renderFlash, renderInstallTip } from "./Install.js";
import { coachHints } from "../coach.js";
import { mergePlaybook } from "../hustle-playbook.js";
import { isBackupStale, daysSinceBackup, BACKUP_STALE_DAYS } from "../backup.js";
import { copy } from "../copy/voice.js";

function findNowBlock(blocks, doneLookup, coresComplete = false) {
  const pool = coresComplete ? blocks.filter((b) => !b.soft) : blocks;
  if (coresComplete && pool.every((b) => doneLookup[b.id])) {
    return { focus: null, mode: "sealed" };
  }
  const mins = nowMinutes();
  let current = null;
  let next = null;
  for (const b of pool) {
    const start = parseTimeToMinutes(b.time);
    if (start == null) continue;
    if (start <= mins) current = b;
    if (start > mins && !next) next = b;
  }
  const focus =
    (current && !doneLookup[current.id] && current) ||
    next ||
    pool.find((b) => !doneLookup[b.id]) ||
    pool[0];
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

function viewToggle(todayView) {
  const view = todayView === "timeline" ? "timeline" : "list";
  return `
    <div class="segment !mt-0" role="tablist" aria-label="Block layout">
      <button type="button" class="segment-btn ${view === "list" ? "is-active accent" : ""}" data-action="today-view" data-view="list" role="tab" aria-selected="${view === "list"}">List</button>
      <button type="button" class="segment-btn ${view === "timeline" ? "is-active accent" : ""}" data-action="today-view" data-view="timeline" role="tab" aria-selected="${view === "timeline"}">Timeline</button>
    </div>
  `;
}

function renderCoachStrip(state, focusBlock) {
  const playbook = mergePlaybook(state.settings?.hustlePlaybook) || playbookSeed;
  const hints = coachHints(state, { playbook, focusBlock });
  const h = hints[0];
  if (!h) return "";
  const actionAttr =
    h.action === "set-tab"
      ? `data-action="set-tab" data-tab="${h.tab || "proof"}"`
      : h.action
        ? `data-action="${escapeHtml(h.action)}"`
        : "";
  return `
    <div class="coach-strip" data-region="coach-banners" role="status">
      <span class="coach-strip-text">${escapeHtml(h.message)}</span>
      ${
        h.action
          ? `<button type="button" class="coach-strip-link" ${actionAttr}>${escapeHtml(h.actionLabel || "Open")} →</button>`
          : ""
      }
    </div>`;
}

function challengeDayNum(state) {
  return state.challenge ? challengeDayNumber(state.challenge) : 0;
}

function challengeLength(state) {
  return state.challenge?.lengthDays || state.settings?.challengeLength || 30;
}

export function renderStatsRail(state, selectedDate) {
  const dayNum = challengeDayNum(state);
  const length = challengeLength(state);
  const streak = computeStreak(state);
  const completion = completionForDate(state, selectedDate || todayKey());
  return `
    <div class="stats-rail" data-region="stats-rail" role="group" aria-label="Day stats">
      <div class="stats-rail-item">
        <p class="stats-rail-label">Day</p>
        <p class="stats-rail-value">${dayNum}<span class="stats-rail-den">/${length}</span></p>
      </div>
      <div class="stats-rail-item">
        <p class="stats-rail-label">Streak</p>
        <p class="stats-rail-value stats-rail-streak">${streak}</p>
      </div>
      <div class="stats-rail-item">
        <p class="stats-rail-label">Core</p>
        <p class="stats-rail-value">${completion.doneCore}<span class="stats-rail-den">/${completion.coreCount}</span></p>
      </div>
    </div>`;
}

function renderBackupBanner(state) {
  const s = state.settings || {};
  if (s.backupNudgeDismissed) return "";
  if (!isBackupStale(s.lastBackupAt)) return "";
  const dayNum = challengeDayNum(state);
  if (dayNum > 0 && dayNum < 3) return "";
  const since = daysSinceBackup(s.lastBackupAt);
  const age =
    since == null ? `${BACKUP_STALE_DAYS}+ days` : `${since} day${since === 1 ? "" : "s"}`;
  return `
    <div class="banner banner-warn flex flex-wrap items-center gap-2 !py-2.5" data-region="backup-banner" role="status">
      <span class="text-xs flex-1 min-w-0" style="color:var(--text-soft)">No fresh export (${escapeHtml(age)}). Export is your account on this phone.</span>
      <button type="button" class="coach-strip-link !text-xs" data-action="export-backup">Export</button>
      <button type="button" class="coach-strip-link !text-xs" data-action="dismiss-backup-nudge">Not now</button>
    </div>`;
}

function renderNowCard(state, ui, { canEdit, isToday, isYesterday, completion, blocks, focus, mode, softRemaining, override, doneLookup, selectedDate }) {
  const streak = computeStreak(state);
  if (completion.complete && isToday) {
    return `
      <section class="panel now-card sealed-card" data-region="now-card">
        <div class="sealed-stamp mx-auto mb-3">SEALED</div>
        <p class="eyebrow" style="color:var(--build)">Day sealed</p>
        <h2 class="display text-[2rem] leading-[1.05] mt-1">All core blocks done.</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">
          Streak ${streak} · ${completion.doneCore}/${completion.coreCount} core locked
          ${softRemaining ? ` · ${softRemaining} soft left` : ""}
        </p>
        <div class="sealed-actions">
          <button type="button" class="btn btn-primary w-full gap-2" data-action="share-progress" data-scope="day">${icon("proof", "h-5 w-5")} Share today</button>
          <button type="button" class="btn w-full" data-action="set-tab" data-tab="proof">View Proof</button>
        </div>
      </section>`;
  }
  return `
    <section class="panel now-card now-card-compact" data-region="now-card">
      <div class="mb-1 flex items-center justify-between gap-2">
        <p class="eyebrow mb-0">${!blocks.length ? "Start here" : mode === "now" ? "Now" : mode === "next" ? "Up next" : "Focus"}</p>
        <div class="flex gap-1">
          ${isYesterday ? '<span class="chip chip-soft">catch-up</span>' : ""}
          ${override ? `<span class="chip chip-maintain">${override.type === "work" ? "shift" : "off"}</span>` : ""}
        </div>
      </div>
      <h2 class="display now-card-title">${escapeHtml(focus?.label || "No blocks yet")}</h2>
      <p class="now-card-footnote">${copy.today.nowSubtitle}</p>
      ${renderMetaRow(focus?.time || "", focus?.tags, focus?.soft)}
      ${focus?.details ? `<p class="mt-1.5 text-sm" style="color:var(--text-soft)">${escapeHtml(focus.details)}</p>` : ""}
      ${
        blocks.length
          ? `<button type="button" class="btn btn-primary mt-3 w-full gap-2 !min-h-11" data-action="toggle-block" data-id="${escapeHtml(focus?.id || "")}" data-date="${selectedDate}" ${canEdit && focus ? "" : "disabled"}>
        ${icon("check", "h-5 w-5")}
        ${focus && doneLookup[focus.id] ? "Done - tap to undo" : "Check this block"}
      </button>
      ${!canEdit ? `<p class="mt-2 text-xs" style="color:var(--mute)">Preview only. Checking works for today and yesterday catch-up.</p>` : ""}`
          : `<p class="mt-2 text-sm" style="color:var(--mute)">${copy.today.emptyTrack}</p>
             ${coachHasEditHint(state) ? "" : `<button type="button" class="btn btn-primary mt-3 w-full !min-h-11" data-action="today-mode" data-mode="edit">Open Edit</button>`}`
      }
    </section>`;
}

function coachHasEditHint(state) {
  const playbook = mergePlaybook(state.settings?.hustlePlaybook) || playbookSeed;
  return coachHints(state, { playbook }).some((h) => h.action === "open-edit");
}

function renderBlockList(state, blocks, selectedDate, canEdit, focusId, { hideEmptyEdit = false } = {}) {
  return blocks
    .map((b) => {
      const done = isDone(state, selectedDate, b.id);
      const isFocus = focusId && b.id === focusId;
      return `
        <button type="button" class="task-row ${done ? "is-done" : ""} ${isFocus ? "is-focus" : ""}" data-action="toggle-block" data-id="${escapeHtml(b.id)}" data-date="${selectedDate}" data-block-id="${escapeHtml(b.id)}" ${canEdit ? "" : "disabled"} aria-pressed="${done}">
          <span class="check ${done ? "is-done" : ""}" aria-hidden="true">${done ? icon("check", "h-4 w-4") : ""}</span>
          <div class="min-w-0 text-left w-full">
            <p class="task-title">${escapeHtml(b.label)}</p>
            ${renderMetaRow(b.time, b.tags, b.soft)}
          </div>
        </button>`;
    })
    .join("");
}

function renderTimeline(state, blocks, selectedDate, canEdit, focusId) {
  return renderScheduleTimeline(blocks, {
    mode: "track",
    state,
    selectedDate,
    canEdit,
    focusId,
    scrollable: true,
    onEmpty: "No blocks for this day.",
  });
}

function renderDayPanel(state, ui, ctx) {
  const {
    selectedDate,
    selectedDay,
    canEdit,
    blocks,
    completion,
    type,
    override,
    pct,
    focus,
    todayView,
  } = ctx;
  const week = weekDates(todayKey(), 0);
  const pills = week
    .map((key) => {
      const dow = new Date(`${key}T12:00:00`).getDay();
      const c = completionForDate(state, key);
      const active = key === selectedDate;
      const sealed = c.complete;
      return `
        <button type="button" class="pill-day snap-start shrink-0 ${dayType(dow, state)} ${active ? "is-active" : ""} ${sealed ? "is-done" : ""}" data-action="select-date" data-date="${key}" data-day="${dow}" aria-label="${DAY_NAMES[dow]} ${formatDisplayDate(key)}${sealed ? ", sealed" : ""}" aria-pressed="${active}">
          <span class="block text-[10px] font-semibold">${DAY_NAMES[dow]}</span>
          <span class="block text-[11px]">${formatDisplayDate(key).slice(0, 5)}</span>
        </button>`;
    })
    .join("");

  const hideEmptyEdit = coachHasEditHint(state);
  const listHtml =
    todayView === "timeline"
      ? renderTimeline(state, blocks, selectedDate, canEdit, focus?.id)
      : `<div class="block-list-stack" data-region="block-list">${
          blocks.length
            ? renderBlockList(state, blocks, selectedDate, canEdit, focus?.id)
            : `<div class="py-4 text-center">
            <p class="text-sm" style="color:var(--mute)">No blocks for this day.</p>
            ${hideEmptyEdit ? "" : `<button type="button" class="btn btn-primary mt-3 w-full" data-action="today-mode" data-mode="edit">Open Edit</button>`}
          </div>`
        }</div>`;

  return `
    <section class="panel" data-region="day-panel">
      <div class="mb-2 flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-sm font-semibold leading-snug">${DAY_NAMES_FULL[selectedDay]}</p>
          <p class="text-sm font-semibold leading-snug" style="color:var(--text-soft)">${override ? describeOverride(override) : type === "foundation" ? "Build day" : "Maintenance"}</p>
          <p class="text-sm font-semibold leading-snug" style="color:var(--mute)">${formatDisplayDate(selectedDate)}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <span class="chip chip-build" data-region="core-chip">${completion.doneCore}/${completion.coreCount} core</span>
          <button type="button" class="icon-btn" data-action="refresh-today" aria-label="Refresh schedule">${icon("refresh", "h-4 w-4")}</button>
        </div>
      </div>
      <div class="mb-3">${viewToggle(todayView)}</div>
      <div class="day-rail mb-3"><div class="day-rail-fill" data-region="day-rail" style="width:${pct}%"></div></div>
      <div class="mb-1 scroll-touch flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory" role="group" aria-label="This week">${pills}</div>
      ${listHtml}
    </section>`;
}

function buildTrackContext(state, ui) {
  const selectedDate = ui.selectedDate || todayKey();
  const selectedDay = new Date(`${selectedDate}T12:00:00`).getDay();
  const isToday = selectedDate === todayKey();
  const isYesterday = selectedDate === yesterdayKey();
  const canEdit = isToday || (isYesterday && state.settings.yesterdayCatchUp);
  const blocks = resolveBlocksForDate(state, selectedDate);
  const completion = completionForDate(state, selectedDate);
  const type = dayType(selectedDay, state);
  const doneLookup = state.completions?.[selectedDate] || {};
  const { focus, mode } = findNowBlock(blocks, doneLookup, completion.complete);
  const softRemaining = blocks.filter((b) => b.soft && !doneLookup[b.id]).length;
  const override = state.workOverrides?.[selectedDate];
  const pct = completion.coreCount ? Math.round((completion.doneCore / completion.coreCount) * 100) : 0;
  const todayView = ui.todayView === "timeline" || state.settings?.todayView === "timeline" ? "timeline" : "list";
  return {
    selectedDate,
    selectedDay,
    isToday,
    isYesterday,
    canEdit,
    blocks,
    completion,
    type,
    doneLookup,
    focus,
    mode,
    softRemaining,
    override,
    pct,
    todayView,
  };
}

/**
 * Patch Today Track regions in place. Returns true if patch applied.
 */
export function patchTodayTrack(root, state, ui, opts = {}) {
  if (!root || ui.tab !== "today" || (ui.todayMode && ui.todayMode !== "track")) return false;
  if (ui.modal || ui.celebrate) return false;
  const screen = root.querySelector("[data-today-track]");
  if (!screen) return false;

  const ctx = buildTrackContext(state, ui);
  const stats = screen.querySelector('[data-region="stats-rail"]');
  if (stats) stats.outerHTML = renderStatsRail(state, ctx.selectedDate);

  const backup = screen.querySelector('[data-region="backup-banner"]');
  const backupHtml = renderBackupBanner(state);
  if (backup && backupHtml) backup.outerHTML = backupHtml;
  else if (backup && !backupHtml) backup.remove();
  else if (!backup && backupHtml) {
    const stats = screen.querySelector('[data-region="stats-rail"]');
    if (stats) stats.insertAdjacentHTML("afterend", backupHtml);
  }

  const coach = screen.querySelector('[data-region="coach-banners"]');
  const coachHtml =
    ctx.isToday && !ctx.completion.complete ? renderCoachStrip(state, ctx.focus) : "";
  if (coach && coachHtml) coach.outerHTML = coachHtml;
  else if (coach && !coachHtml) coach.remove();
  else if (!coach && coachHtml) {
    const now = screen.querySelector('[data-region="now-card"]');
    if (now) now.insertAdjacentHTML("beforebegin", coachHtml);
  }

  const now = screen.querySelector('[data-region="now-card"]');
  if (now) {
    now.outerHTML = renderNowCard(state, ui, {
      ...ctx,
      canEdit: ctx.canEdit,
    });
  }

  const dayPanel = screen.querySelector('[data-region="day-panel"]');
  if (dayPanel) dayPanel.outerHTML = renderDayPanel(state, ui, ctx);

  const rail = screen.querySelector('[data-region="day-rail"]');
  if (rail) rail.style.width = `${ctx.pct}%`;

  return true;
}

export function renderToday(state, ui, opts = {}) {
  const todayMode = ui.todayMode || "track";
  const dayNum = challengeDayNum(state);
  const length = challengeLength(state);

  if (todayMode === "edit") {
    return `
      <section class="screen">
        <header class="page-header">
          <p class="eyebrow">${copy.today.editEyebrow}</p>
          <h1 class="display">${copy.today.editTitle}</h1>
          <p class="mt-2 text-sm" style="color:var(--mute)">${copy.today.editSubtitle(dayNum, length)}</p>
        </header>
        ${modeToggle(todayMode)}
        ${renderFlash(ui.flash)}
        ${renderPlan(state, ui, { embedded: true })}
      </section>
    `;
  }

  const ctx = buildTrackContext(state, ui);
  const displayName = String(state.settings?.displayName || "").trim() || "Marco";
  const events = upcomingEvents(state, todayKey(), 21)
    .filter((e) => e.type === "birthday")
    .slice(0, 3);
  const showCoachStrip =
    ctx.isToday && !ctx.completion.complete && renderCoachStrip(state, ctx.focus);

  return `
    <section class="screen" data-today-track>
      <header class="page-header">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="eyebrow">${copy.today.eyebrow}</p>
            <h1 class="display">${escapeHtml(copy.today.headline(displayName))}</h1>
          </div>
          ${
            !state.settings?.tourCompleted
              ? `<button type="button" class="btn shrink-0 !min-h-10 !px-3 !text-xs" data-action="open-tips">${copy.today.quickTour}</button>`
              : ""
          }
        </div>
      </header>

      ${modeToggle(todayMode)}
      ${renderStatsRail(state, ctx.selectedDate)}
      ${renderFlash(ui.flash)}
      ${showCoachStrip || ""}
      ${renderBackupBanner(state)}

      ${renderNowCard(state, ui, ctx)}
      ${renderDayPanel(state, ui, ctx)}

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
