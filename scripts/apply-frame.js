// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
const FRAME_FLAG = "_gbFrame";

export function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;
  const mesh = token.mesh;
  if (!mesh) return;

  mesh.sortableChildren = true;

  let frame = mesh.children.find(c => c?.[FRAME_FLAG]);
  if (!frame) {
    const framePath = game.settings.get("greybearded-tokens", "frameImagePath");
    const texture = PIXI.Texture.from(framePath);

    frame = new PIXI.Sprite(texture);
    frame[FRAME_FLAG] = true;
    frame.name = "gb-frame";
    frame.anchor.set(0.5);

    // unter Bars, über Artwork
    const barsZ = mesh.bars?.zIndex ?? 20;
    frame.zIndex = barsZ - 1;

    const tint = getTintColor(token);
    if (tint) frame.tint = PIXI.utils.string2hex(tint);

    mesh.addChild(frame);
  }

  // === WICHTIG: Größe/Position im lokalen Mesh-Koordinatensystem ===
  const userScale = game.settings.get("greybearded-tokens", "frameScale") ?? 1;

  // In v12 ist (0,0) die MITTE des Mesh. Also Frame mittig bei (0,0) lassen.
  frame.position.set(0, 0);

  // Robuste Maße: lokale Bounds des Mesh (entsprechen der sichtbaren Tokenfläche)
  const b = mesh.getLocalBounds();            // { x:-w/2, y:-h/2, width:w, height:h }
  const w = b.width;
  const h = b.height;

  frame.width  = w * userScale;
  frame.height = h * userScale;

  // Zur Sicherheit nach Bars einsortieren (falls die eben neu gebaut wurden)
  const barsZ = mesh.bars?.zIndex ?? 20;
  frame.zIndex = barsZ - 1;
}
