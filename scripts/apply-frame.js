// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

const TEX_CACHE = new Map();
async function loadTex(url) {
  if (!url) return null;
  if (TEX_CACHE.has(url)) return TEX_CACHE.get(url);
  const tex = await PIXI.Assets.load(url);
  TEX_CACHE.set(url, tex);
  return tex;
}

function ensureOverlay(token) {
  const mesh = token.mesh ?? token;
  token.sortableChildren = true;
  const overlay = token._gbOverlay ?? (() => {
    const c = new PIXI.Container();
    c.name = "gb-overlay";
    c.sortableChildren = true;
    // Stabil: unabhängig von bars/foreign HUDs sehr hoch legen
    c.zIndex = 10000;
    token.addChild(c);
    token._gbOverlay = c;
    return c;
  })();
  // Overlay an Mesh-Transform koppeln
  overlay.position.set(token.w / 2, token.h / 2);
  overlay.scale.copyFrom(mesh.scale);
  overlay.rotation = mesh.rotation;
  // Token-Mesh nicht unterdrücken; nur sicherstellen, dass Kinder sortiert werden
  mesh.zIndex = mesh.zIndex ?? 10;
  return overlay;
}

export async function applyFrameToToken(token, S) {
  try {
    if (!token || token.destroyed) return;
    if (!canvas?.ready) return;
    if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;

    S = S || getGbFrameSettings();

    const overlay = ensureOverlay(token);

    // Primärframe suchen/übernehmen
    let frame1 =
      overlay.children.find((c) => c?._gbFramePrimary === true) ||
      (token.mesh?.children || []).find((c) => c?._gbFramePrimary === true);
    if (frame1 && frame1.parent !== overlay) overlay.addChild(frame1);

    // Sekundärframe suchen/übernehmen
    let frame2 =
      overlay.children.find((c) => c?._gbFrameSecondary === true) ||
      (token.mesh?.children || []).find((c) => c?._gbFrameSecondary === true);
    if (frame2 && frame2.parent !== overlay) overlay.addChild(frame2);

    // Primärframe erzeugen (Race-fest, kein Texture.from)
    if (!frame1) {
      if (!S.path1) return;
      const tex1 = await loadTex(S.path1);
      if (!tex1) return;
      frame1 = new PIXI.Sprite(tex1);
      frame1._gbFramePrimary = true;
      frame1.name = "gb-frame-1";
      frame1.anchor.set(0.5);
      frame1.alpha = 1;
      frame1.filters = null;
      frame1.blendMode = PIXI.BLEND_MODES.NORMAL;
      overlay.addChild(frame1);
    }

    // Sekundärframe optional erzeugen/entfernen
    if (S.secondEnabled && S.path2) {
      if (!frame2) {
        const tex2 = await loadTex(S.path2);
        if (tex2) {
          frame2 = new PIXI.Sprite(tex2);
          frame2._gbFrameSecondary = true;
          frame2.name = "gb-frame-2";
          frame2.anchor.set(0.5);
          frame2.alpha = 1;
          frame2.filters = null;
          frame2.blendMode = PIXI.BLEND_MODES.NORMAL;
          overlay.addChild(frame2);
        }
      }
    } else if (frame2) {
      frame2.parent?.removeChild(frame2);
      frame2.destroy({ children: true, texture: false, baseTexture: false });
      frame2 = null;
    }

    // Tints
    {
      const t1 = getTintColor(token, S, 1);
      frame1.tint = t1 != null ? PIXI.utils.string2hex(t1) : 0xFFFFFF;

      if (frame2) {
        const t2 = getTintColor(token, S, 2);
        frame2.tint = t2 != null ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
      }
    }

    // Geometrie
    {
      const kW = token.w, kH = token.h;
      const sx = overlay.scale.x || 1, sy = overlay.scale.y || 1;
      const tx = Math.abs(token.document.texture?.scaleX ?? 1);
      const ty = Math.abs(token.document.texture?.scaleY ?? 1);

      frame1.width  = (kW * tx * (S.scale1 || 1)) / sx;
      frame1.height = (kH * ty * (S.scale1 || 1)) / sy;
      frame1.position.set(0, 0);

      if (frame2) {
        frame2.width  = (kW * tx * (S.scale2 || 1)) / sx;
        frame2.height = (kH * ty * (S.scale2 || 1)) / sy;
        frame2.position.set(0, 0);
      }
    }

    // Z-Order im Overlay
    frame1.zIndex = 1;
    if (frame2) frame2.zIndex = 0;
    overlay.sortDirty = true;

    // Maske
    if (S.maskEnabled && S.pathMask) {
      await applyMaskToToken(token, S);
    } else {
      clearMask(token);
    }
  } catch (e) {
    console.error("[GBT] applyFrameToToken error", token, e);
  }
}
