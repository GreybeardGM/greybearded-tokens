import { MOD_ID, SETTING_KEYS, TINT_CHOICES } from "./constants.js";

function requestReload() {
  ui.notifications?.info("Greybearded Tokens: Bitte Oberfläche neu laden (F5), um Änderungen zu übernehmen.");
}

export function registerSettings() {
  // Basis
  game.settings.register(MOD_ID, SETTING_KEYS.defaultFrameColor, {
    name: "Standardfarbe für Rahmen",
    hint: "Wird genutzt, wenn kein anderer Farbmodus greift.",
    scope: "world",
    config: true,
    type: String,
    default: "#888888"
  });

  // ── Rahmen 1 ────────────────────────────────────────────────────────────────
  game.settings.register(MOD_ID, SETTING_KEYS.frameImagePath, {
    name: "Standardbild für Tokenrahmen",
    hint: "Pfad zum PNG/SVG-Bild, das als Tokenrahmen verwendet wird.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-default.png",
    filePicker: "image",
    onChange: requestReload
  });

  game.settings.register(MOD_ID, SETTING_KEYS.frameScale, {
    name: "Token Frame Scale",
    hint: "1 = exakt, 1.05 = größer, 0.95 = kleiner.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, SETTING_KEYS.usePlayerColor1, {
    name: "Use Player Color (Rahmen 1)",
    hint: "Wenn verfügbar, nutze die Spielerfarbe für Rahmen 1. Fällt zurück auf die gewählte Einfärbemethode.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, SETTING_KEYS.frameTintMode, {
    name: "Einfärbemethode (Rahmen 1)",
    hint: "Bestimmt, wie Rahmen 1 eingefärbt wird (ohne Spielerfarbe).",
    scope: "world",
    config: true,
    type: String,
    choices: TINT_CHOICES,
    default: "Disposition",
    onChange: requestReload
  });

  game.settings.register(MOD_ID, SETTING_KEYS.secondaryFrameEnabled, {
    name: "Zweiten Rahmen aktivieren",
    hint: "Zusätzlichen Rahmen überlagern.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, SETTING_KEYS.secondaryFrameImagePath, {
    name: "Bildpfad für zweiten Rahmen",
    hint: "Pfad zum PNG/SVG.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-secondary.png",
    filePicker: "image",
    onChange: requestReload
  });

  game.settings.register(MOD_ID, SETTING_KEYS.usePlayerColor2, {
    name: "Use Player Color (Rahmen 2)",
    hint: "Wenn verfügbar, nutze die Spielerfarbe für Rahmen 2. Fällt zurück auf die gewählte Einfärbemethode.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: requestReload
  });

  game.settings.register(MOD_ID, SETTING_KEYS.secondaryFrameTintMode, {
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
  const defaultColors = {
    [SETTING_KEYS.colorHostile]: "#993333",
    [SETTING_KEYS.colorNeutral]: "#B7A789",
    [SETTING_KEYS.colorFriendly]: "#5F7A8A",
    [SETTING_KEYS.colorSecret]: "#6B5E7A",
    [SETTING_KEYS.colorCharacter]: "#7F7F7F",
  };

  for (const [key, def] of Object.entries(defaultColors)) {
    const label = key.split("color-")[1] || key;
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
