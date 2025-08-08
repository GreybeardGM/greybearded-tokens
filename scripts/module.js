import { applyFrameToToken } from "./apply-frame.js";

Hooks.once("init", () => {
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
