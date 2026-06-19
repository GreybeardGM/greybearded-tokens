import { DEFAULT_TOKEN_TOOLS } from "../settings/constants.js";

export const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHex(value) {
  return (typeof value === "string") && HEX_RE.test(value);
}

export function normalizeToHex(value) {
  if (value == null) return null;

  if (typeof value === "number" || value instanceof Number) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return null;
    const clamped = Math.max(0, Math.min(0xFFFFFF, Math.floor(numberValue)));
    return `#${clamped.toString(16).padStart(6, "0")}`;
  }

  if (typeof value === "string") {
    const stringValue = value.trim();
    const match = stringValue.match(/^#?([0-9a-fA-F]{6})$/);
    if (match) return `#${match[1].toLowerCase()}`;
  }

  if (Array.isArray(value) && value.length === 3) {
    const [r, g, b] = value.map((channel) => Math.max(0, Math.min(255, Number(channel) || 0)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  return null;
}

export function toFiniteNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

export function clampInt(value, min, max, fallback) {
  const n = Math.round(toFiniteNumber(value, fallback));
  return Math.min(max, Math.max(min, n));
}

export function normalizeSizeRange(minValue, maxValue, defaults = DEFAULT_TOKEN_TOOLS) {
  const min = clampInt(minValue, 1, 99, defaults.sizeMin);
  const max = clampInt(maxValue, 1, 99, defaults.sizeMax);
  if (min <= max) return { min, max };
  return { min: max, max: min };
}

export function normalizeTokenToolsConfig(config = {}, defaults = DEFAULT_TOKEN_TOOLS) {
  const sizeRange = normalizeSizeRange(config.sizeMin, config.sizeMax, defaults);
  return {
    size: normalizeBoolean(config.size, defaults.size),
    sizeMin: sizeRange.min,
    sizeMax: sizeRange.max,
    toggleFrame: normalizeBoolean(config.toggleFrame, defaults.toggleFrame),
    disposition: normalizeBoolean(config.disposition, defaults.disposition),
    mirrorArtwork: normalizeBoolean(config.mirrorArtwork, defaults.mirrorArtwork),
    customTint: normalizeBoolean(config.customTint, defaults.customTint)
  };
}
