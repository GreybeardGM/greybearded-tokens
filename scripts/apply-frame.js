// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

export async function applyFrameToToken(token, S) {
  if (!token || token.destroyed) return;
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;
  S = S || getGbFrameSettings();

  token.sortableChildren = true;
  
  const mesh = token.mesh;
  if (!mesh) return;
  mesh.sortableChildren = true;

  // Overlay-Container sicherstellen (Sibling von mesh)
  let overlay = token._gbOverlay;
  if (!overlay) {
    overlay = new PIXI.Container();
    overlay.name = "gb-overlay";
    token.addChild(overlay);
    token._gbOverlay = overlay;
  }
  
  // Z-Order: overlay über mesh
  mesh.zIndex = 10;
  overlay.zIndex = 11;
  
  // vorhandene Frames künftig im OVERLAY suchen/ablegen
  let frame1 = overlay.children.find(c => c?._gbFramePrimary === true)
           || mesh.children.find(c => c?._gbFramePrimary === true); // Migration aus alten Builds
  if (frame1 && frame1.parent !== overlay) overlay.addChild(frame1);
  
  let frame2 = overlay.children.find(c => c?._gbFrameSecondary === true)
           || mesh.children.find(c => c?._gbFrameSecondary === true);
  if (frame2 && frame2.parent !== overlay) overlay.addChild(frame2);
  
  // Neue Frames immer im overlay erzeugen:
  if (!frame1 && S.path1) {
    frame1 = new PIXI.Sprite(PIXI.Texture.from(S.path1));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    overlay.addChild(frame1);
  }
  
  if (S.secondEnabled && S.path2) {
    if (!frame2) {
      frame2 = new PIXI.Sprite(PIXI.Texture.from(S.path2));
      frame2._gbFrameSecondary = true;
      frame2.name = "gb-frame-2";
      frame2.anchor.set(0.5);
      overlay.addChild(frame2);
    }
  } else if (frame2) {
    frame2.parent?.removeChild(frame2);
    frame2.destroy({ children: true, texture: false, baseTexture: false });
    frame2 = null;
  }
  
  // Tints
  {
    const t1 = getTintColor(token, S, 1);
    frame1.tint = (t1 != null) ? PIXI.utils.string2hex(t1) : 0xFFFFFF;

    if (frame2) {
      const t2 = getTintColor(token, S, 2);
      frame2.tint = (t2 != null) ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }
  }

  // Geometrie
  {
    const kW = token.w, kH = token.h;
    const sx = mesh.scale.x || 1, sy = mesh.scale.y || 1;
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

  // Z-Order
  const barsZ = mesh.bars?.zIndex ?? 20;
  frame1.zIndex = barsZ - 1;
  if (frame2) frame2.zIndex = frame1.zIndex - 1;
  mesh.sortDirty = true;

  // Maske
  if (S.maskEnabled && S.pathMask) {
    await applyMaskToToken(token, S);
  } else {
    // falls früher mal eine Maske aktiv war, sauber entfernen
    clearMask(token);
  }
}
