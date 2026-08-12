export function renderCommitModal(state) {
  const length = Number(state?.settings?.challengeLength || 30);
  const focus = state?.settings?.welcomeFocus || "both";
  const name = String(state?.settings?.displayName || "").trim() || "you";
  const first = name.split(/\s+/)[0] || "you";
  const firstLabel = `${first[0].toUpperCase()}${first.slice(1)}`;

  let identity = `${firstLabel}, you're locking in as someone who ships the next block.`;
  if (focus === "fitness") {
    identity = `${firstLabel}, you're locking in as someone who trains on schedule, not when mood permits.`;
  } else if (focus === "schedule") {
    identity = `${firstLabel}, you're locking in as someone who protects the next block.`;
  } else if (focus === "both") {
    identity = `${firstLabel}, you're locking in as someone who builds proof in schedule and training.`;
  }

  const bullets = [
    "Do the next block. One decision.",
    "Core seals the day. Soft does not count.",
    "Protect the lock. Shifts can move. The track does not lie.",
  ];

  return `
    <div class="modal-backdrop modal-enter !items-center">
      <div class="modal-sheet sheet-enter" role="dialog" aria-modal="true" aria-label="Commitment" data-stop>
        <p class="eyebrow" style="color:var(--build)">Locked-In</p>
        <h1 class="display mt-2 text-5xl leading-none">One track. Your length.</h1>
        <p class="serif-accent mt-3 text-2xl" style="color:var(--text-soft)">Proof over vibes.</p>
        <p class="mt-3 text-sm" style="color:var(--mute)">${identity}</p>
        <p class="mt-2 text-sm" style="color:var(--mute)">
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
          ${bullets
            .map(
              (b, i) =>
                `<li class="flex gap-2"><span style="color:var(--build)">0${i + 1}</span> ${b}</li>`
            )
            .join("")}
        </ul>
        <button type="button" class="btn btn-primary mt-6 w-full" data-action="start-challenge">
          Lock in for ${length} days
        </button>
      </div>
    </div>
  `;
}
