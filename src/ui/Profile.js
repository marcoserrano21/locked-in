import { challengeDayNumber } from "../challenge.js";
import { formatDisplayDate } from "../dates.js";
import { BACKUP_STALE_DAYS, daysSinceBackup, isBackupStale } from "../backup.js";
import { escapeHtml, icon } from "./dom.js";
import { renderFlash } from "./Install.js";

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
  const questions = (state.day30Questions || []).join("\n");
  const canDelete = profiles.length > 1;

  const profileRows = profiles
    .map(
      (p) => `
      <div class="plan-row !min-h-[4.75rem] ${p.active ? "!bg-[color-mix(in_srgb,var(--build)_14%,transparent)]" : ""}">
        <div class="flex items-start justify-between gap-2">
          <button type="button" class="min-w-0 flex-1 text-left" data-action="switch-profile" data-id="${escapeHtml(p.id)}" ${p.active ? "aria-current=\"true\"" : ""}>
            <p class="task-title !min-h-0">${escapeHtml(p.displayName)}</p>
            <p class="mt-1 text-xs" style="color:var(--mute)">${escapeHtml(p.preset)}${p.active ? " · active" : ""}</p>
          </button>
          <div class="flex shrink-0 items-center gap-1">
            <button type="button" class="icon-btn" data-action="edit-profile" data-id="${escapeHtml(p.id)}" aria-label="Edit profile ${escapeHtml(p.displayName)}">${icon("edit", "h-4 w-4")}</button>
            <button type="button" class="icon-btn" data-action="delete-profile" data-id="${escapeHtml(p.id)}" aria-label="Remove profile ${escapeHtml(p.displayName)}" ${canDelete ? "" : "disabled"}>${icon("trash", "h-4 w-4")}</button>
          </div>
        </div>
        ${
          p.active
            ? ""
            : `<button type="button" class="btn mt-2 w-full !min-h-11 !text-xs" data-action="switch-profile" data-id="${escapeHtml(p.id)}">Switch to this profile</button>`
        }
      </div>`
    )
    .join("");

  return `
    <section class="screen">
      <header class="page-header">
        <button type="button" class="btn mb-3 inline-flex items-center gap-1 !min-h-11 !px-3" data-action="set-tab" data-tab="today" aria-label="Back to Today">
          ${icon("left", "h-4 w-4")}
          Back to Today
        </button>
        <p class="eyebrow">Profile</p>
        <h1 class="display">${escapeHtml(s.displayName || "Marco")}</h1>
        <p class="mt-2 text-sm" style="color:var(--mute)">Identity, profiles, preferences, and the nuclear options.</p>
      </header>

      ${renderFlash(ui.flash)}

      <section class="panel space-y-2">
        <p class="eyebrow">On-device profiles</p>
        <div class="space-y-2">${profileRows || `<p class="text-sm" style="color:var(--mute)">One profile loaded.</p>`}</div>
        <div class="flex flex-wrap gap-2 pt-1">
          <button type="button" class="btn btn-primary flex-1" data-action="create-profile" data-kind="blank">Add blank</button>
          <button type="button" class="btn flex-1" data-action="create-profile" data-kind="marco">Add Marco preset</button>
        </div>
        <p class="text-xs" style="color:var(--mute)">Local only. Switch tracks without cloud accounts. At least one profile must remain.</p>
      </section>

      <section class="panel">
        <p class="eyebrow mb-3">Identity</p>
        <form class="space-y-2" data-action="profile-identity">
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="display-name">Display name</label>
            <input class="input" id="display-name" name="displayName" value="${escapeHtml(s.displayName || "")}" required autocomplete="nickname" />
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="bio">Positioning</label>
            <textarea class="input min-h-[72px] py-3" id="bio" name="bio" placeholder="One line on what you do">${escapeHtml(s.bio || "")}</textarea>
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="portfolio">Portfolio URL</label>
            <input class="input" id="portfolio" name="portfolioUrl" type="url" value="${escapeHtml(s.portfolioUrl || "")}" />
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="linkedin">LinkedIn URL</label>
            <input class="input" id="linkedin" name="linkedinUrl" type="url" value="${escapeHtml(s.linkedinUrl || "")}" />
          </div>
          <button class="btn btn-primary w-full" type="submit">Save identity</button>
        </form>
      </section>

      <section class="panel space-y-3">
        <p class="eyebrow">Preferences</p>
        <div>
          <p class="mb-2 text-xs" style="color:var(--mute)" id="theme-label">Theme</p>
          <div class="segment" role="group" aria-labelledby="theme-label">
            ${THEMES.map(
              (t) =>
                `<button type="button" class="segment-btn ${theme === t.id ? "is-active accent" : ""}" data-action="set-theme" data-theme="${t.id}" aria-pressed="${theme === t.id}" aria-label="${t.id === "high" ? "High contrast theme" : `${t.label} theme`}">${t.label}</button>`
            ).join("")}
          </div>
        </div>
        <label class="flex min-h-tap items-center justify-between gap-3 text-sm">
          <span>Yesterday catch-up</span>
          <input type="checkbox" data-action="toggle-catchup" ${s.yesterdayCatchUp !== false ? "checked" : ""} class="h-4 w-4" style="accent-color:var(--build)" aria-label="Yesterday catch-up" />
        </label>
        <form class="space-y-2" data-action="profile-miles">
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
          <button class="btn w-full" type="submit">Save mile limits</button>
        </form>
      </section>

      <section class="panel space-y-3">
        <p class="eyebrow mb-0">Challenge</p>
        <div class="flex items-end justify-between gap-3">
          <div>
            <p class="display text-4xl" style="color:var(--build)">${dayNum}/${length}</p>
            <p class="mt-1 text-sm" style="color:var(--mute)">Status: ${escapeHtml(status)}</p>
          </div>
          <p class="text-sm" style="color:var(--text-soft)">${start ? `Started ${formatDisplayDate(start)}` : "Not started"}</p>
        </div>
        <div>
          <p class="mb-2 text-xs" style="color:var(--mute)">Length</p>
          <div class="segment" role="group" aria-label="Challenge length">
            ${[7, 14, 30, 90]
              .map(
                (d) =>
                  `<button type="button" class="segment-btn ${lengthChoice === d ? "is-active accent" : ""}" data-action="set-challenge-length" data-days="${d}">${d}</button>`
              )
              .join("")}
          </div>
        </div>
        <form class="space-y-2" data-action="profile-day30-questions">
          <label class="mb-1 block text-xs" style="color:var(--mute)" for="day30-qs">Day 30 questions (one per line)</label>
          <textarea class="input min-h-[120px] py-3" id="day30-qs" name="questions">${escapeHtml(questions)}</textarea>
          <button class="btn w-full" type="submit">Save review questions</button>
        </form>
      </section>

      <section class="panel space-y-2">
        <p class="eyebrow">Data</p>
        ${
          stale
            ? `<div class="banner banner-warn" role="status">
                No fresh export in ${since == null ? `${BACKUP_STALE_DAYS}+` : since} day${since === 1 ? "" : "s"}. Last backup: ${escapeHtml(lastLabel)}. Export is your account on this phone.
              </div>`
            : `<p class="text-xs" style="color:var(--mute)">Last export: ${escapeHtml(lastLabel)}. Local only. Device wipe = streak gone.</p>`
        }
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn ${stale ? "btn-primary" : ""}" data-action="export-backup">Export JSON</button>
          <label class="btn cursor-pointer">Import JSON<input type="file" accept="application/json,.json" class="sr-only" data-action="import-backup" /></label>
          <button type="button" class="btn" data-action="reset-seed">Reset templates</button>
        </div>
      </section>

      <section class="panel space-y-2">
        <p class="eyebrow" style="color:var(--danger)">Danger zone</p>
        <p class="text-sm" style="color:var(--mute)">Wipes local data, reseeds schedule, and forces the recommit gate.</p>
        ${stale ? `<p class="text-xs" style="color:var(--maintain)">Export first. This reset cannot be undone on-device.</p>` : ""}
        <button type="button" class="btn btn-danger w-full" data-action="open-reset">Reset app</button>
      </section>
    </section>
  `;
}

export function renderProfileEditorModal(ui, profiles = []) {
  const draft = ui.editingProfile || { id: "", displayName: "" };
  const meta = profiles.find((p) => p.id === draft.id);
  return `
    <div class="modal-backdrop" data-action="close-modal">
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
    <div class="modal-backdrop" data-action="close-modal">
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
    <div class="modal-backdrop" data-action="close-modal">
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
