import { escapeHtml } from "./dom.js";
import { normalizeMuscleGroup } from "../fitness.js";
import frontSvgRaw from "../assets/anatomy/front_muscles.svg?raw";
import backSvgRaw from "../assets/anatomy/back_muscles.svg?raw";

const SELECTED = "#3ECF8E";
const MUTED = "rgba(139, 147, 167, 0.38)";
const OUTLINE = "rgba(139, 147, 167, 0.2)";
const STROKE = "rgba(42, 48, 64, 0.55)";

/** Crop each side so the full figure (head → feet) fills the stage. */
const FRONT_VB = "15 15 430 720";
const BACK_VB = "435 15 430 720";

/** Zoom crop boxes (wider / re-centered so thumbs are not right-biased). */
const MUSCLE_ZOOM_VB = {
  chest: "110 150 220 175",
  abs: "118 230 224 210",
  shoulders: "60 120 340 170",
  biceps: "40 185 380 195",
  quads: "110 340 240 250",
  adductors: "118 355 224 205",
  abductors: "88 325 284 210",
  neck: "159 55 150 115",
  forearms: "18 235 424 230",
  calves: "500 385 280 245",
  back: "506 135 260 280",
  traps: "505 35 250 175",
  triceps: "453 165 330 220",
  hamstrings: "515 360 230 230",
  glutes: "530 300 200 155",
  lower_back: "535 240 200 165",
};

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

/** Front interactive map: calves live on the back view only. */
const FRONT_INTERACTIVE_SKIP = new Set(["calves"]);

/** Paint order: later paths win hit-testing on overlaps. Abs before quads, calves before hamstrings so the limb wins. */
const FRONT_PAINT_ORDER = [
  "body-outline",
  "chest",
  "neck",
  "shoulders",
  "biceps",
  "forearms",
  "abs",
  "abs-hip",
  "quads",
  "abductors",
  "adductors",
  "calves",
];
const BACK_PAINT_ORDER = [
  "body-outline",
  "neck",
  "traps",
  "shoulders",
  "triceps",
  "back",
  "forearms",
  "lower_back",
  "glutes",
  "calves",
  "hamstrings",
];

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

/** Hip-crease lobes on the quads compound path sit under the last abs row. */
function splitQuadHipBlobs(svg) {
  const quads = svg.querySelector("#quads");
  if (!quads) return;
  const d = quads.getAttribute("d") || "";
  const parts = d.match(/M[\s\S]*?Z/gi);
  if (!parts || parts.length < 3) return;
  quads.setAttribute("d", parts.slice(2).join(" "));
  const hip = quads.cloneNode(true);
  hip.setAttribute("id", "abs-hip");
  hip.setAttribute("d", parts.slice(0, 2).join(" "));
  hip.setAttribute("data-muscle-group", "abs");
  quads.parentNode.insertBefore(hip, quads);
}

let calvesClipSeq = 0;

/** Upper calves lobes cross the knee into hamstrings. Keep the lower-leg only. */
function clipCalvesBelowKnee(svg) {
  const calves = svg.querySelector("#calves");
  if (!calves) return;
  const g = calves.parentNode;
  if (!g) return;
  const NS = "http://www.w3.org/2000/svg";
  const id = `calves-below-knee-${++calvesClipSeq}`;
  const clip = svg.ownerDocument.createElementNS(NS, "clipPath");
  clip.setAttribute("id", id);
  clip.setAttribute("clipPathUnits", "userSpaceOnUse");
  const rect = svg.ownerDocument.createElementNS(NS, "rect");
  rect.setAttribute("x", "5400");
  rect.setAttribute("y", "1480");
  rect.setAttribute("width", "2100");
  rect.setAttribute("height", "1200");
  clip.appendChild(rect);
  g.insertBefore(clip, calves);
  calves.setAttribute("clip-path", `url(#${id})`);
}

function paintBodyMap(side, selectedSet, { interactive = false, multi = false, intensityMap = null, zoomGroup = "" } = {}) {
  const svg = getTemplate(side).cloneNode(true);
  const zoomVb = zoomGroup ? MUSCLE_ZOOM_VB[normalizeMuscleGroup(zoomGroup)] : "";
  svg.setAttribute("viewBox", zoomVb || (side === "back" ? BACK_VB : FRONT_VB));
  // Pick thumbs use meet so both sides show; full maps also prefer meet.
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  if (side === "front") splitQuadHipBlobs(svg);
  if (side === "back") clipCalvesBelowKnee(svg);

  const g = svg.querySelector("g");
  if (g) {
    g.removeAttribute("fill");
    g.setAttribute("stroke", "none");
    const order = side === "back" ? BACK_PAINT_ORDER : FRONT_PAINT_ORDER;
    const paths = [...svg.querySelectorAll("path")];
    const rank = (path) => {
      const id = path.getAttribute("id") || "";
      const idx = order.indexOf(id);
      return idx < 0 ? 999 : idx;
    };
    paths.sort((a, b) => rank(a) - rank(b));
    for (const path of paths) g.appendChild(path);
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
      path.style.pointerEvents = "none";
      continue;
    }

    const skipInteractive = interactive && side === "front" && FRONT_INTERACTIVE_SKIP.has(group);
    path.setAttribute("stroke", STROKE);
    path.setAttribute("stroke-width", interactive ? "2" : "6");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("fill", fillColor(selectedSet, group, multi, intensityMap));
    path.setAttribute("data-muscle-group", group);

    if (interactive && !skipInteractive) {
      path.setAttribute("class", "muscle-region");
      path.setAttribute("data-action", "toggle-muscle-group");
      path.setAttribute("data-group", group);
      path.setAttribute("role", "button");
      path.setAttribute("tabindex", "0");
      path.setAttribute("aria-label", group);
      path.style.pointerEvents = "auto";
    } else {
      path.removeAttribute("class");
      path.removeAttribute("data-action");
      path.removeAttribute("data-group");
      path.removeAttribute("role");
      path.removeAttribute("tabindex");
      path.removeAttribute("aria-label");
      if (skipInteractive) {
        path.style.pointerEvents = "none";
        path.setAttribute("fill", MUTED);
      }
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

export function renderMuscleMap(muscleGroup = "", className = "", { zoom = false } = {}) {
  const g = normalizeMuscleGroup(muscleGroup);
  const selectedSet = asSelectedSet(g);
  const side = useBackView(g) ? "back" : "front";
  const svg = paintBodyMap(side, selectedSet, {
    interactive: false,
    multi: false,
    zoomGroup: zoom ? g : "",
  });
  if (!zoom) svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
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
  return `<div class="${cls}">${renderMuscleMap(muscleGroup, "h-full w-full", { zoom: true })}</div>`;
}

export function renderMuscleGridIcon(groupId = "", className = "h-full w-full") {
  return renderMuscleMap(groupId, className, { zoom: true });
}
