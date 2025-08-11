import { applyFrameToToken } from "./apply-frame.js";

Hooks.once("init", () => {

  // ──────────────────────────────────────────────────────────────────────────────
  // Einfärbemethode
  // ──────────────────────────────────────────────────────────────────────────────
  const TINT_CHOICES = {
    Disposition: "Disposition",
    PlayerColor: "Player Color",
    NoTint: "No Tint"
  };

  game.settings.register("greybearded-tokens", "frameImagePath", {
    name: "Standardbild für Tokenrahmen",
    hint: "Pfad zum PNG/SVG-Bild, das als Tokenrahmen verwendet wird.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-default.png",
    filePicker: "image"  // aktiviert den Datei-Browser für Bilddateien
  });

  game.settings.register("greybearded-tokens", "frameScale", {
    name: "Token Frame Scale",
    hint: "Verändert die Größe des Tokenrahmens relativ zum Token selbst. 1 = exakt gleich groß, 1.05 = leicht größer, 0.95 = leicht kleiner.",
    scope: "world",
    config: true,
    type: Number,
    default: 1
  });
  
  game.settings.register("greybearded-tokens", "frameTintMode", {
    name: "Einfärbemethode (Rahmen 1)",
    hint: "Bestimmt, wie der erste Rahmen eingefärbt wird.",
    scope: "world",
    config: true,
    type: String,
    choices: TINT_CHOICES,
    default: "Disposition"
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Zweiter Rahmen: Settings
  // ──────────────────────────────────────────────────────────────────────────────
  game.settings.register("greybearded-tokens", "secondaryFrameEnabled", {
    name: "Zweiten Rahmen aktivieren",
    hint: "Wenn aktiviert, wird zusätzlich zum Standardrahmen ein zweiter Rahmen überlagert.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  
  game.settings.register("greybearded-tokens", "secondaryFrameImagePath", {
    name: "Bildpfad für zweiten Rahmen",
    hint: "Pfad zum PNG/SVG, das als zweiter Tokenrahmen verwendet wird.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-secondary.png",
    filePicker: "image"
  });
  
  game.settings.register("greybearded-tokens", "secondaryFrameTintMode", {
    name: "Einfärbemethode (Rahmen 2)",
    hint: "Bestimmt, wie der zweite Rahmen eingefärbt wird.",
    scope: "world",
    config: true,
    type: String,
    choices: TINT_CHOICES,
    default: "PlayerColor"
  });
  
  game.settings.register("greybearded-tokens", "secondaryFrameScale", {
    name: "Skalierung des zweiten Rahmens",
    hint: "Größe relativ zum Token. 1 = exakt Token-Größe; 1.05 = etwas größer; 0.95 = etwas kleiner.",
    scope: "world",
    config: true,
    type: Number,
    default: 1
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Farben
  // ──────────────────────────────────────────────────────────────────────────────
  const defaultColors = {
    hostile: "#993333",
    neutral: "#B7A789",
    friendly: "#5F7A8A",
    secret: "#6B5E7A",
    character: "#7F7F7F"
  };

  for (const [key, defaultValue] of Object.entries(defaultColors)) {
    game.settings.register("greybearded-tokens", `color-${key}`, {
      name: `Farbe für ${key}`,
      hint: `Rahmenfarbe für ${key === "character" ? "Spielercharaktere" : `Disposition: ${key}`}`,
      scope: "world",
      config: true,
      type: String,
      default: defaultValue
    });
  }

  console.log("✅⭕ Greybearded Token Frames initialized.");
});

Hooks.once("ready", () => {
  console.log("✅⭕ Greybearded Token Frames ready.");

  Hooks.on("refreshToken", (token) => {
    console.log(`🎨 refreshToken → Rahmen wird angewendet für ${token.name}`);
    applyFrameToToken(token);
  });

});
