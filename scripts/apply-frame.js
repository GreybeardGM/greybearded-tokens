// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings/snapshot.js";
import { toFiniteNumber } from "./utils/normalization.js";

/* =========================
   Konsolidierter Namespace (mit Upgrade/Hydration)
   ========================= */
function ensureGbNS(token) {
  if (typeof token._gb !== "object" || token._gb === null) token._gb = {};
  const gb = token._gb;

  if (!("overlay"    in gb)) gb.overlay = null;
  if (!("f1"         in gb)) gb.f1 = null;
  if (!("f2"         in gb)) gb.f2 = null;
  if (!("maskSprite" in gb)) gb.maskSprite = null;
  if (!("maskScaleAbsX" in gb)) gb.maskScaleAbsX = null;
  if (!("maskScaleAbsY" in gb)) gb.maskScaleAbsY = null;
  if (!("maskSignX" in gb)) gb.maskSignX = null;
  if (!("maskSignY" in gb)) gb.maskSignY = null;
  if (!("maskBoundsW" in gb)) gb.maskBoundsW = null;
  if (!("maskBoundsH" in gb)) gb.maskBoundsH = null;
  if (!("lastTint1"  in gb)) gb.lastTint1 = null;
  if (!("lastTint2"  in gb)) gb.lastTint2 = null;
  //if (!gb.npPrev) gb.npPrev = { size: null, family: null, fill: null, anchored: false };

  return gb;
}

/* =========================
   Masken-Helfer (V13-pur)
   ========================= */
const MASK_TEX_CACHE = new Map();

async function loadMaskOnce(url) {
  if (!url) return null;
  const cached = MASK_TEX_CACHE.get(url);
  if (cached?.baseTexture?.valid) return cached;

  const base = await PIXI.Assets.load(url);
  const tex = base instanceof PIXI.Texture ? base : new PIXI.Texture(base);
  MASK_TEX_CACHE.set(url, tex);
  return tex;
}

function clearMaskInline(token) {
  const gb = ensureGbNS(token);
  const mesh = token?.mesh;
  if (mesh && mesh.mask === gb.maskSprite) mesh.mask = null;

  if (gb.maskSprite?.parent) gb.maskSprite.parent.removeChild(gb.maskSprite);
  gb.maskSprite?.destroy?.({ children: false, texture: false, baseTexture: false });
  gb.maskSprite = null;
  gb.maskScaleAbsX = null;
  gb.maskScaleAbsY = null;
  gb.maskSignX = null;
  gb.maskSignY = null;
  gb.maskBoundsW = null;
  gb.maskBoundsH = null;
}

function getScaleSign(value) {
  return (Math.sign(value || 1) || 1);
}

function applyMaskScaleFromCache(token) {
  const gb = ensureGbNS(token);
  const mesh = token?.mesh;
  const maskSprite = gb.maskSprite;
  if (!mesh || !maskSprite) return false;

  if (!isFinite(gb.maskScaleAbsX) || !isFinite(gb.maskScaleAbsY)) return false;

  const signX = getScaleSign(mesh.scale.x);
  const signY = getScaleSign(mesh.scale.y);

  maskSprite.scale.set(gb.maskScaleAbsX * signX, gb.maskScaleAbsY * signY);
  gb.maskSignX = signX;
  gb.maskSignY = signY;
  return true;
}

function getTextureSize(texture) {
  return {
    width: texture?.width || texture?.source?.width || texture?.baseTexture?.realWidth || 0,
    height: texture?.height || texture?.source?.height || texture?.baseTexture?.realHeight || 0
  };
}

function getCoverTextureFitMode() {
  const modes = globalThis.CONST?.TEXTURE_DATA_FIT_MODES;
  if (!Array.isArray(modes)) return null;
  return modes.includes("cover") ? "cover" : null;
}

async function ensureArtworkFitCover(token) {
  const gb = ensureGbNS(token);
  const coverFit = getCoverTextureFitMode();
  if (!coverFit || gb.coverFitUpdatePending || gb.coverFitUnsupported) return;
  if (token?.document?.texture?.fit === coverFit) return;

  try {
    gb.coverFitUpdatePending = true;
    await token.document.update({ "texture.fit": coverFit });
  } catch (error) {
    gb.coverFitUnsupported = true;
    console.warn("Greybearded Token Frames | Unable to set token texture fit to cover.", error);
  } finally {
    gb.coverFitUpdatePending = false;
  }
}

