// apply-mask.js
import { getGbFrameSettings } from "./settings-snapshot.js";

const MASK_FLAG = "_gbMaskSprite";
const MASK_CACHE = new Map(); // url -> PIXI.Texture

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
    if (!tex.baseTexture.valid) {
      await new Promise(res => tex.baseTexture.once("loaded", res));
    }
  }
  MASK_CACHE.set(url, tex);
  return tex;
}

export function clearMask(token) {
  const icon = token?.icon;
  const maskSprite = token?.[MASK_FLAG];
  if (icon && icon.mask === maskSprite) icon.mask = null;
  if (maskSprite?.parent) maskSprite.parent.removeChild(maskSprite);
  if (token) token[MASK_FLAG] = null;
}

export async function applyMaskToToken(token, S) {
  if (!token?.icon) return;
  S ||= getGbFrameSettings();

  if (!S.maskEnabled || !S.pathMask) {
    clearMask(token);
    return;
  }

  const icon = token.icon;
  if (!icon.texture || !icon.texture.valid) {
    // ein einziger Retry im nächsten Frame reicht; keine Polling-Schleifen
    PIXI.Ticker.shared.addOnce(() => applyMaskToToken(token, S));
    return;
  }

  const maskTex = await loadMaskOnce(S.pathMask);
  if (!maskTex) {
    clearMask(token);
    return;
  }

  let maskSprite = token[MASK_FLAG];
  if (!maskSprite || !maskSprite.parent) {
    clearMask(token);
    maskSprite = new PIXI.Sprite(maskTex);
    maskSprite.name = "gbt-mask";
    (icon.parent ?? token).addChild(maskSprite);
    token[MASK_FLAG] = maskSprite;
  } else if (maskSprite.texture !== maskTex) {
    // Dieser Fall tritt praktisch nur nach manuellem Snapshot-Wechsel ohne Reload auf.
    maskSprite.texture = maskTex;
  }

  // Geometrie vom Icon spiegeln
  maskSprite.anchor.set(icon.anchor?.x ?? 0.5, icon.anchor?.y ?? 0.5);
  maskSprite.position.set(icon.position.x, icon.position.y);
  maskSprite.rotation = icon.rotation;

  const texW = maskTex.width || maskTex.baseTexture?.realWidth || 1;
  const texH = maskTex.height || maskTex.baseTexture?.realHeight || 1;
  maskSprite.scale.set(icon.width / texW, icon.height / texH);

  icon.mask = maskSprite;
}
