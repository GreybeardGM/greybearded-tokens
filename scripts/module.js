import { applyFrameToToken } from "./apply-frame.js";

Hooks.once("init", () => {
  game.settings.register("greybearded-tokens", "frameScale", {
    name: "Token Frame Scale",
    hint: "Verändert die Größe des Tokenrahmens relativ zum Token selbst. 1 = exakt gleich groß, 1.1 = etwas größer.",
    scope: "client",
    config: true,
    type: Number,
    default: 1,
    range: {
      min: 0.5,
      max: 2,
      step: 0.01
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
