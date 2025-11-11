// settings/register.js
import { MOD_ID, TINT_CHOICES, FONT_CHOICES, DEFAULT_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK } from "../constants.js";
import { updateFrame } from "../apply-frame.js";
import { buildSnapshot } from "./snapshot.js";
import { ColorsForm } from "./colors-form.js";
import { NameplateForm } from "./nameplate-form.js";
import { FramesForm } from "./frames-form.js";

async function preloadFrameTextures(S) {
  const paths = [S.path1, S.secondEnabled ? S.path2 : null].filter(Boolean);
  if (!paths.length) return;

  if (PIXI.Assets?.load) {
    await Promise.all(paths.map(p => PIXI.Assets.load(p)));
  } else {
    paths.forEach(p => PIXI.Texture.from(p));
  }
}

function sweepAllTokenFrames(S) {
  for (const t of canvas.tokens.placeables) updateFrame(t, S);
}

function requestReload() {
  ui.notifications?.info("Greybearded Tokens: Bitte Oberfläche neu laden (F5), um Änderungen zu übernehmen.");
  const S = buildSnapshot();
  preloadFrameTextures(S);
  sweepAllTokenFrames(S);
}

export function registerSettings() {
  // ── Rahmen ─────────────────────────────────────────────────────────────────
  game.settings.register(MOD_ID, "frames", {
    name: "Grouped Frames",
    scope: "world",
    config: false,
    type: Object,
    default: {
      frame1: DEFAULT_FRAME1,
      frame2: DEFAULT_FRAME2,
      mask:   DEFAULT_MASK
    }
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
  
  console.log("✅⭕ Greybearded Token Frames: Settings registered.");
}

