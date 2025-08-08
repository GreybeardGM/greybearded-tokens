import { getTintColor } from "./get-tint-color.js";

/**
 * Fügt dem gegebenen Token einen gerahmten Pixi-Sprite hinzu.
 * Entfernt vorhandenen Rahmen, wenn nötig.
 * @param {Token} token
 */
export function applyFrameToToken(token) {
  const framePath = "https://assets.forge-vtt.com/6409126bc31700d40e3ac139/Dungeon%20World/Tokens/Frames/player.png";

  // Entferne existierenden Frame
  const existing = token.children.find(c => c.name === "gb-frame");
  if (existing) token.removeChild(existing);

  // Erzeuge neuen Sprite
  const texture = PIXI.Texture.from(framePath);
  const sprite = new PIXI.Sprite(texture);
  sprite.name = "gb-frame";

  sprite.anchor.set(0.5);
  sprite.width = token.w;
  sprite.height = token.h;
  sprite.x = token.w / 2;
  sprite.y = token.h / 2;
  sprite.zIndex = 100;

  const tint = getTintColor(token);
  if (tint) sprite.tint = PIXI.utils.string2hex(tint);

  token.addChild(sprite);
}
