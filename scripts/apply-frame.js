import { getTintColor } from "./get-tint-color.js";

/**
 * Fügt dem gegebenen Token einen gerahmten Pixi-Sprite hinzu.
 * Entfernt vorhandenen Rahmen, wenn nötig.
 * @param {Token} token
 */
export function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) {
    console.log(`⛔ Token ${token.name} hat disableFrame-Flag. Rahmen wird nicht angewendet.`);
    return;
  }

  token.sortableChildren = true;
  const framePath = game.settings.get("greybearded-tokens", "frameImagePath") || "https://assets.forge-vtt.com/6409126bc31700d40e3ac139/Dungeon%20World/Tokens/Frames/default.png";
  const scale = game.settings.get("greybearded-tokens", "frameScale") || 1;
  const zIndex = game.settings.get("greybearded-tokens", "frameZIndex");

  // Existierenden Frame entfernen
  const existing = token.children.find(c => c.name === "gb-frame");
  if (existing) token.removeChild(existing);

  // Frame erstellen
  const texture = PIXI.Texture.from(framePath);
  const sprite = new PIXI.Sprite(texture);
  sprite.name = "gb-frame";

  sprite.anchor.set(0.5);
  sprite.width = token.w * scale;
  sprite.height = token.h * scale;
  sprite.x = token.w / 2;
  sprite.y = token.h / 2;
  sprite.zIndex = zIndex;

  const tint = getTintColor(token);
  if (tint) sprite.tint = PIXI.utils.string2hex(tint);

  token.addChild(sprite);
}
