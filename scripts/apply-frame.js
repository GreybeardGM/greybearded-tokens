// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";

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

/* =========================
   Nameplate (nur Änderungen anwenden)
   ========================= */
function updateNameplate(token, S, tx, ty) {
  const NP = S?.nameplate;
  if (!NP?.enabled) return;

  const label = token?.nameplate;
  if (!label || !label.style) return;

  const gb = ensureGbNS(token);

  const basePx = Number(NP.baseFontSize ?? 22) || 22;
  let fontPx = basePx;

  if (NP.scaleWithToken) {
    const wSquares = token?.document?.width  ?? 1;
    const hSquares = token?.document?.height ?? 1;
    const sizeFactor = Math.max(wSquares, hSquares);
    const textureScale = Math.max(tx, ty);
    fontPx = Math.max(8, Math.round(basePx * sizeFactor * textureScale));
  }

  /*
  if (!gb.npPrev.anchored && label.anchor?.set) {
    label.anchor.set(0.5, 0);
    gb.npPrev.anchored = true;
  }
  */

  label.style.fontSize = fontPx;
  label.style.fontFamily = nextFamily;
  label.style.fill = nextFill;

  const padding = Math.max(2, Math.round(fontPx * 0.10));
  label.y = (token.h * (1 + ty) / 2) + padding;

  label.updateText?.();
}

/* =========================
   Hauptfunktion
   ========================= */
export async function applyFrameToToken(token, S) {
  if (!token || token.destroyed) return;
  if (!token.scene?.active) return;

  S = S || getGbFrameSettings();

  // Einmalige Reads
  const tx = Math.abs(token?.document?.texture?.scaleX ?? 1);
  const ty = Math.abs(token?.document?.texture?.scaleY ?? 1);

  // 1) Nameplate zuerst
  updateNameplate(token, S, tx, ty);

  // 2) Disable-Flag: Frames & Maske aufräumen
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) {
    removeGbFramesIfAny(token);
    const gb = ensureGbNS(token);
    if (gb.maskSprite) clearMaskInline(token);
    return;
  }

  // 3) Overlay am TOKEN, Mesh-Eigenschaften spiegeln
  const mesh = token.mesh;
  if (!mesh) return;

  const gb = ensureGbNS(token);
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

  // 4) Maske einmalig am Mesh (blockierend beibehalten)
  await attachMaskIfNeeded(token, S);
}
