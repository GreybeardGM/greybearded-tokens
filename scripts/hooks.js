// hooks.js
import { getGbFrameSettings, buildSnapshot } from "./settings/snapshot.js";
import { rebuildPlayerColorSnapshot } from "./get-player-color.js";
import { updateFrame } from "./apply-frame.js";

/* ---------- Preload-Cache ---------- */
let _lastPreloaded = new Set();

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
    await Promise.all(paths.map((p) => loadTexture(p)));
    _lastPreloaded = cur;
  }
}

function _setEquals(a, b) {
  if (!(b instanceof Set) || a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function sweepAllTokenFrames(S) {
  requestAnimationFrame(() => {
    for (const t of canvas.tokens.placeables) updateFrame(t, S);
  });
}

export function registerRenderingHooks() {

  Hooks.on("refreshToken", (t) => {
    updateFrame(t);
  });

  Hooks.on("updateUser", (user, change) => {
    if (!change) return;

    const colorOrCharChange = ("color" in change) || ("character" in change);
    const viewChange        = ("viewedScene" in change);

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

  // Updaten für alle Tokes, wenn Canvas geladen
  Hooks.on("canvasReady", async () => {
    rebuildPlayerColorSnapshot();
    const S = buildSnapshot();
    await preloadFrameTextures(S);
    sweepAllTokenFrames(S);
  });

}
