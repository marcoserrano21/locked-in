import playbookSeed from "../../content/freelance.playbook.json";
import { DAY_NAMES, DAY_NAMES_FULL, dayType } from "../schedule.js";
import {
  todayKey,
  yesterdayKey,
  nowMinutes,
  parseTimeToMinutes,
  formatDisplayDate,
  dateKey,
  addDays,
  parseDateKey,
} from "../dates.js";
import { challengeDayNumber } from "../challenge.js";
import { computeStreak, completionForDate, isDone } from "../streaks.js";
import { describeOverride, resolveBlocksForDate } from "../work.js";
import { escapeHtml, icon, tagChips } from "./dom.js";
import { tagsToFormValue } from "../tags.js";
import { formatTimeShort } from "./plan/ScheduleTimeline.js";
import { renderPlan } from "./Plan.js";
import { renderFlash, renderInstallTip } from "./Install.js";
import { coachHints } from "../coach.js";
import { mergePlaybookFor } from "../hustle-playbook.js";
import { isBackupStale, daysSinceBackup, BACKUP_STALE_DAYS } from "../backup.js";
import { copy } from "../copy/voice.js";
import { renderDateField } from "./DatePicker.js";

const AT_RISK_HOUR = 18; // 6pm local

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

function isAtRisk(blocks, doneLookup, completion, isToday) {
  if (!isToday || completion.complete || !completion.coreCount) return false;
  const mins = nowMinutes();
  if (mins >= AT_RISK_HOUR * 60) return true;
  const incompleteCores = blocks.filter((b) => !b.soft && !doneLookup[b.id]);
  if (!incompleteCores.length) return false;
  const lastStart = Math.max(
    ...incompleteCores.map((b) => parseTimeToMinutes(b.time)).filter((n) => n != null)
  );
  return Number.isFinite(lastStart) && mins >= lastStart;
}

function editToggleBtn(todayMode) {
  if (todayMode === "edit") {
    return `<button type="button" class="btn shrink-0 !min-h-10 !px-3 !text-xs" data-action="today-mode" data-mode="track">Track</button>`;
  }
  return `<button type="button" class="icon-btn shrink-0" data-action="today-mode" data-mode="edit" aria-label="Edit schedule">${icon("edit", "h-5 w-5")}</button>`;
}

const STATUS_DUPLICATE_HINTS = new Set(["empty-wizard", "streak-risk"]);

