import { getGbFrameSettings } from "./settings-snapshot.js";
import { rebuildPlayerColorSnapshot } from "./get-player-color.js";
import { applyFrameToToken } from "./apply-frame.js";

function nextTick(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

async function preloadFrameTextures() {
  const S = getGbFrameSettings();
  const paths = [S.path1, S.secondEnabled ? S.path2 : null].filter(Boolean);
  if (!paths.length) return;

  if (PIXI.Assets?.load) {
    await Promise.all(paths.map(p => PIXI.Assets.load(p)));
  } else {
    paths.forEach(p => PIXI.Texture.from(p));
  }
}

function sweepAllTokenFrames() {
  nextTick(() => {
    for (const t of canvas.tokens.placeables) applyFrameToToken(t);
  });
}

export function registerRenderingHooks() {
  // einmalig vor dem ersten Auftrag: Snapshot
  Hooks.once("ready", async () => {
    rebuildPlayerColorSnapshot();
    if (canvas?.ready) {
      await preloadFrameTextures();
      sweepAllTokenFrames();
    }
  });

  Hooks.on("canvasReady", async () => {
    if (!canvas?.ready) return;
    rebuildPlayerColorSnapshot();
    await preloadFrameTextures();
    sweepAllTokenFrames();
  });

  Hooks.on("drawToken", (token) => {
    nextTick(() => applyFrameToToken(token));
  });

  Hooks.on("updateToken", (doc, change) => {
    if (!("disposition" in (change ?? {}))) return;
    const token = doc?.object;
    if (!token || !canvas?.ready) return;
    applyFrameToToken(token);
  });

  // PlayerColor-Snapshot aktuell halten
  Hooks.on("updateUser", (user, change) => {
    if (!change) return;
    if ("color" in change || "character" in change) {
      rebuildPlayerColorSnapshot();
      if (canvas?.ready) sweepAllTokenFrames();
    }
  });
  Hooks.on("createUser", () => {
    rebuildPlayerColorSnapshot();
    if (canvas?.ready) sweepAllTokenFrames();
  });
  Hooks.on("deleteUser", () => {
    rebuildPlayerColorSnapshot();
    if (canvas?.ready) sweepAllTokenFrames();
  });

  // Sicherheitsnetz: kein doppeltes ready (vermeidet Doppelarbeit)
  console.log("✅⭕ Greybearded Token Frames: Hooks registered.");
}
