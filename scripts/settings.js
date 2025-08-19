// settings.js
import { MOD_ID, TINT_CHOICES } from "./constants.js";

function requestReload() {
  ui.notifications?.info("Greybearded Tokens: Bitte Oberfläche neu laden (F5), um Änderungen zu übernehmen.");
}

export function registerSettings() {
  // ── Basis ───────────────────────────────────────────────────────────────────
  game.settings.register(MOD_ID, "defaultColor", {
    name: "Standardfarbe für Rahmen",
    hint: "Wird genutzt, wenn kein anderer Farbmodus greift.",
    scope: "world",
    config: true,
    type: String,
    default: "#888888"
  });

  // ── Rahmen 1 ────────────────────────────────────────────────────────────────
  game.settings.register(MOD_ID, "path1", {
    name: "Standardbild für Tokenrahmen (Rahmen 1)",
    hint: "Pfad zum PNG/SVG-Bild.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-default.png",
    filePicker: "image",
    onChange: requestReload
  });

  game.settings.register(MOD_ID, "scale1", {
    name: "Skalierung (Rahmen 1)",
    hint: "1 = exakt, 1.05 = größer, 0.95 = kleiner.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, "usePlayerColor1", {
    name: "Use Player Color (Rahmen 1)",
    hint: "Wenn verfügbar, nutze die Spielerfarbe. Sonst Fallback auf Tint-Mode.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, "tintMode1", {
    name: "Einfärbemethode (Rahmen 1)",
    hint: "Bestimmt, wie Rahmen 1 eingefärbt wird (ohne Spielerfarbe).",
    scope: "world",
    config: true,
    type: String,
    choices: TINT_CHOICES,
    default: "Disposition",
    onChange: requestReload
  });

  // ── Rahmen 2 ────────────────────────────────────────────────────────────────
  game.settings.register(MOD_ID, "secondEnabled", {
    name: "Zweiten Rahmen aktivieren",
    hint: "Zusätzlichen Rahmen überlagern.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, "path2", {
    name: "Bildpfad für zweiten Rahmen (Rahmen 2)",
    hint: "Pfad zum PNG/SVG.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-secondary.png",
    filePicker: "image",
    onChange: requestReload
  });

  game.settings.register(MOD_ID, "scale2", {
    name: "Skalierung (Rahmen 2)",
    hint: "1 = exakt; 1.05 = größer; 0.95 = kleiner.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, "usePlayerColor2", {
    name: "Use Player Color (Rahmen 2)",
    hint: "Wenn verfügbar, nutze die Spielerfarbe. Sonst Fallback auf Tint-Mode.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, "tintMode2", {
    name: "Einfärbemethode (Rahmen 2)",
    hint: "Bestimmt, wie Rahmen 2 eingefärbt wird (ohne Spielerfarbe).",
    scope: "world",
    config: true,
    type: String,
    choices: TINT_CHOICES,
    default: "Unicolor",
    onChange: requestReload
  });

  // ── Disposition-Farben ──────────────────────────────────────────────────────
  const colors = {
    "color-hostile":   "#993333",
    "color-neutral":   "#B7A789",
    "color-friendly":  "#5F7A8A",
    "color-secret":    "#6B5E7A",
    "color-character": "#7F7F7F",
  };

  for (const [key, def] of Object.entries(colors)) {
    const label = key.replace("color-", "");
    game.settings.register(MOD_ID, key, {
      name: `Farbe für ${label}`,
      hint: `Rahmenfarbe für ${label === "character" ? "Spielercharaktere" : `Disposition: ${label}`}`,
      scope: "world",
      config: true,
      type: String,
      default: def
    });
  }

  console.log("✅⭕ Greybearded Token Frames: Settings registered.");
}
