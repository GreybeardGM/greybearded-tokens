// hooks.js
import { getGbFrameSettings, buildSnapshot } from "./settings-snapshot.js";
import { rebuildPlayerColorSnapshot } from "./get-player-color.js";
import { updateFrame } from "./apply-frame.js";

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
  for (const t of canvas.tokens.placeables) await updateFrame(t, S);
}

export function registerRenderingHooks() {
  
  Hooks.on("refreshToken", (t) => {
    const S = getGbFrameSettings();
    await updateFrame(t, S);
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
