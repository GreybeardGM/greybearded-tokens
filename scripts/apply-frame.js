// apply-frame.js
import { getTintColor } from "./get-tint-color.js";

const FRAME_FLAG = "_gbFrame";

export function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;
  const mesh = token.mesh;
  if (!mesh) return;

  mesh.sortableChildren = true;

  // Frame suchen/erstellen
  let frame = mesh.children.find(c => c?.[FRAME_FLAG]);
  if (!frame) {
    const framePath = game.settings.get("greybearded-tokens", "frameImagePath");
    const texture = PIXI.Texture.from(framePath);

    frame = new PIXI.Sprite(texture);
    frame[FRAME_FLAG] = true;
    frame.name = "gb-frame";
    frame.anchor.set(0.5);

    // Z unter Bars, über Artwork (Bars haben meist höheren zIndex)
    const barsZ = mesh.bars?.zIndex ?? 20;
    frame.zIndex = barsZ - 1;

    // Farbe
    const tint = getTintColor(token);
    if (tint) frame.tint = PIXI.utils.string2hex(tint);

    mesh.addChild(frame);
  }

  // Größe/Position jedes Mal neu setzen
  const userScale = game.settings.get("greybearded-tokens", "frameScale") ?? 1;

  // token.w/h = gerenderte Pixelgröße des Tokens (inkl. document width/height & Grid)
  frame.width  = token.w * userScale;
  frame.height = token.h * userScale;

  // Mitte des Tokens (lokale Mesh-Koordinaten)
  frame.position.set(token.w / 2, token.h / 2);

  // Z-Reihenfolge gegen Bars absichern (falls Bars gerade neu gebaut wurden)
  const barsZ = mesh.bars?.zIndex ?? 20;
  frame.zIndex = barsZ - 1;
}
