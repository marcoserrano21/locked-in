/**
 * Beta preview is a plain toggle in Profile, Beta. There used to be a
 * founder-password shortcut here; it was removed because a hardcoded
 * password in a public repo is not a gate, it is a leak.
 */

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
