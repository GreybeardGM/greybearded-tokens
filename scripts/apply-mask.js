// apply-mask.js
import { getGbFrameSettings } from "./settings-snapshot.js";

export const MASK_FLAG = "_gbMaskSprite";
const _GB_MASK_TARGET   = Symbol("gbMaskTarget");
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

// In v12 ist meist kein token.icon vorhanden; Artwork hängt quasi „am Token“.
// -> Wir maskieren dann den Token selbst, ABER hängen die Maske als Kind an den Token (nicht an den Layer!).
function resolveTargetAndParent(token) {
  // bevorzugt: expliziter Sprite falls vorhanden
  if (token.icon?.texture?.valid) return { target: token.icon, parent: token.icon.parent ?? token };
  // Fallback: Token selbst maskieren, Maske ALS KIND DES TOKENS anhängen
  return { target: token, parent: token };
}

export async function applyMaskToToken(token, S) {
  if (!token) return;
  S ||= getGbFrameSettings();

  if (!S.maskEnabled || !S.pathMask) { clearMask(token); return; }

  // Einmaliges Debug pro Token – hilft bei Strukturfragen
  if (!token[_GB_MASK_DEBUGGED]) {
    const kids = (token.mesh?.children ?? []).map(c => `${c.constructor?.name || "?"}:${c.name || "(unnamed)"}`);
    console.log("GBT mask: mesh children →", kids);
    console.log("GBT mask: token.icon →", token.icon);
    console.log("GBT mask: token has texture →", !!token.texture?.valid);
    token[_GB_MASK_DEBUGGED] = true;
  }

  const { target, parent } = resolveTargetAndParent(token);
  if (!target) return;

  // Prüfen, ob das Target überhaupt rendert
  const texValid =
    !!(target.texture?.valid ||
       target.shader?.texture?.valid ||
       target.texture?.baseTexture?.valid ||
       target === token); // Token als Container ist ok

  if (!texValid) return;

  // Masken-Textur laden
  const maskTex = await loadMaskOnce(S.pathMask);
  if (!maskTex) return;

  // Masken-Sprite sicherstellen – WICHTIG: Parent NIEMALS der Layer-Objects-Container
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

  // Geometrie:
  if (target === token) {
    // (A) Token-Container maskieren → zentriert (0,0), keine Rotation
    // Größe analog zu deinen Frames berechnen
    const sx = token.mesh?.scale.x || 1;
    const sy = token.mesh?.scale.y || 1;
    const tx = Math.abs(token.document?.texture?.scaleX ?? 1);
    const ty = Math.abs(token.document?.texture?.scaleY ?? 1);

    const w  = (token.w * tx * 1) / sx;
    const h  = (token.h * ty * 1) / sy;

    const texW = maskTex.width || maskTex.baseTexture?.realWidth || 1;
    const texH = maskTex.height || maskTex.baseTexture?.realHeight || 1;

    maskSprite.anchor?.set?.(0.5, 0.5);
    maskSprite.position.set(0, 0);
    maskSprite.rotation = 0;
    maskSprite.scale.set(w / texW, h / texH);
  } else {
    // (B) Explizites Sprite/Mesh maskieren → Anchor/Pos/Rot spiegeln
    if (target.anchor && typeof target.anchor.x === "number") {
      maskSprite.anchor.set(target.anchor.x, target.anchor.y);
    } else {
      maskSprite.anchor?.set?.(0.5);
    }
    if (maskSprite.position.copyFrom) maskSprite.position.copyFrom(target.position);
    else maskSprite.position.set(target.x || 0, target.y || 0);
    maskSprite.rotation = target.rotation || 0;

    const b    = target.getLocalBounds?.() ?? { width: target.width ?? 1, height: target.height ?? 1 };
    const texW = maskTex.width || maskTex.baseTexture?.realWidth || 1;
    const texH = maskTex.height || maskTex.baseTexture?.realHeight || 1;
    maskSprite.scale.set((b.width || 1) / texW, (b.height || 1) / texH);
  }

  // Maske setzen (direkt aufs Target; bei (A) ist target === token)
  try {
    target.mask = maskSprite;
  } catch (e) {
    console.warn("GBT mask: could not set mask on target", target, e);
    return;
  }

  token[_GB_MASK_TARGET] = target;
}
