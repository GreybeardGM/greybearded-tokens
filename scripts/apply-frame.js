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

  const framePath = game.settings.get("greybearded-tokens", "frameImagePath") || 
    "https://assets.forge-vtt.com/6409126bc31700d40e3ac139/Dungeon%20World/Tokens/Frames/default.png";

  const scaleX = token.document.texture.scaleX ?? 1;
  const scaleY = token.document.texture.scaleY ?? 1;
  const userScale = game.settings.get("greybearded-tokens", "frameScale") ?? 1;

  // Existierenden Frame entfernen
  const existing = token.children.find(c => c.name === "gb-frame");
  if (existing) token.removeChild(existing);

  // Frame erstellen
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

  // Wichtig: Frame zwischen Token-Artwork und Bars/Highlight einsortieren
  const iconIndex = token.children.indexOf(token.icon);
  token.addChildAt(sprite, iconIndex + 1); // Direkt über dem Token-Bild
}
