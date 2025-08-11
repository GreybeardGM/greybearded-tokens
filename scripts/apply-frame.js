// apply-frame.js
import { getTintColor } from "./get-tint-color.js";

export async function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;
  // ... innerhalb von applyFrameToToken(token)
  const mesh = token.mesh;
  if (!mesh) return;
  
  mesh.sortableChildren = true;
  
  let frame = mesh.children.find(c => c?._gbFrame);
  if (!frame) {
    const framePath = game.settings.get("greybearded-tokens", "frameImagePath");
    const tex = PIXI.Texture.from(framePath);
    frame = new PIXI.Sprite(tex);
    frame._gbFrame = true;
    frame.name = "gb-frame";
    frame.anchor.set(0.5);
  
    const tint = getTintColor(token);
    if (tint) frame.tint = PIXI.utils.string2hex(tint);
  
    const barsZ = mesh.bars?.zIndex ?? 20;
    frame.zIndex = barsZ - 1;
  
    mesh.addChild(frame);
  }
  
  // Frame bleibt: mesh.addChild(frame)
  
  const userScale = Number(game.settings.get("greybearded-tokens","frameScale")) || 1;
  
  // Starte neutral
  frame.scale.set(1,1);
  frame.anchor.set(0.5);
  frame.position.set(0,0);
  
  // Größe der Kachel
  const kW = token.w;
  const kH = token.h;
  
  // Eltern-Skalierung (das Problemkind)
  const sx = mesh.scale.x || 1;
  const sy = mesh.scale.y || 1;
  
  // Textur-Skalierung (per Token-Dokument gesetzt)
  const tx = Math.abs(token.document.texture?.scaleX ?? 1);
  const ty = Math.abs(token.document.texture?.scaleY ?? 1);
  
  // Breite/Höhe so setzen, dass die geerbte Eltern-Skalierung kompensiert
  // UND der Textur-Zoom berücksichtigt wird
  frame.width  = (kW * tx * userScale) / sx;
  frame.height = (kH * ty * userScale) / sy;
  
  // v12: Mesh-Mitte ist (0,0)
  frame.position.set(0, 0);
  
  // Bars-Z erneut sichern (falls gerade neu erzeugt)
  const barsZ2 = mesh.bars?.zIndex ?? 20;
  frame.zIndex = barsZ2 - 1;

}
