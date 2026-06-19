// get-tint-color.js
import { getPlayerColor } from "./get-player-color.js";
import { DEFAULT_ACTOR_TYPE_COLOR } from "./settings/constants.js";
import { normalizeToHex } from "./utils/normalisation.js";

const OWNERSHIP_COLOR_PRIORITY = [
  { level: "OWNER", colorKey: "owner" },
  { level: "OBSERVER", colorKey: "observer" },
  { level: "LIMITED", colorKey: "limited" },
];

/**
 * Return the tint color for a token from a specific settings object.
 * Pass S.frame1, S.frame2, or S.nameplate as `part`.
 *
 * Supported tint modes:
 *   - "NoTint"        → null
 *   - "Unicolor"      → part.defaultColor
 *   - "PlayerColor"   -> player color or part.defaultColor when no player color exists
 *   - "Disposition"   -> colors from S.dispositionColors.* (hostile, neutral, friendly, secret, character)
 *   - "ActorType"     -> color from S.actorTypeColors[actor.type], otherwise DEFAULT_ACTOR_TYPE_COLOR
 *   - "Ownership"    -> color based on user permission for the token or linked actor
 *   - "custom"|"Custom" -> normalized `greybearded-tokens.customTint` token flag, otherwise part.defaultColor
 *
 * @param {Token} token            Foundry Token
 * @param {object} S               Full snapshot; must include dispositionColors, actorTypeColors, and ownershipColors.
 * @param {object} part            Partial settings: { tintMode, usePlayerColor, defaultColor }
 * @returns {string|null}          "#rrggbb" or null for NoTint.
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

  for (const { level, colorKey } of OWNERSHIP_COLOR_PRIORITY) {
    if (hasOwnership(tokenDoc, user, level) || hasOwnership(actor, user, level)) {
      return normalizeToHex(ownershipColors[colorKey]) ?? fallbackColor;
    }
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
