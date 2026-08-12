import seed from "../content/freelance.playbook.json";

export function getSeedPlaybook() {
  return seed;
}

export function mergePlaybook(overrides = null) {
  const o = overrides && typeof overrides === "object" ? overrides : {};
  return {
    ...seed,
    ...o,
    offers: Array.isArray(o.offers) ? o.offers : seed.offers,
    proofPrimary: { ...seed.proofPrimary, ...(o.proofPrimary || {}) },
    proofSecondary: Array.isArray(o.proofSecondary) ? o.proofSecondary : seed.proofSecondary,
    warmSources: Array.isArray(o.warmSources) ? o.warmSources : seed.warmSources,
    weeklyFlow: Array.isArray(o.weeklyFlow) && o.weeklyFlow.length ? o.weeklyFlow : seed.weeklyFlow,
    ramp: Array.isArray(o.ramp) && o.ramp.length ? o.ramp : seed.ramp,
    scripts: { ...seed.scripts, ...(o.scripts || {}) },
    channels: Array.isArray(o.channels) ? o.channels : seed.channels,
  };
}
