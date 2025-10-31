// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

/* ---------- konsolidierter Token-Namespace ---------- */
function ensureGbNS(token) {
  if (!token._gb) token._gb = { overlay: null, f1: null, f2: null, nameplateAnchored: false, maskApplied: false };
  return token._gb;
}

/* ---------- Helfer ---------- */

function removeGbFramesIfAny(token) {
  const gb = ensureGbNS(token);
  const overlay = gb.overlay;
  let removed = false;

  // markierte Sprites im Overlay entfernen
  if (overlay?.children?.length) {
    for (const c of [...overlay.children]) {
      if (c?._gbFramePrimary === true || c?._gbFrameSecondary === true) {
        c.parent?.removeChild(c);
        c.destroy({ children: true, texture: false, baseTexture: false });
        removed = true;
      }
    }
    // Overlay abbauen, wenn leer
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

function updateNameplate(token, S, tx, ty) {
  const NP = S?.nameplate;
  if (!NP?.enabled) return;

  const label = token?.nameplate;
  if (!label || !label.style) return;

  // sichtbar halten
  label.visible = true;
  label.renderable = true;

  // Schriftgröße (einmalige tx/ty genutzt)
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
  if (nt != null) label.style.fill = nt; // Text akzeptiert CSS-Farben/Hex-Strings direkt

  // Anker nur setzen, wenn nötig
  const gb = ensureGbNS(token);
  if (!gb.nameplateAnchored && label.anchor?.set) {
    label.anchor.set(0.5, 0);
    gb.nameplateAnchored = true;
  }

  // Y-Position wie bestätigt (X bleibt unberührt)
  const padding = Math.max(2, Math.round(fontPx * 0.10));
  label.y = (token.h * (1 + ty) / 2) + padding;

  // Reflow (ein Mechanismus reicht)
  label.updateText?.();
}

/* ---------- Hauptfunktion ---------- */

export async function applyFrameToToken(token, S) {
  if (!token || token.destroyed) return;
  if (!token.scene?.active) return;

  S = S || getGbFrameSettings();

  // einmalige Reads cachen
  const tx = Math.abs(token?.document?.texture?.scaleX ?? 1);
  const ty = Math.abs(token?.document?.texture?.scaleY ?? 1);

  // 1) Nameplate immer zuerst (falls aktiviert)
  updateNameplate(token, S, tx, ty);

  // 2) Early-Exit: disableFrame → nur real vorhandene Artefakte säubern
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) {
    const gb = ensureGbNS(token);
    // Frames/Overlay nur entfernen, wenn vorhanden
    removeGbFramesIfAny(token);

    // Maske nur entfernen, wenn Masken jemals aktiv waren ODER in Settings aktiv sind
    if (gb.maskApplied || S?.mask?.enabled) {
      clearMask(token);
      gb.maskApplied = false;
    }
    return;
  }

  // Ab hier nur, wenn Frames erlaubt sind
  const F1 = S.frame1;
  const F2 = S.frame2;
  const M  = S.mask;

  const mesh = token.mesh;
  if (!mesh) return;

  const gb = ensureGbNS(token);

  // Overlay einmalig anlegen; keine Z-Order-Spielchen, keine globale sortableChildren
  let overlay = gb.overlay;
  if (!overlay) {
    overlay = new PIXI.Container();
    overlay.name = "gb-overlay";
    token.addChild(overlay);          // hängt sich hinter das mesh ein; wir verzichten bewusst auf zIndex
    gb.overlay = overlay;
  }

  // Transform nur setzen, wenn nötig (keine Änderung der Skalier-Strategie!)
  // Beibehalten der bestehenden Logik: Position/Maße werden weiterhin wie gehabt gerechnet
  overlay.position.set(token.w / 2, token.h / 2);
  overlay.scale.copyFrom(mesh.scale);
  overlay.rotation = mesh.rotation;
  overlay.sortableChildren = true;

  // Frames im Overlay (keine mesh-Migration, da nicht benötigt)
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

  // Tints (unverändert, aber ohne doppelte Konvertierung für Text)
  if (frame1 && F1) {
    const t1 = getTintColor(token, S, F1);
    frame1.tint = (t1 != null) ? PIXI.utils.string2hex(t1) : 0xFFFFFF;
  }
  if (frame2 && F2) {
    const t2 = getTintColor(token, S, F2);
    frame2.tint = (t2 != null) ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
  }

  // Geometrie exakt wie zuvor (keine Strategieänderung), aber tx/ty nur einmal gelesen
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

  // Maske nur anwenden/entfernen, wenn Settings Masken wirklich vorsehen
  if (M?.enabled && M?.path) {
    await applyMaskToToken(token, S);
    // Kennzeichnen, dass tatsächlich eine Maske aktiv ist/war
    ensureGbNS(token).maskApplied = true;
  } else {
    // Nur wenn wirklich eine Maske existierte, entfernen
    if (gb.maskApplied) {
      clearMask(token);
      gb.maskApplied = false;
    }
  }
}