function getMaskLocalPlacement(token) {
  const mesh = token?.mesh;
  if (!mesh || !isFinite(token?.w) || !isFinite(token?.h) || token.w <= 0 || token.h <= 0) return null;

  const sx = mesh.scale.x || 1;
  const sy = mesh.scale.y || 1;
  const absSx = Math.abs(sx);
  const absSy = Math.abs(sy);
  if (!isFinite(absSx) || !isFinite(absSy) || absSx <= 0 || absSy <= 0) return null;

  const width = token.w / absSx;
  const height = token.h / absSy;
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) return null;

  // The mask is a child of Foundry's token mesh, so its placement must be in mesh-local
  // coordinates. Do not subtract mesh.position here: Foundry may store canvas/world
  // coordinates in that vector. Foundry's mesh local origin is already the token artwork
  // center, so placing an anchored mask at width / 2 and height / 2 moves its center to
  // the artwork's lower-right corner.
  return {
    width,
    height,
    x: 0,
    y: 0
  };
}

export function syncTokenMaskMirror(token) {
  if (!token || token.destroyed) return false;
  return applyMaskScaleFromCache(token);
}

function updateMaskScaleIfDirty(token) {
  const gb = ensureGbNS(token);
  const mesh = token?.mesh;
  const maskSprite = gb.maskSprite;
  if (!mesh || !maskSprite) return;

  const tokenW = token.w || 0;
  const tokenH = token.h || 0;

  const b = getMaskLocalPlacement(token);
  if (!b) return;

  const { width: texW, height: texH } = getTextureSize(maskSprite.texture);
  if (texW <= 0 || texH <= 0) return;

  const boundsChanged =
    !isFinite(gb.maskScaleAbsX) ||
    !isFinite(gb.maskScaleAbsY) ||
    gb.maskBoundsW !== tokenW ||
    gb.maskBoundsH !== tokenH ||
    gb.maskScaleAbsX !== b.width / texW ||
    gb.maskScaleAbsY !== b.height / texH;

  if (boundsChanged) {
    gb.maskScaleAbsX = b.width / texW;
    gb.maskScaleAbsY = b.height / texH;
    gb.maskBoundsW = tokenW;
    gb.maskBoundsH = tokenH;
    gb.maskSignX = null;
    gb.maskSignY = null;
  }

  maskSprite.position.set(b.x, b.y);
  applyMaskScaleFromCache(token);
}

async function attachMaskIfNeeded(token, S) {
  const gb = ensureGbNS(token);
  if (gb.maskSprite) return; // bereits gesetzt

  const M = S?.mask;
  if (!M?.enabled || !M?.path) return;

  const mesh = token?.mesh;
  if (!mesh) return;

  const tex = await loadMaskOnce(M.path);
  if (!tex) return;

  // Maske im lokalen Space des Meshes
  const maskSprite = new PIXI.Sprite(tex);
  maskSprite.name = "gbtf-mask";
  maskSprite.renderable = false;
  maskSprite.anchor?.set?.(0.5, 0.5);
  maskSprite.position.set(0, 0);
  maskSprite.rotation = 0;

  mesh.addChild(maskSprite);

  // Skalierung anhand der Tokenfläche im lokalen Mesh-Space, nicht anhand des Bildseitenverhältnisses.
  const b = getMaskLocalPlacement(token);
  const { width: texW, height: texH } = getTextureSize(maskSprite.texture);
  if (!b || texW <= 0 || texH <= 0) {
    maskSprite.parent?.removeChild(maskSprite);
    maskSprite.destroy({ children: false, texture: false, baseTexture: false });
    return;
  }

  gb.maskScaleAbsX = b.width / texW;
  gb.maskScaleAbsY = b.height / texH;
  gb.maskBoundsW = token.w || 0;
  gb.maskBoundsH = token.h || 0;
  gb.maskSignX = null;
  gb.maskSignY = null;
  maskSprite.position.set(b.x, b.y);

  applyMaskScaleFromCache(token);

  mesh.mask = maskSprite;
  gb.maskSprite = maskSprite;
}

