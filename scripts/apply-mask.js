// apply-mask.js
import { getGbFrameSettings } from "./settings-snapshot.js";

const TEX_CACHE = new Map();
async function loadTex(url){
  if (!url) return null;
  if (TEX_CACHE.has(url)) return TEX_CACHE.get(url);
  const tex = await PIXI.Assets.load(url);
  TEX_CACHE.set(url, tex);
  return tex;
}

function ensureMaskSibling(token){
  // Maske als Sibling von mesh, also Kind von token (wie das Overlay)
  const parent = token;
  let m = token._gbMaskSprite;
  if (!m || m.destroyed){
    m = new PIXI.Sprite();
    m.name = "gb-mask-sprite";
    token._gbMaskSprite = m;
  }
  if (m.parent !== parent){
    m.parent?.removeChild(m);
    parent.addChild(m);
  }
  // nie das Overlay als Parent
  if (token._gbOverlay && m.parent === token._gbOverlay){
    token._gbOverlay.removeChild(m);
    parent.addChild(m);
  }
  return m;
}

export async function applyMaskToToken(token, S){
  if (!token || token.destroyed) return;
  S = S || getGbFrameSettings();
  if (!S?.maskEnabled || !S?.pathMask) return;

  const mesh = token.mesh ?? token;
  const tex  = await loadTex(S.pathMask);
  if (!tex) return;

  const mask = ensureMaskSibling(token);
  mask.texture = tex;

  // Geometrie im Token-KS: Zentrum = mesh.position
  const w = token.w ?? mesh.width;
  const h = token.h ?? mesh.height;

  mask.anchor.set(0.5, 0.5);
  mask.position.copyFrom(mesh.position);
  mask.rotation = 0;
  mask.scale.set(1,1);
  mask.width  = w;
  mask.height = h;

  // Nur das mesh maskieren
  mesh.mask = mask;

  // Sicherheit: Overlay nie maskieren
  if (token._gbOverlay) token._gbOverlay.mask = null;
}

export function clearMask(token){
  if (!token || token.destroyed) return;
  const mesh = token.mesh ?? token;

  if (mesh.mask) mesh.mask = null;

  if (token._gbMaskSprite){
    token._gbMaskSprite.parent?.removeChild(token._gbMaskSprite);
    token._gbMaskSprite.destroy({ children:true, texture:false, baseTexture:false });
    token._gbMaskSprite = null;
  }

  if (token._gbOverlay) token._gbOverlay.mask = null;
}
