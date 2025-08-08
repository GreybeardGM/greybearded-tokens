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
    "https://assets.forge-vtt.com/6409126bc31700d40e3ac139/Dungeon%20World/Tokens/Frames/default.png";
  const scaleX = token.document.texture.scaleX ?? 1;
  const scaleY = token.document.texture.scaleY ?? 1;
  const userScale = game.settings.get("greybearded-tokens", "frameScale") ?? 1;

  // Existierende Ebene bereinigen
  if (token.gbFrameLayer) {
    token.removeChild(token.gbFrameLayer);
    token.gbFrameLayer.destroy({ children: true });
  }

  // Neue Ebene erstellen
  const frameLayer = new PIXI.Container();
  frameLayer.name = "gb-frame-layer";
  frameLayer.zIndex = 10;
  frameLayer.sortableChildren = false;

  // Sprite bauen
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

  frameLayer.addChild(sprite);
  token.gbFrameLayer = frameLayer;

  // Nach dem icon, vor bars/effects hinzufügen
  const iconIndex = token.children.indexOf(token.icon);
  token.addChildAt(frameLayer, iconIndex + 1);
  console.log(token.children.map(c => c.name));
}
