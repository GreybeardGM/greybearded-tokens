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

  const framePath = game.settings.get("greybearded-tokens", "frameImagePath") || 
    "modules/greybearded-tokens/assets/frame-default.png";

  const scaleX = token.document.texture.scaleX ?? 1;
  const scaleY = token.document.texture.scaleY ?? 1;
  const userScale = game.settings.get("greybearded-tokens", "frameScale") ?? 1;

  // Alten Frame entfernen
  const existing = token.iconGroup.children.find(c => c.name === "gb-frame");
  if (existing) token.iconGroup.removeChild(existing);

  // Neuen Frame hinzufügen
  const texture = PIXI.Texture.from(framePath);
  const sprite = new PIXI.Sprite(texture);
  sprite.name = "gb-frame";

  sprite.anchor.set(0.5);
  sprite.width = token.w * scaleX * userScale;
  sprite.height = token.h * scaleY * userScale;
  sprite.x = token.w / 2;
  sprite.y = token.h / 2;

  const tint = getTintColor(token);
  if (tint) sprite.tint = PIXI.utils.string2hex(tint);

  token.iconGroup.addChild(sprite);
}
