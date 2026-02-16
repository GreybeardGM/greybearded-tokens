// hooks.js
import { getGbFrameSettings, buildSnapshot } from "./settings/snapshot.js";
import { rebuildPlayerColorSnapshot } from "./get-player-color.js";
import { updateFrame } from "./apply-frame.js";

/* ---------- Texture preload cache ---------- */
let _lastPreloaded = new Set();
let _pendingSweepHandle = null;
let _pendingSweepSnapshot = null;

function _pathsFromSnapshot(S) {
  const out = [];
  if (S?.frame1?.path) out.push(S.frame1.path);
  if (S?.frame2?.enabled && S?.frame2?.path) out.push(S.frame2.path);
  if (S?.mask?.enabled && S?.mask?.path) out.push(S.mask.path);
  return [...new Set(out)];
}

async function preloadFrameTextures(S) {
  const paths = _pathsFromSnapshot(S);
  const cur = new Set(paths);
  if (paths.length && !_setEquals(cur, _lastPreloaded)) {
    const load = foundry?.canvas?.loadTexture ?? loadTexture;
    await Promise.all(paths.map((p) => load(p)));
    _lastPreloaded = cur;
  }
}

function _setEquals(a, b) {
  if (!(b instanceof Set) || a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function sweepAllTokenFrames(snapshot) {
  if (!canvas?.ready) return;

  _pendingSweepSnapshot = snapshot ?? _pendingSweepSnapshot ?? getGbFrameSettings();
  if (_pendingSweepHandle) return;

  _pendingSweepHandle = requestAnimationFrame(() => {
    _pendingSweepHandle = null;
    const snap = _pendingSweepSnapshot ?? getGbFrameSettings();
    _pendingSweepSnapshot = null;
    for (const t of canvas.tokens.placeables) updateFrame(t, snap);
  });
}

export function registerRenderingHooks() {

  Hooks.on("refreshToken", (t) => {
    updateFrame(t);
  });

  Hooks.on("updateUser", (user, change) => {
    if (!change) return;

    const colorOrCharChange = ("color" in change) || ("character" in change);

    if (colorOrCharChange) {
      rebuildPlayerColorSnapshot();
      if (canvas?.ready) {
        sweepAllTokenFrames();
      }
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

  // Single entry point for initial snapshot build: this is the first hook where
  // we can atomically build settings, preload textures, and refresh rendered tokens.
  // Keeping buildSnapshot() here avoids duplicate init work across module.js hooks.
  Hooks.on("canvasReady", async () => {
    rebuildPlayerColorSnapshot();
    const S = buildSnapshot();
    await preloadFrameTextures(S);
    sweepAllTokenFrames(S);
  });

}
