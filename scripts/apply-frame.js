// apply-frame.js
import { getTintColor } from "./get-tint-color.js";

const FRAME_FLAG = "_gbFrame";
let CACHED_TEX = null;

async function getFrameTexture() {
  const framePath = game.settings.get("greybearded-tokens", "frameImagePath");
  // Einmalig vorladen, damit Maße konsistent sind
  if (!CACHED_TEX || CACHED_TEX.baseTexture.resource.url !== framePath) {
    // Falls deine Foundry-Version PIXI.Assets hat, nimm das – sonst PIXI.Texture.from
    if (PIXI.Assets?.load) {
      const base = await PIXI.Assets.load(framePath);
      CACHED_TEX = new PIXI.Texture(base);
    } else {
      CACHED_TEX = PIXI.Texture.from(framePath);
      if (!CACHED_TEX.baseTexture.valid) {
        await new Promise(res => CACHED_TEX.baseTexture.once("loaded", res));
      }
    }
  }
  return CACHED_TEX;
}

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
  
  // — deterministische Größe/Position —
  const userScale = Number(game.settings.get("greybearded-tokens", "frameScale")) || 1;
  
  // v12: Mesh-Mitte ist (0,0)
  frame.position.set(0, 0);
  
  // Bars-Z erneut sichern (falls gerade neu erzeugt)
  const barsZ2 = mesh.bars?.zIndex ?? 20;
  frame.zIndex = barsZ2 - 1;

}
