// get-tint-color.js
import { getPlayerColor } from "./get-player-color.js";
import { DEFAULT_ACTOR_TYPE_COLOR } from "./settings/constants.js";

/**
 * Liefert die Tint-Farbe für ein Token anhand eines spezifischen Settings-Objekts.
 * Übergib z. B. S.frame1, S.frame2 oder S.nameplate als 'part'.
 *
 * Unterstützte Tint-Modes:
 *   - "NoTint"        → null
 *   - "Unicolor"      → part.defaultColor
 *   - "PlayerColor"   → Spielerfarbe oder part.defaultColor (falls keine Spielerfarbe)
 *   - "Disposition"   → Farben aus S.dispositionColors.* (hostile, neutral, friendly, secret, character)
 *   - "ActorType"     → Farbe aus S.actorTypeColors[actor.type], sonst DEFAULT_ACTOR_TYPE_COLOR
 *   - "Ownership"    → Farbe anhand Nutzer-Berechtigung auf Token oder verlinktem Actor
 *   - "custom"|"Custom" → Token-Flag 'greybearded-tokens.customTint' (normalisiert), sonst part.defaultColor
 *
 * @param {Token} token            Foundry Token
 * @param {object} S               Gesamtsnapshot (muss S.dispositionColors, S.actorTypeColors und S.ownershipColors enthalten)
 * @param {object} part            Teil-Settings: { tintMode, usePlayerColor, defaultColor }
 * @returns {string|null}          "#rrggbb" oder null (bei NoTint)
 */
export function getTintColor(token, S, part) {
  if (!token || !S || !part) return "#888888";

  const tintMode = part.tintMode ?? "Unicolor";
  const usePlayerColor = !!part.usePlayerColor;
  const defaultColor = normalizeToHex(part.defaultColor) ?? "#888888";

  if (usePlayerColor || tintMode === "PlayerColor") {
    const actorId = token?.actor?.id ?? null;
    if (actorId) {
      const pc = getPlayerColor(actorId);
      if (pc) return pc;
    }
    if (tintMode === "PlayerColor") return defaultColor;
  }

  switch (tintMode) {
    case "NoTint":
      return null;

    case "Unicolor":
      return defaultColor;

    case "Ownership":
      return getOwnershipColor(token, S, defaultColor);

    case "Custom": {
      const raw = token?.document?.getFlag?.("greybearded-tokens", "customTint");
      const hex = normalizeToHex(raw);
      return hex ?? defaultColor;
    }

    case "ActorType":
      return getActorTypeColor(token, S);

    case "Disposition":
      return getDispositionColor(token, S, defaultColor);

    default:
      return null;
  }
}

function getDispositionColor(token, snapshot, fallbackColor) {
  const dispositionColors = snapshot.dispositionColors;
  const isPC = token?.actor?.type === "character" && token?.actor?.hasPlayerOwner;
  if (isPC) return dispositionColors.character;

  switch (token?.document?.disposition) {
    case -2: return dispositionColors.secret;
    case -1: return dispositionColors.hostile;
    case 0: return dispositionColors.neutral;
    case 1: return dispositionColors.friendly;
    default: return fallbackColor;
  }
}


function getOwnershipColor(token, snapshot, fallbackColor) {
  const ownershipColors = snapshot.ownershipColors ?? {};
  const user = game?.user;
  const tokenDoc = token?.document ?? null;
  const actor = token?.actor ?? null;

  if (hasOwnership(tokenDoc, user, "OWNER") || hasOwnership(actor, user, "OWNER")) {
    return normalizeToHex(ownershipColors.owner) ?? fallbackColor;
  }

  if (hasOwnership(tokenDoc, user, "OBSERVER") || hasOwnership(actor, user, "OBSERVER")) {
    return normalizeToHex(ownershipColors.observer) ?? fallbackColor;
  }

  if (hasOwnership(tokenDoc, user, "LIMITED") || hasOwnership(actor, user, "LIMITED")) {
    return normalizeToHex(ownershipColors.limited) ?? fallbackColor;
  }

  return normalizeToHex(ownershipColors.none) ?? fallbackColor;
}

function hasOwnership(doc, user, level) {
  if (!doc || !user || typeof doc.testUserPermission !== "function") return false;
  return !!doc.testUserPermission(user, level, { exact: false });
}
function getActorTypeColor(token, snapshot) {
  const actorType = token?.actor?.type;
  if (typeof actorType !== "string" || !actorType.length) return DEFAULT_ACTOR_TYPE_COLOR;

  return snapshot.actorTypeColors?.[actorType] ?? DEFAULT_ACTOR_TYPE_COLOR;
}

/** Hilfsfunktion: beliebige Eingaben nach "#rrggbb" normalisieren */
function normalizeToHex(val) {
  if (val == null) return null;

  if (typeof val === "number" || val instanceof Number) {
    const n = Number(val);
    if (!Number.isFinite(n)) return null;
    const clamped = Math.max(0, Math.min(0xFFFFFF, Math.floor(n)));
    return "#" + clamped.toString(16).padStart(6, "0");
  }

  if (typeof val === "string") {
    const s = val.trim();
    const m = s.match(/^#?([0-9a-fA-F]{6})$/);
    if (m) return "#" + m[1].toLowerCase();
  }

  if (Array.isArray(val) && val.length === 3) {
    const [r, g, b] = val.map((x) => Math.max(0, Math.min(255, Number(x) || 0)));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  return null;
}
