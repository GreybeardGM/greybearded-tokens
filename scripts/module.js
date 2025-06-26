// greybearded-tokens/module.js

const MODULE_ID = "greybearded-tokens";
const DISPOSITIONS = {
  1: "friendly",
  0: "neutral",
  [-1]: "hostile",
  null: "secret"
};

Hooks.once("init", () => {
  const systemId = game.system.id;
  const actorTypes = Object.keys(CONFIG.Actor.typeLabels ?? {});

  for (const type of actorTypes) {
    for (const [value, label] of Object.entries(DISPOSITIONS)) {
      const key = `framePath_${type}_${label}`;
      game.settings.register(MODULE_ID, key, {
        name: `Rahmenpfad: ${type} (${label})`,
        hint: `Pfad zur PNG-Datei, die für Tokens vom Typ '${type}' mit Disposition '${label}' verwendet werden soll.`,
        scope: "world",
        config: true,
        type: String,
        default: `modules/${MODULE_ID}/frames/${systemId}/${type}/${label}.png`
      });
    }
  }
});

Hooks.on("drawToken", async token => {
  const actor = token.actor;
  if (!actor) return;

  const type = actor.type;
  const disp = token.document.disposition;
  const label = DISPOSITIONS.hasOwnProperty(disp) ? DISPOSITIONS[disp] : "secret";

  const key = `framePath_${type}_${label}`;
  const path = game.settings.get(MODULE_ID, key);

  try {
    const frame = await loadSprite(path);
    frame.width = token.w;
    frame.height = token.h;
    frame.zIndex = 99;

    token.addChild(frame);
    token._gbtFrameSprite = frame;
  } catch (e) {
    console.warn(`[${MODULE_ID}] Frame konnte nicht geladen werden:`, path);
  }
});

Hooks.on("destroyToken", token => {
  if (token._gbtFrameSprite) {
    token._gbtFrameSprite.destroy();
  }
});

async function loadSprite(path) {
  return new Promise((resolve, reject) => {
    const texture = PIXI.Texture.from(path);
    if (!texture.baseTexture.valid) {
      texture.baseTexture.once("loaded", () => resolve(new PIXI.Sprite(texture)));
      texture.baseTexture.once("error", reject);
    } else {
      resolve(new PIXI.Sprite(texture));
    }
  });
}
