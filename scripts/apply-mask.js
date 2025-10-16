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

function findArtSprite(token){
  const parent = token.mesh ?? token;
  // Kandidaten: echte Sprites unterhalb des Mesh, aber nicht unser Overlay
  const cand = (parent.children || []).filter(c =>
    c instanceof PIXI.Sprite &&
    c !== token._gbOverlay &&
    !c._gbFramePrimary &&
    !c._gbFrameSecondary
  );
  // Größten Sprite wählen (robust gegen Systemspezifika)
  cand.sort((a,b)=> (b.width*b.height) - (a.width*a.height));
  return cand[0] ?? null;
}

function ensureMaskSprite(token){
  const parent = token.mesh ?? token;
  let m = token._gbMaskSprite;
  if (!m || m.destroyed){
    m = new PIXI.Sprite();
    m.name = "gb-mask-sprite";
    m.anchor.set(0.5);
    m.zIndex = -10; // unter dem Artwork, irrelevant für Mask
    parent.addChild(m);
    token._gbMaskSprite = m;
  } else if (m.parent !== parent){
    m.parent?.removeChild(m);
    parent.addChild(m);
  }
  // Mask-Sprite gehört in Mesh-Lokalsystem
  m.position.set(0,0);
  m.scale.set(1,1);
  m.rotation = 0;
  return m;
}

export async function applyMaskToToken(token, S){
  if (!token || token.destroyed) return;
  S = S || getGbFrameSettings();
  if (!S?.maskEnabled || !S?.pathMask) return;

  const parent = token.mesh ?? token;
  const art = findArtSprite(token);
  if (!art) return; // nichts zu maskieren

  const tex = await loadTex(S.pathMask);
  if (!tex) return;

  // Mask-Sprite vorbereiten
  const mask = ensureMaskSprite(token);
  mask.texture = tex;

  // Größe im Mesh-Lokalsystem
  const sx = Math.abs(parent.scale.x) || 1;
  const sy = Math.abs(parent.scale.y) || 1;
  const w = parent.width  / sx;
  const h = parent.height / sy;

  mask.width  = w;
  mask.height = h;
  mask.position.set(0,0);

  // Nur das Artwork maskieren – NICHT parent/token
  art.mask = mask;

  // Sicherheit: Overlay darf niemals maskiert sein
  if (token._gbOverlay){
    token._gbOverlay.mask = null;
    // Falls ein Fremdmodul versehentlich parent.mask gesetzt hat, neutralisiere:
    if ((parent.mask && parent.mask !== mask) || parent.mask === mask){
      parent.mask = null;
    }
  }
}

export function clearMask(token){
  if (!token || token.destroyed) return;
  const parent = token.mesh ?? token;
  const art = parent && (parent.children||[]).find(c => c instanceof PIXI.Sprite && !c._gbFramePrimary && !c._gbFrameSecondary && c !== token._gbOverlay);
  if (art && art.mask){
    art.mask = null;
  }
  if (token._gbMaskSprite){
    token._gbMaskSprite.parent?.removeChild(token._gbMaskSprite);
    token._gbMaskSprite.destroy({ children:true, texture:false, baseTexture:false });
    token._gbMaskSprite = null;
  }
  if (token._gbOverlay) token._gbOverlay.mask = null;
  parent.mask = null;
}
