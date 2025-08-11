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
export function getTintColor(token, tintMode = "Disposition") {
  const colorFromSettings = (key, fallback) =>
    game.settings.get("greybearded-tokens", `color-${key}`) || fallback;

  if (tintMode === "NoTint") return null;

  if (tintMode === "PlayerColor") {
    const owner = getOwnerUserForToken(token);
    const css = userColorToCss(owner);
    return css ?? "#888888";
  }

  // Default / "Disposition"
  const disp = token.document?.disposition;
  const actorType = token.actor?.type;
  const hasPlayerOwner = token.actor?.hasPlayerOwner;

  // Spielercharakter → character-Farbe aus Settings (dein bisheriges Verhalten)
  if (actorType === "character" && hasPlayerOwner) {
    return colorFromSettings("character", "#AAAAAA");
  }

  switch (disp) {
    case -1: return colorFromSettings("hostile",  "#993333");
    case  0: return colorFromSettings("neutral",  "#B7A789");
    case  1: return colorFromSettings("friendly", "#5F7A8A");
    case  2: return colorFromSettings("secret",   "#6B5E7A");
    default: return "#555555";
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
