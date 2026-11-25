import { challengeDayNumber } from "../challenge.js";
import { formatDisplayDate } from "../dates.js";
import { BACKUP_STALE_DAYS, daysSinceBackup, isBackupStale } from "../backup.js";
import { MAX_PROFILES } from "../store.js";
import {
  activeGuestId,
  computeBetaInsights,
  listBetaGuestLinks,
} from "../beta.js";
import { escapeHtml, icon } from "./dom.js";
import { renderFlash } from "./Install.js";
import { renderDay30Editor } from "./Day30Editor.js";
import { copy } from "../copy/voice.js";

const THEMES = [
  { id: "dark", label: "dark" },
  { id: "light", label: "light" },
  { id: "high", label: "high" },
];

export function renderProfile(state, ui = {}, profiles = []) {
  const s = state.settings || {};
  const theme = s.theme || "dark";
  const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
  const length = state.challenge?.lengthDays || s.challengeLength || 30;
  const start = state.challenge?.startDate;
  const status = state.challenge?.status || "idle";
  const stale = isBackupStale(s.lastBackupAt);
  const since = daysSinceBackup(s.lastBackupAt);
  const lastLabel = s.lastBackupAt
    ? formatDisplayDate(s.lastBackupAt.slice(0, 10))
    : "never";
  const lengthChoice = Number(s.challengeLength || length || 30);
  const premium = Boolean(s.premiumUnlocked);
  const isCustomLength = ![7, 14, 30, 90].includes(lengthChoice);
  const canDelete = profiles.length > 1;
  const atProfileCap = profiles.length >= MAX_PROFILES;
  const challengeOpen = Boolean(ui.profileChallengeOpen);
  const day30Open = Boolean(ui.profileDay30Open);
  const limitsOpen = Boolean(ui.profileLimitsOpen);
  const displayName = s.displayName || "Marco";
  const bio = s.bio || "Build the day. Keep the streak.";
  const betaLinks = listBetaGuestLinks();
  const insights = computeBetaInsights(state);

  const trackChips = profiles
    .map(
      (p) => `
      <button type="button" class="profile-track-chip ${p.active ? "is-active" : ""}" data-action="switch-profile" data-id="${escapeHtml(p.id)}" ${p.active ? 'aria-current="true"' : ""}>
        ${escapeHtml(p.displayName)}
      </button>`
    )
    .join("");

  const trackActions = profiles
    .map(
      (p) => `
      <div class="flex items-center justify-between gap-2 py-1">
        <p class="text-sm min-w-0 truncate">${escapeHtml(p.displayName)}${p.active ? ' <span style="color:var(--mute)">· active</span>' : ""}</p>
        <div class="flex shrink-0 gap-1">
          <button type="button" class="icon-btn" data-action="edit-profile" data-id="${escapeHtml(p.id)}" aria-label="Edit ${escapeHtml(p.displayName)}">${icon("edit", "h-4 w-4")}</button>
          <button type="button" class="icon-btn" data-action="delete-profile" data-id="${escapeHtml(p.id)}" aria-label="Remove ${escapeHtml(p.displayName)}" ${canDelete ? "" : "disabled"}>${icon("trash", "h-4 w-4")}</button>
        </div>
      </div>`
    )
    .join("");

  return `
    <section class="screen space-y-3">
      <header class="page-header">
        <p class="eyebrow">You</p>
        <h1 class="display">${escapeHtml(displayName)}</h1>
        <p class="mt-2 text-sm" style="color:var(--mute)">${escapeHtml(bio)}</p>
      </header>

      ${renderFlash(ui.flash)}

      <section class="panel space-y-3">
        <p class="eyebrow mb-0">Preferences</p>
        <div>
          <p class="mb-2 help-text" id="theme-label">Theme</p>
          <div class="segment" role="group" aria-labelledby="theme-label">
            ${THEMES.map(
              (t) =>
                `<button type="button" class="segment-btn ${theme === t.id ? "is-active accent" : ""}" data-action="set-theme" data-theme="${t.id}" aria-pressed="${theme === t.id}" aria-label="${t.id === "high" ? "High contrast theme" : `${t.label} theme`}">${t.label}</button>`
            ).join("")}
          </div>
        </div>
        <div>
          <p class="mb-2 help-text" id="text-size-label">Text size</p>
          <div class="segment flex-wrap" role="group" aria-labelledby="text-size-label">
            ${["default", "medium", "large"]
              .map((size) => {
                const active = (s.textSize || "default") === size;
                const label = size === "default" ? "Default" : size === "medium" ? "Medium" : "Large";
                return `<button type="button" class="segment-btn ${active ? "is-active accent" : ""}" data-action="set-text-size" data-size="${size}" aria-pressed="${active}">${label}</button>`;
              })
              .join("")}
          </div>
          <p class="mt-2 help-text">Scales type across Today, Fitness, Profile, and modals.</p>
        </div>
        <div>
          <p class="mb-2 help-text">App mode</p>
          <div class="segment" role="group" aria-label="App mode">
            <button type="button" class="segment-btn ${(s.appMode || "simple") === "simple" ? "is-active accent" : ""}" data-action="set-app-mode" data-mode="simple">Simple</button>
            <button type="button" class="segment-btn ${s.appMode === "full" ? "is-active accent" : ""}" data-action="set-app-mode" data-mode="full">Full</button>
          </div>
          <p class="mt-2 help-text">Simple stays three tabs. Proof unlocks after your first core check. Money only if that module is on.</p>
        </div>
        <label class="flex min-h-tap flex-col gap-2 text-sm">
          <span class="flex items-center justify-between gap-3">
            <span id="catchup-label">Yesterday catch-up</span>
            <input type="checkbox" data-action="toggle-catchup" ${s.yesterdayCatchUp !== false ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--build)" aria-labelledby="catchup-label" aria-describedby="catchup-help" />
          </span>
          <span id="catchup-help" class="help-text">Check yesterday's core blocks until midnight. Today stays the main track.</span>
        </label>
      </section>

      <details class="panel space-y-3">
        <summary class="cursor-pointer text-sm font-semibold">Identity</summary>
        <form class="space-y-2 mt-3" data-action="profile-identity">
          <div>
            <label class="mb-1 block help-text" for="display-name">Display name</label>
            <input class="input" id="display-name" name="displayName" value="${escapeHtml(s.displayName || "")}" required autocomplete="nickname" />
          </div>
          <div>
            <label class="mb-1 block help-text" for="bio">One-line positioning</label>
            <textarea class="input min-h-[72px] py-3" id="bio" name="bio" placeholder="What you're building">${escapeHtml(s.bio || "")}</textarea>
          </div>
          <details class="text-sm">
            <summary class="cursor-pointer help-text font-semibold">Links</summary>
            <div class="mt-2 space-y-2">
              <div>
                <label class="mb-1 block help-text" for="portfolio">Portfolio URL</label>
                <input class="input" id="portfolio" name="portfolioUrl" type="url" value="${escapeHtml(s.portfolioUrl || "")}" />
              </div>
              <div>
                <label class="mb-1 block help-text" for="linkedin">LinkedIn URL</label>
                <input class="input" id="linkedin" name="linkedinUrl" type="url" value="${escapeHtml(s.linkedinUrl || "")}" />
              </div>
            </div>
          </details>
          <button class="btn btn-primary w-full" type="submit">Save identity</button>
        </form>
      </details>

      <details class="panel space-y-3">
        <summary class="cursor-pointer text-sm font-semibold">Tracks</summary>
        <div class="mt-3 flex items-start justify-between gap-2">
          <p class="help-text">On-device profiles. Same phone, separate lanes.</p>
          ${
            atProfileCap
              ? `<p class="help-text shrink-0">${profiles.length}/${MAX_PROFILES}</p>`
              : `<button type="button" class="btn !min-h-9 !px-3 !text-xs shrink-0" data-action="create-profile" data-kind="blank">Add</button>`
          }
        </div>
        <div class="flex flex-wrap gap-2">${trackChips || `<p class="text-sm" style="color:var(--mute)">One track loaded.</p>`}</div>
        <details class="text-sm">
          <summary class="cursor-pointer help-text font-semibold">Edit or remove</summary>
          <div class="mt-2 space-y-1">${trackActions}</div>
          ${
            atProfileCap
              ? ""
              : `<button type="button" class="btn mt-2 w-full !min-h-10 !text-xs" data-action="create-profile" data-kind="marco">Add Marco preset</button>`
          }
        </details>
      </details>

      <section class="panel space-y-3">
        <button type="button" class="review-head w-full !px-0" data-action="toggle-profile-limits" aria-expanded="${limitsOpen}">
          <div class="min-w-0 text-left">
            <p class="text-sm font-semibold mb-0">Limits</p>
            <p class="mt-1 help-text">${state.preset === "marco" ? "Mile soft stop / hard cap" : "Hours or $ soft stop / hard cap"}</p>
          </div>
          <span class="chevron-rot ${limitsOpen ? "is-open" : ""}" aria-hidden="true">${icon("down", "h-5 w-5")}</span>
        </button>
        <div class="day30-body ${limitsOpen ? "is-open" : ""}">
          ${
            limitsOpen
              ? `<form class="space-y-2 mt-2" data-action="profile-miles">
            ${
              state.preset !== "marco"
                ? `<div>
                <label class="mb-1 block help-text" for="money-label">Money label</label>
                <input class="input" id="money-label" name="moneyLabel" value="${escapeHtml(s.moneyLabel || "Side income")}" placeholder="Side income" />
              </div>`
                : ""
            }
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="mb-1 block help-text" for="soft-stop">Soft stop</label>
                <input class="input" id="soft-stop" name="uberSoftStop" type="number" min="1" value="${Number(s.uberSoftStop || 400)}" />
              </div>
              <div class="flex-1">
                <label class="mb-1 block help-text" for="uber-cap">Hard cap</label>
                <input class="input" id="uber-cap" name="uberCap" type="number" min="1" value="${Number(s.uberCap || 500)}" />
              </div>
            </div>
            <button class="btn w-full" type="submit">Save limits</button>
          </form>`
              : ""
          }
        </div>
      </section>

      <section class="panel space-y-3">
        <button type="button" class="review-head w-full !px-0" data-action="toggle-profile-challenge" aria-expanded="${challengeOpen}">
          <div class="min-w-0 text-left">
            <p class="eyebrow mb-0">Challenge</p>
            <p class="mt-1 text-xs" style="color:var(--mute)">${dayNum}/${length} · ${escapeHtml(status)}</p>
          </div>
          <span class="chevron-rot ${challengeOpen ? "is-open" : ""}" aria-hidden="true">${icon("down", "h-5 w-5")}</span>
        </button>
        <div class="day30-body ${challengeOpen ? "is-open" : ""}">
          ${
            challengeOpen
              ? `
        <div class="flex items-end justify-between gap-3 mt-2">
          <div>
            <p class="display text-4xl" style="color:var(--build)">${dayNum}/${length}</p>
            <p class="mt-1 text-sm" style="color:var(--mute)">Status: ${escapeHtml(status)}</p>
          </div>
          <p class="text-sm" style="color:var(--text-soft)">${start ? `Started ${formatDisplayDate(start)}` : "Not started"}</p>
        </div>
        <div class="mt-3">
          <p class="mb-2 text-xs" style="color:var(--mute)">Length</p>
          <div class="segment" role="group" aria-label="Challenge length">
            ${[7, 14, 30]
              .map(
                (d) =>
                  `<button type="button" class="segment-btn ${lengthChoice === d ? "is-active accent" : ""}" data-action="set-challenge-length" data-days="${d}">${d} Days</button>`
              )
              .join("")}
            ${
              premium
                ? `<button type="button" class="segment-btn ${lengthChoice === 90 ? "is-active accent" : ""}" data-action="set-challenge-length" data-days="90">90 Days</button>`
                : `<button type="button" class="segment-btn challenge-length-locked" data-action="set-challenge-length" data-days="90" title="${escapeHtml(copy.challenge.locked90)}">90 Days · Beta</button>`
            }
          </div>
          ${
            premium
              ? `
          <form class="challenge-custom-row" data-action="set-custom-challenge-length">
            <input class="input" type="number" name="days" min="7" max="365" placeholder="${copy.challenge.customLabel}" value="${isCustomLength ? lengthChoice : ""}" />
            <button type="submit" class="btn shrink-0 !text-xs">${copy.challenge.customSave}</button>
          </form>`
              : ""
          }
        </div>
        <div class="mt-4 pt-3" style="border-top:1px solid var(--border)">
          <button type="button" class="review-head w-full !px-0" data-action="toggle-profile-day30" aria-expanded="${day30Open}">
            <div class="min-w-0 text-left">
              <p class="text-xs font-semibold mb-0">Day ${length} review</p>
              <p class="mt-1 help-text">Edit questions. Answer on Proof.</p>
            </div>
            <span class="chevron-rot ${day30Open ? "is-open" : ""}" aria-hidden="true">${icon("down", "h-5 w-5")}</span>
          </button>
          <div class="day30-body ${day30Open ? "is-open" : ""}">
            ${day30Open ? renderDay30Editor(state, { embedded: true }) : ""}
          </div>
        </div>`
              : ""
          }
        </div>
      </section>

      <details class="panel space-y-2">
        <summary class="cursor-pointer text-sm font-semibold">Data</summary>
        <div class="mt-3 space-y-3">
        ${
          stale
            ? `<div class="banner banner-warn" role="status">
                No fresh export in ${since == null ? `${BACKUP_STALE_DAYS}+` : since} day${since === 1 ? "" : "s"}. Last backup: ${escapeHtml(lastLabel)}. Export is your account on this phone.
              </div>`
            : `<p class="help-text">Last export: ${escapeHtml(lastLabel)}. Device wipe = data gone unless exported.</p>`
        }
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn ${stale ? "btn-primary" : ""}" data-action="export-backup">Export JSON</button>
          <label class="btn cursor-pointer">Import JSON<input type="file" accept="application/json,.json" class="sr-only" data-action="import-backup" /></label>
          <button type="button" class="btn" data-action="reset-seed">Reset templates</button>
        </div>
        <label class="flex min-h-tap flex-col gap-2 text-sm">
          <span class="flex items-center justify-between gap-3">
            <span id="reminders-label">Block reminders</span>
            <input type="checkbox" data-action="toggle-block-reminders" ${s.blockReminders ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--build)" aria-labelledby="reminders-label" aria-describedby="reminders-help" />
          </span>
          <span id="reminders-help" class="help-text">Reminders need an installed PWA and a recent open on iOS. They are not a home-screen widget or an OS alarm.</span>
        </label>
        </div>
      </details>

      <details class="panel space-y-3">
        <summary class="cursor-pointer text-sm font-semibold">Beta</summary>
        <div class="mt-3 space-y-3">
        <label class="flex min-h-tap flex-col gap-2 text-sm">
          <span class="flex items-center justify-between gap-3">
            <span id="premium-beta-label">Enable beta preview</span>
            <input type="checkbox" data-action="toggle-premium-beta" ${s.premiumUnlocked ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--build)" aria-labelledby="premium-beta-label" aria-describedby="premium-beta-help" />
          </span>
          <span id="premium-beta-help" class="help-text">Beta preview. Not a purchase. Unlocks 90-day and custom challenge lengths.</span>
        </label>
        ${
          !activeGuestId
            ? `<p class="help-text">
          Share one guest link per friend. Each slot is its own localStorage. No shared blob, no login wall from the app.
          You are on the founder track.
        </p>
        <div class="panel-quiet space-y-1 !p-3">
          <p class="help-text font-semibold">Local insights (this device)</p>
          <p class="text-sm">${insights.completedWorkouts} workouts · ${insights.sealedDays} days sealed · ${insights.daysWithChecks} days with checks</p>
        </div>
        <div class="space-y-1">
          ${betaLinks
            .map(
              (link) => `
            <div class="beta-link-row">
              <code title="${escapeHtml(link.url)}">${escapeHtml(link.id)}</code>
              <button type="button" class="btn !min-h-9 !px-3 !text-xs shrink-0" data-action="copy-guest-link" data-url="${escapeHtml(link.url)}">Copy</button>
            </div>`
            )
            .join("")}
        </div>
        <button type="button" class="btn w-full !text-xs" data-action="copy-all-beta-links">Copy all 10 links</button>`
            : ""
        }
        </div>
      </details>

      <details class="panel space-y-3">
        <summary class="cursor-pointer text-sm font-semibold" style="color:var(--danger)">Danger</summary>
        <div class="mt-3 space-y-3">
        <p class="help-text">Testing and wipe tools. Export first if the streak matters.</p>
        <button type="button" class="btn w-full" data-action="open-restart-onboarding">Restart from onboarding</button>
        ${stale ? `<p class="help-text" style="color:var(--maintain)">Export first. Reset cannot be undone on-device.</p>` : ""}
        <button type="button" class="btn btn-danger w-full" data-action="open-reset">Reset app</button>
        </div>
      </details>
    </section>
  `;
}

