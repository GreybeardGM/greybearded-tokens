// apply-mask.js
import { getGbFrameSettings } from "./settings-snapshot.js";

export const MASK_FLAG = "_gbMaskSprite";
const _GB_MASK_TARGET = Symbol("gbMaskTarget");
const MASK_CACHE = new Map();

async function loadMaskOnce(url) {
  if (!url) return null;
  const cached = MASK_CACHE.get(url);
  if (cached?.baseTexture?.valid) return cached;

  let tex;
  if (PIXI.Assets?.load) {
    const base = await PIXI.Assets.load(url);
    tex = new PIXI.Texture(base);
  } else {
    tex = PIXI.Texture.from(url);
    if (!tex.baseTexture.valid) await new Promise(res => tex.baseTexture.once("loaded", res));
  }
  MASK_CACHE.set(url, tex);
  return tex;
}

export function clearMask(token) {
  try {
    const tgt = token?.[_GB_MASK_TARGET];
    const maskSprite = token?.[MASK_FLAG];
    if (tgt && tgt.mask === maskSprite) tgt.mask = null;
    if (maskSprite?.parent) maskSprite.parent.removeChild(maskSprite);
  } finally {
    if (token) {
      token[MASK_FLAG] = null;
      token[_GB_MASK_TARGET] = null;
    }
  }
}

function getTargetAndParent(token) {
  if (token.mesh) return { target: token.mesh, parent: token.mesh }; // Parent = mesh
  return null;
}

export async function applyMaskToToken(token, S) {
  if (!token) return;
  S ||= getGbFrameSettings();

  // NEU: nur noch gruppierte Settings
  const enabled = !!S?.mask?.enabled;
  const path    = S?.mask?.path;

  if (!enabled || !path) { clearMask(token); return; }

  const tp = getTargetAndParent(token);
  if (!tp) return;
  const { target, parent } = tp;

  // Masken-Textur laden/holen
  let maskSprite = token[MASK_FLAG];
  const maskTex  = await loadMaskOnce(path);
  if (!maskTex) return;

  // Sprite erstellen/umbauen
  if (!maskSprite || maskSprite.parent !== parent) {
    clearMask(token);
    maskSprite = new PIXI.Sprite(maskTex);
    maskSprite.name = "gbt-mask";
    maskSprite.renderable = false;      // nie zeichnen, nur als Maske dienen
    parent.addChild(maskSprite);        // ans mesh hängen
    token[MASK_FLAG] = maskSprite;
  } else if (maskSprite.texture !== maskTex) {
    maskSprite.texture = maskTex;
  }

  // Geometrie exakt auf die LocalBounds des mesh legen
  const b = target.getLocalBounds?.();
  if (!b || !isFinite(b.width) || !isFinite(b.height) || b.width <= 0 || b.height <= 0) return;

  const texW = maskSprite.texture.width  || maskSprite.texture.baseTexture?.realWidth  || 1;
  const texH = maskSprite.texture.height || maskSprite.texture.baseTexture?.realHeight || 1;

  maskSprite.anchor?.set?.(0.5, 0.5);
  maskSprite.position.set(0, 0);        // im mesh-LocalSpace zentriert
  maskSprite.rotation = 0;
  maskSprite.scale.set(b.width / texW, b.height / texH);

  // Maske auf das Mesh setzen
  target.mask = maskSprite;
  token[_GB_MASK_TARGET] = target;
}
