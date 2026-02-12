// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings/snapshot.js";

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
  if (!("lastTint1"  in gb)) gb.lastTint1 = null;
  if (!("lastTint2"  in gb)) gb.lastTint2 = null;
  if (!("outlineState" in gb)) gb.outlineState = null;
  if (!("outlineSprite" in gb)) gb.outlineSprite = null;
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
  maskSprite.name = "gbt-mask";
  maskSprite.renderable = false;
  maskSprite.anchor?.set?.(0.5, 0.5);
  maskSprite.position.set(0, 0);
  maskSprite.rotation = 0;

  mesh.addChild(maskSprite);

  // Skalierung EINMALIG anhand der LocalBounds des Meshes
  const b = mesh.getLocalBounds?.();
  if (!b || !isFinite(b.width) || !isFinite(b.height) || b.width <= 0 || b.height <= 0) {
    maskSprite.parent?.removeChild(maskSprite);
    maskSprite.destroy({ children: false, texture: false, baseTexture: false });
    return;
  }

  const texW = maskSprite.texture.width  || maskSprite.texture.baseTexture?.realWidth  || 1;
  const texH = maskSprite.texture.height || maskSprite.texture.baseTexture?.realHeight || 1;

  maskSprite.scale.set(b.width / texW, b.height / texH);

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
  if (gb.outlineSprite?.parent) gb.outlineSprite.parent.removeChild(gb.outlineSprite);
  gb.outlineSprite?.destroy?.({ children: false, texture: false, baseTexture: false });
  gb.outlineSprite = null;
  gb.outlineState = null;
}

function upsertOverlayOnToken(token) {
  const gb = ensureGbNS(token);
  if (gb.overlay) return gb.overlay;

  // Overlay am TOKEN, nicht am Mesh (Masken-Isolation)
  const overlay = new PIXI.Container();
  overlay.name = "gb-overlay";
  overlay.sortableChildren = false; // Reihenfolge statt Sorting
  token.addChild(overlay);

  gb.overlay = overlay;
  return overlay;
}

function getOutlineTargetSprite(token) {
  const gb = ensureGbNS(token);
  return gb.f1 ?? gb.f2 ?? null;
}

const ALPHA_OUTLINE_FRAG = `
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 inputSize;
uniform float outlineThickness;
uniform vec3 outlineColor;
uniform float sampleCount;

const float PI = 3.141592653589793;
const int MAX_SAMPLES = 32;

void main(void) {
  vec4 src = texture2D(uSampler, vTextureCoord);
  if (src.a > 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 pixelStep = vec2(inputSize.z, inputSize.w) * outlineThickness;
  float edgeAlpha = 0.0;

  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (float(i) >= sampleCount) break;
    float t = float(i) / sampleCount;
    float angle = t * (2.0 * PI);
    vec2 offset = vec2(cos(angle), sin(angle)) * pixelStep;
    edgeAlpha = max(edgeAlpha, texture2D(uSampler, vTextureCoord + offset).a);
  }

  if (edgeAlpha <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  gl_FragColor = vec4(outlineColor, edgeAlpha);
}
`;

function _hexToRgbArray(color) {
  const hex = Number(color) >>> 0;
  return [
    ((hex >> 16) & 0xFF) / 255,
    ((hex >> 8) & 0xFF) / 255,
    (hex & 0xFF) / 255
  ];
}

function _resolveOutlineFactory() {
  const pixiOutline = PIXI?.filters?.OutlineFilter;
  if (pixiOutline) {
    return {
      id: "PIXI.filters.OutlineFilter",
      isMatch: (filter) => filter instanceof pixiOutline,
      create: ({ thickness, color, quality }) => {
        const f = new pixiOutline(thickness, color, quality);
        f.padding = Math.ceil(thickness + 1);
        return f;
      }
    };
  }

  return {
    id: "PIXI.Filter.alpha-outline",
    isMatch: (filter) => !!filter?._gbAlphaOutline,
    create: ({ thickness, color, quality }) => {
      const sampleCount = Math.max(8, Math.min(Math.round((quality || 0.2) * 64), 24));
      const filter = new PIXI.Filter(undefined, ALPHA_OUTLINE_FRAG, {
        outlineThickness: thickness,
        outlineColor: _hexToRgbArray(color),
        sampleCount
      });
      filter._gbAlphaOutline = true;
      filter.padding = Math.ceil(thickness + 1);
      filter.autoFit = true;
      return filter;
    }
  };
}


