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

  // Neue Tokens (async Polling)
  Hooks.on("createToken", (doc) => {
    const waitForToken = async () => {
      for (let i = 0; i < 10; i++) {
        const token = canvas.tokens.get(doc.id);
        if (token) {
          applyFrameToToken(token);
          return;
        }
        await new Promise(r => setTimeout(r, 50));
      }
      console.warn("⭕ Greybearded Token Frames: Token not found after createToken.", doc);
    };
    waitForToken();
  });

  // Token wird aktualisiert
  Hooks.on("updateToken", (doc) => {
    const token = canvas.tokens.get(doc.id);
    if (token) applyFrameToToken(token);
  });
});
