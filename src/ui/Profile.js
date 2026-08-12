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
  const challengeOpen = ui.profileChallengeOpen !== false;
  const day30Open =
    ui.profileDay30Open != null ? Boolean(ui.profileDay30Open) : dayNum >= 21;
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
        <button type="button" class="btn mb-3 inline-flex items-center gap-1 !min-h-11 !px-3" data-action="set-tab" data-tab="today" aria-label="Back to Today">
          ${icon("left", "h-4 w-4")}
          Back to Today
        </button>
        <p class="eyebrow">You</p>
        <h1 class="display">${escapeHtml(displayName)}</h1>
        <p class="mt-2 text-sm" style="color:var(--mute)">${escapeHtml(bio)}</p>
      </header>

      ${renderFlash(ui.flash)}

      <section class="panel space-y-3">
        <p class="eyebrow mb-0">Identity</p>
        <form class="space-y-2" data-action="profile-identity">
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="display-name">Display name</label>
            <input class="input" id="display-name" name="displayName" value="${escapeHtml(s.displayName || "")}" required autocomplete="nickname" />
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="bio">One-line positioning</label>
            <textarea class="input min-h-[72px] py-3" id="bio" name="bio" placeholder="What you're building">${escapeHtml(s.bio || "")}</textarea>
          </div>
          <details class="text-sm">
            <summary class="cursor-pointer text-xs font-semibold" style="color:var(--mute)">Links</summary>
            <div class="mt-2 space-y-2">
              <div>
                <label class="mb-1 block text-xs" style="color:var(--mute)" for="portfolio">Portfolio URL</label>
                <input class="input" id="portfolio" name="portfolioUrl" type="url" value="${escapeHtml(s.portfolioUrl || "")}" />
              </div>
              <div>
                <label class="mb-1 block text-xs" style="color:var(--mute)" for="linkedin">LinkedIn URL</label>
                <input class="input" id="linkedin" name="linkedinUrl" type="url" value="${escapeHtml(s.linkedinUrl || "")}" />
              </div>
            </div>
          </details>
          <button class="btn btn-primary w-full" type="submit">Save identity</button>
        </form>
      </section>

      <section class="panel space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="eyebrow mb-0">Tracks</p>
            <p class="mt-1 text-xs" style="color:var(--mute)">On-device profiles. Same phone, separate lanes.</p>
          </div>
          ${
            atProfileCap
              ? `<p class="text-xs shrink-0" style="color:var(--mute)">${profiles.length}/${MAX_PROFILES}</p>`
              : `<button type="button" class="btn !min-h-9 !px-3 !text-xs shrink-0" data-action="create-profile" data-kind="blank">Add</button>`
          }
        </div>
        <div class="flex flex-wrap gap-2">${trackChips || `<p class="text-sm" style="color:var(--mute)">One track loaded.</p>`}</div>
        <details class="text-sm">
          <summary class="cursor-pointer text-xs font-semibold" style="color:var(--mute)">Edit or remove</summary>
          <div class="mt-2 space-y-1">${trackActions}</div>
          ${
            atProfileCap
              ? ""
              : `<button type="button" class="btn mt-2 w-full !min-h-10 !text-xs" data-action="create-profile" data-kind="marco">Add Marco preset</button>`
          }
        </details>
      </section>

      <section class="panel space-y-3">
        <p class="eyebrow mb-0">Preferences</p>
        <div>
          <p class="mb-2 text-xs" style="color:var(--mute)" id="theme-label">Theme</p>
          <div class="segment" role="group" aria-labelledby="theme-label">
            ${THEMES.map(
              (t) =>
                `<button type="button" class="segment-btn ${theme === t.id ? "is-active accent" : ""}" data-action="set-theme" data-theme="${t.id}" aria-pressed="${theme === t.id}" aria-label="${t.id === "high" ? "High contrast theme" : `${t.label} theme`}">${t.label}</button>`
            ).join("")}
          </div>
        </div>
        <div>
          <p class="mb-2 text-xs" style="color:var(--mute)">App mode</p>
          <div class="segment" role="group" aria-label="App mode">
            <button type="button" class="segment-btn ${(s.appMode || "simple") === "simple" ? "is-active accent" : ""}" data-action="set-app-mode" data-mode="simple">Simple</button>
            <button type="button" class="segment-btn ${s.appMode === "full" ? "is-active accent" : ""}" data-action="set-app-mode" data-mode="full">Full</button>
          </div>
          <p class="mt-2 text-xs" style="color:var(--mute)">Simple hides Proof and Miles until you unlock them or switch to Full.</p>
        </div>
        <label class="flex min-h-tap flex-col gap-2 text-sm">
          <span class="flex items-center justify-between gap-3">
            <span id="catchup-label">Yesterday catch-up</span>
            <input type="checkbox" data-action="toggle-catchup" ${s.yesterdayCatchUp !== false ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--build)" aria-labelledby="catchup-label" aria-describedby="catchup-help" />
          </span>
          <span id="catchup-help" class="text-xs" style="color:var(--mute)">Check yesterday's core blocks until midnight. Today stays the main track.</span>
        </label>
        <label class="flex min-h-tap flex-col gap-2 text-sm">
          <span class="flex items-center justify-between gap-3">
            <span id="reminders-label">Block reminders</span>
            <input type="checkbox" data-action="toggle-block-reminders" ${s.blockReminders ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--build)" aria-labelledby="reminders-label" aria-describedby="reminders-help" />
          </span>
          <span id="reminders-help" class="text-xs" style="color:var(--mute)">Local alerts before the next core block. Best when the app is installed and recently open.</span>
        </label>
        <div>
          <button type="button" class="review-head w-full !px-0" data-action="toggle-profile-limits" aria-expanded="${limitsOpen}">
            <div class="min-w-0 text-left">
              <p class="text-xs font-semibold mb-0" style="color:var(--mute)">Limits</p>
              <p class="mt-1 text-xs" style="color:var(--mute)">${state.preset === "marco" ? "Mile soft stop / hard cap" : "Money soft stop / hard cap"}</p>
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
                  <label class="mb-1 block text-xs" style="color:var(--mute)" for="money-label">Money label</label>
                  <input class="input" id="money-label" name="moneyLabel" value="${escapeHtml(s.moneyLabel || "Side income")}" placeholder="Side income" />
                </div>`
                  : ""
              }
              <div class="flex gap-2">
                <div class="flex-1">
                  <label class="mb-1 block text-xs" style="color:var(--mute)" for="soft-stop">Soft stop</label>
                  <input class="input" id="soft-stop" name="uberSoftStop" type="number" min="1" value="${Number(s.uberSoftStop || 400)}" />
                </div>
                <div class="flex-1">
                  <label class="mb-1 block text-xs" style="color:var(--mute)" for="uber-cap">Hard cap</label>
                  <input class="input" id="uber-cap" name="uberCap" type="number" min="1" value="${Number(s.uberCap || 500)}" />
                </div>
              </div>
              <button class="btn w-full" type="submit">Save limits</button>
            </form>`
                : ""
            }
          </div>
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
                  `<button type="button" class="segment-btn ${lengthChoice === d ? "is-active accent" : ""}" data-action="set-challenge-length" data-days="${d}">${d}</button>`
              )
              .join("")}
            ${
              premium
                ? `<button type="button" class="segment-btn ${lengthChoice === 90 ? "is-active accent" : ""}" data-action="set-challenge-length" data-days="90">90</button>`
                : `<button type="button" class="segment-btn challenge-length-locked" data-action="open-premium-unlock" title="${escapeHtml(copy.challenge.locked90)}">90 · Premium</button>`
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
              <p class="text-xs font-semibold mb-0">Day 30 review</p>
              <p class="mt-1 text-xs" style="color:var(--mute)">Edit questions. Answer on Proof.</p>
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

      <section class="panel space-y-2">
        <p class="eyebrow mb-0">Data</p>
        ${
          stale
            ? `<div class="banner banner-warn" role="status">
                No fresh export in ${since == null ? `${BACKUP_STALE_DAYS}+` : since} day${since === 1 ? "" : "s"}. Last backup: ${escapeHtml(lastLabel)}. Export is your account on this phone.
              </div>`
            : `<p class="text-xs" style="color:var(--mute)">Last export: ${escapeHtml(lastLabel)}. Device wipe = data gone unless exported.</p>`
        }
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn ${stale ? "btn-primary" : ""}" data-action="export-backup">Export JSON</button>
          <label class="btn cursor-pointer">Import JSON<input type="file" accept="application/json,.json" class="sr-only" data-action="import-backup" /></label>
          <button type="button" class="btn" data-action="reset-seed">Reset templates</button>
        </div>
      </section>

      <section class="panel space-y-3">
        <p class="eyebrow mb-0">Beta</p>
        <p class="text-xs" style="color:var(--mute)">
          Share one guest link per friend. Each slot is its own localStorage. No shared blob, no login wall from the app.
          ${activeGuestId ? ` You are on <strong>${escapeHtml(activeGuestId)}</strong>.` : " You are on the founder track."}
        </p>
        <div class="panel-quiet space-y-1 !p-3">
          <p class="text-xs font-semibold" style="color:var(--mute)">Local insights (this device)</p>
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
        <button type="button" class="btn w-full !text-xs" data-action="copy-all-beta-links">Copy all 10 links</button>
      </section>

      <section class="panel space-y-3">
        <p class="eyebrow mb-0" style="color:var(--danger)">Danger</p>
        <p class="text-xs" style="color:var(--mute)">Testing and wipe tools. Export first if the streak matters.</p>
        <button type="button" class="btn w-full" data-action="${s.premiumUnlocked ? "disable-premium-preview" : "open-premium-unlock"}">
          ${s.premiumUnlocked ? "Disable Premium preview" : "Enable Premium preview"}
        </button>
        <p class="text-xs" style="color:var(--mute)">Client-side only. Not real billing security.</p>
        <button type="button" class="btn w-full" data-action="open-restart-onboarding">Restart from onboarding</button>
        ${stale ? `<p class="text-xs" style="color:var(--maintain)">Export first. Reset cannot be undone on-device.</p>` : ""}
        <button type="button" class="btn btn-danger w-full" data-action="open-reset">Reset app</button>
      </section>
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