/* =========================
   Frames-Helfer
   ========================= */
function removeGbFramesIfAny(token) {
  const gb = ensureGbNS(token);
  if (gb.overlay) {
    gb.overlay.parent?.removeChild(gb.overlay);
    gb.overlay.destroy({ children: true, texture: false, baseTexture: false });
  }
  gb.overlay = null;
  gb.f1 = null;
  gb.f2 = null;
}

function upsertOverlayOnToken(token) {
  const gb = ensureGbNS(token);
  if (gb.overlay) return gb.overlay;

  // Overlay am TOKEN, nicht am Mesh (Masken-Isolation)
  const overlay = new PIXI.Container();
  overlay.name = "gbtf-overlay";
  overlay.sortableChildren = false; // Reihenfolge statt Sorting
  token.addChild(overlay);

  gb.overlay = overlay;
  return overlay;
}

/* =========================
   Nameplate (nur Änderungen anwenden)
   ========================= */
function getNameplateBaseStyle(token, label) {
  const gb = ensureGbNS(token);
  const current = label?.style ?? {};

  if (!gb.nameplateBaseStyle) {
    gb.nameplateBaseStyle = {
      strokeThickness: toFiniteNumber(current.strokeThickness, 0),
      dropShadowBlur: toFiniteNumber(current.dropShadowBlur, 0),
      dropShadowDistance: toFiniteNumber(current.dropShadowDistance, 0),
      padding: toFiniteNumber(current.padding, 0),
      stroke: current.stroke,
      dropShadowColor: current.dropShadowColor
    };
  }

  return gb.nameplateBaseStyle;
}

function calculateNameplateScale(token, NP, tx, ty) {
  if (!NP?.scaleWithToken) return 1;

  const wSquares = toFiniteNumber(token?.document?.width, 1);
  const hSquares = toFiniteNumber(token?.document?.height, 1);
  const sizeFactor = Math.max(wSquares, hSquares);
  const textureScale = Math.max(toFiniteNumber(tx, 1), toFiniteNumber(ty, 1));

  return Math.max(0, sizeFactor * textureScale);
}

function scaleNameplateMetric(value, scale) {
  return toFiniteNumber(value, 0) * Math.max(0, toFiniteNumber(scale, 1));
}

function updateNameplateScaleEffects(token, label, nameplateScale) {
  const baseStyle = getNameplateBaseStyle(token, label);

  const strokeThickness = scaleNameplateMetric(baseStyle.strokeThickness, nameplateScale);
  const dropShadowBlur = scaleNameplateMetric(baseStyle.dropShadowBlur, nameplateScale);
  const dropShadowDistance = scaleNameplateMetric(baseStyle.dropShadowDistance, nameplateScale);
  const minPadding = strokeThickness + dropShadowBlur + Math.abs(dropShadowDistance);
  const padding = Math.max(scaleNameplateMetric(baseStyle.padding, nameplateScale), minPadding);

  label.style.strokeThickness = strokeThickness;
  label.style.dropShadowBlur = dropShadowBlur;
  label.style.dropShadowDistance = dropShadowDistance;
  label.style.padding = Math.ceil(padding);
}

function updateNameplate(token, S, tx, ty) {
  const NP = S?.nameplate;
  if (!NP?.enabled) return;

  const label = token?.nameplate;
  if (!label || !label.style) return;

  const basePx = toFiniteNumber(NP.baseFontSize, 22);
  const nameplateScale = calculateNameplateScale(token, NP, tx, ty);
  const fontPx = Math.max(8, Math.round(basePx * nameplateScale));

  label.style.fontSize = fontPx;
  label.style.fontFamily = NP.fontFamily;
  updateNameplateScaleEffects(token, label, nameplateScale);
  const tint = getTintColor(token, S, NP);
  if (tint != null) label.style.fill = tint;

  const baseStyle = getNameplateBaseStyle(token, label);
  const outlineTint = getTintColor(token, S, {
    tintMode: NP.outlineTintMode,
    usePlayerColor: NP.outlineUsePlayerColor,
    defaultColor: NP.outlineDefaultColor
  });
  if (outlineTint != null) {
    label.style.stroke = outlineTint;
    label.style.dropShadowColor = outlineTint;
  } else {
    label.style.stroke = baseStyle.stroke;
    label.style.dropShadowColor = baseStyle.dropShadowColor;
  }

  label.updateText?.();

  const distance = scaleNameplateMetric(NP.distance ?? 2, nameplateScale);
  const tokenTextureBottom = token.h * (1 + ty) / 2;
  const labelBounds = label.getLocalBounds?.();
  const labelTopInset = Number.isFinite(labelBounds?.y) ? labelBounds.y : 0;
  label.y = tokenTextureBottom + distance - labelTopInset;
}

