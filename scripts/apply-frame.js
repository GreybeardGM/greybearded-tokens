// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings/snapshot.js";

/* =========================
   Consolidated namespace (with upgrade/hydration)
   ========================= */
const GB_DEFAULTS = {
  overlay: null,
  f1: null,
  f2: null,
  maskSprite: null,
  maskScaleAbsX: null,
  maskScaleAbsY: null,
  maskSignX: null,
  maskSignY: null,
  maskBoundsW: null,
  maskBoundsH: null,
  lastTint1: null,
  lastTint2: null,
};

function ensureGbNS(token) {
  if (typeof token._gb !== "object" || token._gb === null) token._gb = {};
  const gb = token._gb;

  for (const [key, value] of Object.entries(GB_DEFAULTS)) {
    if (!(key in gb)) gb[key] = value;
  }

  return gb;
}

/* =========================
   Mask helpers (V13-native)
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

  if (gb.maskSignX === signX && gb.maskSignY === signY) return false;

  maskSprite.scale.set(gb.maskScaleAbsX * signX, gb.maskScaleAbsY * signY);
  gb.maskSignX = signX;
  gb.maskSignY = signY;
  return true;
}

function hasValidMaskBounds(bounds) {
  return !!bounds && isFinite(bounds.width) && isFinite(bounds.height) && bounds.width > 0 && bounds.height > 0;
}

function getMaskTextureSize(maskSprite) {
  const texture = maskSprite?.texture;
  return {
    width: texture?.width || texture?.baseTexture?.realWidth || 1,
    height: texture?.height || texture?.baseTexture?.realHeight || 1
  };
}

function updateMaskScaleCache(token, mesh, maskSprite, gb) {
  const bounds = mesh?.getLocalBounds?.();
  if (!hasValidMaskBounds(bounds)) return false;

  const textureSize = getMaskTextureSize(maskSprite);
  gb.maskScaleAbsX = bounds.width / textureSize.width;
  gb.maskScaleAbsY = bounds.height / textureSize.height;
  gb.maskBoundsW = bounds.width;
  gb.maskBoundsH = bounds.height;
  gb.maskSignX = null;
  gb.maskSignY = null;
  return true;
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

  if (!updateMaskScaleCache(token, mesh, maskSprite, gb)) return;

  applyMaskScaleFromCache(token);
}

async function attachMaskIfNeeded(token, S) {
  const gb = ensureGbNS(token);
  if (gb.maskSprite) return; // Already attached

  const M = S?.mask;
  if (!M?.enabled || !M?.path) return;

  const mesh = token?.mesh;
  if (!mesh) return;

  const tex = await loadMaskOnce(M.path);
  if (!tex) return;

  // Keep the mask in the mesh local space.
  const maskSprite = new PIXI.Sprite(tex);
  maskSprite.name = "gbtf-mask";
  maskSprite.renderable = false;
  maskSprite.anchor?.set?.(0.5, 0.5);
  maskSprite.position.set(0, 0);
  maskSprite.rotation = 0;

  mesh.addChild(maskSprite);

  // Cache scaling once from the mesh local bounds.
  if (!updateMaskScaleCache(token, mesh, maskSprite, gb)) {
    maskSprite.parent?.removeChild(maskSprite);
    maskSprite.destroy({ children: false, texture: false, baseTexture: false });
    return;
  }

  gb.maskSprite = maskSprite;
  applyMaskScaleFromCache(token);

  mesh.mask = maskSprite;
}

/* =========================
   Frame helpers
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

  // Attach the overlay to the token, not the mesh, to isolate masks.
  const overlay = new PIXI.Container();
  overlay.name = "gbtf-overlay";
  overlay.sortableChildren = false; // Use insertion order instead of sorting.
  token.addChild(overlay);

  gb.overlay = overlay;
  return overlay;
}

function createFrameSprite(path, name, markerProperty) {
  const sprite = new PIXI.Sprite(PIXI.Texture.from(path));
  sprite.name = name;
  sprite[markerProperty] = true;
  sprite._gbFramePath = path;
  sprite.anchor.set(0.5);
  return sprite;
}

function destroyFrameSprite(sprite) {
  sprite.parent?.removeChild(sprite);
  sprite.destroy({ children: true, texture: false, baseTexture: false });
}

const FRAME_DESCRIPTORS = {
  primary: {
    key: "f1",
    tintKey: "lastTint1",
    name: "gbtf-frame-1",
    markerProperty: "_gbFramePrimary"
  },
  secondary: {
    key: "f2",
    tintKey: "lastTint2",
    name: "gbtf-frame-2",
    markerProperty: "_gbFrameSecondary"
  }
};

function upsertFrameSprite({ gb, overlay, key, tintKey, settings, name, markerProperty }) {
  if (settings?.path) {
    if (gb[key]?._gbFramePath !== settings.path) {
      if (gb[key]) destroyFrameSprite(gb[key]);
      gb[key] = createFrameSprite(settings.path, name, markerProperty);
      overlay.addChild(gb[key]);
      gb[tintKey] = null;
    }
    return gb[key];
  }

  if (gb[key]) {
    destroyFrameSprite(gb[key]);
    gb[key] = null;
    gb[tintKey] = null;
  }

  return null;
}

function applyFrameTint(sprite, token, snapshot, settings, gb, cacheKey) {
  if (!sprite || !settings) return;

  const tintString = getTintColor(token, snapshot, settings);
  const tint = (tintString != null) ? PIXI.utils.string2hex(tintString) : 0xFFFFFF;
  if (tint === gb[cacheKey]) return;

  sprite.tint = tint;
  gb[cacheKey] = tint;
}

function resizeFrameSprite(sprite, token, textureScaleX, textureScaleY, frameScale, overlayScaleX, overlayScaleY) {
  if (!sprite) return;

  sprite.width = (token.w * textureScaleX * (frameScale || 1)) / overlayScaleX;
  sprite.height = (token.h * textureScaleY * (frameScale || 1)) / overlayScaleY;
  sprite.position.set(0, 0);
}

function cleanupTokenVisuals(token) {
  removeGbFramesIfAny(token);
  const gb = ensureGbNS(token);
  if (gb.maskSprite) clearMaskInline(token);
}

function applyOverlayFrames(token, snapshot, textureScaleX, textureScaleY, gb) {
  const mesh = token.mesh;
  if (!mesh) return false;

  const overlay = upsertOverlayOnToken(token);
  if (!overlay) return false;

  // Center the overlay and intentionally do not mirror frames with token artwork.
  // This keeps frames aligned consistently for mirrored tokens.
  overlay.position.set(token.w / 2, token.h / 2);
  overlay.scale.set(Math.abs(mesh.scale.x || 1), Math.abs(mesh.scale.y || 1));
  overlay.rotation = mesh.rotation;

  const frameDescriptors = [
    { ...FRAME_DESCRIPTORS.secondary, settings: snapshot.frame2?.enabled ? snapshot.frame2 : null },
    { ...FRAME_DESCRIPTORS.primary, settings: snapshot.frame1 }
  ];

  const overlayScaleX = Math.abs(overlay.scale.x || 1);
  const overlayScaleY = Math.abs(overlay.scale.y || 1);

  for (const frameDescriptor of frameDescriptors) {
    const sprite = upsertFrameSprite({
      gb,
      overlay,
      ...frameDescriptor
    });
    applyFrameTint(sprite, token, snapshot, frameDescriptor.settings, gb, frameDescriptor.tintKey);
    resizeFrameSprite(
      sprite,
      token,
      textureScaleX,
      textureScaleY,
      frameDescriptor.settings?.scale,
      overlayScaleX,
      overlayScaleY
    );
  }

  return true;
}

async function applyMask(token, snapshot, gb) {
  if (snapshot.runtime?.hasMask) {
    await attachMaskIfNeeded(token, snapshot);
    updateMaskScaleIfDirty(token);
  } else if (gb.maskSprite) {
    clearMaskInline(token);
  }
}

/* =========================
   Nameplate (apply only changes)
   ========================= */
