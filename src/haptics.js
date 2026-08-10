/** Light haptic patterns via Vibration API. No-op when unsupported. */

function canVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function haptic(kind = "light") {
  if (!canVibrate()) return;
  const patterns = {
    light: 12,
    medium: 24,
    success: [12, 40, 18],
    heavy: [20, 30, 40],
  };
  try {
    navigator.vibrate(patterns[kind] || patterns.light);
  } catch {
    /* ignore */
  }
}

export function hapticCheck() {
  haptic("light");
}

export function hapticSuccess() {
  haptic("success");
}