/* =========================
   Hauptfunktion
   ========================= */
async function applyFrameToToken(token, snapshot) {
  if (!token || token.destroyed) return;
  // if (!token.scene?.active) return; // Deaktivierung für Inaktive Szenen

  // Settings laden
  const S = snapshot ?? getGbFrameSettings();
  const runtime = S?.runtime ?? {};

  // Einmalige Reads
  const tx = Math.abs(token?.document?.texture?.scaleX ?? 1);
  const ty = Math.abs(token?.document?.texture?.scaleY ?? 1);

  await ensureArtworkFitCover(token);

  // 1) Nameplate zuerst (nur wenn aktiviert)
  if (runtime.hasNameplate) {
    updateNameplate(token, S, tx, ty);
  }

  // 2) Disable-Flag: Frames & Maske aufräumen
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) {
    removeGbFramesIfAny(token);
    const gb = ensureGbNS(token);
    if (gb.maskSprite) clearMaskInline(token);
    return;
  }

  // Wenn global keinerlei Visuals aktiv sind, sofort aufräumen
  if (!runtime.hasAnyVisuals) {
    removeGbFramesIfAny(token);
    const gb = ensureGbNS(token);
    if (gb.maskSprite) clearMaskInline(token);
    return;
  }

  const gb = ensureGbNS(token);

  // 3) Overlay am TOKEN, Mesh-Eigenschaften spiegeln (nur wenn Frames aktiv)
  if (runtime.hasAnyOverlay) {
    const mesh = token.mesh;
    if (!mesh) return;

    const overlay = upsertOverlayOnToken(token);
    if (!overlay) return;

    // Overlay relativ mittig platzieren.
    // Wichtig: Spiegelung des Token-Meshes wird absichtlich NICHT auf Frames übernommen,
    // damit Rahmen bei gespiegelten Tokens immer gleich ausgerichtet bleiben.
    overlay.position.set(token.w / 2, token.h / 2);
    overlay.scale.set(Math.abs(mesh.scale.x || 1), Math.abs(mesh.scale.y || 1));
    overlay.rotation = mesh.rotation;

    const F1 = S.frame1;
    const F2 = S.frame2;

    // Sekundär zuerst (liegt unten)
    if (F2?.enabled && F2?.path) {
      if (!gb.f2) {
        const tex2 = PIXI.Texture.from(F2.path);
        const spr2 = new PIXI.Sprite(tex2);
        spr2.name = "gbtf-frame-2";
        spr2._gbFrameSecondary = true;
        spr2.anchor.set(0.5);
        overlay.addChild(spr2);
        gb.f2 = spr2;
        gb.lastTint2 = null;
      }
    } else if (gb.f2) {
      gb.f2.parent?.removeChild(gb.f2);
      gb.f2.destroy({ children: true, texture: false, baseTexture: false });
      gb.f2 = null;
      gb.lastTint2 = null;
    }

    // Primär oben
    if (F1?.path) {
      if (!gb.f1) {
        const tex1 = PIXI.Texture.from(F1.path);
        const spr1 = new PIXI.Sprite(tex1);
        spr1.name = "gbtf-frame-1";
        spr1._gbFramePrimary = true;
        spr1.anchor.set(0.5);
        overlay.addChild(spr1);
        gb.f1 = spr1;
        gb.lastTint1 = null;
      }
    } else if (gb.f1) {
      gb.f1.parent?.removeChild(gb.f1);
      gb.f1.destroy({ children: true, texture: false, baseTexture: false });
      gb.f1 = null;
      gb.lastTint1 = null;
    }

    // Tints nur bei Änderung
    if (gb.f1 && F1) {
      const t1str = getTintColor(token, S, F1);
      const t1 = (t1str != null) ? PIXI.utils.string2hex(t1str) : 0xFFFFFF;
      if (t1 !== gb.lastTint1) {
        gb.f1.tint = t1;
        gb.lastTint1 = t1;
      }
    }
    if (gb.f2 && F2) {
      const t2str = getTintColor(token, S, F2);
      const t2 = (t2str != null) ? PIXI.utils.string2hex(t2str) : 0xFFFFFF;
      if (t2 !== gb.lastTint2) {
        gb.f2.tint = t2;
        gb.lastTint2 = t2;
      }
    }

    // Größenlogik mit Gegenrechnen der Overlay-Skalierung (wie zuvor)
    const kW = token.w, kH = token.h;
    const sx = Math.abs(overlay.scale.x || 1), sy = Math.abs(overlay.scale.y || 1);

    if (gb.f1 && F1) {
      gb.f1.width  = (kW * tx * (F1.scale || 1)) / sx;
      gb.f1.height = (kH * ty * (F1.scale || 1)) / sy;
      gb.f1.position.set(0, 0);
    }
    if (gb.f2 && F2) {
      gb.f2.width  = (kW * tx * (F2.scale || 1)) / sx;
      gb.f2.height = (kH * ty * (F2.scale || 1)) / sy;
      gb.f2.position.set(0, 0);
    }
  } else {
    removeGbFramesIfAny(token);
  }

  // 4) Maske einmalig am Mesh (blockierend beibehalten)
  if (runtime.hasMask) {
    await attachMaskIfNeeded(token, S);
    updateMaskScaleIfDirty(token);
  } else if (gb.maskSprite) {
    clearMaskInline(token);
  }
}
/* =========================
   Frame Update Reservieren
   ========================= */