function updateNameplate(token, S, tx, ty) {
  const NP = S?.nameplate;
  if (!NP?.enabled) return;

  const label = token?.nameplate;
  if (!label || !label.style) return;

  const basePx = Number(NP.baseFontSize ?? 22) || 22;
  let fontPx = basePx;

  if (NP.scaleWithToken) {
    const wSquares = token?.document?.width  ?? 1;
    const hSquares = token?.document?.height ?? 1;
    const sizeFactor = Math.max(wSquares, hSquares);
    const textureScale = Math.max(tx, ty);
    fontPx = Math.max(8, Math.round(basePx * sizeFactor * textureScale));
  }

  label.style.fontSize = fontPx;
  label.style.fontFamily = NP.fontFamily;
  const tint = getTintColor(token, S, NP);
  if (tint != null) label.style.fill = tint;
   
  const padding = Math.max(2, Math.round(fontPx * 0.10));
  label.y = (token.h * (1 + ty) / 2) + padding;

  label.updateText?.();
}

/* =========================
   Main entry point
   ========================= */
async function applyFrameToToken(token, snapshot) {
  if (!token || token.destroyed) return;

  const S = snapshot ?? getGbFrameSettings();
  const runtime = S?.runtime ?? {};
  const textureScaleX = Math.abs(token?.document?.texture?.scaleX ?? 1);
  const textureScaleY = Math.abs(token?.document?.texture?.scaleY ?? 1);

  if (runtime.hasNameplate) {
    updateNameplate(token, S, textureScaleX, textureScaleY);
  }

  if (token.document.getFlag("greybearded-tokens", "disableFrame") || !runtime.hasAnyVisuals) {
    cleanupTokenVisuals(token);
    return;
  }

  const gb = ensureGbNS(token);

  if (runtime.hasAnyOverlay) {
    const overlayApplied = applyOverlayFrames(token, S, textureScaleX, textureScaleY, gb);
    if (!overlayApplied) return;
  } else {
    removeGbFramesIfAny(token);
  }

  await applyMask(token, S, gb);
}
/* =========================
   Reserve frame updates
   ========================= */
const frameQueue = [];
let frameQueueScheduled = false;
const MAX_FRAME_RETRIES = 12;

function queueFrameUpdate(callback) {
  frameQueue.push(callback);
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
  queueFrameUpdate(async () => {
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
