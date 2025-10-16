// hooks.js
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
  const S = getGbFrameSettings();
  nextTick(() => {
    for (const t of canvas.tokens.placeables) applyFrameToToken(t, S);
  });
}

export function registerRenderingHooks() {
  // 0) Sofort registrieren – diese Funktion aus einem Hooks.once("init") o.ä. heraus aufrufen
  let registered = false;
  if (registered) return; registered = true;

  // 1) Immer aktive Listener
  Hooks.on("drawToken", (token) => {
    const S = getGbFrameSettings();
    nextTick(() => applyFrameToToken(token, S));
  });

  Hooks.on("refreshToken", (token) => {
    const S = getGbFrameSettings();
    nextTick(() => applyFrameToToken(token, S));
  });

  Hooks.on("updateToken", (doc, change) => {
    if (!("disposition" in (change ?? {}))) return;
    const token = doc?.object;
    if (!token || !canvas?.ready) return;
    const S = getGbFrameSettings();
    applyFrameToToken(token, S);
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

  // 2) Spätere Canvas-Lebenszyklen
  Hooks.on("canvasReady", async () => {
    await preloadFrameTextures();
    sweepAllTokenFrames();
  });

  // 3) Aufholen, falls wir zu spät kamen
  //    -> wenn bei Registrierung das Canvas schon fertig ist, sofort preload + sweep
  (async () => {
    if (canvas?.ready) {
      await preloadFrameTextures();
      sweepAllTokenFrames();
    }
  })();

  console.log("✅⭕ Greybearded Token Frames: Hooks registered.");
}
