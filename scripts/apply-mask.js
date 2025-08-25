// modules/greybearded-tokens/scripts/apply-mask.js
import { getGbFrameSettings } from "./settings-snapshot.js";

export const MASK_FLAG = "_gbMaskSprite";
const _GB_MASK_TARGET = Symbol("gbMaskTarget");
const _GB_MASK_DEBUGGED = Symbol("gbMaskDebugged");
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

// Kandidaten: icon → mesh.children → token selbst (falls mit Texture)
function resolveArtworkTarget(token) {
  const list = [];
  if (token.icon) list.push(token.icon);
  if (token.mesh?.children?.length) list.push(...token.mesh.children);
  list.push(token); // Fallback

  const valid = list.filter(c => {
    if (!c || !c.renderable || !c.visible) return false;
    if (c._gbFramePrimary || c._gbFrameSecondary) return false;
    const tex = c.texture;
    const meshTex = c.shader?.texture || tex?.baseTexture;
    return !!(tex?.valid || meshTex?.valid);
  });

  return valid[0] ?? null;
}

export async function applyMaskToToken(token, S) {
  if (!token) return;
  S ||= getGbFrameSettings();

  if (!S.maskEnabled || !S.pathMask) { clearMask(token); return; }

  // Einmalig kleines Debug zur Struktur
  if (!token[_GB_MASK_DEBUGGED]) {
    const kids = (token.mesh?.children ?? []).map(c => `${c.constructor?.name || "?"}:${c.name || "(unnamed)"}`);
    console.log("GBT mask: mesh children →", kids);
    console.log("GBT mask: token.icon →", token.icon);
    console.log("GBT mask: token has texture →", !!token.texture?.valid);
    token[_GB_MASK_DEBUGGED] = true;
  }

  const target = resolveArtworkTarget(token);
  if (!target) return;

  const texValid = !!(target.texture?.valid || target.shader?.texture?.valid || target.texture?.baseTexture?.valid);
  if (!texValid) return;

  const maskTex = await loadMaskOnce(S.pathMask);
  if (!maskTex) return;

  const parent = target.parent ?? token.mesh ?? token;
  let maskSprite = token[MASK_FLAG];

  if (!maskSprite || maskSprite.parent !== parent) {
    clearMask(token);
    maskSprite = new PIXI.Sprite(maskTex);
    maskSprite.name = "gbt-mask";
    parent.addChild(maskSprite);
    token[MASK_FLAG] = maskSprite;
  } else if (maskSprite.texture !== maskTex) {
    maskSprite.texture = maskTex;
  }

  // Anchor/Pivot
  if (target.anchor && typeof target.anchor.x === "number") {
    maskSprite.anchor.set(target.anchor.x, target.anchor.y);
  } else {
    const b = target.getLocalBounds?.() ?? { x: 0, y: 0, width: target.width ?? 1, height: target.height ?? 1 };
    maskSprite.anchor?.set?.(0);
    maskSprite.pivot.set(b.x + b.width / 2, b.y + b.height / 2);
  }

  // Position/Rotation
  if (maskSprite.position.copyFrom) maskSprite.position.copyFrom(target.position);
  else maskSprite.position.set(target.x || 0, target.y || 0);
  maskSprite.rotation = target.rotation || 0;

  // Skalierung
  const b = target.getLocalBounds?.() ?? { width: target.width ?? 1, height: target.height ?? 1 };
  const texW = maskTex.width || maskTex.baseTexture?.realWidth || 1;
  const texH = maskTex.height || maskTex.baseTexture?.realHeight || 1;
  maskSprite.scale.set((b.width || 1) / texW, (b.height || 1) / texH);

  // Maske setzen (direkt aufs Render-Target)
  target.mask = maskSprite;
  token[_GB_MASK_TARGET] = target;
}
