// apply-mask.js
import { getGbFrameSettings } from "./settings-snapshot.js";

export const MASK_FLAG = "_gbMaskSprite";
const _GB_MASK_TARGET   = Symbol("gbMaskTarget");
const _GB_MASK_DEBUGGED = Symbol("gbMaskDebugged");
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

/** wir maskieren IMMER das Mesh, und hängen die Maske als Kind am Token ein */
function getTargetAndParent(token) {
  if (token.mesh) return { target: token.mesh, parent: token };
  return null;
}

export async function applyMaskToToken(token, S) {
  if (!token) return;
  S ||= getGbFrameSettings();

  if (!S.maskEnabled || !S.pathMask) { clearMask(token); return; }

  // Einmaliges Debug zur Struktur
  if (!token[_GB_MASK_DEBUGGED]) {
    const kids = (token.mesh?.children ?? []).map(c => `${c.constructor?.name || "?"}:${c.name || "(unnamed)"}`);
    console.log("GBT mask: mesh children →", kids);
    console.log("GBT mask: token.icon →", token.icon);
    console.log("GBT mask: token.mesh? →", !!token.mesh);
    token[_GB_MASK_DEBUGGED] = true;
  }

  const tp = getTargetAndParent(token);
  if (!tp) return;
  const { target, parent } = tp;

  // Masken-Sprite sicherstellen (am TOKEN anhängen, nicht am Layer!)
  let maskSprite = token[MASK_FLAG];
  const maskTex  = await loadMaskOnce(S.pathMask);
  if (!maskTex) return;

  if (!maskSprite || maskSprite.parent !== parent) {
    clearMask(token);
    maskSprite = new PIXI.Sprite(maskTex);
    maskSprite.name = "gbt-mask";
    maskSprite.renderable = false; // Maske NICHT zeichnen
    parent.addChild(maskSprite);
    token[MASK_FLAG] = maskSprite;
  } else if (maskSprite.texture !== maskTex) {
    maskSprite.texture = maskTex;
  }

  // --- Geometrie identisch zu apply-frame.js (für mesh) ---
  const sx = target.scale?.x || 1;
  const sy = target.scale?.y || 1;
  const tx = Math.abs(token.document?.texture?.scaleX ?? 1);
  const ty = Math.abs(token.document?.texture?.scaleY ?? 1);
  
  // Zielgröße wie bei den Rahmen:
  const w = (token.w * tx) / sx;
  const h = (token.h * ty) / sy;
  
  // Maske darf nie sichtbar gezeichnet werden
  maskSprite.renderable = false;
  
  // Sprite-Anker mittig, Position (0,0) im selben Parent wie mesh
  // (mesh ist zentriert, deine Frames stehen genauso)
  maskSprite.anchor?.set?.(0.5, 0.5);
  maskSprite.position.set(0, 0);
  maskSprite.rotation = 0;
  
  // auf Zielgröße skalieren (Texture-Px -> Token-Px)
  const texW = maskSprite.texture.width  || maskSprite.texture.baseTexture?.realWidth  || 1;
  const texH = maskSprite.texture.height || maskSprite.texture.baseTexture?.realHeight || 1;
  maskSprite.scale.set(w / texW, h / texH);
  
  // Maske AUF DAS MESH setzen (nicht auf den Token selbst)
  target.mask = maskSprite;
  token[_GB_MASK_TARGET] = target;

}
