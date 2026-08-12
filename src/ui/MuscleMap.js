import { escapeHtml } from "./dom.js";
import { normalizeMuscleGroup } from "../fitness.js";
import frontSvgRaw from "../assets/anatomy/front_muscles.svg?raw";
import backSvgRaw from "../assets/anatomy/back_muscles.svg?raw";

const SELECTED = "#3ECF8E";
const MUTED = "rgba(139, 147, 167, 0.38)";
const OUTLINE = "rgba(139, 147, 167, 0.2)";
const STROKE = "rgba(42, 48, 64, 0.55)";

/** Crop each side so the figure fills the stage (source art is offset in a wide viewBox). */
const FRONT_VB = "30 35 400 690";
const BACK_VB = "450 35 400 690";

const FRONT_VIEW = new Set([
  "chest",
  "abs",
  "shoulders",
  "biceps",
  "quads",
  "adductors",
  "abductors",
  "neck",
  "forearms",
]);

/** SVG-only aliases — do not fold into normalizeMuscleGroup. */
const SVG_GROUP_ALIASES = {
  lats: "back",
  "upper-back": "back",
  upper_back: "back",
  hip: "abs",
  hips: "abs",
  obliques: "abs",
};

function asSelectedSet(selected) {
  if (Array.isArray(selected)) return new Set(selected.map(normalizeMuscleGroup));
  if (selected && typeof selected === "object" && selected.has) return selected;
  const g = normalizeMuscleGroup(selected || "");
  return g && g !== "all" ? new Set([g]) : new Set();
}

function resolveSvgGroup(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!key || key === "head") return null;
  const aliased = SVG_GROUP_ALIASES[key] || SVG_GROUP_ALIASES[key.replace(/_/g, "-")] || key;
  return normalizeMuscleGroup(aliased);
}

function fillColor(selectedSet, key, multi, intensityMap) {
  if (!selectedSet.has(key)) return MUTED;
  if (!multi) return SELECTED;
  const rank = intensityMap?.get?.(key);
  if (rank === "low") return "rgba(62, 207, 142, 0.32)";
  if (rank === "mid") return "rgba(62, 207, 142, 0.55)";
  return SELECTED;
}

function useBackView(group) {
  const g = normalizeMuscleGroup(group);
  return g && !FRONT_VIEW.has(g);
}

function parseSvgRoot(raw) {
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg") {
    throw new Error("MuscleMap: failed to parse anatomy SVG");
  }
  return root;
}

let frontTemplate = null;
let backTemplate = null;

function getTemplate(side) {
  if (side === "back") {
    if (!backTemplate) backTemplate = parseSvgRoot(backSvgRaw);
    return backTemplate;
  }
  if (!frontTemplate) frontTemplate = parseSvgRoot(frontSvgRaw);
  return frontTemplate;
}

function paintBodyMap(side, selectedSet, { interactive = false, multi = false, intensityMap = null } = {}) {
  const svg = getTemplate(side).cloneNode(true);
  svg.setAttribute("viewBox", side === "back" ? BACK_VB : FRONT_VB);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  const g = svg.querySelector("g");
  if (g) {
    g.removeAttribute("fill");
    g.setAttribute("stroke", "none");
  }

  for (const path of svg.querySelectorAll("path")) {
    const rawGroup = path.getAttribute("data-muscle-group") || "";
    const id = path.getAttribute("id") || "";
    const isOutline = id === "body-outline" || !rawGroup;
    const group = isOutline ? null : resolveSvgGroup(rawGroup);

    if (!group) {
      path.setAttribute("fill", OUTLINE);
      path.setAttribute("stroke", "none");
      path.removeAttribute("stroke-width");
      path.removeAttribute("data-muscle-group");
      path.removeAttribute("class");
      path.removeAttribute("data-action");
      path.removeAttribute("data-group");
      path.removeAttribute("role");
      path.removeAttribute("tabindex");
      path.removeAttribute("aria-label");
      continue;
    }

    path.setAttribute("stroke", STROKE);
    path.setAttribute("stroke-width", "6");
    path.setAttribute("stroke-linejoin", "round");

    path.setAttribute("fill", fillColor(selectedSet, group, multi, intensityMap));
    path.setAttribute("data-muscle-group", group);

    if (interactive) {
      path.setAttribute("class", "muscle-region");
      path.setAttribute("data-action", "toggle-muscle-group");
      path.setAttribute("data-group", group);
      path.setAttribute("role", "button");
      path.setAttribute("tabindex", "0");
      path.setAttribute("aria-label", group);
    } else {
      path.removeAttribute("class");
      path.removeAttribute("data-action");
      path.removeAttribute("data-group");
      path.removeAttribute("role");
      path.removeAttribute("tabindex");
      path.removeAttribute("aria-label");
    }
  }

  return svg;
}

function serializeSvg(svg, className, { ariaHidden = true, ariaLabel = "" } = {}) {
  const classes = ["muscle-map", className].filter(Boolean).join(" ");
  svg.setAttribute("class", classes);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (ariaHidden) {
    svg.setAttribute("aria-hidden", "true");
    svg.removeAttribute("role");
    svg.removeAttribute("aria-label");
  } else {
    svg.removeAttribute("aria-hidden");
    svg.setAttribute("role", "img");
    if (ariaLabel) svg.setAttribute("aria-label", ariaLabel);
  }
  return svg.outerHTML;
}

export function renderMuscleMap(muscleGroup = "", className = "") {
  const g = normalizeMuscleGroup(muscleGroup);
  const selectedSet = asSelectedSet(g);
  const side = useBackView(g) ? "back" : "front";
  const svg = paintBodyMap(side, selectedSet, { interactive: false, multi: false });
  return serializeSvg(svg, escapeHtml(className));
}

/** Interactive front/back body map for workout builder. */
export function renderInteractiveBodyMap(selected = [], side = "front") {
  const selectedSet = asSelectedSet(selected);
  const isBack = side === "back";
  const svg = paintBodyMap(isBack ? "back" : "front", selectedSet, {
    interactive: true,
    multi: true,
  });
  return serializeSvg(svg, "muscle-map-interactive", {
    ariaHidden: false,
    ariaLabel: isBack ? "Back body muscle map" : "Front body muscle map",
  });
}

/** Multi-highlight body map (non-interactive) for analytics. */
export function renderHighlightBodyMap(selected = [], side = "front", className = "", volumeByMuscle = null) {
  const selectedSet = asSelectedSet(selected);
  let intensityMap = null;
  if (volumeByMuscle && typeof volumeByMuscle === "object") {
    const entries = Object.entries(volumeByMuscle);
    const max = Math.max(1, ...entries.map(([, n]) => Number(n) || 0));
    intensityMap = new Map();
    for (const [id, n] of entries) {
      const ratio = (Number(n) || 0) / max;
      const rank = ratio >= 0.66 ? "high" : ratio >= 0.33 ? "mid" : "low";
      intensityMap.set(normalizeMuscleGroup(id), rank);
    }
  }
  const isBack = side === "back";
  const svg = paintBodyMap(isBack ? "back" : "front", selectedSet, {
    interactive: false,
    multi: true,
    intensityMap,
  });
  return serializeSvg(svg, escapeHtml(className));
}

export function renderMuscleThumb(muscleGroup = "", size = "") {
  const cls = size === "lg" ? "muscle-thumb muscle-thumb-lg" : "muscle-thumb";
  return `<div class="${cls}">${renderMuscleMap(muscleGroup, "h-full w-full")}</div>`;
}

export function renderMuscleGridIcon(groupId = "", className = "h-full w-full") {
  return renderMuscleMap(groupId, className);
}
