// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";

export async function applyFrameToToken(token) {
  if (token.document.getFlag("greybearded-tokens", "disableFrame")) return;

  const mesh = token.mesh;
  if (!mesh) return;

  mesh.sortableChildren = true;
  const S = getGbFrameSettings();

  // vorhandene Sprites suchen
  let frame1 = mesh.children.find(c => c?._gbFramePrimary);
  let frame2 = mesh.children.find(c => c?._gbFrameSecondary);

  // Frame 1 erzeugen (Pfad/Anchor aus Snapshot)
  if (!frame1) {
    frame1 = new PIXI.Sprite(PIXI.Texture.from(S.path1));
    frame1._gbFramePrimary = true;
    frame1.name = "gb-frame-1";
    frame1.anchor.set(0.5);
    mesh.addChild(frame1);
  }

  // Frame 2 je nach Snapshot erzeugen/entfernen
  if (S.secondEnabled) {
    if (!frame2) {
      frame2 = new PIXI.Sprite(PIXI.Texture.from(S.path2));
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

  // Tints (Mode fix aus Snapshot; Wert dynamisch je Token-Zustand)
  {
    const t1 = getTintColor(token, S.mode1);
    frame1.tint = t1 ? PIXI.utils.string2hex(t1) : 0xFFFFFF;

    if (frame2) {
      const t2 = getTintColor(token, S.mode2);
      frame2.tint = t2 ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }
  }

  // Geometrie/Skalierung (Scale fix aus Snapshot)
  {
    const kW = token.w, kH = token.h;
    const sx = mesh.scale.x || 1, sy = mesh.scale.y || 1;
    const tx = Math.abs(token.document.texture?.scaleX ?? 1);
    const ty = Math.abs(token.document.texture?.scaleY ?? 1);

    frame1.width  = (kW * tx * S.scale1) / sx;
    frame1.height = (kH * ty * S.scale1) / sy;
    frame1.position.set(0, 0);

    if (frame2) {
      frame2.width  = (kW * tx * S.scale2) / sx;
      frame2.height = (kH * ty * S.scale2) / sy;
      frame2.position.set(0, 0);
    }
  }

  // Z‑Order: Bars > Frame1 > Frame2 > Token
  const barsZ = mesh.bars?.zIndex ?? 20;
  frame1.zIndex = barsZ - 1;
  if (frame2) frame2.zIndex = frame1.zIndex - 1;
  mesh.sortDirty = true;
}
