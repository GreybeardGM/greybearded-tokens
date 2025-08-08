import { getTintColor } from "./get-tint-color.js";

/**
 * Fügt dem gegebenen Token einen gerahmten Pixi-Sprite hinzu.
 * Entfernt vorhandenen Rahmen, wenn nötig.
 * @param {Token} token
 */
export function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;

  token.sortableChildren = true;

  const framePath = game.settings.get("greybearded-tokens", "frameImagePath");

  const scaleX = token.document.texture.scaleX ?? 1;
  const scaleY = token.document.texture.scaleY ?? 1;
  const userScale = game.settings.get("greybearded-tokens", "frameScale") ?? 1;

  // Remove old frame
  const existing = token.children.find(c => c.name === "gb-frame");
  if (existing) token.removeChild(existing);

  // Add frame sprite
  const texture = PIXI.Texture.from(framePath);
  const sprite = new PIXI.Sprite(texture);
  sprite.name = "gb-frame";

  sprite.anchor.set(0.5);
  sprite.width = token.w * scaleX * userScale;
  sprite.height = token.h * scaleY * userScale;
  sprite.x = token.w / 2;
  sprite.y = token.h / 2;
  sprite.zIndex = -1;

  const tint = getTintColor(token);
  if (tint) sprite.tint = PIXI.utils.string2hex(tint);

  token.addChild(sprite);

}
