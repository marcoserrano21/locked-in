import { formatDisplayDate } from "../dates.js";

export function renderCelebrate(payload) {
  const colors = ["#3ECF8E", "#F0A43A", "#F2F4F8", "#7DD3FC", "#F472B6"];
  const bits = Array.from({ length: 28 }, (_, i) => {
    const left = 4 + ((i * 17) % 92);
    const delay = (i % 8) * 0.05;
    const color = colors[i % colors.length];
    return `<span style="left:${left}%; background:${color}; animation-delay:${delay}s"></span>`;
  }).join("");
  const when = payload?.date ? formatDisplayDate(payload.date) : "today";

  return `
    <div class="celebrate" role="dialog" aria-modal="true" aria-label="Day sealed">
      <div class="burst" aria-hidden="true">${bits}</div>
      <div class="celebrate-card">
        <p class="eyebrow" style="color:var(--build)">Day sealed</p>
        <h2 class="display text-5xl mt-2">Core complete.</h2>
        <p class="serif-accent mt-3 text-2xl" style="color:var(--text-soft)">Proof over vibes.</p>
        <p class="mt-3 text-sm" style="color:var(--mute)">
          ${payload?.doneCore || 0}/${payload?.coreCount || 0} core blocks locked for ${when}.
          Soft targets can wait.
        </p>
        <button type="button" class="btn btn-primary mt-6 w-full" data-action="dismiss-celebrate">Keep moving</button>
      </div>
    </div>
  `;
}
