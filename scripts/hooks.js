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
    for (const t of canvas.tokens.placeables) {
      if (!t._gb) t._gb = {};
      if (t._gb.frameScheduled) continue;
      t._gb.frameScheduled = true;
      //nextTick(async () => {
        try { await applyFrameToToken(t, S); }
        finally { t._gb.frameScheduled = false; }
      //});
    }
  });
}

export function registerRenderingHooks() {
  
  Hooks.on("refreshToken", (t) => {
    if (!t?._gb) t._gb = {};
    if (t._gb.frameScheduled) return;
    t._gb.frameScheduled = true;   // ✅ echte Reservation
    const S = getGbFrameSettings();
    //nextTick(async () => {
      try { await applyFrameToToken(t, S); }
      finally { t._gb.frameScheduled = false; } // ✅ Flag NUR hier zurücksetzen
    //});
  });

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
    //sweepAllTokenFrames();
  });
  
  console.log("✅⭕ Greybearded Token Frames: Hooks registered.");
}
