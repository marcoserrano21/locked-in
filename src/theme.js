import { themeKeyForGuest } from "./beta.js";

const THEME_KEY = themeKeyForGuest();

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function normalizeTextSize(value) {
  return ["default", "medium", "large"].includes(value) ? value : "default";
}

export function applyTextSize(size, opts = {}) {
  const next = normalizeTextSize(size);
  const current = document.documentElement.getAttribute("data-text-size") || "default";
  if (current === next && !opts.force) return next;
  document.documentElement.setAttribute("data-text-size", next);
  return next;
}

export function applyTheme(theme, opts = {}) {
  const next = ["dark", "light", "high"].includes(theme) ? theme : "dark";
  const current = document.documentElement.getAttribute("data-theme");
  if (current === next && !opts.force) return next;
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      next === "light" ? "#F3F1EB" : next === "high" ? "#000000" : "#070A10"
    );
  }
  return next;
}

export function cycleTheme(current) {
  const order = ["dark", "light", "high"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}
