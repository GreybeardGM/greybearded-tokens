// modules/greybearded-tokens/scripts/settings/snapshot.js
import {
  MOD_ID,
  TINT_CHOICES,
  DEFAULT_DISPOSITION_COLORS,
  DEFAULT_ACTOR_TYPE_COLORS,
  DEFAULT_ACTOR_TYPE_COLOR,
  DEFAULT_OWNERSHIP_COLORS,
  DEFAULT_NAMEPLATES,
  DEFAULT_FRAME1,
  DEFAULT_FRAME2,
  DEFAULT_MASK
} from "./constants.js";
import { toFiniteNumber, normalizeBoolean } from "../utils/normalization.js";
import { str, oneOf, isHex, readObjectSetting, getConfiguredFontFamilies } from "./helpers.js";

let _S = null;

const DISPOSITION_COLOR_KEYS = ["hostile", "neutral", "friendly", "secret", "character"];
const OWNERSHIP_COLOR_KEYS = ["owner", "observer", "limited", "none"];

function deriveRuntimeFlags(snapshot) {
  const hasFrame1 = !!snapshot?.frame1?.path;
  const hasFrame2 = !!(snapshot?.frame2?.enabled && snapshot?.frame2?.path);
  const hasMask = !!(snapshot?.mask?.enabled && snapshot?.mask?.path);
  const hasName = !!snapshot?.nameplate?.enabled;

  return {
    hasFrame1,
    hasFrame2,
    hasMask,
    hasNameplate: hasName,
    hasAnyOverlay: hasFrame1 || hasFrame2,
    hasAnyVisuals: hasFrame1 || hasFrame2 || hasMask || hasName
  };
}

function normalizeDispositionColors(rawDispositionColors) {
  const source = (rawDispositionColors && typeof rawDispositionColors === "object")
    ? rawDispositionColors
    : DEFAULT_DISPOSITION_COLORS;

  const normalized = {};
  for (const key of DISPOSITION_COLOR_KEYS) {
    normalized[key] = isHex(source[key]) ? source[key] : DEFAULT_DISPOSITION_COLORS[key];
  }

  return normalized;
}

function normalizeActorTypeColors(rawActorTypeColors) {
  const source = (rawActorTypeColors && typeof rawActorTypeColors === "object")
    ? rawActorTypeColors
    : DEFAULT_ACTOR_TYPE_COLORS;

  const normalized = {};
  for (const [actorType, color] of Object.entries(source)) {
    if (typeof actorType !== "string" || !actorType.trim().length) continue;
    normalized[actorType] = isHex(color) ? color : DEFAULT_ACTOR_TYPE_COLOR;
  }

  return normalized;
}

function normalizeOwnershipColors(rawOwnershipColors) {
  const source = (rawOwnershipColors && typeof rawOwnershipColors === "object")
    ? rawOwnershipColors
    : DEFAULT_OWNERSHIP_COLORS;

  const normalized = {};
  for (const key of OWNERSHIP_COLOR_KEYS) {
    normalized[key] = isHex(source[key]) ? source[key] : DEFAULT_OWNERSHIP_COLORS[key];
  }

  return normalized;
}

function _readAll() {
  const FR = readObjectSetting(MOD_ID, "frames", {
    frame1: DEFAULT_FRAME1,
    frame2: DEFAULT_FRAME2,
    mask: DEFAULT_MASK
  });
  const NP = readObjectSetting(MOD_ID, "nameplate", DEFAULT_NAMEPLATES);
  const rawDispositionColors = readObjectSetting(MOD_ID, "colors", DEFAULT_DISPOSITION_COLORS);
  const rawActorTypeColors = readObjectSetting(MOD_ID, "actorTypeColors", DEFAULT_ACTOR_TYPE_COLORS);
  const rawOwnershipColors = readObjectSetting(MOD_ID, "ownershipColors", DEFAULT_OWNERSHIP_COLORS);

  const configuredFonts = Object.fromEntries(getConfiguredFontFamilies().map((family) => [family, true]));

  const nameplate = {
    enabled: normalizeBoolean(NP?.enabled, DEFAULT_NAMEPLATES.enabled),
    baseFontSize: toFiniteNumber(NP?.baseFontSize, DEFAULT_NAMEPLATES.baseFontSize),
    fontFamily: oneOf(NP?.fontFamily, configuredFonts, DEFAULT_NAMEPLATES.fontFamily),
    usePlayerColor: normalizeBoolean(NP?.usePlayerColor, DEFAULT_NAMEPLATES.usePlayerColor),
    defaultColor: isHex(NP?.defaultColor) ? NP.defaultColor : DEFAULT_NAMEPLATES.defaultColor,
    tintMode: oneOf(NP?.tintMode, TINT_CHOICES, DEFAULT_NAMEPLATES.tintMode),
    scaleWithToken: normalizeBoolean(NP?.scaleWithToken, DEFAULT_NAMEPLATES.scaleWithToken)
  };

  const dispositionColors = normalizeDispositionColors(rawDispositionColors);
  const actorTypeColors = normalizeActorTypeColors(rawActorTypeColors);
  const ownershipColors = normalizeOwnershipColors(rawOwnershipColors);

  const snap = {
    frame1: {
      path: str(FR?.frame1?.path, DEFAULT_FRAME1.path),
      scale: toFiniteNumber(FR?.frame1?.scale, DEFAULT_FRAME1.scale),
      tintMode: oneOf(FR?.frame1?.tintMode, TINT_CHOICES, DEFAULT_FRAME1.tintMode),
      usePlayerColor: normalizeBoolean(FR?.frame1?.usePlayerColor, DEFAULT_FRAME1.usePlayerColor),
      defaultColor: isHex(FR?.frame1?.defaultColor) ? FR.frame1.defaultColor : DEFAULT_FRAME1.defaultColor
    },
    frame2: {
      enabled: normalizeBoolean(FR?.frame2?.enabled, DEFAULT_FRAME2.enabled),
      path: str(FR?.frame2?.path, DEFAULT_FRAME2.path),
      scale: toFiniteNumber(FR?.frame2?.scale, DEFAULT_FRAME2.scale),
      tintMode: oneOf(FR?.frame2?.tintMode, TINT_CHOICES, DEFAULT_FRAME2.tintMode),
      usePlayerColor: normalizeBoolean(FR?.frame2?.usePlayerColor, DEFAULT_FRAME2.usePlayerColor),
      defaultColor: isHex(FR?.frame2?.defaultColor) ? FR.frame2.defaultColor : DEFAULT_FRAME2.defaultColor
    },
    mask: {
      enabled: normalizeBoolean(FR?.mask?.enabled, DEFAULT_MASK.enabled),
      path: str(FR?.mask?.path, DEFAULT_MASK.path)
    },
    nameplate,
    dispositionColors,
    actorTypeColors,
    ownershipColors
  };

  snap.runtime = deriveRuntimeFlags(snap);

  return snap;
}

/**
 * Liefert den aktuellen Snapshot.
 * Vor `ready`: Live-Fallback ohne Memo (kein verfrühtes Cachen).
 * Ab `ready` (nach buildSnapshot): memoized Rückgabe.
 */
export function getGbFrameSettings() {
  if (_S) return _S;
  if (game?.ready) {
    _S = _readAll();
    return _S;
  }
  return _readAll();
}

/** Erzwingt Neuaufbau und Memoisierung. */
export function buildSnapshot() {
  _S = _readAll();
  return _S;
}

/** Optionales manuelles Invalidieren (Tests/Reloads) */
export function invalidateGbFrameSettings() {
  _S = null;
}
