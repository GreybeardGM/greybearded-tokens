// get-tint-color.js
import { getPlayerColor } from "./get-player-color.js";

/**
 * Bestimmt die Tint-Farbe für einen Tokenrahmen.
 * - Nutzt ausschließlich den übergebenen Settings-Snapshot S (kein internes Laden).
 * - which = 1 → verwendet S.tintMode1 / S.usePlayerColor1
 * - which = 2 → verwendet S.tintMode2 / S.usePlayerColor2
 * Unterstützte Tint-Modes:
 *   - "NoTint" | "Unicolor" | "Advanced" | "Disposition" | "custom"
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

  // 0) Helper: beliebige Eingaben zu "#rrggbb" normalisieren
  const normalizeToHex = (val) => {
    if (val == null) return null;

    // Numeric (inkl. Number-Objekte)
    if (typeof val === "number" || val instanceof Number) {
      const n = Number(val);
      if (!Number.isFinite(n)) return null;
      const clamped = Math.max(0, Math.min(0xFFFFFF, Math.floor(n)));
      return "#" + clamped.toString(16).padStart(6, "0");
    }

    if (typeof val === "string") {
      const s = val.trim();
      // "#rrggbb" oder "rrggbb"
      const m = s.match(/^#?([0-9a-fA-F]{6})$/);
      if (m) return "#" + m[1].toLowerCase();
    }

    // Optional: [r,g,b]
    if (Array.isArray(val) && val.length === 3) {
      const [r, g, b] = val.map((x) => Math.max(0, Math.min(255, Number(x) || 0)));
      return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
    }

    return null;
  };

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

    case "custom":
    case "Custom": {
      // Farbe aus Token-Flag lesen und normalisieren
      const raw = token?.document?.getFlag?.("greybearded-tokens", "customTint");
      const hex = normalizeToHex(raw);
      return hex ?? defaultColor;
    }

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
