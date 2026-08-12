import { escapeHtml } from "./dom.js";

/** Client-side preview password only — not real billing security. */
export const PREMIUM_TEST_PASSWORD = "test123!S";

export function renderPremiumUnlockCard() {
  return `
    <section class="panel premium-card space-y-3">
      <p class="eyebrow" style="color:var(--maintain)">Premium preview</p>
      <h2 class="display text-3xl leading-tight">Unlock Hustle command center</h2>
      <p class="text-sm" style="color:var(--mute)">Fitness stays free. This gate is client-side for testing, not real payments.</p>
      <button type="button" class="btn btn-primary w-full" data-action="open-premium-unlock">Unlock Premium</button>
    </section>
  `;
}

export function renderPremiumUnlockModal(ui) {
  const err = ui.premiumError ? `<p class="text-xs mt-2" style="color:var(--danger)">${escapeHtml(ui.premiumError)}</p>` : "";
  return `
    <div class="modal-backdrop">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Unlock Premium" data-stop>
        <p class="eyebrow" style="color:var(--maintain)">Premium preview</p>
        <h2 class="display text-3xl mt-1">Enter access code</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">Preview only. Client password is not security. Profile also has Enable Premium preview.</p>
        <form class="mt-5 space-y-3" data-action="unlock-premium">
          <div>
            <label class="mb-1 block text-xs" style="color:var(--mute)" for="premium-pass">Password</label>
            <input class="input" id="premium-pass" name="password" type="password" required autocomplete="current-password" />
          </div>
          ${err}
          <button type="submit" class="btn btn-primary w-full">Unlock Hustle</button>
        </form>
        <button type="button" class="btn w-full mt-2" data-action="close-modal">Cancel</button>
      </div>
    </div>
  `;
}
