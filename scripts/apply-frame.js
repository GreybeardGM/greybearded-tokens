// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";

/* =========================
   Konsolidierter Namespace
   ========================= */
function ensureGbNS(token) {
  if (!token._gb) token._gb = {
    overlay: null,
    f1: null,
    f2: null,
    nameplateAnchored: false,
    maskApplied: false,
    maskSprite: null,
    maskTarget: null
  };
  return token._gb;
}

/* =========================
   Masken-Helfer (inline)
   ========================= */
const MASK_TEX_CACHE = new Map();
const MASK_INFLIGHT = new Map(); // dedupliziert parallele Loads

async function loadMaskOnce(url) {
  if (!url) return null;
  const cached = MASK_TEX_CACHE.get(url);
  if (cached?.baseTexture?.valid) return cached;

  if (MASK_INFLIGHT.has(url)) return MASK_INFLIGHT.get(url);

  const p = (async () => {
    let tex;
    if (PIXI.Assets?.load) {
      const base = await PIXI.Assets.load(url);
      tex = base instanceof PIXI.Texture ? base : new PIXI.Texture(base);
    } else {
      tex = PIXI.Texture.from(url);
      if (!tex.baseTexture.valid) {
        await new Promise(res => tex.baseTexture.once("loaded", res));
      }
    }
    MASK_TEX_CACHE.set(url, tex);
    MASK_INFLIGHT.delete(url);
    return tex;
  })();

  MASK_INFLIGHT.set(url, p);
  return p;
}

function clearMaskInline(token) {
  const gb = ensureGbNS(token);
  const tgt = gb.maskTarget;
  const spr = gb.maskSprite;

  if (tgt && tgt.mask === spr) tgt.mask = null;
  if (spr?.parent) spr.parent.removeChild(spr);
  // Sprite zerstören, Texture bleibt gecached
  spr?.destroy?.({ children: true, texture: false, baseTexture: false });

  gb.maskApplied = false;
  gb.maskSprite = null;
  gb.maskTarget = null;
}

async function attachMaskIfNeeded(token, S) {
  const gb = ensureGbNS(token);
  const M = S?.mask;
  if (!M?.enabled || !M?.path) return;
  if (gb.maskApplied) return; // bereits gesetzt

  const mesh = token?.mesh;
  if (!mesh) return;

  // Textur laden
  const tex = await loadMaskOnce(M.path);
  if (!tex) return;

  // Maske erstellen und am Mesh anhängen (lokaler Space)
  const maskSprite = new PIXI.Sprite(tex);
  maskSprite.name = "gbt-mask";
  maskSprite.renderable = false;       // nur als Maske

  mesh.addChild(maskSprite);

  // Geometrie einmalig anhand der LocalBounds
  const b = mesh.getLocalBounds?.();
  if (!b || !isFinite(b.width) || !isFinite(b.height) || b.width <= 0 || b.height <= 0) {
    // Aufräumen, falls Bounds nicht valide
    maskSprite.parent?.removeChild(maskSprite);
    maskSprite.destroy({ children: true, texture: false, baseTexture: false });
    return;
  }

  const texW = maskSprite.texture.width  || maskSprite.texture.baseTexture?.realWidth  || 1;
  const texH = maskSprite.texture.height || maskSprite.texture.baseTexture?.realHeight || 1;

  maskSprite.anchor?.set?.(0.5, 0.5);
  maskSprite.position.set(0, 0);
  maskSprite.rotation = 0;
  maskSprite.scale.set(b.width / texW, b.height / texH);

  mesh.mask = maskSprite;

  gb.maskApplied = true;
  gb.maskSprite  = maskSprite;
  gb.maskTarget  = mesh;
}

/* =========================
   Frames-Helfer
   ========================= */
function removeGbFramesIfAny(token) {
  const gb = ensureGbNS(token);
  const overlay = gb.overlay;
  let removed = false;

  if (overlay?.children?.length) {
    for (const c of [...overlay.children]) {
      if (c?._gbFramePrimary === true || c?._gbFrameSecondary === true) {
        c.parent?.removeChild(c);
        c.destroy({ children: true, texture: false, baseTexture: false });
        removed = true;
      }
    }
    if (!overlay.children.length) {
      overlay.parent?.removeChild(overlay);
      overlay.destroy({ children: true, texture: false, baseTexture: false });
      gb.overlay = null;
    }
  }

  gb.f1 = null;
  gb.f2 = null;
  return removed;
}

