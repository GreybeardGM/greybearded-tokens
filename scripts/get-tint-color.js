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
    // game.user.color kann Zahl (0xRRGGBB) oder bereits String sein
    const uc = game.user?.color;
    if (typeof uc === "number") {
      // PIXI-Zahl → CSS-String
      return PIXI.utils.hex2string(uc); // -> "#rrggbb"
    }
    if (typeof uc === "string" && uc.trim()) {
      // Falls FF-String wie "#aabbcc"
      return uc.startsWith("#") ? uc : `#${uc.replace(/^0x/i, "")}`;
    }
    // Fallback, falls keine User-Farbe verfügbar
    return "#888888";
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
