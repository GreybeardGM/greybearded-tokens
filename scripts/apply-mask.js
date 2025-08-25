// apply-mask.js
const MASK_FLAG = "_gbMaskSprite";
const _GB_MASK_TARGET = Symbol("gbMaskTarget");
const _GB_MASK_DEBUGGED = Symbol("gbMaskDebugged");
const MASK_CACHE = new Map();

function listChildrenNames(d) {
  return (d?.children ?? []).map(c => `${c.constructor?.name || "?"}:${c.name || "(unnamed)"}`);
}

function resolveArtworkTarget(token) {
  const candidates = [];

  // 1) offensichtliche Kandidaten
  if (token.icon) candidates.push(token.icon);
  if (token.mesh?.children?.length) candidates.push(...token.mesh.children);

  // 2) Fallback: das Token selbst, wenn es eine gültige Textur trägt
  candidates.push(token);

  // 3) filtern auf echte Render-Ziele (Sprite/Mesh) mit gültiger Textur
  const valid = candidates.filter(c => {
    if (!c || !c.renderable || !c.visible) return false;
    if (c._gbFramePrimary || c._gbFrameSecondary) return false;
    const tex = c.texture;
    const meshTex = c.shader?.texture || tex?.baseTexture;
    return !!(tex?.valid || meshTex?.valid);
  });

  // zuerst der wahrscheinlich richtige
  return valid[0] ?? null;
}

export async function applyMaskToToken(token, S) {
  if (!token) return;
  S ||= getGbFrameSettings();

  if (!S.maskEnabled || !S.pathMask) { clearMask(token); return; }

  // — Debug einmalig pro Token — (hilft uns, die Struktur zu sehen)
  if (!token[_GB_MASK_DEBUGGED]) {
    const kids = listChildrenNames(token.mesh);
    console.log("GBT mask: mesh children →", kids);
    console.log("GBT mask: token.icon →", token.icon);
    console.log("GBT mask: token has texture →", !!token.texture?.valid);
    token[_GB_MASK_DEBUGGED] = true;
  }

  const target = resolveArtworkTarget(token);
  if (!target) return;

  // Textur wirklich da?
  const texValid = !!(target.texture?.valid || target.shader?.texture?.valid || target.texture?.baseTexture?.valid);
  if (!texValid) return;

  // Masken-Textur laden (einmal pro URL)
  const maskTex = await loadMaskOnce(S.pathMask);
  if (!maskTex) return;

  // Maske im selben Parent wie das Target
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

  // Geometrie angleichen (Anchor wenn vorhanden, sonst Pivot via Bounds)
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

  // Hier unterscheiden wir je nach Typ das Mask-Property:
  // In Pixi v7 wird .mask auf DisplayObject unterstützt, aber wenn es zickt,
  // versuchen wir .mask auf dem "Container" vs. direkt auf dem Objekt.
  try {
    target.mask = maskSprite;     // üblich
  } catch (e) {
    try {
      (target.parent ?? parent).mask = maskSprite; // Fallback
    } catch (_) {
      console.warn("GBT mask: could not apply mask to target", target, e);
      return;
    }
  }

  token[_GB_MASK_TARGET] = target;
}