/* =========================
   Nameplate
   ========================= */
function updateNameplate(token, S, tx, ty) {
  const NP = S?.nameplate;
  if (!NP?.enabled) return;

  const label = token?.nameplate;
  if (!label || !label.style) return;

  //label.visible = true;
  //label.renderable = true;

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
  if (NP.fontFamily) label.style.fontFamily = NP.fontFamily;

  const nt = getTintColor(token, S, NP);
  if (nt != null) label.style.fill = nt; // Text: CSS/Hex ok

  const gb = ensureGbNS(token);
  if (!gb.nameplateAnchored && label.anchor?.set) {
    label.anchor.set(0.5, 0);
    gb.nameplateAnchored = true;
  }

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

  // 1) Nameplate immer zuerst
  updateNameplate(token, S, tx, ty);

  // 2) Early-Exit bei Disable-Flag: Frames + (falls vorhanden) Maske aufräumen
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) {
    removeGbFramesIfAny(token);
    const gb = ensureGbNS(token);
    if (gb.maskApplied) clearMaskInline(token);
    return;
  }

  // 3) Overlay/Frames normal bearbeiten (keine Änderung der Skalierstrategie)
  const F1 = S.frame1;
  const F2 = S.frame2;

  const mesh = token.mesh;
  if (!mesh) return;

  const gb = ensureGbNS(token);

  let overlay = gb.overlay;
  if (!overlay) {
    overlay = new PIXI.Container();
    overlay.name = "gb-overlay";
    token.addChild(overlay);
    gb.overlay = overlay;
  }

  overlay.position.set(token.w / 2, token.h / 2);
  overlay.scale.copyFrom(mesh.scale);
  overlay.rotation = mesh.rotation;
  overlay.sortableChildren = true;

  let frame1 = gb.f1;
  let frame2 = gb.f2;

  if (!frame1 && F1?.path) {
    frame1 = new PIXI.Sprite(PIXI.Texture.from(F1.path));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    overlay.addChild(frame1);
    gb.f1 = frame1;
  }

  if (F2?.enabled && F2?.path) {
    if (!frame2) {
      frame2 = new PIXI.Sprite(PIXI.Texture.from(F2.path));
      frame2._gbFrameSecondary = true;
      frame2.name = "gb-frame-2";
      frame2.anchor.set(0.5);
      overlay.addChild(frame2);
      gb.f2 = frame2;
    }
  } else if (frame2) {
    frame2.parent?.removeChild(frame2);
    frame2.destroy({ children: true, texture: false, baseTexture: false });
    gb.f2 = frame2 = null;
  }

  if (frame1 && F1) {
    const t1 = getTintColor(token, S, F1);
    frame1.tint = (t1 != null) ? PIXI.utils.string2hex(t1) : 0xFFFFFF;
  }
  if (frame2 && F2) {
    const t2 = getTintColor(token, S, F2);
    frame2.tint = (t2 != null) ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
  }

  {
    const kW = token.w, kH = token.h;
    const sx = overlay.scale.x || 1, sy = overlay.scale.y || 1;

    if (frame1 && F1) {
      frame1.width  = (kW * tx * (F1.scale || 1)) / sx;
      frame1.height = (kH * ty * (F1.scale || 1)) / sy;
      frame1.position.set(0, 0);
      frame1.zIndex = 1;
    }
    if (frame2 && F2) {
      frame2.width  = (kW * tx * (F2.scale || 1)) / sx;
      frame2.height = (kH * ty * (F2.scale || 1)) / sy;
      frame2.position.set(0, 0);
      frame2.zIndex = 0;
    }
    overlay.sortDirty = true;
  }

  // 4) Maske einmalig anlegen (nur wenn Setting aktiv und noch nicht gesetzt)
  await attachMaskIfNeeded(token, S);
}
