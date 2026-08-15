import { escapeHtml } from "./dom.js";

/** Client-side preview password only — not real billing security. Founder shortcut. */
export const PREMIUM_TEST_PASSWORD = "test123!S";

export function renderPremiumUnlockCard() {
  return `
    <section class="panel premium-card space-y-3">
      <p class="eyebrow" style="color:var(--maintain)">Beta preview</p>
      <h2 class="display text-3xl leading-tight">Command center</h2>
      <p class="text-sm" style="color:var(--mute)">Turn it on in Profile under Beta. Fitness stays free. This is not a purchase.</p>
      <button type="button" class="btn w-full" data-action="set-tab" data-tab="profile">Open Profile Beta</button>
    </section>
  `;
}

export function renderPremiumUnlockModal(ui) {
  const err = ui.premiumError ? `<p class="text-xs mt-2" style="color:var(--danger)">${escapeHtml(ui.premiumError)}</p>` : "";
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Beta preview" data-stop>
        <p class="eyebrow" style="color:var(--maintain)">Beta preview</p>
        <h2 class="display text-3xl mt-1">Founder shortcut</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">Not a purchase. The primary switch is Profile, Enable command center (beta). This password is a founder shortcut only.</p>
        <form class="mt-5 space-y-3" data-action="unlock-premium">
          <div>
            <label class="mb-1 block help-text" for="premium-pass">Founder password</label>
            <input class="input" id="premium-pass" name="password" type="password" required autocomplete="current-password" />
          </div>
          ${err}
          <button type="submit" class="btn btn-primary w-full">Enable beta</button>
        </form>
        <button type="button" class="btn w-full mt-2" data-action="close-modal">Cancel</button>
      </div>
    </div>
  `;
}
