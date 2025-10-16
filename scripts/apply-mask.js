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

function getArtSprite(token){
  const mesh = token.mesh ?? token;
  // Primär: Foundry V12/V13 Artwork-Sprite
  if (mesh?.icon instanceof PIXI.Sprite) return mesh.icon;

  // Fallback: größter Sprite unterhalb mesh, aber nicht unsere Overlays
  const sprites = (mesh?.children || []).filter(c =>
    c instanceof PIXI.Sprite &&
    c !== token._gbOverlay &&
    !c._gbFramePrimary &&
    !c._gbFrameSecondary &&
    c.name !== "gb-mask-sprite"
  );
  if (!sprites.length) return null;
  sprites.sort((a,b)=> (b.width*b.height) - (a.width*a.height));
  return sprites[0];
}

function ensureMaskSibling(token, art){
  const parent = art.parent;
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
  return m;
}

export async function applyMaskToToken(token, S){
  if (!token || token.destroyed) return;
  S = S || getGbFrameSettings();
  if (!S?.maskEnabled || !S?.pathMask) return;

  const art = getArtSprite(token);
  if (!art) return;

  const tex = await loadTex(S.pathMask);
  if (!tex) return;

  const mask = ensureMaskSibling(token, art);
  mask.texture = tex;

  // Lokalsystem des Artwork-Sprites exakt spiegeln
  // (kein zusätzliches Skalieren/Dividieren)
  const ax = art.anchor?.x ?? 0.5;
  const ay = art.anchor?.y ?? 0.5;
  mask.anchor.set(ax, ay);

  // Größe/Position im selben Parent-KS
  mask.width  = art.width;
  mask.height = art.height;
  mask.position.set(art.position.x, art.position.y);
  mask.rotation = art.rotation;

  // Sicherheit: keine globale/Parent-Maskierung mehr
  const mesh = token.mesh ?? token;
  if (mesh.mask) mesh.mask = null;
  if (token._gbOverlay?.mask) token._gbOverlay.mask = null;

  // Nur das Artwork maskieren
  art.mask = mask;
}

export function clearMask(token){
  if (!token || token.destroyed) return;
  const mesh = token.mesh ?? token;

  // Artwork-Maske lösen
  const art = mesh?.icon instanceof PIXI.Sprite ? mesh.icon : null;
  if (art && art.mask) art.mask = null;

  // Fallback: ggf. größte Sprite-Maske entfernen
  if (!art){
    for (const c of (mesh?.children || [])){
      if (c instanceof PIXI.Sprite && c.mask) c.mask = null;
    }
  }

  // Mask-Sprite entfernen, Frame-Overlay nie maskieren
  if (token._gbMaskSprite){
    token._gbMaskSprite.parent?.removeChild(token._gbMaskSprite);
    token._gbMaskSprite.destroy({ children:true, texture:false, baseTexture:false });
    token._gbMaskSprite = null;
  }
  if (token._gbOverlay) token._gbOverlay.mask = null;
  mesh.mask = null;
}
