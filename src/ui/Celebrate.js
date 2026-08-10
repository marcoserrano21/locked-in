import { formatDisplayDate } from "../dates.js";
import { computeStreak } from "../streaks.js";
import { challengeDayNumber } from "../challenge.js";
import { icon } from "./dom.js";

export function renderCelebrate(payload, state) {
  const colors = ["#3ECF8E", "#F0A43A", "#F2F4F8", "#7DD3FC", "#F472B6"];
  const bits = Array.from({ length: 28 }, (_, i) => {
    const left = 4 + ((i * 17) % 92);
    const delay = (i % 8) * 0.05;
    const color = colors[i % colors.length];
    return `<span style="left:${left}%; background:${color}; animation-delay:${delay}s"></span>`;
  }).join("");
  const when = payload?.date ? formatDisplayDate(payload.date) : "today";
  const streak = state ? computeStreak(state) : 0;
  const dayNum = state?.challenge ? challengeDayNumber(state.challenge) : 0;
  const length = state?.challenge?.lengthDays || 30;
  const name = state?.settings?.displayName || "You";

  return `
    <div class="celebrate" role="dialog" aria-modal="true" aria-label="Day sealed">
      <div class="burst" aria-hidden="true">${bits}</div>
      <div class="celebrate-card">
        <div class="sealed-stamp mx-auto mb-3">SEALED</div>
        <p class="eyebrow" style="color:var(--build)">Day sealed</p>
        <h2 class="display text-5xl mt-2">Core complete.</h2>
        <p class="mt-3 text-sm" style="color:var(--mute)">
          ${payload?.doneCore || 0}/${payload?.coreCount || 0} core · Day ${dayNum}/${length}<br/>
          Streak ${streak} · ${when}
        </p>
        <p class="serif-accent mt-3 text-xl" style="color:var(--text-soft)">${name}, proof over vibes.</p>
        <div class="sealed-actions">
          <button type="button" class="btn btn-primary w-full gap-2" data-action="share-progress" data-scope="day">${icon("proof", "h-5 w-5")} Share proof</button>
          <button type="button" class="btn w-full" data-action="dismiss-celebrate">Keep moving</button>
        </div>
      </div>
    </div>
  `;
}
