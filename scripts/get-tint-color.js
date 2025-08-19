// get-tint-color.js
import { getPlayerColor } from "./get-player-color.js";

/**
 * Bestimmt die Tint-Farbe für einen Tokenrahmen.
 * - Nutzt ausschließlich den übergebenen Settings-Snapshot S (kein internes Laden).
 * - which = 1 → verwendet S.tintMode1 / S.usePlayerColor1
 * - which = 2 → verwendet S.tintMode2 / S.usePlayerColor2
 *
 * @param {Token} token
 * @param {object} S             Settings-Snapshot aus getGbFrameSettings()
 * @param {1|2} which            Rahmenindex: 1 = Primär, 2 = Sekundär
 * @returns {string|null}        "#rrggbb" oder null (bei NoTint)
 */
export function getTintColor(token, S, which) {
  // Safety
  if (!token || !S || (which !== 1 && which !== 2)) return S?.defaultColor ?? "#888888";

  const defaultColor = S.defaultColor || "#888888";
  const colorFromSnapshot = (key, fallback) => (S.colors?.[key] ?? fallback);

  const usePlayerColor = which === 1 ? !!S.usePlayerColor1 : !!S.usePlayerColor2;
  const tintMode       = which === 1 ? (S.tintMode1 || "Disposition") : (S.tintMode2 || "Disposition");

  // 1) Optional zuerst: Spielerfarbe
  if (usePlayerColor) {
    const actorId = token?.actor?.id ?? null;
    if (actorId) {
      const pc = getPlayerColor(actorId);  // "#rrggbb" oder null
      if (pc) return pc;
    }
    // kein Treffer → mit Tint-Mode fortfahren
  }

  // 2) Tint-Mode
  switch (tintMode) {
    case "NoTint":
      return null;

    case "Unicolor":
      return defaultColor;

    case "Advanced":
      // Platzhalter: hier kann später erweiterte Logik rein (Flags, Zustände, Tags, etc.)
      return defaultColor;

    case "Disposition":
    default: {
      const disp = token?.document?.disposition;
      const actorType = token?.actor?.type;
      const hasPlayerOwner = token?.actor?.hasPlayerOwner;

      if (actorType === "character" && hasPlayerOwner) {
        return colorFromSnapshot("character", defaultColor);
      }

      switch (disp) {
        case -2: return colorFromSnapshot("secret",   defaultColor);
        case -1: return colorFromSnapshot("hostile",  defaultColor);
        case  0: return colorFromSnapshot("neutral",  defaultColor);
        case  1: return colorFromSnapshot("friendly", defaultColor);
        default: return defaultColor;
      }
    }
  }
}
