// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

export async function applyFrameToToken(token, S) {
  if (!token || token.destroyed) return;
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;
  S = S || getGbFrameSettings();

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
  
  // Frame 1
  if (!frame1) {
    if (!S.path1) return;
    frame1 = new PIXI.Sprite(PIXI.Texture.from(S.path1));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    overlay.addChild(frame1);
  }
  
  // Frame 2 (optional)
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
  
  // 3) Tints unverändert
  {
    const t1 = getTintColor(token, S, 1);
    frame1.tint = (t1 != null) ? PIXI.utils.string2hex(t1) : 0xFFFFFF;
  
    if (frame2) {
      const t2 = getTintColor(token, S, 2);
      frame2.tint = (t2 != null) ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }
  }
  
  // 4) Geometrie: jetzt gegen overlay.scale rechnen
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
  
  // 5) Z-Order: Primär über Sekundär (im Overlay)
  frame1.zIndex = 1;           // oben
  if (frame2) frame2.zIndex = 0; // darunter
  overlay.sortDirty = true;
  
  // Maske
  if (S.maskEnabled && S.pathMask) {
    await applyMaskToToken(token, S);
  } else {
    // falls früher mal eine Maske aktiv war, sauber entfernen
    clearMask(token);
  }

  // --- Nameplate stylen (Font mitskalieren, Y statisch am unteren Rand) ---
  {
    // 1) Label holen (Foundry v13: TokenMesh.nameplate ist PIXI.Text)
    const label = mesh?.nameplate ?? token.nameplate;
    if (label) {
      // 2) Basiswerte
      const basePx = 22; // dein gewünschter Basiswert
  
      // Token-"Größe" (Quadrate) + Texture-Scaling (wie bei deinen Frames)
      const wSquares = token.document.width  ?? 1;
      const hSquares = token.document.height ?? 1;
      const sizeFactor = Math.max(wSquares, hSquares);
  
      const tx = Math.abs(token.document.texture?.scaleX ?? 1);
      const ty = Math.abs(token.document.texture?.scaleY ?? 1);
      const textureScale = Math.max(tx, ty);
  
      // Endgültige Fontgröße:
      // - skaliert mit Token-Größe (2x2 => ~doppelt)
      // - multipliziert mit Texture-Scale (falls du einzelne Tokens per texture scale vergrößerst)
      const fontPx = Math.max(8, Math.round(basePx * sizeFactor * textureScale));
      label.style.fontSize = fontPx;
  
      // Optional: Stil wie gehabt (du kannst deine Farben/Shadow hier belassen)
      // label.style.fill = "#ffffff";
      // label.style.stroke = "#000000";
      // label.style.strokeThickness = Math.ceil(fontPx / 8);
  
      // 3) Anker und X-Zentrierung (sicherstellen, dass es mittig sitzt)
      //    Anchor (0.5, 0): X mittig, Y = Toplinie des Textes
      label.anchor?.set?.(0.5, 0);
      label.x = 0;
  
      // 4) Y-Position ABSOLUT an die Unterkante legen (keine kumulierte Verschiebung)
      //    token.h ist die unskalierte Token-Höhe in lokalen Koordinaten des Mesh (Center-Anchor).
      //    Da der Nameplate-Container mit dem Mesh mitskaliert, setzen wir die Position
      //    in Lokalkoordinaten: +token.h/2 bringt uns an die Unterkante, +padding hebt etwas ab.
      const padding = Math.max(2, Math.round(fontPx * 0.15)); // 10–20% der Fontgröße als Luft
      label.y = (token.h / 2) + padding;
  
      // 5) Render aktualisieren (falls nötig)
      label.dirty = true; // oder label.updateText?.();
    }
  }
}