export function renderProfileEditorModal(ui, profiles = []) {
  const draft = ui.editingProfile || { id: "", displayName: "" };
  const meta = profiles.find((p) => p.id === draft.id);
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Edit profile" data-stop>
        <h2 class="display text-3xl">Edit profile</h2>
        <p class="mt-1 text-sm" style="color:var(--mute)">${escapeHtml(meta?.preset || "local")} track · on-device only</p>
        <form class="mt-4 space-y-3" data-action="save-profile">
          <input type="hidden" name="id" value="${escapeHtml(draft.id || "")}" />
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="profile-name">Display name</label>
            <input class="input" id="profile-name" name="displayName" required maxlength="48" value="${escapeHtml(draft.displayName || "")}" autocomplete="nickname" />
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderDeleteProfileModal(ui) {
  const draft = ui.deletingProfile || { id: "", displayName: "" };
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Remove profile" data-stop>
        <h2 class="display text-3xl">Remove profile?</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">
          Deletes <strong>${escapeHtml(draft.displayName || "this profile")}</strong> and its local data on this device. Cannot be undone.
        </p>
        <div class="mt-4 flex gap-2">
          <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
          <button type="button" class="btn btn-danger flex-1" data-action="confirm-delete-profile" data-id="${escapeHtml(draft.id || "")}">Remove</button>
        </div>
      </div>
    </div>
  `;
}

export function renderResetConfirmModal(state) {
  const stale = isBackupStale(state?.settings?.lastBackupAt);
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Confirm reset" data-stop tabindex="-1">
        <h2 class="display text-3xl">Reset everything?</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">This clears streak history, miles, hustle checks, and Day 30 answers on this device.</p>
        ${stale ? `<p class="mt-2 text-sm banner banner-warn">No recent export on file. Export JSON first if you want a way back.</p>` : ""}
        <div class="mt-4 flex flex-col gap-2">
          <button type="button" class="btn w-full" data-action="export-backup">Export JSON first</button>
          <div class="flex gap-2">
            <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
            <button type="button" class="btn btn-danger flex-1" data-action="confirm-reset">Reset app</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderRestartOnboardingModal(state) {
  const stale = isBackupStale(state?.settings?.lastBackupAt);
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Restart from onboarding" data-stop>
        <h2 class="display text-3xl">Start from onboarding?</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">
          Wipes data on this device and opens Welcome so you can walk Simple vs Complete like a new user.
        </p>
        ${stale ? `<p class="mt-2 text-sm banner banner-warn">No recent export. Export JSON first if you need your streak back.</p>` : ""}
        <div class="mt-4 flex flex-col gap-2">
          <button type="button" class="btn w-full" data-action="export-backup">Export JSON first</button>
          <div class="flex gap-2">
            <button type="button" class="btn flex-1" data-action="close-modal">Cancel</button>
            <button type="button" class="btn btn-primary flex-1" data-action="confirm-restart-onboarding">Restart</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
