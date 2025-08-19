// get-tint-color.js
import { getGbFrameSettings } from "./settings-snapshot.js";
import { getPlayerColor } from "./get-player-color.js";

/**
 * 1) Wenn usePlayerColor=true und Spielerfarbe existiert → return Spielerfarbe.
 * 2) Sonst Farbe gemäß tintMode. Dabei werden defaultColor & Dispo-Farben AUS DEM SNAPSHOT gelesen.
 *    Der Snapshot wird erst geladen, wenn er wirklich gebraucht wird (lazy).
 *
 * @param {Token} token
 * @param {"NoTint"|"Unicolor"|"Advanced"|"Disposition"} [tintMode="Disposition"]
 * @param {boolean} [usePlayerColor=false]
 * @param {object|null} [S=null] Optional: bereits vorhandener Settings-Snapshot (getGbFrameSettings()).
 * @returns {string|null} "#rrggbb" oder null (bei NoTint)
 */
export function getTintColor(token, tintMode = "Disposition", usePlayerColor = false, S = null) {
  // 1) Optional: Spielerfarbe
  if (usePlayerColor) {
    const actorId = token?.actor?.id ?? null;
    if (actorId) {
      const pc = getPlayerColor(actorId); // "#rrggbb" oder null
      if (pc) return pc;
    }
    // kein Treffer → weiter mit Tint-Mode
  }

  // Lazy Snapshot Loader
  const getS = () => (S ?? (S = getGbFrameSettings()));
  const defaultColor = () => getS().defaultColor || "#888888";
  const colorFromSnapshot = (key, fallback) => (getS().colors?.[key] ?? fallback);

  // 2) Tint-Mode
  switch (tintMode) {
    case "NoTint":
      return null;

    case "Unicolor":
      return defaultColor();

    case "Advanced":
      // TODO: erweiterte Logik (Tags/Flags/Zustände)
      return defaultColor();

    case "Disposition":
    default: {
      const disp = token?.document?.disposition;
      const actorType = token?.actor?.type;
      const hasPlayerOwner = token?.actor?.hasPlayerOwner;

      if (actorType === "character" && hasPlayerOwner) {
        return colorFromSnapshot("character", "#00ff00");
      }

      switch (disp) {
        case -2: return colorFromSnapshot("secret",   "#8000ff");
        case -1: return colorFromSnapshot("hostile",  "#ff0000");
        case  0: return colorFromSnapshot("neutral",  "#ffff00");
        case  1: return colorFromSnapshot("friendly", "#ff8000");
        default: return defaultColor();
      }
    }
  }
}
