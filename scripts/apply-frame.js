// apply-frame.js
import { getTintColor } from "./get-tint-color.js";

export async function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;

  const mesh = token.mesh;
  if (!mesh) return;

  mesh.sortableChildren = true;

  // vorhandene Sprites suchen
  let frame1 = mesh.children.find(c => c?._gbFramePrimary);
  let frame2 = mesh.children.find(c => c?._gbFrameSecondary);

  // Frame 1 erzeugen (Pfad nur jetzt lesen)
  if (!frame1) {
    const path1 = game.settings.get("greybearded-tokens", "frameImagePath");
    frame1 = new PIXI.Sprite(PIXI.Texture.from(path1));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    mesh.addChild(frame1);
  }

  // Frame 2 je nach Setting erzeugen/entfernen (Pfad nur jetzt lesen)
  const secondEnabled = !!game.settings.get("greybearded-tokens", "secondaryFrameEnabled");
  if (secondEnabled) {
    if (!frame2) {
      const path2 = game.settings.get("greybearded-tokens", "secondaryFrameImagePath");
      frame2 = new PIXI.Sprite(PIXI.Texture.from(path2));
      frame2._gbFrameSecondary = true;
      frame2.name = "gb-frame-2";
      frame2.anchor.set(0.5);
      mesh.addChild(frame2);
    }
  } else if (frame2) {
    frame2.parent?.removeChild(frame2);
    frame2.destroy({ children: true, texture: false, baseTexture: false });
    frame2 = null;
  }

  // Tints (dürfen weiter live sein, wenn du willst – oder auch reloadpflichtig machen)
  {
    const tintMode1 = game.settings.get("greybearded-tokens", "frameTintMode") ?? "Disposition";
    const t1 = getTintColor(token, tintMode1);
    frame1.tint = t1 ? PIXI.utils.string2hex(t1) : 0xFFFFFF;

    if (frame2) {
      const tintMode2 = game.settings.get("greybearded-tokens", "secondaryFrameTintMode") ?? "Disposition";
      const t2 = getTintColor(token, tintMode2);
      frame2.tint = t2 ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }
  }

  // Geometrie/Skalierung
  {
    const kW = token.w, kH = token.h;
    const sx = mesh.scale.x || 1, sy = mesh.scale.y || 1;
    const tx = Math.abs(token.document.texture?.scaleX ?? 1);
    const ty = Math.abs(token.document.texture?.scaleY ?? 1);

    const scale1 = Number(game.settings.get("greybearded-tokens","frameScale")) || 1;
    frame1.width  = (kW * tx * scale1) / sx;
    frame1.height = (kH * ty * scale1) / sy;
    frame1.position.set(0, 0);

    if (frame2) {
      const scale2 = Number(game.settings.get("greybearded-tokens","secondaryFrameScale")) || 1;
      frame2.width  = (kW * tx * scale2) / sx;
      frame2.height = (kH * ty * scale2) / sy;
      frame2.position.set(0, 0);
    }
  }

  // Z‑Order: Bars > Frame1 > Frame2 > Token
  const barsZ = mesh.bars?.zIndex ?? 20;
  frame1.zIndex = barsZ - 1;
  if (frame2) frame2.zIndex = frame1.zIndex - 1;
  mesh.sortDirty = true;
}
