import { registerSettings } from "./settings.js";
import { registerRenderingHooks } from "./hooks.js";
import { buildSnapshot } from "./settings-snapshot.js";

import { applyFrameToToken } from "./apply-frame.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";
import { getGbFrameSettings } from "./settings-snapshot.js";

Hooks.once("init", () => {
  registerSettings();
  registerRenderingHooks();
});

Hooks.once("ready", () => {
  buildSnapshot(); // jetzt sind persistierte Settings sicher geladen
  const mod = game.modules.get("greybearded-tokens");
  mod.api = { applyFrameToToken, applyMaskToToken, clearMask, buildSnapshot, getGbFrameSettings };
  console.log("GBT api ready:", Object.keys(mod.api));
});

Hooks.on("canvasReady", () => {
  buildSnapshot(); // falls Welt/Scene-spezifische Settings/Fallbacks
});

// Optional: bei Settings-Änderung Snapshot erneuern
Hooks.on("updateSetting", (setting) => {
  if (setting?.key?.startsWith("greybearded-tokens.")) buildSnapshot();
});
