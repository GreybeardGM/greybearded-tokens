import { applyFrameToToken } from "./apply-frame.js";

Hooks.once("init", () => {
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

  game.settings.register("greybearded-tokens", "frameZIndex", {
    name: "Tokenrahmen-Z-Ebene",
    hint: "Legt fest, wie weit oben der Rahmen über dem Token erscheinen soll. Höhere Werte bedeuten höhere Sichtbarkeit, können aber UI-Elemente überdecken.",
    scope: "world",
    config: true,
    type: Number,
    default: 15,
  });

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

  // Bestehende Tokens
  for (const token of canvas.tokens.placeables) {
    if (token.iconGroup) {
      applyFrameToToken(token);
    } else {
      token.once("drawn", () => applyFrameToToken(token));
    }
  }

  // Neue Tokens beim Zeichnen
  Hooks.on("drawToken", token => {
    console.log(`🎨 drawToken → Rahmen wird angewendet für ${token.name}`);
    applyFrameToToken(token);
  });

  // Token wird aktualisiert
  Hooks.on("updateToken", (doc) => {
    const token = canvas.tokens.get(doc.id);
    if (!token) return;

    if (token.iconGroup) {
      applyFrameToToken(token);
    } else {
      token.once("drawn", () => applyFrameToToken(token));
    }
  });
});

