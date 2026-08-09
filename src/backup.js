/** Backup validation and freshness helpers. Export is the account on this device. */

export const MAX_BACKUP_BYTES = 2_000_000;
export const BACKUP_STALE_DAYS = 7;
export const SUPPORTED_BACKUP_VERSIONS = [1, 2, 3, 4];

export function validateBackupText(text) {
  if (typeof text !== "string") {
    throw new Error("Backup must be a JSON text file.");
  }
  if (text.length > MAX_BACKUP_BYTES) {
    throw new Error("Backup file is too large (max 2 MB).");
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not parse that file as JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Backup root must be a JSON object.");
  }
  const version = Number(parsed.version ?? 1);
  if (!SUPPORTED_BACKUP_VERSIONS.includes(version)) {
    throw new Error(`Unsupported backup version: ${parsed.version}.`);
  }
  return parsed;
}

export function isBackupStale(lastBackupAt, days = BACKUP_STALE_DAYS) {
  if (!lastBackupAt) return true;
  const t = Date.parse(lastBackupAt);
  if (Number.isNaN(t)) return true;
  return Date.now() - t > days * 24 * 60 * 60 * 1000;
}

export function daysSinceBackup(lastBackupAt) {
  if (!lastBackupAt) return null;
  const t = Date.parse(lastBackupAt);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}
