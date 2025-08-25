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
    if (!tex.baseTexture.valid) await new Promise(res => tex.baseTexture.once("loaded", res));
  }
  MASK_CACHE.set(url, tex);
  return tex;
}

export function clearMask(token) {
  const tgt = token?.[_GB_MASK_TARGET]; // s.u. setzen wir den Ziel-Ref
  const maskSprite = token?.[MASK_FLAG];
  if (tgt && tgt.mask === maskSprite) tgt.mask = null;
  if (maskSprite?.parent) maskSprite.parent.removeChild(maskSprite);
  if (token) {
    token[MASK_FLAG] = null;
    token[_GB_MASK_TARGET] = null;
  }
}

// internes Symbol, damit wir nicht mit anderen Props kollidieren
const _GB_MASK_TARGET = Symbol("gbMaskTarget");

/** robust: finde das eigentliche Artwork-DisplayObject (Sprite oder Mesh) */
function resolveArtworkTarget(token) {
  // 1) direkte Kandidaten
  const candidates = [];
  if (token.icon) candidates.push(token.icon);
  if (token.mesh) candidates.push(...token.mesh.children);

  // 2) filtern: echtes Bild/Mesh mit gültiger Textur, nicht unsere Frames/Bars/Borders
  const valid = candidates.filter(c => {
    if (!c || !c.renderable || !c.visible) return false;
    if (c._gbFramePrimary || c._gbFrameSecondary) return false; // unsere Rahmen
    if (c === token.bars || c === token.border || c === token.nameplate) return false;

    // Sprite mit Texture?
    if (c.texture?.valid) return true;
    // Mesh mit Texture?
    if (c.shader?.texture?.valid || c.texture?.baseTexture?.valid) return true;

    return false;
  });

  // 3) nimm den größten (falls mehrere)
  let best = null; let area = -1;
  for (const c of valid) {
    const b = c.getLocalBounds?.() ?? { width: c.width ?? 0, height: c.height ?? 0 };
    const a = (b.width || 0) * (b.height || 0);
    if (a > area) { area = a; best = c; }
  }
  return best ?? null;
}

export async function applyMaskToToken(token, S) {
  if (!token) return;
  S ||= getGbFrameSettings();

  if (!S.maskEnabled || !S.pathMask) {
    clearMask(token);
    return;
  }

  // Ziel ermitteln (Sprite oder Mesh)
  const target = resolveArtworkTarget(token);
  if (!target) {
    // beim nächsten Frame nochmal versuchen (erst wenn alles gezeichnet ist)
    PIXI.Ticker.shared.addOnce(() => applyMaskToToken(token, S));
    return;
  }

  // Texture vorhanden?
  const hasTex = !!(target.texture?.valid || target.shader?.texture?.valid || target.texture?.baseTexture?.valid);
  if (!hasTex) {
    PIXI.Ticker.shared.addOnce(() => applyMaskToToken(token, S));
    return;
  }

  // Masken-Textur laden
  const maskTex = await loadMaskOnce(S.pathMask);
  if (!maskTex) {
    clearMask(token);
    return;
  }

  // Masken-Sprite anlegen (im selben Parent wie das Target!)
  let maskSprite = token[MASK_FLAG];
  const parent = target.parent ?? token.mesh ?? token;

  if (!maskSprite || maskSprite.parent !== parent) {
    clearMask(token);
    maskSprite = new PIXI.Sprite(maskTex);
    maskSprite.name = "gbt-mask";
    parent.addChild(maskSprite);
    token[MASK_FLAG] = maskSprite;
  } else if (maskSprite.texture !== maskTex) {
    maskSprite.texture = maskTex;
  }

  // Geometrie: an Target angleichen
  // Anker/Pivot: robust über Pivot zentrieren, falls kein Anchor existiert
  const hasAnchor = typeof maskSprite.anchor?.set === "function" && typeof target.anchor?.x === "number";
  if (hasAnchor) {
    maskSprite.anchor.set(target.anchor.x, target.anchor.y);
  } else {
    // auf Mitte zentrieren via Pivot
    const tb = target.getLocalBounds?.() ?? { width: target.width, height: target.height, x: 0, y: 0 };
    maskSprite.anchor?.set?.(0); // falls vorhanden, neutralisieren
    maskSprite.pivot.set(tb.x + tb.width / 2, tb.y + tb.height / 2);
  }

  // Position/Rotation/Scale angleichen
  maskSprite.position.copyFrom?.(target.position) ?? maskSprite.position.set(target.x, target.y);
  maskSprite.rotation = target.rotation;

  // Zielgröße bestimmen
  const tb = target.getLocalBounds?.() ?? { width: target.width ?? 1, height: target.height ?? 1 };
  const texW = maskTex.width || maskTex.baseTexture?.realWidth || 1;
  const texH = maskTex.height || maskTex.baseTexture?.realHeight || 1;
  const sx = (tb.width  || 1) / texW;
  const sy = (tb.height || 1) / texH;
  maskSprite.scale.set(sx, sy);

  // WICHTIG: die Maske auf das **Target** setzen (nicht auf token oder mesh)
  target.mask = maskSprite;

  // merken, welches Target wir gemaskt haben (für sauberes clear)
  token[_GB_MASK_TARGET] = target;
}
