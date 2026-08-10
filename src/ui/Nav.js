import { icon } from "./dom.js";

const TABS = [
  { id: "today", label: "Today", icon: "today" },
  { id: "proof", label: "Proof", icon: "proof" },
  { id: "miles", label: "Miles", icon: "miles" },
  { id: "freelance", label: "Hustle", icon: "freelance" },
  { id: "profile", label: "Profile", icon: "profile" },
];

export function visibleTabs(state) {
  const s = state?.settings || {};
  const full = s.appMode === "full";
  const unlocked = s.modulesUnlocked || {};
  return TABS.filter((t) => {
    if (full) return true;
    if (t.id === "proof") return unlocked.proof;
    if (t.id === "miles") return unlocked.miles;
    return t.id === "today" || t.id === "freelance" || t.id === "profile";
  });
}

export function renderNav(activeTab, state) {
  const tabs = visibleTabs(state);
  return `
    <nav class="nav-shell" role="tablist" aria-label="Primary">
      <div class="flex gap-0.5">
        ${tabs
          .map(
            (t) => `
          <button type="button" class="nav-item ${activeTab === t.id ? "is-active" : ""}" data-action="set-tab" data-tab="${t.id}" role="tab" aria-selected="${activeTab === t.id}">
            ${icon(t.icon, "h-[18px] w-[18px]")}
            <span>${t.label}</span>
          </button>`
          )
          .join("")}
      </div>
    </nav>
  `;
}
