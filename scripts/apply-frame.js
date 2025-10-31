// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

/* ---------- interne Helfer ---------- */

/** Alle von uns erzeugten Frames entfernen (egal ob im Overlay oder noch im mesh), leere Container wegräumen */
function removeAllGbFrames(token) {
  const mesh = token?.mesh;
  if (!mesh) return;

  // 1) Im Overlay
  const overlay = token._gbOverlay;
  if (overlay) {
    // markierte Frames killen
    overlay.children
      ?.filter(c => c?._gbFramePrimary === true || c?._gbFrameSecondary === true)
      ?.forEach(spr => {
        spr.parent?.removeChild(spr);
        spr.destroy({ children: true, texture: false, baseTexture: false });
      });

    // falls jetzt leer → Overlay entfernen
    if (!overlay.children?.length) {
      overlay.parent?.removeChild(overlay);
      overlay.destroy({ children: true, texture: false, baseTexture: false });
      token._gbOverlay = null;
    }
  }

  // 2) Migration-Sicherheit: evtl. alte Frames noch direkt im mesh
  mesh.children
    ?.filter(c => c?._gbFramePrimary === true || c?._gbFrameSecondary === true)
    ?.forEach(spr => {
      spr.parent?.removeChild(spr);
      spr.destroy({ children: true, texture: false, baseTexture: false });
    });
}

/** Nameplate-Styling anwenden (vorrangig, läuft immer zuerst, wenn Setting aktiv) */
function updateNameplate(token, S) {
  const NP = S?.nameplate;
  if (!NP?.enabled) return;

  const label = token?.nameplate; // V12/V13: PIXI.Text-ähnlich
  if (!label || !label.style) return;

  // sicher sichtbar
  label.visible = true;
  label.renderable = true;

  // Basisgröße
  const basePx = Number(NP.baseFontSize ?? 22) || 22;
  let fontPx = basePx;

  const tx = Math.abs(token?.document?.texture?.scaleX ?? 1);
  const ty = Math.abs(token?.document?.texture?.scaleY ?? 1);

  if (NP.scaleWithToken) {
    const wSquares = token?.document?.width  ?? 1;
    const hSquares = token?.document?.height ?? 1;
    const sizeFactor = Math.max(wSquares, hSquares);
    const textureScale = Math.max(tx, ty);
    fontPx = Math.max(8, Math.round(basePx * sizeFactor * textureScale));
  }

  // Stil
  label.style.fontSize = fontPx;
  if (NP.fontFamily) label.style.fontFamily = NP.fontFamily;

  const nt = getTintColor(token, S, NP);
  if (nt != null) label.style.fill = nt;

  // Anker und Y-Position (X nicht anfassen)
  label.anchor?.set?.(0.5, 0);
  const padding = Math.max(2, Math.round(fontPx * 0.10));
  label.y = (token.h * (1 + ty) / 2) + padding;

  // Reflow
  label.updateText?.();
  label.dirty = true;
}

/* ---------- Hauptfunktion ---------- */

export async function applyFrameToToken(token, S) {
  if (!token || token.destroyed) return;

  // Settings (werden für Nameplate sofort benötigt)
  S = S || getGbFrameSettings();

  // 1) Nameplate IMMER zuerst aktualisieren (falls aktiviert)
  updateNameplate(token, S);

  // 2) Early-Exit-Pfad: disableFrame → Frames/Masken entfernen, dann Schluss
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) {
    removeAllGbFrames(token);
    clearMask(token);
    return;
  }

  // Ab hier nur noch, wenn Frames erlaubt sind
  const F1 = S.frame1;
  const F2 = S.frame2;
  const M  = S.mask;

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

  // 3) Frames im OVERLAY finden/erzeugen (inkl. Migration alter Frames aus mesh)
  let frame1 = overlay.children.find(c => c?._gbFramePrimary === true)
           ||  mesh.children.find(c => c?._gbFramePrimary === true);
  if (frame1 && frame1.parent !== overlay) overlay.addChild(frame1);

  let frame2 = overlay.children.find(c => c?._gbFrameSecondary === true)
           ||  mesh.children.find(c => c?._gbFrameSecondary === true);
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

  // 4) Tints
  if (frame1 && F1) {
    const t1 = getTintColor(token, S, F1);
    frame1.tint = (t1 != null) ? PIXI.utils.string2hex(t1) : 0xFFFFFF;
  }
  if (frame2 && F2) {
    const t2 = getTintColor(token, S, F2);
    frame2.tint = (t2 != null) ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
  }

  // 5) Geometrie (gegen overlay.scale rechnen)
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

  // 6) Z-Order im Overlay
  if (frame1) frame1.zIndex = 1; // oben
  if (frame2) frame2.zIndex = 0; // darunter
  overlay.sortDirty = true;

  // 7) Maske
  if (M?.enabled && M?.path) {
    await applyMaskToToken(token, S); // nutzt S.mask intern
  } else {
    clearMask(token);
  }
}
