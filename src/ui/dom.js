export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function icon(name, className = "h-5 w-5") {
  const common = `class="${className}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const icons = {
    today: `<svg ${common} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
    proof: `<svg ${common} viewBox="0 0 24 24"><path d="M4 19V5M4 19h16"/><path d="M8 15l3-4 3 2 5-7"/></svg>`,
    miles: `<svg ${common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 1.5"/><path d="M5 12h2M17 12h2M12 5v2"/></svg>`,
    freelance: `<svg ${common} viewBox="0 0 24 24"><path d="M4 7h16v12H4z"/><path d="M8 7V5h8v2"/><path d="M8 12h8M8 16h5"/></svg>`,
    plan: `<svg ${common} viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
    check: `<svg ${common} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`,
    plus: `<svg ${common} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
    edit: `<svg ${common} viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`,
    trash: `<svg ${common} viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M10 11v6M14 11v6M6 7l1 12h10l1-12"/></svg>`,
    up: `<svg ${common} viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg>`,
    down: `<svg ${common} viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg>`,
    warning: `<svg ${common} viewBox="0 0 24 24"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`,
    theme: `<svg ${common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    spark: `<svg ${common} viewBox="0 0 24 24"><path d="M12 2l1.2 6.3L19 12l-5.8 3.7L12 22l-1.2-6.3L5 12l5.8-3.7z"/></svg>`,
    refresh: `<svg ${common} viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>`,
    left: `<svg ${common} viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>`,
    right: `<svg ${common} viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`,
    profile: `<svg ${common} viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 19a7 7 0 0 1 14 0"/></svg>`,
    copy: `<svg ${common} viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`,
    more: `<svg ${common} viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`,
  };
  return icons[name] || "";
}

export function pctLabel(pct) {
  return `${Math.round(pct * 100)}%`;
}

export { tagChips, renderMetaRow } from "../tags.js";
