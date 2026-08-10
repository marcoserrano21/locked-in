import { escapeHtml } from "./dom.js";
import { normalizeMuscleGroup } from "../fitness.js";

const BODY = "rgba(139, 147, 167, 0.35)";
const HI = "#F2F4F8";

const REGION = {
  head: BODY,
  chest: BODY,
  abs: BODY,
  back: BODY,
  shoulders: BODY,
  biceps: BODY,
  triceps: BODY,
  quads: BODY,
  hamstrings: BODY,
  glutes: BODY,
  calves: BODY,
  traps: BODY,
  lower_back: BODY,
  abductors: BODY,
  adductors: BODY,
  forearms: BODY,
  neck: BODY,
};

function regionsFor(group) {
  const g = normalizeMuscleGroup(group);
  const r = { ...REGION };
  if (!g || g === "all") return r;
  if (r[g] !== undefined) r[g] = HI;
  // legacy aliases already normalized
  return r;
}

export function renderMuscleMap(muscleGroup = "", className = "") {
  const r = regionsFor(muscleGroup);
  return `
    <svg class="${escapeHtml(className)}" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="32" cy="12" rx="9" ry="10" fill="${r.head}"/>
      <rect x="28" y="20" width="8" height="5" rx="2" fill="${r.neck}"/>
      <rect x="22" y="24" width="20" height="13" rx="4" fill="${r.chest}"/>
      <rect x="24" y="28" width="16" height="10" rx="3" fill="${r.traps}" opacity="0.55"/>
      <rect x="18" y="37" width="28" height="11" rx="3" fill="${r.abs}"/>
      <rect x="22" y="38" width="20" height="10" rx="3" fill="${r.lower_back}" opacity="0.7"/>
      <rect x="10" y="25" width="8" height="10" rx="3" fill="${r.shoulders}"/>
      <rect x="46" y="25" width="8" height="10" rx="3" fill="${r.shoulders}"/>
      <rect x="8" y="34" width="8" height="16" rx="3" fill="${r.biceps}"/>
      <rect x="48" y="34" width="8" height="16" rx="3" fill="${r.biceps}"/>
      <rect x="8" y="42" width="7" height="12" rx="2" fill="${r.triceps}" opacity="0.85"/>
      <rect x="49" y="42" width="7" height="12" rx="2" fill="${r.triceps}" opacity="0.85"/>
      <rect x="9" y="48" width="6" height="10" rx="2" fill="${r.forearms}"/>
      <rect x="49" y="48" width="6" height="10" rx="2" fill="${r.forearms}"/>
      <rect x="22" y="48" width="20" height="8" rx="3" fill="${r.glutes}" opacity="0.75"/>
      <rect x="20" y="52" width="10" height="20" rx="4" fill="${r.quads}"/>
      <rect x="34" y="52" width="10" height="20" rx="4" fill="${r.quads}"/>
      <rect x="21" y="58" width="8" height="14" rx="3" fill="${r.hamstrings}" opacity="0.8"/>
      <rect x="35" y="58" width="8" height="14" rx="3" fill="${r.hamstrings}" opacity="0.8"/>
      <rect x="18" y="56" width="5" height="12" rx="2" fill="${r.abductors}" opacity="0.7"/>
      <rect x="41" y="56" width="5" height="12" rx="2" fill="${r.abductors}" opacity="0.7"/>
      <rect x="24" y="58" width="5" height="10" rx="2" fill="${r.adductors}" opacity="0.65"/>
      <rect x="35" y="58" width="5" height="10" rx="2" fill="${r.adductors}" opacity="0.65"/>
      <rect x="21" y="72" width="8" height="14" rx="3" fill="${r.calves}"/>
      <rect x="35" y="72" width="8" height="14" rx="3" fill="${r.calves}"/>
      <rect x="24" y="36" width="16" height="12" rx="3" fill="${r.back}" opacity="0.55"/>
    </svg>
  `;
}

export function renderMuscleThumb(muscleGroup = "", size = "") {
  const cls = size === "lg" ? "muscle-thumb muscle-thumb-lg" : "muscle-thumb";
  return `<div class="${cls}">${renderMuscleMap(muscleGroup, "h-full w-full")}</div>`;
}

export function renderMuscleGridIcon(groupId = "", className = "h-full w-full") {
  return renderMuscleMap(groupId, className);
}
