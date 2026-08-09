export function totalMiles(state) {
  return state.uberLog.reduce((sum, e) => sum + Number(e.miles || 0), 0);
}

export function totalEarnings(state) {
  return state.uberLog.reduce((sum, e) => sum + Number(e.earnings || 0), 0);
}

export function ratePerMile(state) {
  const miles = totalMiles(state);
  if (!miles) return 0;
  return totalEarnings(state) / miles;
}
