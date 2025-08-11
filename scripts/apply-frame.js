// apply-frame.js
import { getTintColor } from "./get-tint-color.js";

export async function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;

  const mesh = token.mesh;
  if (!mesh) return;

  mesh.sortableChildren = true;

  // ▼ NEU: Tint-Mode aus Settings (sicher mit Fallback)
  const tintMode = game.settings.get("greybearded-tokens", "frameTintMode") ?? "Disposition";

  let frame = mesh.children.find(c => c?._gbFrame);
  if (!frame) {
    const framePath = game.settings.get("greybearded-tokens", "frameImagePath");
    const tex = PIXI.Texture.from(framePath);
    frame = new PIXI.Sprite(tex);
    frame._gbFrame = true;
    frame.name = "gb-frame";
    frame.anchor.set(0.5);

    // ▼ NEU: initialen Tint setzen
    const tint = getTintColor(token, tintMode);
    frame.tint = tint ? PIXI.utils.string2hex(tint) : 0xFFFFFF;

    const barsZ = mesh.bars?.zIndex ?? 20;
    frame.zIndex = barsZ - 1;
    mesh.addChild(frame);
  }

  // ▼ NEU: Tint bei jedem Aufruf aktualisieren (Disposition/Setting kann sich geändert haben)
  {
    const tint = getTintColor(token, tintMode);
    frame.tint = tint ? PIXI.utils.string2hex(tint) : 0xFFFFFF;
  }

  const userScale = Number(game.settings.get("greybearded-tokens","frameScale")) || 1;

  // Starte neutral
  frame.scale.set(1,1);
  frame.anchor.set(0.5);
  frame.position.set(0,0);

  // Größe der Kachel
  const kW = token.w;
  const kH = token.h;

  // Eltern-Skalierung
  const sx = mesh.scale.x || 1;
  const sy = mesh.scale.y || 1;

  // Textur-Skalierung
  const tx = Math.abs(token.document.texture?.scaleX ?? 1);
  const ty = Math.abs(token.document.texture?.scaleY ?? 1);

  // Größe mit Eltern- und Textur-Skalierung
  frame.width  = (kW * tx * userScale) / sx;
  frame.height = (kH * ty * userScale) / sy;

  // v12: Mesh-Mitte ist (0,0)
  frame.position.set(0, 0);

  // Bars-Z erneut sichern
  const barsZ2 = mesh.bars?.zIndex ?? 20;
  frame.zIndex = barsZ2 - 1;
}