function _syncOutlineSprite(target, outlineSprite) {
  outlineSprite.texture = target.texture;
  outlineSprite.anchor.copyFrom(target.anchor);
  outlineSprite.position.copyFrom(target.position);
  outlineSprite.scale.copyFrom(target.scale);
  outlineSprite.rotation = target.rotation;
  outlineSprite.width = target.width;
  outlineSprite.height = target.height;
}

function _clearOutlineArtifacts(token) {
  const gb = ensureGbNS(token);
  if (gb.f1?.filters?.length) gb.f1.filters = null;
  if (gb.f2?.filters?.length) gb.f2.filters = null;
  if (gb.outlineSprite?.parent) gb.outlineSprite.parent.removeChild(gb.outlineSprite);
  gb.outlineSprite?.destroy?.({ children: false, texture: false, baseTexture: false });
  gb.outlineSprite = null;
  gb.outlineState = null;
}

function setFrameOutline(token, enabled, options = {}) {
  const gb = ensureGbNS(token);
  const sprite = getOutlineTargetSprite(token);

  if (!enabled || !sprite) {
    _clearOutlineArtifacts(token);
    return;
  }

  const outlineFactory = _resolveOutlineFactory();
  if (!outlineFactory) return;

  const colorInput = options.color ?? "#f7e7a3";
  const color = (typeof colorInput === "number") ? colorInput : PIXI.utils.string2hex(colorInput);
  const thickness = Math.max(0.5, Math.min(Number(options.thickness ?? 1) || 1, 3));
  const quality = Math.max(0.1, Math.min(Number(options.quality ?? 0.2) || 0.2, 0.5));
  const stateKey = `${sprite.name}|${outlineFactory.id}|${color}|${thickness}|${quality}`;

  let outlineSprite = gb.outlineSprite;
  if (!outlineSprite || outlineSprite.destroyed || outlineSprite.parent !== sprite.parent) {
    if (outlineSprite?.parent) outlineSprite.parent.removeChild(outlineSprite);
    outlineSprite?.destroy?.({ children: false, texture: false, baseTexture: false });
    outlineSprite = new PIXI.Sprite(sprite.texture);
    outlineSprite.name = "gb-frame-outline";
    outlineSprite.renderable = true;
    const parent = sprite.parent;
    const idx = Math.max(0, parent.getChildIndex(sprite));
    parent.addChildAt(outlineSprite, idx);
    gb.outlineSprite = outlineSprite;
    gb.outlineState = null;
  }

  _syncOutlineSprite(sprite, outlineSprite);

  if (gb.outlineState !== stateKey || !outlineFactory.isMatch(outlineSprite.filters?.[0])) {
    outlineSprite.filters = [outlineFactory.create({ thickness, color, quality })];
    gb.outlineState = stateKey;
  }

  if (gb.f1?.filters?.length) gb.f1.filters = null;
  if (gb.f2?.filters?.length) gb.f2.filters = null;
}

/* =========================
   Nameplate (nur Änderungen anwenden)
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

  // 1) Nameplate zuerst (nur wenn aktiviert)
  if (runtime.hasNameplate) {
    updateNameplate(token, S, tx, ty);
  }

  // 2) Disable-Flag: Frames & Maske aufräumen
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) {
    removeGbFramesIfAny(token);
    setFrameOutline(token, false);
    const gb = ensureGbNS(token);
    if (gb.maskSprite) clearMaskInline(token);
    return;
  }

  // Wenn global keinerlei Visuals aktiv sind, sofort aufräumen
  if (!runtime.hasAnyVisuals) {
    removeGbFramesIfAny(token);
    setFrameOutline(token, false);
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

    // Overlay relativ mittig platzieren und Transformationspfad spiegeln
    overlay.position.set(token.w / 2, token.h / 2);
    overlay.scale.copyFrom(mesh.scale);
    overlay.rotation = mesh.rotation;

    const F1 = S.frame1;
    const F2 = S.frame2;

    // Sekundär zuerst (liegt unten)
    if (F2?.enabled && F2?.path) {
      if (!gb.f2) {
        const tex2 = PIXI.Texture.from(F2.path);
        const spr2 = new PIXI.Sprite(tex2);
        spr2.name = "gb-frame-2";
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
        spr1.name = "gb-frame-1";
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
    const sx = overlay.scale.x || 1, sy = overlay.scale.y || 1;

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

    const outlineOptions = S?.border ?? {};
    const outlineEnabled = !!(outlineOptions.enabled && token.controlled);
    setFrameOutline(token, outlineEnabled, outlineOptions);
  } else {
    removeGbFramesIfAny(token);
    setFrameOutline(token, false);
  }

  // 4) Maske einmalig am Mesh (blockierend beibehalten)
  if (runtime.hasMask) {
    await attachMaskIfNeeded(token, S);
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
