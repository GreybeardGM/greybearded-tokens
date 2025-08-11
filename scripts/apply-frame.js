// apply-frame.js
import { getTintColor } from "./get-tint-color.js";

export async function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;

  const mesh = token.mesh;
  if (!mesh) return;

  mesh.sortableChildren = true;

  // Settings lesen
  const tintMode1 = game.settings.get("greybearded-tokens", "frameTintMode") ?? "Disposition";
  const scale1    = Number(game.settings.get("greybearded-tokens","frameScale")) || 1;
  const path1     = game.settings.get("greybearded-tokens", "frameImagePath");

  const secondEnabled = !!game.settings.get("greybearded-tokens", "secondaryFrameEnabled");
  const tintMode2     = game.settings.get("greybearded-tokens", "secondaryFrameTintMode") ?? "Disposition";
  const scale2        = Number(game.settings.get("greybearded-tokens","secondaryFrameScale")) || 1;
  const path2         = game.settings.get("greybearded-tokens", "secondaryFrameImagePath");

  // bestehende Sprites suchen
  let frame1 = mesh.children.find(c => c?._gbFramePrimary);
  let frame2 = mesh.children.find(c => c?._gbFrameSecondary);

  // Helper zum (Neu-)Laden der Textur falls Pfad geändert wurde
  const ensureTexture = (sprite, path) => {
    if (!sprite) return;
    const current = sprite.texture?.baseTexture?.resource?.url;
    if (!current || current !== path) {
      sprite.texture = PIXI.Texture.from(path);
    }
  };

  // Frame 1 erstellen
  if (!frame1) {
    frame1 = new PIXI.Sprite(PIXI.Texture.from(path1));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    mesh.addChild(frame1);
  } else {
    ensureTexture(frame1, path1);
  }

  // Frame 2 erstellen/entfernen je nach Setting
  if (secondEnabled) {
    if (!frame2) {
      frame2 = new PIXI.Sprite(PIXI.Texture.from(path2));
      frame2._gbFrameSecondary = true;
      frame2.name = "gb-frame-2";
      frame2.anchor.set(0.5);
      mesh.addChild(frame2);
    } else {
      ensureTexture(frame2, path2);
    }
  } else if (frame2) {
    frame2.parent?.removeChild(frame2);
    frame2.destroy({ children: true, texture: false, baseTexture: false });
    frame2 = null;
  }

  // Tints aktualisieren (bei jedem Refresh)
  {
    const t1 = getTintColor(token, tintMode1);
    frame1.tint = t1 ? PIXI.utils.string2hex(t1) : 0xFFFFFF;

    if (frame2) {
      const t2 = getTintColor(token, tintMode2);
      frame2.tint = t2 ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }
  }

  // Geometrie/Skalierung
  frame1.scale.set(1,1);
  frame1.anchor.set(0.5);
  frame1.position.set(0,0);

  if (frame2) {
    frame2.scale.set(1,1);
    frame2.anchor.set(0.5);
    frame2.position.set(0,0);
  }

  // Token-Kachelgröße
  const kW = token.w;
  const kH = token.h;

  // Eltern-Skalierung (Token-Mesh)
  const sx = mesh.scale.x || 1;
  const sy = mesh.scale.y || 1;

  // Textur-Skalierung des Tokenbildes
  const tx = Math.abs(token.document.texture?.scaleX ?? 1);
  const ty = Math.abs(token.document.texture?.scaleY ?? 1);

  // Größe so setzen, dass Eltern- und Textur-Skalierung kompensiert werden
  frame1.width  = (kW * tx * scale1) / sx;
  frame1.height = (kH * ty * scale1) / sy;

  if (frame2) {
    frame2.width  = (kW * tx * scale2) / sx;
    frame2.height = (kH * ty * scale2) / sy;
  }

  // Z‑Reihenfolge: Bars ganz oben, darunter Frame 1, darunter Frame 2, danach Token
  const barsZ = mesh.bars?.zIndex ?? 20;
  frame1.zIndex = barsZ - 1;
  if (frame2) frame2.zIndex = frame1.zIndex - 1;

  // Position (v12: (0,0) ist Mesh-Mitte)
  frame1.position.set(0, 0);
  if (frame2) frame2.position.set(0, 0);
}
