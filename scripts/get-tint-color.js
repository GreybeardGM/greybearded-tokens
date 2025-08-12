/**
 * Liefert die Rahmenfarbe je nach Tint-Mode.
 * - "Disposition": nutzt Disposition/Typ + deine Moduleinstellungen (PCs = character-Farbe)
 * - "PlayerColor": nimmt die aktuelle User-Farbe (game.user.color), konvertiert zu "#RRGGBB"
 * - "NoTint": gibt null zurück (kein Tint anwenden)
 *
 * @param {Token} token
 * @param {"Disposition"|"PlayerColor"|"NoTint"} [tintMode="Disposition"]
 * @returns {string|null} CSS-Farbwert "#RRGGBB" oder null bei NoTint
 */
// get-tint-color.js
export function getTintColor(token, tintMode = "Disposition") {
  const colorFromSettings = (key, fallback) =>
    game.settings.get("greybearded-tokens", `color-${key}`) || fallback;

  const defaultColor =
    game.settings.get("greybearded-tokens", "defaultFrameColor") || "#888888";

  switch (tintMode) {
    case "NoTint":
      return null;

    case "Unicolor":
      return defaultColor;

    case "Advanced":
      // Platzhalter: später erweiterbar (z.B. per Actor-Flag/Status)
      return defaultColor;

    case "PlayerColor": {
      const owner = getOwnerUserForToken(token);         // <- dein bestehender Helper
      const css   = userColorToCss(owner);               // <- dein bestehender Helper
      return css ?? defaultColor;
    }

    case "Disposition":
    default: {
      const disp = token.document?.disposition;
      const actorType = token.actor?.type;
      const hasPlayerOwner = token.actor?.hasPlayerOwner;

      if (actorType === "character" && hasPlayerOwner) {
        return colorFromSettings("character", defaultColor);
      }
      switch (disp) {
        case -2: return colorFromSettings("secret",   defaultColor);
        case -1: return colorFromSettings("hostile",  defaultColor);
        case  0: return colorFromSettings("neutral",  defaultColor);
        case  1: return colorFromSettings("friendly", defaultColor);
        default: return defaultColor;
      }
    }
  }
}

// Robust: v12 (OWNERSHIP) → v9/v10 (PERMISSION) → Fallback 3
const OWNER_LVL =
  (globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER) ??
  (globalThis.CONST?.DOCUMENT_PERMISSION_LEVELS?.OWNER) ?? 3;

function userColorToCss(user) {
  const c = user?.color;
  if (typeof c === "number") return PIXI.utils.hex2string(c);
  if (typeof c === "string" && c.trim()) return c.startsWith("#") ? c : `#${c.replace(/^0x/i, "")}`;
  return null;
}

function getOwnerUserForToken(token) {
  const doc = token?.document;
  const actor = token?.actor;

  const isOwner = (d, u) => {
    if (!d || !u) return false;
    // testUserPermission erwartet die numerische Stufe
    try { return d.testUserPermission(u, OWNER_LVL); }
    catch { return false; }
  };

  // Owner via TokenDocument ODER Actor (falls Token keine eigenen Rechte nutzt)
  const owners = game.users.filter(u => isOwner(doc, u) || isOwner(actor, u));
  if (!owners.length) return null;

  const playerOwners = owners.filter(u => !u.isGM);
  return (
    playerOwners.find(u => u.active) ??
    playerOwners[0] ??
    owners.find(u => u.active) ??
    owners[0] ??
    null
  );
}
