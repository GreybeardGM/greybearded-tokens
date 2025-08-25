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

  // ---- Geometry for mesh target (robust via LocalBounds) ----
  const b = target.getLocalBounds?.();
  if (!b || !isFinite(b.width) || !isFinite(b.height) || b.width <= 0 || b.height <= 0) {
    // Wenn das Mesh noch keine Bounds hat, lieber abbrechen – beim nächsten Frame klappt's
    return;
  }
  
  // Maske darf NICHT zeichnen:
  maskSprite.renderable = false;
  
  // Wichtig: Bei Mesh OHNE Anchor zentrieren wir über den Pivot
  // (der Mask-Sprite hängt am selben Parent wie target)
  maskSprite.anchor?.set?.(0); // neutralisieren (falls es ein Sprite ist)
  maskSprite.pivot.set(b.x + b.width / 2, b.y + b.height / 2);
  
  // Position & Rotation 1:1 vom Mesh übernehmen
  if (maskSprite.position.copyFrom) maskSprite.position.copyFrom(target.position);
  else maskSprite.position.set(target.x || 0, target.y || 0);
  maskSprite.rotation = target.rotation || 0;
  
  // Auf die Boundsgröße skalieren
  const texW = maskSprite.texture.width  || maskSprite.texture.baseTexture?.realWidth  || 1;
  const texH = maskSprite.texture.height || maskSprite.texture.baseTexture?.realHeight || 1;
  maskSprite.scale.set(b.width / texW, b.height / texH);
  
  // Maske AUF DAS MESH setzen (nicht auf das Token)
  target.mask = maskSprite;
  token[_GB_MASK_TARGET] = target;

}
