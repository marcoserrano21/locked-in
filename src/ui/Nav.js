import { icon } from "./dom.js";

const TABS = [
  { id: "today", label: "Today", icon: "today" },
  { id: "proof", label: "Proof", icon: "proof" },
  { id: "miles", label: "Miles", icon: "miles" },
  { id: "freelance", label: "Hustle", icon: "freelance" },
  { id: "profile", label: "Profile", icon: "profile" },
];

export function renderNav(activeTab) {
  return `
    <nav class="nav-shell" role="tablist" aria-label="Primary">
      <div class="flex gap-0.5">
        ${TABS.map(
          (t) => `
          <button type="button" class="nav-item ${activeTab === t.id ? "is-active" : ""}" data-action="set-tab" data-tab="${t.id}" role="tab" aria-selected="${activeTab === t.id}">
            ${icon(t.icon, "h-[18px] w-[18px]")}
            <span>${t.label}</span>
          </button>`
        ).join("")}
      </div>
    </nav>
  `;
}
