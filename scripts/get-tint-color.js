// get-tint-color.js
import { getPlayerColor } from "./get-player-color.js";

/**
 * Liefert die Rahmenfarbe je nach Tint-Mode.
 * - "Disposition": nutzt Disposition/Typ + Moduleinstellungen (PCs = character-Farbe)
 * - "PlayerColor": nimmt die Spielerfarbe aus dem Snapshot (per ActorID)
 * - "Unicolor": feste Default-Farbe aus Settings
 * - "Advanced": Platzhalter für spätere Logik
 * - "NoTint": kein Tint (null)
 *
 * @param {Token} token
 * @param {"Disposition"|"PlayerColor"|"Unicolor"|"Advanced"|"NoTint"} [tintMode="Disposition"]
 * @returns {string|null} CSS-Farbwert "#RRGGBB" oder null bei NoTint
 */
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
      const actorId = token?.actor?.id ?? null;
      const snapColor = actorId ? getPlayerColor(actorId) : null; // <-- Neuer Weg
      return snapColor ?? defaultColor;
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
