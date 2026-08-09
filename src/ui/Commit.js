export function renderCommitModal(state) {
  const length = Number(state?.settings?.challengeLength || 30);
  return `
    <div class="modal-backdrop !items-center">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="30-day commitment" data-stop>
        <p class="eyebrow" style="color:var(--build)">Marco Locked-In</p>
        <h1 class="display mt-2 text-5xl leading-none">One track. Your length.</h1>
        <p class="serif-accent mt-3 text-2xl" style="color:var(--text-soft)">Proof over vibes.</p>
        <p class="mt-3 text-sm" style="color:var(--mute)">
          Most habit apps track intent. This one tracks the next block.
          Soft targets do not inflate your streak. Shifts can change. The lock does not.
          After commit, add this to your home screen for one-tap daily check-ins.
        </p>
        <div class="mt-4">
          <p class="mb-2 text-xs" style="color:var(--mute)">Challenge length</p>
          <div class="segment" role="group" aria-label="Challenge length">
            ${[7, 14, 30, 90]
              .map(
                (d) =>
                  `<button type="button" class="segment-btn ${length === d ? "is-active accent" : ""}" data-action="set-challenge-length" data-days="${d}">${d}</button>`
              )
              .join("")}
          </div>
        </div>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="flex gap-2"><span style="color:var(--build)">01</span> Check the now block.</li>
          <li class="flex gap-2"><span style="color:var(--build)">02</span> Core seals the day.</li>
          <li class="flex gap-2"><span style="color:var(--build)">03</span> Uber is a bridge. Cap the miles.</li>
        </ul>
        <button type="button" class="btn btn-primary mt-6 w-full" data-action="start-challenge">
          Lock in for ${length} days
        </button>
      </div>
    </div>
  `;
}
