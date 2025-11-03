// module.js
import { registerSettings } from "./settings.js";
import { registerRenderingHooks } from "./hooks.js";
import { buildSnapshot } from "./settings-snapshot.js";

Hooks.once("init", () => {
  registerSettings();
  registerRenderingHooks(); // Hooks früh registrieren
});

Hooks.once("ready", () => {
  buildSnapshot(); // Settings jetzt sicher
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

Hooks.on("canvasReady", () => {
  // Szene-/Weltwechsel: Snapshot auffrischen
  buildSnapshot();
});

// Optional: bei Settings-Änderung Snapshot erneuern
Hooks.on("updateSetting", (setting) => {
  if (setting?.key?.startsWith("greybearded-tokens.")) buildSnapshot();
});