function renderCoachStrip(state, focusBlock) {
  const playbook = mergePlaybookFor(state) || playbookSeed;
  const hints = coachHints(state, { playbook, focusBlock });
  const h = hints.find((hint) => !STATUS_DUPLICATE_HINTS.has(hint.id));
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
    <div class="stats-inline" data-region="stats-rail" role="group" aria-label="Day stats">
      <span>Day <strong>${dayNum}/${length}</strong></span>
      <span class="stats-inline-sep" aria-hidden="true">·</span>
      <span>Streak <strong class="stats-inline-streak">${streak}</strong></span>
      <span class="stats-inline-sep" aria-hidden="true">·</span>
      <span>Core <strong>${completion.doneCore}/${completion.coreCount}</strong></span>
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

function renderStatusBanner(state, ui, ctx) {
  const {
    canEdit,
    isToday,
    isYesterday,
    completion,
    blocks,
    focus,
    softRemaining,
    override,
    doneLookup,
    selectedDate,
    pct,
    atRisk,
  } = ctx;
  const left = Math.max(0, completion.coreCount - completion.doneCore);

  if (completion.complete && isToday) {
    return `
      <div class="status-banner status-banner-sealed" data-region="now-card" role="status">
        <p class="status-banner-text min-w-0 flex-1">${icon("check", "h-4 w-4")} Day sealed. All core blocks done${softRemaining ? ` · ${softRemaining} soft left` : ""}</p>
        <button type="button" class="btn btn-primary status-banner-action !min-h-9 !px-3 !text-xs shrink-0" data-action="share-progress" data-scope="day">Share</button>
      </div>`;
  }

  if (!blocks.length) {
    return `
      <div class="status-banner" data-region="now-card">
        <div class="min-w-0 flex-1">
          <p class="status-banner-text">${copy.today.emptyTrack}</p>
        </div>
        <button type="button" class="btn btn-primary !min-h-9 !px-3 !text-xs shrink-0" data-action="today-mode" data-mode="edit">Edit</button>
      </div>`;
  }

  const riskClass = atRisk ? "status-banner-risk" : "";
  const headline = atRisk
    ? `Streak at risk. ${left} core block${left === 1 ? "" : "s"} left today`
    : left > 0
      ? `${left} core block${left === 1 ? "" : "s"} left`
      : "Core complete";
  const nextLine =
    focus && !completion.complete
      ? `Next: ${escapeHtml(focus.label)}${focus.time ? `, ${escapeHtml(formatTimeShort(focus.time))}` : ""}`
      : "";

  return `
    <div class="status-banner ${riskClass}" data-region="now-card">
      <div class="min-w-0 flex-1">
        <div class="mb-0.5 flex flex-wrap items-center gap-1">
          ${isYesterday ? '<span class="chip chip-data">catch-up</span>' : ""}
          ${override ? `<span class="chip chip-maintain">${override.type === "work" ? "shift" : "off"}</span>` : ""}
        </div>
        <p class="status-banner-text">${escapeHtml(headline)}</p>
        ${nextLine ? `<p class="status-banner-sub">${nextLine}</p>` : ""}
        <div class="day-rail mt-2"><div class="day-rail-fill" data-region="day-rail" style="width:${pct}%"></div></div>
      </div>
      ${
        focus && canEdit && !completion.complete
          ? `<button type="button" class="btn btn-primary !min-h-9 !px-3 !text-xs shrink-0" data-action="toggle-block" data-id="${escapeHtml(focus.id)}" data-date="${selectedDate}">Check</button>`
          : ""
      }
    </div>`;
}

function renderTomorrowFooter(state, selectedDate) {
  const tomorrow = dateKey(addDays(parseDateKey(selectedDate), 1));
  const dow = new Date(`${tomorrow}T12:00:00`).getDay();
  const type = dayType(dow, state);
  const blocks = resolveBlocksForDate(state, tomorrow);
  const first = [...blocks].sort((a, b) => {
    const am = parseTimeToMinutes(a.time);
    const bm = parseTimeToMinutes(b.time);
    if (am == null) return 1;
    if (bm == null) return -1;
    return am - bm;
  })[0];
  const typeLabel = type === "foundation" ? "Build day" : "Maintenance day";
  const firstLine = first?.time ? `first block ${formatTimeShort(first.time)}` : "no blocks yet";
  return `
    <p class="tomorrow-footer" data-region="tomorrow-footer">
      Tomorrow: <strong>${DAY_NAMES[dow]}</strong> · ${escapeHtml(typeLabel)} · ${escapeHtml(firstLine)}
    </p>`;
}

function coachHasEditHint(state) {
  const playbook = mergePlaybookFor(state) || playbookSeed;
  return coachHints(state, { playbook }).some((h) => h.action === "open-edit");
}

function renderHybridBlockList(state, blocks, selectedDate, canEdit, focusId) {
  const sorted = [...blocks].sort((a, b) => {
    const am = parseTimeToMinutes(a.time);
    const bm = parseTimeToMinutes(b.time);
    if (am == null && bm == null) return 0;
    if (am == null) return 1;
    if (bm == null) return -1;
    return am - bm;
  });
  return sorted
    .map((b) => {
      const done = isDone(state, selectedDate, b.id);
      const isFocus = focusId && b.id === focusId;
      const chips = tagChips(b.tags, b.soft);
      const tagPreview = tagsToFormValue(b.tags || []);
      return `
        <button type="button" class="hybrid-row ${done ? "is-done" : ""} ${isFocus ? "is-focus" : ""}" data-action="toggle-block" data-id="${escapeHtml(b.id)}" data-date="${selectedDate}" data-block-id="${escapeHtml(b.id)}" data-preview-label="${escapeHtml(b.label || "")}" data-preview-time="${escapeHtml(formatTimeShort(b.time))}" data-preview-tags="${escapeHtml(tagPreview)}" data-preview-soft="${b.soft ? "1" : "0"}" data-preview-details="${escapeHtml(b.details || "")}" ${canEdit ? "" : "disabled"} aria-pressed="${done}">
          <span class="hybrid-rail" aria-hidden="true">
            <span class="hybrid-time">${escapeHtml(formatTimeShort(b.time))}</span>
            <span class="hybrid-dot"></span>
          </span>
          <span class="check shrink-0 ${done ? "is-done" : ""}" aria-hidden="true">${done ? icon("check", "h-4 w-4") : ""}</span>
          <span class="hybrid-body min-w-0 text-left">
            <span class="hybrid-label">${escapeHtml(b.label)}</span>
            ${chips ? `<span class="hybrid-chips">${chips}</span>` : ""}
          </span>
        </button>`;
    })
    .join("");
}

function renderDayPanel(state, ui, ctx) {
  const { selectedDate, selectedDay, canEdit, blocks, completion, type, override, focus } = ctx;
  const week = Array.from({ length: 7 }, (_, i) => dateKey(addDays(parseDateKey(todayKey()), i)));
  const realToday = todayKey();
  const pills = week
    .map((key) => {
      const dow = new Date(`${key}T12:00:00`).getDay();
      const c = completionForDate(state, key);
      const active = key === selectedDate;
      const sealed = c.complete;
      const isRealToday = key === realToday;
      return `
        <button type="button" class="pill-day ${dayType(dow, state)} ${active ? "is-active" : ""} ${sealed ? "is-done" : ""} ${isRealToday ? "is-today" : ""}" data-action="select-date" data-date="${key}" data-day="${dow}" aria-label="${DAY_NAMES[dow]} ${formatDisplayDate(key)}${sealed ? ", sealed" : ""}${isRealToday ? ", today" : ""}" aria-pressed="${active}">
          <span class="block text-[10px] font-semibold">${DAY_NAMES[dow]}</span>
          <span class="block text-[11px]">${formatDisplayDate(key).slice(0, 5)}</span>
          ${isRealToday ? '<span class="pill-today-dot" aria-hidden="true"></span>' : ""}
        </button>`;
    })
    .join("");

  const hideEmptyEdit = coachHasEditHint(state);
  const listHtml = `<div class="hybrid-list" data-region="block-list">${
    blocks.length
      ? renderHybridBlockList(state, blocks, selectedDate, canEdit, focus?.id)
      : `<div class="py-4 text-center">
          <p class="text-sm" style="color:var(--mute)">No blocks for this day.</p>
          ${hideEmptyEdit ? "" : `<button type="button" class="btn btn-primary mt-3 w-full" data-action="today-mode" data-mode="edit">Open Edit</button>`}
        </div>`
  }</div>`;

  return `
    <section class="panel" data-region="day-panel">
      <div class="mb-3 flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-sm font-semibold leading-snug">${DAY_NAMES_FULL[selectedDay]}</p>
          <p class="text-sm font-semibold leading-snug" style="color:var(--text-soft)">${override ? describeOverride(override) : type === "foundation" ? "Build day" : "Maintenance"}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <span class="chip chip-build" data-region="core-chip">${completion.doneCore}/${completion.coreCount} core</span>
        </div>
      </div>
      <div class="mb-3">
        ${renderDateField({
          id: "today-date",
          name: "todayDate",
          value: selectedDate,
          action: "select-today-date",
          label: "Day",
        })}
      </div>
      <div class="mb-3 day-pill-grid" role="group" aria-label="This week">${pills}</div>
      <p class="eyebrow mb-2">Today's blocks</p>
      ${listHtml}
      ${ctx.isToday && completion.complete ? renderTomorrowFooter(state, selectedDate) : ""}
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
  const atRisk = isAtRisk(blocks, doneLookup, completion, isToday);
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
    atRisk,
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
    const dayPanel = screen.querySelector('[data-region="day-panel"]');
    if (dayPanel) dayPanel.insertAdjacentHTML("afterend", backupHtml);
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
    now.outerHTML = renderStatusBanner(state, ui, ctx);
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
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="eyebrow">${copy.today.editEyebrow}</p>
              <h1 class="display">${copy.today.editTitle}</h1>
              <p class="mt-2 text-sm" style="color:var(--mute)">${copy.today.editSubtitle(dayNum, length)}</p>
            </div>
            ${editToggleBtn(todayMode)}
          </div>
        </header>
        ${renderFlash(ui.flash)}
        ${renderPlan(state, ui, { embedded: true })}
      </section>
    `;
  }

  const ctx = buildTrackContext(state, ui);
  const displayName = String(state.settings?.displayName || "").trim() || "Marco";
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
          <div class="flex shrink-0 items-center gap-1">
            ${
              (() => {
                const sealedBefore = Object.keys(state.completions || {}).some((key) => {
                  const c = completionForDate(state, key);
                  return c.complete;
                });
                const showTour = !state.settings?.tourCompleted && !sealedBefore;
                return showTour
                  ? `<button type="button" class="btn shrink-0 !min-h-10 !px-3 !text-xs" data-action="open-tips" data-track="today">${copy.today.quickTour}</button>`
                  : "";
              })()
            }
            ${editToggleBtn(todayMode)}
          </div>
        </div>
      </header>

      ${renderStatsRail(state, ctx.selectedDate)}
      ${renderFlash(ui.flash)}
      ${showCoachStrip || ""}

      ${renderStatusBanner(state, ui, ctx)}
      ${renderDayPanel(state, ui, ctx)}

      ${renderBackupBanner(state)}
      ${renderInstallTip(state, { canInstall: Boolean(opts.canInstall) })}
    </section>
  `;
}
