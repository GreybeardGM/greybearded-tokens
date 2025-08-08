import { getTintColor } from "./get-tint-color.js";

Hooks.once("init", () => {
  console.log("✅⭕ Greybearded Token Frames initialized.");
});

Hooks.once("ready", () => {
  console.log("✅⭕ Greybearded Token Frames ready.");

  const framePath = "https://assets.forge-vtt.com/6409126bc31700d40e3ac139/Dungeon%20World/Tokens/Frames/player.png";

  function applyFrameToToken(token) {
    // Entferne alten Frame, falls vorhanden
    const existing = token.children.find(c => c.name === "gb-frame");
    if (existing) token.removeChild(existing);

    // Erzeuge neuen Frame
    const texture = PIXI.Texture.from(framePath);
    const sprite = new PIXI.Sprite(texture);
    sprite.name = "gb-frame";

    sprite.anchor.set(0.5);
    sprite.width = token.w;
    sprite.height = token.h;
    sprite.x = token.w / 2;
    sprite.y = token.h / 2;
    sprite.zIndex = 100;

    // Färbung per modularer Funktion
    const tint = getTintColor(token);
    if (tint) sprite.tint = PIXI.utils.string2hex(tint);

    token.addChild(sprite);
  }

  // Wende Rahmen auf vorhandene Tokens an
  for (const token of canvas.tokens.placeables) {
    applyFrameToToken(token);
  }

  // Neue Tokens
  Hooks.on("createToken", (doc) => {
    // Warte, bis das Token tatsächlich auf dem Canvas existiert
    const waitForToken = async () => {
      for (let i = 0; i < 10; i++) {
        const token = canvas.tokens.get(doc.id);
        if (token) {
          applyFrameToToken(token);
          return;
        }
        await new Promise(r => setTimeout(r, 50)); // 50ms warten
      }
      console.warn("⭕ Greybearded Token Frames: Token not found after createToken.", doc);
    };
  
    waitForToken();
  });

  // Token-Änderungen (Größe, Disposition, etc.)
  Hooks.on("updateToken", (doc) => {
    const token = canvas.tokens.get(doc.id);
    if (token) applyFrameToToken(token);
  });
});
