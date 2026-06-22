import { DEFAULT_TOKEN_TOOLS, DEFAULT_AUTO_ALIGN, ALIGN_CHOICES } from "../settings/constants.js";

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


export function oneOf(value, choices, fallback) {
  return Object.hasOwn(choices ?? {}, value) ? value : fallback;
}

export function normalizeAutoAlignConfig(config = {}, defaults = DEFAULT_AUTO_ALIGN) {
  return {
    enabled: normalizeBoolean(config.enabled, defaults.enabled),
    verticalAlign: oneOf(String(config.verticalAlign || ""), ALIGN_CHOICES.vertical, defaults.verticalAlign),
    horizontalAlign: oneOf(String(config.horizontalAlign || ""), ALIGN_CHOICES.horizontal, defaults.horizontalAlign)
  };
}
