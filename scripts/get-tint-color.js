// get-tint-color.js
import { getPlayerColor } from "./get-player-color.js";
import { DEFAULT_COLORS } from "./constants.js";

/**
 * Liefert die Tint-Farbe für ein Token anhand eines spezifischen Settings-Objekts.
 * Übergib z. B. S.frame1, S.frame2 oder S.nameplate als 'part'.
 *
 * Unterstützte Tint-Modes:
 *   - "NoTint"        → null
 *   - "Unicolor"      → part.defaultColor
 *   - "PlayerColor"   → Spielerfarbe oder part.defaultColor (falls keine Spielerfarbe)
 *   - "Disposition"   → Farben aus S.colors.* (hostile, neutral, friendly, secret, character)
 *   - "ActorType"     → character → S.colors.character, sonst part.defaultColor
 *   - "Advanced"      → aktuell wie Unicolor (Platzhalter für spätere Logik)
 *   - "custom"|"Custom" → Token-Flag 'greybearded-tokens.customTint' (normalisiert), sonst part.defaultColor
 *
 * @param {Token} token            Foundry Token
 * @param {object} S               Gesamtsnapshot (muss S.colors enthalten)
 * @param {object} part            Teil-Settings: { tintMode, usePlayerColor, defaultColor }
 * @returns {string|null}          "#rrggbb" oder null (bei NoTint)
 */
export function getTintColor(token, S, part) {
  if (!token || !S || !part) return "#888888";

  const tintMode       = part.tintMode ?? "Unicolor";
  const usePlayerColor = !!part.usePlayerColor;
  const defaultColor   = normalizeToHex(part.defaultColor) ?? "#888888";

  // 0) Spielerfarbe bevorzugen, wenn aktiviert
  if (usePlayerColor || tintMode === "PlayerColor") {
    const actorId = token?.actor?.id ?? null;
    if (actorId) {
      const pc = getPlayerColor(actorId);   // "#rrggbb" oder null
      if (pc) return pc;
    }
    // kein Treffer → weiter mit Tint-Mode
    if (tintMode === "PlayerColor") return defaultColor;
  }

  switch (tintMode) {
    case "NoTint":
      return null;

    case "Unicolor":
      return defaultColor;

    case "Advanced":
      // Platzhalter für künftige Regeln (Bedingungen/Flags/Status)
      return defaultColor;

    case "custom":
    case "Custom": {
      const raw = token?.document?.getFlag?.("greybearded-tokens", "customTint");
      const hex = normalizeToHex(raw);
      return hex ?? defaultColor;
    }

    case "ActorType": {
      const isPC = token?.actor?.type === "character" && token?.actor?.hasPlayerOwner;
      return isPC ? (S.colors?.character ?? defaultColor) : defaultColor;
    }

    case "Disposition":
    default: {
      const disp = token?.document?.disposition;
      const isPC = token?.actor?.type === "character" && token?.actor?.hasPlayerOwner;
      if (isPC) return S.colors?.character ?? defaultColor;

      switch (disp) {
        case -2: return S.colors?.secret   ?? DEFAULT_COLORS.secret;
        case -1: return S.colors?.hostile  ?? DEFAULT_COLORS.hostile;
        case  0: return S.colors?.neutral  ?? DEFAULT_COLORS.neutral;
        case  1: return S.colors?.friendly ?? DEFAULT_COLORS.friendly;
        default: return defaultColor;
      }
    }
  }
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
