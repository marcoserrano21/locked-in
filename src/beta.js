/** Beta guest slots: isolated localStorage per ?guest=beta-01…beta-10 */

export const BETA_GUEST_IDS = Array.from({ length: 10 }, (_, i) => `beta-${String(i + 1).padStart(2, "0")}`);

const STORE_BASE = "marco-tracker-v4";
const THEME_BASE = "marco-theme";

export function sanitizeGuestId(raw) {
  const id = String(raw || "")
    .trim()
    .toLowerCase();
  return BETA_GUEST_IDS.includes(id) ? id : null;
}

export function resolveGuestIdFromLocation(search = typeof window !== "undefined" ? window.location.search : "") {
  try {
    const params = new URLSearchParams(search);
    return sanitizeGuestId(params.get("guest"));
  } catch {
    return null;
  }
}

/** Active guest for this page load (null = founder / default store). */
export const activeGuestId = resolveGuestIdFromLocation();

export function storeKeyForGuest(guestId = activeGuestId) {
  return guestId ? `${STORE_BASE}:guest:${guestId}` : STORE_BASE;
}

export function themeKeyForGuest(guestId = activeGuestId) {
  return guestId ? `${THEME_BASE}:guest:${guestId}` : THEME_BASE;
}

export function betaShareBaseUrl() {
  if (typeof window === "undefined") return "https://locked-in-marco.vercel.app";
  return `${window.location.origin}${window.location.pathname.replace(/\/$/, "") || ""}`;
}

export function betaGuestUrl(guestId, base = betaShareBaseUrl()) {
  const id = sanitizeGuestId(guestId);
  if (!id) return base;
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${root}/?guest=${id}`;
}

export function listBetaGuestLinks(base = betaShareBaseUrl()) {
  return BETA_GUEST_IDS.map((id) => ({ id, url: betaGuestUrl(id, base) }));
}

/**
 * Lightweight local insights for the active guest (or default) track.
 * @param {object} state
 */
export function computeBetaInsights(state) {
  const fitnessLog = state?.fitnessLog || [];
  const completedWorkouts = fitnessLog.filter((s) => s.completedAt).length;
  const sealedDays = Object.keys(state?.celebrations || {}).length;
  const completions = state?.completions || {};
  const daysWithChecks = Object.keys(completions).filter((k) =>
    Object.values(completions[k] || {}).some(Boolean)
  ).length;
  return {
    guestId: activeGuestId,
    completedWorkouts,
    sealedDays,
    daysWithChecks,
    displayName: state?.settings?.displayName || "Guest",
  };
}
