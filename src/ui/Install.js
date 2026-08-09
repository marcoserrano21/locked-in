import { escapeHtml } from "./dom.js";

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Compact install tip for mobile. Hidden when already installed or dismissed.
 * @param {object} state
 * @param {{ canInstall?: boolean }} opts
 */
export function renderInstallTip(state, opts = {}) {
  if (isStandaloneDisplay()) return "";
  if (state.settings?.installTipDismissed) return "";

  const canInstall = Boolean(opts.canInstall);
  const ios = isIosDevice();

  let body = "";
  if (canInstall) {
    body = `
      <p class="text-sm" style="color:var(--text-soft)">Install Marco Locked-In on your home screen. Tracks the next block, not intent.</p>
      <div class="mt-3 flex gap-2">
        <button type="button" class="btn btn-primary flex-1" data-action="install-pwa">Install</button>
        <button type="button" class="btn flex-1" data-action="dismiss-install">Not now</button>
      </div>`;
  } else if (ios) {
    body = `
      <p class="text-sm" style="color:var(--text-soft)">On iPhone: Share → Add to Home Screen. Offline after first open.</p>
      <button type="button" class="btn mt-3 w-full" data-action="dismiss-install">Got it</button>`;
  } else {
    body = `
      <p class="text-sm" style="color:var(--text-soft)">Add this app to your home screen from the browser menu for one-tap daily check-ins.</p>
      <button type="button" class="btn mt-3 w-full" data-action="dismiss-install">Got it</button>`;
  }

  return `
    <aside class="panel-quiet install-tip" role="status" aria-label="Install tip">
      <p class="eyebrow mb-1">Home screen</p>
      ${body}
    </aside>
  `;
}

export function renderToast(toast) {
  if (!toast?.message) return "";
  return `
    <div class="app-toast" role="status" aria-live="polite">${escapeHtml(toast.message)}</div>
  `;
}

export function renderFlash(flash) {
  if (!flash?.message) return "";
  const kind = flash.type === "ok" ? "banner-ok" : "banner-warn";
  return `
    <div class="banner ${kind} flex items-start justify-between gap-2" role="alert">
      <span>${escapeHtml(flash.message)}</span>
      <button type="button" class="icon-btn !h-9 !w-9 !min-h-9 !min-w-9" data-action="dismiss-flash" aria-label="Dismiss message">×</button>
    </div>
  `;
}
