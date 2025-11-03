// hooks.js
import { getGbFrameSettings, buildSnapshot } from "./settings-snapshot.js";
import { rebuildPlayerColorSnapshot } from "./get-player-color.js";
import { applyFrameToToken } from "./apply-frame.js";

function nextTick(fn){
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(fn,0)));
}

async function preloadFrameTextures() {
  const S = getGbFrameSettings();
  const paths = [
    S?.frame1?.path,
    (S?.frame2?.enabled ? S?.frame2?.path : null)
  ].filter(Boolean);

  if (!paths.length) return;
  await Promise.all(paths.map((p) => PIXI.Assets.load(p)));
}

function sweepAllTokenFrames() {
  const S = getGbFrameSettings();
  nextTick(() => {
    for (const t of canvas.tokens.placeables) applyFrameToToken(t, S);
  });
}

export function registerRenderingHooks() {
  // immer aktiv
  Hooks.on("drawToken", (t) => { 
    const S = getGbFrameSettings(); 
    nextTick(() => applyFrameToToken(t, S));
  });

  Hooks.on("refreshToken", (t) => {
    const S = getGbFrameSettings();
    nextTick(() => applyFrameToToken(t, S));
  });

  /*
  Hooks.on("updateToken", (doc, change) => {
    if (!("disposition" in (change ?? {}))) return;
    const token = doc?.object;
    if (!token || !canvas?.ready) return;
    const S = getGbFrameSettings();
    applyFrameToToken(token, S);
  });
  */

  Hooks.on("updateUser", (user, change) => {
    if (!change) return;
    if ("color" in change || "character" in change) {
      rebuildPlayerColorSnapshot();
      if (canvas?.ready) sweepAllTokenFrames();
    }
  });
  Hooks.on("createUser", () => { rebuildPlayerColorSnapshot(); if (canvas?.ready) sweepAllTokenFrames(); });
  Hooks.on("deleteUser", () => { rebuildPlayerColorSnapshot(); if (canvas?.ready) sweepAllTokenFrames(); });

  // späte Lebenszyklen
  Hooks.on("canvasReady", async () => {
    rebuildPlayerColorSnapshot();
    buildSnapshot();                // gültige Settings sicherstellen
    await preloadFrameTextures();   // erst nach Snapshot
    sweepAllTokenFrames();
  });

  /*
  Hooks.once("ready", async () => {
    rebuildPlayerColorSnapshot();
    if (canvas?.ready) {
      buildSnapshot();
      await preloadFrameTextures();
      sweepAllTokenFrames();
    }
  });
  */
  
  console.log("✅⭕ Greybearded Token Frames: Hooks registered.");
}
