// apply-mask.js
import { getGbFrameSettings } from "./settings-snapshot.js";

const MASK_FLAG = "_gbMaskSprite";
const _GB_MASK_TARGET = Symbol("gbMaskTarget");
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

// minimal robust: bevorzugt token.icon; wenn nicht brauchbar, suche in mesh.children
function resolveArtworkTarget(token) {
  const list = [];
  if (token.icon) list.push(token.icon);
  if (token.mesh?.children?.length) list.push(...token.mesh.children);

  const valid = list.filter(c => {
    if (!c || !c.renderable || !c.visible) return false;
    if (c._gbFramePrimary || c._gbFrameSecondary) return false; // unsere Rahmen nicht maskieren
    // Sprite?
    if (c.texture?.valid) return true;
    // Mesh?
    if (c.shader?.texture?.valid || c.texture?.baseTexture?.valid) return true;
    return false;
  });

  // nimm den ersten „echten“ Kandidaten (meist token.icon)
  return valid[0] ?? null;
}

/**
 * Wendet/aktualisiert die Maske auf einem Token – ohne Ticker-Retries.
 * Falls Ziel/Texture noch nicht ready: bricht leise ab.
 */
export async function applyMaskToToken(token, S) {
  if (!token) return;
  S ||= getGbFrameSettings();

  if (!S.maskEnabled || !S.pathMask) {
    clearMask(token);
    return;
  }

  // 1) Ziel ermitteln (Sprite oder Mesh). Wenn keins → sofort aufgeben.
  const target = resolveArtworkTarget(token);
  if (!target) return;

  // 2) Texture vorhanden? Falls nein → leise aufgeben.
  const texValid = !!(target.texture?.valid || target.shader?.texture?.valid || target.texture?.baseTexture?.valid);
  if (!texValid) return;

  // 3) Masken-Textur laden
  const maskTex = await loadMaskOnce(S.pathMask);
  if (!maskTex) return;

  // 4) Masken-Sprite sicherstellen (im selben Parent wie das Target)
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

  // 5) Geometrie angleichen (Anchor/Pivot robust)
  if (target.anchor && typeof target.anchor.x === "number") {
    maskSprite.anchor.set(target.anchor.x, target.anchor.y);
  } else {
    // Zentrieren via Pivot
    const b = target.getLocalBounds?.() ?? { x: 0, y: 0, width: target.width ?? 1, height: target.height ?? 1 };
    maskSprite.anchor?.set?.(0);
    maskSprite.pivot.set(b.x + b.width / 2, b.y + b.height / 2);
  }

  // Position/Rotation
  if (maskSprite.position.copyFrom) maskSprite.position.copyFrom(target.position);
  else maskSprite.position.set(target.x, target.y);
  maskSprite.rotation = target.rotation;

  // Skalierung anhand Zielgröße
  const b = target.getLocalBounds?.() ?? { width: target.width ?? 1, height: target.height ?? 1 };
  const texW = maskTex.width || maskTex.baseTexture?.realWidth || 1;
  const texH = maskTex.height || maskTex.baseTexture?.realHeight || 1;
  maskSprite.scale.set((b.width || 1) / texW, (b.height || 1) / texH);

  // 6) Maske setzen
  target.mask = maskSprite;
  token[_GB_MASK_TARGET] = target;
}
