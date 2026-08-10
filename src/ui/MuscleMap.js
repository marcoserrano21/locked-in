import { escapeHtml } from "./dom.js";

const BODY = "rgba(139, 147, 167, 0.35)";

const HIGHLIGHTS = {
  chest: "#3ECF8E",
  back: "#7DD3FC",
  legs: "#F5A623",
  shoulders: "#F472B6",
  arms: "#A78BFA",
  core: "#F2F4F8",
};

export function muscleWikiUrl(name) {
  const slug = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `https://musclewiki.com/exercise/${slug}` : "";
}

export function renderMuscleMap(muscleGroup = "", className = "") {
  const hi = HIGHLIGHTS[muscleGroup] || BODY;
  const chest = muscleGroup === "chest" ? hi : BODY;
  const back = muscleGroup === "back" ? hi : BODY;
  const legs = muscleGroup === "legs" ? hi : BODY;
  const shoulders = muscleGroup === "shoulders" ? hi : BODY;
  const arms = muscleGroup === "arms" ? hi : BODY;
  const core = muscleGroup === "core" ? hi : BODY;

  return `
    <svg class="${escapeHtml(className)}" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="32" cy="14" rx="10" ry="11" fill="${BODY}"/>
      <rect x="22" y="24" width="20" height="14" rx="4" fill="${chest}"/>
      <rect x="18" y="38" width="28" height="12" rx="3" fill="${core}"/>
      <rect x="10" y="26" width="8" height="22" rx="3" fill="${arms}"/>
      <rect x="46" y="26" width="8" height="22" rx="3" fill="${arms}"/>
      <rect x="14" y="24" width="6" height="8" rx="2" fill="${shoulders}"/>
      <rect x="44" y="24" width="6" height="8" rx="2" fill="${shoulders}"/>
      <rect x="20" y="50" width="10" height="28" rx="4" fill="${legs}"/>
      <rect x="34" y="50" width="10" height="28" rx="4" fill="${legs}"/>
      <rect x="24" y="38" width="16" height="14" rx="3" fill="${back}" opacity="0.85"/>
    </svg>
  `;
}

export function renderMuscleThumb(muscleGroup = "") {
  return `<div class="muscle-thumb">${renderMuscleMap(muscleGroup, "h-full w-full")}</div>`;
}
