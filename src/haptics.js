/** Light haptic patterns via Vibration API. Audio tick fallback on iOS. */

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function canVibrate() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  if (isIosDevice()) return false;
  return true;
}

function playHapticTick(kind = "light") {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = kind === "success" ? 1046 : kind === "heavy" ? 220 : 880;
    const peak = kind === "heavy" ? 0.06 : 0.04;
    const dur = kind === "success" ? 0.07 : 0.045;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    }, 250);
  } catch {
    /* ignore */
  }
}

export function haptic(kind = "light") {
  if (prefersReducedMotion()) return;
  if (canVibrate()) {
    const patterns = {
      light: 12,
      medium: 24,
      success: [12, 40, 18],
      heavy: [20, 30, 40],
    };
    try {
      navigator.vibrate(patterns[kind] || patterns.light);
      return;
    } catch {
      /* fall through to audio tick */
    }
  }
  playHapticTick(kind);
}

export function hapticCheck() {
  haptic("light");
}

export function hapticSuccess() {
  haptic("success");
}

export function playRestChime() {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const beep = (offset, freq, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + dur + 0.02);
    };
    beep(0, 880, 0.12);
    beep(0.14, 1174, 0.18);
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    }, 600);
  } catch {
    /* ignore */
  }
}
