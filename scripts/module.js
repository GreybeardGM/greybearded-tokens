import { applyFrameToToken } from "./apply-frame.js";

Hooks.once("init", () => {
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
    choices: {
      10: "Unter dem HUD (10)",
      15: "Über dem Token, unter dem HUD (15)",
      20: "Neben dem HUD (20)",
      30: "Über Zielmarkern (30)",
      40: "Ganz oben (40 – kann UI überdecken)",
    }
  });
  
  console.log("✅⭕ Greybearded Token Frames initialized.");
});

Hooks.once("ready", () => {
  console.log("✅⭕ Greybearded Token Frames ready.");

  // Bestehende Tokens
  for (const token of canvas.tokens.placeables) {
    applyFrameToToken(token);
  }

  // Neue Tokens
  Hooks.on("drawToken", token => {
    console.log(`🎨 drawToken → Rahmen wird angewendet für ${token.name}`);
    applyFrameToToken(token);
  });
  
  // Token wird aktualisiert
  Hooks.on("updateToken", (doc) => {
    const token = canvas.tokens.get(doc.id);
    if (token) applyFrameToToken(token);
  });
});
