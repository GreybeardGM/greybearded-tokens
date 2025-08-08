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
    const maxRetries = 10;
    const retryDelay = 50; // ms
  
    const tryApplyFrame = async (attempt = 0) => {
      const token = canvas.tokens.get(doc.id);
      if (token) {
        console.log(`⭕ createToken → Rahmen angewendet bei Versuch #${attempt + 1} für ${token.name}`);
        applyFrameToToken(token);
      } else if (attempt < maxRetries) {
        setTimeout(() => tryApplyFrame(attempt + 1), retryDelay);
      } else {
        console.warn("❌ createToken → Kein Token gefunden nach 10 Versuchen:", doc);
      }
    };
  
    tryApplyFrame();
  });

  // Token wird aktualisiert
  Hooks.on("updateToken", (doc) => {
    const token = canvas.tokens.get(doc.id);
    if (token) applyFrameToToken(token);
  });
});
