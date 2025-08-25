import { registerSettings } from "./settings.js";
import { registerRenderingHooks } from "./hooks.js";
import { buildSnapshot } from "./settings-snapshot.js";

import { applyFrameToToken } from "./apply-frame.js";
import { applyMaskToToken, clearMask } from "./apply-mask.js";
import { buildSnapshot, getGbFrameSettings } from "./settings-snapshot.js";

Hooks.once("ready", () => {
  const mod = game.modules.get("greybearded-tokens");
  mod.api = {
    applyFrameToToken,
    applyMaskToToken,
    clearMask,
    buildSnapshot,
    getGbFrameSettings
  };
  console.log("GBT api ready:", Object.keys(mod.api));
});

Hooks.once("init", () => {
  registerSettings();
  buildSnapshot();
  registerRenderingHooks();
});
