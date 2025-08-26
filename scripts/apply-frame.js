// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

export async function applyFrameToToken(token, S) {
  if (!token || token.destroyed) return;
  S ||= getGbFrameSettings();
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;

  const mesh = token.mesh;
  if (!mesh) return;

  // ── Parent für die Frames: token.border (unmaskiert, folgt Bewegung) ──
  const framesParent = token.border ?? token;   // Border ist ein Container des Tokens
  framesParent.sortableChildren = true;

  // ── evtl. falsch platzierte alte Frames aus mesh ins framesParent migrieren ──
  for (const ch of mesh.children.slice()) {
    if (ch?._gbFramePrimary || ch?._gbFrameSecondary) framesParent.addChild(ch);
  }

  // ── vorhandene Frames unter framesParent suchen ──
  let frame1 = framesParent.children.find(c => c?._gbFramePrimary === true);
  let frame2 = framesParent.children.find(c => c?._gbFrameSecondary === true);

  // ── Frame 1 ──
  if (!frame1) {
    if (!S.path1) return;
    frame1 = new PIXI.Sprite(PIXI.Texture.from(S.path1));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    framesParent.addChild(frame1);
  }

  // ── Frame 2 (optional) ──
  if (S.secondEnabled && S.path2) {
    if (!frame2) {
      frame2 = new PIXI.Sprite(PIXI.Texture.from(S.path2));
      frame2._gbFrameSecondary = true;
      frame2.name = "gb-frame-2";
      frame2.anchor.set(0.5);
      framesParent.addChild(frame2);
    }
  } else if (frame2) {
    frame2.parent?.removeChild(frame2);
    frame2.destroy({ children: true, texture: false, baseTexture: false });
    frame2 = null;
  }

  // ── Tints ──
  {
    const t1 = getTintColor(token, S, 1);
    frame1.tint = (t1 != null) ? PIXI.utils.string2hex(t1) : 0xFFFFFF;

    if (frame2) {
      const t2 = getTintColor(token, S, 2);
      frame2.tint = (t2 != null) ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }
  }

  // ── Geometrie: Breite/Höhe wie gehabt, nur gegen framesParent.scale rechnen ──
  {
    const kW = token.w, kH = token.h;
    const sx = framesParent.scale?.x || 1, sy = framesParent.scale?.y || 1;
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

  // ── Reihenfolge: Primär über Sekundär ──
  frame1.zIndex = 2;
  if (frame2) frame2.zIndex = 1;
  framesParent.sortDirty = true;

  // ── Maske NUR aufs mesh ──
  if (S.maskEnabled && S.pathMask) {
    await applyMaskToToken(token, S);   // setzt mesh.mask = (unsichtbare) Maske
  } else {
    clearMask(token);
  }
}
