import seed from "../content/freelance.playbook.json";

export function getSeedPlaybook() {
  return seed;
}

/**
 * Empty playbook shape for non-Marco profiles: no borrowed niche, scripts,
 * proof, or links. Same shape as the seed, all fields blank.
 */
export function blankPlaybook() {
  return {
    positioning: "",
    niche: "",
    offers: [],
    proofPrimary: { title: "", line: "", stack: "", links: { portfolio: "", linkedin: "" } },
    proofSecondary: [],
    warmSources: [],
    weeklyFlow: [],
    ramp: [],
    scripts: { warmDm: "", contraHeadline: "", socialPost: "", discoveryOpener: "" },
    channels: [],
    moneyBlock: "",
  };
}

export function mergePlaybook(overrides = null, base = seed) {
  const o = overrides && typeof overrides === "object" ? overrides : {};
  return {
    ...base,
    ...o,
    offers: Array.isArray(o.offers) ? o.offers : base.offers,
    proofPrimary: { ...base.proofPrimary, ...(o.proofPrimary || {}) },
    proofSecondary: Array.isArray(o.proofSecondary) ? o.proofSecondary : base.proofSecondary,
    warmSources: Array.isArray(o.warmSources) ? o.warmSources : base.warmSources,
    weeklyFlow: Array.isArray(o.weeklyFlow) && o.weeklyFlow.length ? o.weeklyFlow : base.weeklyFlow,
    ramp: Array.isArray(o.ramp) && o.ramp.length ? o.ramp : base.ramp,
    scripts: { ...base.scripts, ...(o.scripts || {}) },
    channels: Array.isArray(o.channels) ? o.channels : base.channels,
  };
}

/**
 * Merge a profile's playbook overrides onto the right base: Marco's own seed
 * for his profile, a blank playbook for everyone else, so guests never see
 * Marco's niche, scripts, or links.
 */
export function mergePlaybookFor(state) {
  const base = state?.preset === "marco" ? seed : blankPlaybook();
  return mergePlaybook(state?.settings?.hustlePlaybook, base);
}
