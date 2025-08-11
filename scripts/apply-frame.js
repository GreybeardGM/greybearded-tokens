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
  // Eindeutige Größe aus dem Token selbst (unabhängig vom Frame)
  const userScale = game.settings.get("greybearded-tokens", "frameScale") ?? 1;
  
  // Wichtig: keine kumulative Skalierung – immer zurück auf 1 setzen
  frame.scale.set(1, 1);
  
  // token.w / token.h = aktuelle gerenderte Pixelgröße des Tokens
  const w = token.w;
  const h = token.h;
  
  frame.width  = w * userScale;
  frame.height = h * userScale;
  
  // Position je nach Koordinatensystem:
  frame.anchor.set(0.5);
  
  // Variante A (meist korrekt in v12): Ursprung oben‑links
  frame.position.set(0, 0);

  // Zur Sicherheit nach Bars einsortieren (falls die eben neu gebaut wurden)
  const barsZ = mesh.bars?.zIndex ?? 20;
  frame.zIndex = barsZ - 1;
}
