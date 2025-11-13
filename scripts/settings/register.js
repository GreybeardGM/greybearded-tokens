// settings/register.js
import { MOD_ID, DEFAULT_DISPOSITION_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK } from "./constants.js";
import { updateFrame } from "../apply-frame.js";
import { buildSnapshot } from "./snapshot.js";
import { ColorsForm } from "./colors-form.js";
import { NameplateForm } from "./nameplate-form.js";
import { FramesForm } from "./frames-form.js";

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

export function registerSettings() {
  // Wertecontainer (nicht sichtbar)
  game.settings.register(MOD_ID, "frames", {
    name: "Frames",
    scope: "world",
    config: false,
    type: Object,
    default: { frame1: DEFAULT_FRAME1, frame2: DEFAULT_FRAME2, mask: DEFAULT_MASK }
  });

  game.settings.register(MOD_ID, "nameplate", {
    name: "Nameplate",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_NAMEPLATES
  });

  game.settings.register(MOD_ID, "colors", {
    name: "Colors",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_DISPOSITION_COLORS
  });

  // Sichtbare Menüs
  game.settings.registerMenu(MOD_ID, "framesMenu", {
    name: "GBT.Frames.Name",     // Frame Setting
    label: "GBT.Frames.Label",   // Configure Frames
    icon: "fas fa-images",
    type: FramesForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "nameplateMenu", {
    name: "GBT.Nameplate.Name",   // Nameplate Settings
    label: "GBT.Nameplate.Label", // Configure Nameplate
    icon: "fas fa-font",
    type: NameplateForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "colorsMenu", {
    name: "GBT.Colors.Name",     // Disposition Colors
    label: "GBT.Colors.Label",   // Configure Colors
    icon: "fas fa-palette",
    type: ColorsForm,
    restricted: true
  });

  Hooks.once("canvasReady", async () => {
    const S = buildSnapshot();
    await preloadFrameTextures(S);
    sweepAllTokenFrames(S);
  });

}
