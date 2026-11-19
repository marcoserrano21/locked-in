import { icon } from "./dom.js";

const TABS = [
  { id: "today", label: "Today", icon: "today" },
  { id: "freelance", label: "Hustle", icon: "freelance" },
  { id: "miles", label: "Miles", icon: "miles" },
  { id: "proof", label: "Proof", icon: "proof" },
  { id: "profile", label: "Profile", icon: "profile" },
];

export function visibleTabs(state) {
  const s = state?.settings || {};
  const unlocked = s.modulesUnlocked || {};
  const isMarco = state?.preset === "marco";
  const moneyLabel = isMarco ? "Miles" : "Money";
  // One label for everyone. The screen holds both Fitness and Hustle behind a
  // toggle, so a focus-dependent label sent schedule users to a workout log.
  const freelanceLabel = "Train";
  return TABS.filter((t) => {
    if (t.id === "proof") return Boolean(unlocked.proof);
    if (t.id === "miles") return Boolean(unlocked.miles);
    return t.id === "today" || t.id === "freelance" || t.id === "profile";
  }).map((t) => {
    if (t.id === "miles") return { ...t, label: moneyLabel };
    if (t.id === "freelance") return { ...t, label: freelanceLabel };
    return t;
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
            <span class="nav-icon">${icon(t.icon, "h-[18px] w-[18px]")}</span>
            <span class="nav-label">${t.label}</span>
          </button>`
          )
          .join("")}
      </div>
    </nav>
  `;
}