const frameQueue = [];
let frameQueueScheduled = false;
const MAX_FRAME_RETRIES = 12;

function nextTick(fn){
  frameQueue.push(fn);
  if (typeof queueMicrotask === "function") {
    queueMicrotask(scheduleFrameQueue);
    return;
  }
  scheduleFrameQueue();
}

function scheduleFrameQueue() {
  if (frameQueueScheduled) return;
  frameQueueScheduled = true;
  requestAnimationFrame(() => {
    frameQueueScheduled = false;
    const callbacks = frameQueue.splice(0, frameQueue.length);
    for (const callback of callbacks) callback();
  });
}

function isTokenVisualReady(token) {
  if (!token || token.destroyed) return false;
  if (!token.mesh || !token.mesh.visible) return false;
  if (!isFinite(token.w) || !isFinite(token.h) || token.w <= 0 || token.h <= 0) return false;
  const tex = token.mesh.texture;
  return !!(tex?.valid || tex?.baseTexture?.valid);
}

function reserveFrameUpdate(token) {
  if (!token?._gb) token._gb = {};
  const gb = token._gb;
  if (gb.frameScheduled) return false;
  gb.frameScheduled = true;
  gb.frameRetryCount = gb.frameRetryCount ?? 0;
  return true;
}

function releaseFrameUpdate(token) {
  if (!token?._gb) return;
  token._gb.frameScheduled = false;
}

function scheduleRetry(token, snapshot) {
  const gb = token?._gb;
  if (!gb) return;
  const retries = (gb.frameRetryCount ?? 0) + 1;
  gb.frameRetryCount = retries;
  if (retries > MAX_FRAME_RETRIES) {
    gb.frameRetryCount = 0;
    releaseFrameUpdate(token);
    return;
  }
  releaseFrameUpdate(token);
  requestAnimationFrame(() => updateFrame(token, snapshot));
}

export async function updateFrame(token, snapshot) {
  if (!reserveFrameUpdate(token)) return;
  const S = snapshot ?? getGbFrameSettings();
  nextTick(async () => {
    try {
      if (!isTokenVisualReady(token)) {
        scheduleRetry(token, S);
        return;
      }

      token._gb.frameRetryCount = 0;
      await applyFrameToToken(token, S);
    } finally {
      if (token?._gb?.frameScheduled) releaseFrameUpdate(token);
    }
  });
}
