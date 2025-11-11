// settings/register.js
import { MOD_ID, TINT_CHOICES, FONT_CHOICES, DEFAULT_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK } from "../constants.js";
import { updateFrame } from "../apply-frame.js";
import { buildSnapshot } from "./snapshot.js";
import { ColorsForm } from "./colors-form.js";
import { NameplateForm } from "./nameplate-form.js";
import { FramesForm } from "./frames-form.js";

/* ---------- Preload-Cache ---------- */
let _lastPreloaded = new Set();

/* Pfade aus dem Snapshot ziehen */
function _pathsFromSnapshot(S) {
  const out = [];
  if (S?.frame1?.path) out.push(S.frame1.path);
  if (S?.frame2?.enabled && S?.frame2?.path) out.push(S.frame2.path);
  if (S?.mask?.enabled && S?.mask?.path) out.push(S.mask.path);
  return [...new Set(out)]; // dedup
}

async function preloadFrameTextures(S) {
  const paths = _pathsFromSnapshot(S);
  // Nur laden, wenn sich die Menge geändert hat
  const cur = new Set(paths);
  if (paths.length && _setEquals(cur, _lastPreloaded) === false) {
    await Promise.all(paths.map(p => loadTexture(p)));
    _lastPreloaded = cur;
  }
}

function _setEquals(a, b) {
  if (!(b instanceof Set) || a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function sweepAllTokenFrames(S) {
  // Rendering erst nach Preload, non-blocking
  requestAnimationFrame(() => {
    for (const t of canvas.tokens.placeables) updateFrame(t, S);
  });
}

async function requestReload() {
  ui.notifications?.info("Greybearded Tokens: Bitte Oberfläche neu laden (F5), um Änderungen zu übernehmen.");
  const S = buildSnapshot();
  await preloadFrameTextures(S);
  sweepAllTokenFrames(S);
}

export function registerSettings() {
  // ── Frames ─────────────────────────────────────────────────────────────────
  game.settings.register(MOD_ID, "frames", {
    name: "Grouped Frames",
    scope: "world",
    config: false,
    type: Object,
    default: { frame1: DEFAULT_FRAME1, frame2: DEFAULT_FRAME2, mask: DEFAULT_MASK }
  });

  game.settings.registerMenu(MOD_ID, "framesMenu", {
    name: "Frames & Mask",
    label: "Configure Frames",
    icon: "fas fa-images",
    type: FramesForm,
    restricted: true
  });

  // ── Nameplates ──────────────────────────────────────────────────────────────
  game.settings.register(MOD_ID, "nameplate", {
    name: "Nameplate Settings",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_NAMEPLATES
  });

  game.settings.registerMenu(MOD_ID, "nameplateMenu", {
    name: "Nameplate",
    label: "Configure Nameplate",
    icon: "fas fa-font",
    type: NameplateForm,
    restricted: true
  });

  // ── Disposition-Farben ──────────────────────────────────────────────────────
  game.settings.register(MOD_ID, "colors", {
    name: "Grouped Colors",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_COLORS
  });

  game.settings.registerMenu(MOD_ID, "colorsMenu", {
    name: "Colors",
    label: "Disposition Colors",
    icon: "fas fa-palette",
    type: ColorsForm,
    restricted: true
  });

  // Initiales Preload nach Canvas-Start
  Hooks.once("canvasReady", async () => {
    const S = buildSnapshot();
    await preloadFrameTextures(S);
  });

  console.log("✅⭕ Greybearded Token Frames: Settings registered.");
}
