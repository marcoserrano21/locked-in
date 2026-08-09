function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const TAG_TONES = ["neutral", "build", "maintain", "danger"];

/** Tag 1 tone = priority (low → high importance). Values map to existing chip tones. */
export const PRIORITY_LEVELS = [
  { value: "", label: "None" },
  { value: "neutral", label: "Low" },
  { value: "maintain", label: "Medium" },
  { value: "build", label: "High" },
  { value: "danger", label: "Critical" },
];

export function normalizeTag(tag) {
  if (!tag) return null;
  if (typeof tag === "string") {
    const label = tag.trim();
    if (!label) return null;
    const lower = label.toLowerCase();
    let tone = "neutral";
    if (lower === "soft") tone = "maintain";
    else if (["danger", "risk", "urgent"].includes(lower)) tone = "danger";
    else if (["money", "uber", "build", "core"].includes(lower)) tone = "build";
    return { label, tone };
  }
  if (typeof tag === "object") {
    const label = String(tag.label || tag.name || "").trim();
    if (!label) return null;
    const tone = TAG_TONES.includes(tag.tone) ? tag.tone : "neutral";
    return { label, tone: label.toLowerCase() === "soft" ? "maintain" : tone };
  }
  return null;
}

export function normalizeTags(tags = [], soft = false) {
  const out = [];
  const seen = new Set();
  for (const raw of tags || []) {
    const t = normalizeTag(raw);
    if (!t) continue;
    const key = t.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  if (soft && !seen.has("soft")) {
    out.push({ label: "soft", tone: "maintain" });
  }
  return out.slice(0, 2);
}

export function tagsToFormValue(tags = []) {
  return normalizeTags(tags)
    .map((t) => t.label)
    .join(", ");
}

export function parseTagsFromForm(tagsValue, soft, tone1 = "neutral", tone2 = "neutral") {
  const labels = String(tagsValue || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 2);
  const tones = [tone1 || "neutral", tone2 || "neutral"];
  const tags = labels.map((label, i) =>
    normalizeTag({
      label,
      tone: label.toLowerCase() === "soft" ? "maintain" : tones[i] || "neutral",
    })
  );
  return normalizeTags(tags, soft);
}

export function tagChips(tags = [], soft = false) {
  return normalizeTags(tags, soft)
    .map((tag) => {
      const toneClass =
        tag.tone === "build"
          ? "chip-build"
          : tag.tone === "maintain"
            ? "chip-maintain"
            : tag.tone === "danger"
              ? "chip-danger"
              : "chip-neutral";
      return `<span class="chip ${toneClass}">${escapeHtml(tag.label)}</span>`;
    })
    .join("");
}

export function renderMetaRow(time, tags = [], soft = false) {
  const chips = tagChips(tags, soft);
  return `
    <div class="task-meta">
      <span class="task-meta-time">${escapeHtml(time || "")}</span>
      <div class="task-meta-pills">${chips || '<span class="task-meta-spacer" aria-hidden="true"></span>'}</div>
    </div>
  `;
}
