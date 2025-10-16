// apply-frame.js (minimal-invasive Korrektur)
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";

const TEX_CACHE = new Map();
async function loadTex(url){ if(!url) return null; if(TEX_CACHE.has(url)) return TEX_CACHE.get(url); const tex = await PIXI.Assets.load(url); TEX_CACHE.set(url, tex); return tex; }

function ensureOverlay(token){
  const parent = token.mesh ?? token;
  parent.sortableChildren = true;

  let c = token._gbOverlay;
  if (!c || c.parent !== parent) {
    if (c?.parent) c.parent.removeChild(c);
    c = new PIXI.Container();
    c.name = "gb-overlay";
    c.sortableChildren = true;
    c.zIndex = 10000;
    parent.addChild(c);
    token._gbOverlay = c;
  }
  // Mesh-Lokalsystem: Ursprung = Mitte → Overlay bleibt bei (0,0)
  c.position.set(0, 0);
  c.pivot.set(0, 0);
  c.scale.set(1, 1);
  c.rotation = 0;
  return c;
}

export async function applyFrameToToken(token, S){
  try{
    if (!token || token.destroyed) return;
    if (!canvas?.ready) return;
    if (await token.document.getFlag("greybearded-tokens","disableFrame")) return;

    S = S || getGbFrameSettings();
    if (!S?.path1) return;

    const overlay = ensureOverlay(token);

    let frame1 = overlay.children.find(c=>c?._gbFramePrimary===true)
            || (token.mesh?.children||[]).find(c=>c?._gbFramePrimary===true);
    if (frame1 && frame1.parent !== overlay) overlay.addChild(frame1);

    let frame2 = overlay.children.find(c=>c?._gbFrameSecondary===true)
            || (token.mesh?.children||[]).find(c=>c?._gbFrameSecondary===true);
    if (frame2 && frame2.parent !== overlay) overlay.addChild(frame2);

    if (!frame1){
      const tex1 = await loadTex(S.path1); if(!tex1) return;
      frame1 = new PIXI.Sprite(tex1);
      frame1._gbFramePrimary = true; frame1.name="gb-frame-1";
      frame1.anchor.set(0.5); frame1.alpha=1; frame1.filters=null;
      frame1.blendMode = PIXI.BLEND_MODES.NORMAL;
      overlay.addChild(frame1);
    }

    if (S.secondEnabled && S.path2){
      if (!frame2){
        const tex2 = await loadTex(S.path2);
        if (tex2){
          frame2 = new PIXI.Sprite(tex2);
          frame2._gbFrameSecondary = true; frame2.name="gb-frame-2";
          frame2.anchor.set(0.5); frame2.alpha=1; frame2.filters=null;
          frame2.blendMode = PIXI.BLEND_MODES.NORMAL;
          overlay.addChild(frame2);
        }
      }
    } else if (frame2){
      frame2.parent?.removeChild(frame2);
      frame2.destroy({children:true, texture:false, baseTexture:false});
      frame2=null;
    }

    const parent = token.mesh ?? token;
    const sx = Math.abs(parent.scale.x) || 1;
    const sy = Math.abs(parent.scale.y) || 1;
  
    // Texture-/Flip-Skalierung des Tokens berücksichtigen
    const tx = Math.abs(token.document.texture?.scaleX ?? 1);
    const ty = Math.abs(token.document.texture?.scaleY ?? 1);
  
    // Zielgröße in Canvas-Pixeln (sichtbare Token-Größe)
    const targetW = (token.w ?? parent.width)  * tx;
    const targetH = (token.h ?? parent.height) * ty;
  
    // In Mesh-Lokalkoordinaten umrechnen (Eltern-Skalierung kompensieren)
    const locW = (targetW * (S.scale1 || 1)) / sx;
    const locH = (targetH * (S.scale1 || 1)) / sy;
  
    frame1.anchor.set(0.5, 0.5);
    frame1.width  = locW;
    frame1.height = locH;
    frame1.position.set(0, 0);
  
    if (frame2) {
      const locW2 = (targetW * (S.scale2 || 1)) / sx;
      const locH2 = (targetH * (S.scale2 || 1)) / sy;
      frame2.anchor.set(0.5, 0.5);
      frame2.width  = locW2;
      frame2.height = locH2;
      frame2.position.set(0, 0);
    }

    const t1 = getTintColor(token, S, 1);
    frame1.tint = t1 != null ? PIXI.utils.string2hex(t1) : 0xFFFFFF;
    if (frame2){
      const t2 = getTintColor(token, S, 2);
      frame2.tint = t2 != null ? PIXI.utils.string2hex(t2) : 0xFFFFFF;
    }

    frame1.zIndex = 1;
    if (frame2) frame2.zIndex = 0;
    overlay.sortDirty = true;

    if (S.maskEnabled && S.pathMask) await applyMaskToToken(token, S);
    else clearMask(token);
  }catch(e){
    console.error("[GBT] applyFrameToToken error", token, e);
  }
}
