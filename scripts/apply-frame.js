// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

export async function applyFrameToToken(token, S) {
  if (!token || token.destroyed) return;
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;
  S = S || getGbFrameSettings();

  const F1 = S.frame1;
  const F2 = S.frame2;
  const M  = S.mask;
  const NP = S.nameplate;

  const mesh = token.mesh;
  if (!mesh) return;

  token.sortableChildren = true;

  // Overlay-Container als Sibling von mesh
  let overlay = token._gbOverlay;
  if (!overlay) {
    overlay = new PIXI.Container();
    overlay.name = "gb-overlay";
    token.addChild(overlay);
    token._gbOverlay = overlay;
  }
  // Overlay transformiert wie das mesh (damit Größenformeln stimmen)
  overlay.position.set(token.w / 2, token.h / 2);
  overlay.scale.copyFrom(mesh.scale);
  overlay.rotation = mesh.rotation;
  overlay.sortableChildren = true;

  // Z-Order: overlay über mesh
  mesh.zIndex = 10;
  overlay.zIndex = (token.bars?.zIndex ?? mesh.bars?.zIndex ?? 20) - 1;

  // 2) Frames IM OVERLAY finden/erzeugen (Migration alter Frames aus mesh)
  let frame1 = overlay.children.find(c => c?._gbFramePrimary === true)
          || mesh.children.find(c => c?._gbFramePrimary === true);
  if (frame1 && frame1.parent !== overlay) overlay.addChild(frame1);

  let frame2 = overlay.children.find(c => c?._gbFrameSecondary === true)
          || mesh.children.find(c => c?._gbFrameSecondary === true);
  if (frame2 && frame2.parent !== overlay) overlay.addChild(frame2);

  // Frame 1 (nur erzeugen, wenn Pfad gesetzt ist)
  if (!frame1 && F1?.path) {
    frame1 = new PIXI.Sprite(PIXI.Texture.from(F1.path));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    overlay.addChild(frame1);
  }

  // Frame 2 (optional)
  if (F2?.enabled && F2?.path) {
    if (!frame2) {
      frame2 = new PIXI.Sprite(PIXI.Texture.from(F2.path));
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

  // 3) Tints (neu: über Teil-Snapshots)
  {
    if (frame1 && F1) {
      const t1 = getTintColor(token, S, F1);
      frame1.tint = (t1 != null) ? PIXI.utils.string2hex(t1) : 0xFFFFFF;
    }
    if (frame2 && F2) {
      const t2 = getTintColor(token, S, F2);
      frame2.tint = (t2 != null) ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }
  }

  // 4) Geometrie: jetzt gegen overlay.scale rechnen
  {
    const kW = token.w, kH = token.h;
    const sx = overlay.scale.x || 1, sy = overlay.scale.y || 1;
    const tx = Math.abs(token.document.texture?.scaleX ?? 1);
    const ty = Math.abs(token.document.texture?.scaleY ?? 1);

    if (frame1 && F1) {
      frame1.width  = (kW * tx * (F1.scale || 1)) / sx;
      frame1.height = (kH * ty * (F1.scale || 1)) / sy;
      frame1.position.set(0, 0);
    }

    if (frame2 && F2) {
      frame2.width  = (kW * tx * (F2.scale || 1)) / sx;
      frame2.height = (kH * ty * (F2.scale || 1)) / sy;
      frame2.position.set(0, 0);
    }
  }

  // 5) Z-Order: Primär über Sekundär (im Overlay)
  if (frame1) frame1.zIndex = 1;            // oben
  if (frame2) frame2.zIndex = 0;            // darunter
  overlay.sortDirty = true;

  // 6) Maske
  if (M?.enabled && M?.path) {
    await applyMaskToToken(token, S); // nutzt S.mask intern
  } else {
    clearMask(token);
  }

  // 7) Nameplate stylen (Font mitskalieren, Y statisch am unteren Rand)
  if (NP?.enabled) {
    // In V13 ist nameplate meist ein Container mit .text (PIXI.Text)
    const np = mesh?.nameplate ?? token.nameplate;
    const txt = np?.text ?? np; // falls es kein Container ist, txt==np (PIXI.Text)
  
    if (np && txt && txt.style) {
      // Schriftgröße
      const basePx = Number(NP.baseFontSize ?? 22) || 22;
      let fontPx = basePx;
  
      const tx = Math.abs(token.document.texture?.scaleX ?? 1);
      const ty = Math.abs(token.document.texture?.scaleY ?? 1);
  
      if (NP.scaleWithToken) {
        const wSquares = token.document.width  ?? 1;
        const hSquares = token.document.height ?? 1;
        const sizeFactor = Math.max(wSquares, hSquares);
        const textureScale = Math.max(tx, ty);
        fontPx = Math.max(8, Math.round(basePx * sizeFactor * textureScale));
      }
  
      // Stil auf dem Textobjekt
      txt.style.fontSize = fontPx;
      if (NP.fontFamily) txt.style.fontFamily = NP.fontFamily;
  
      const nt = getTintColor(token, S, NP);
      if (nt != null) txt.style.fill = nt;
  
      // Anchor/Mitte am Text; X NICHT auf 0 setzen (dein Offset bleibt korrekt)
      txt.anchor?.set?.(0.5, 0);
  
      // Position auf dem Container setzen (damit Backdrop/HitArea mitwandern)
      const padding = Math.max(2, Math.round(fontPx * 0.10));
      np.y = (token.h * (1 + ty) / 2) + padding;
  
      // Render aktualisieren
      txt.updateText?.();
      txt.dirty = true;
    }
  }

}
