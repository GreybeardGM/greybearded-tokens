// module.js
import { registerSettings } from "./settings/register.js";
import { registerRenderingHooks } from "./hooks.js";
import { buildSnapshot } from "./settings/snapshot.js";

Hooks.once("init", () => {
  registerSettings();
  registerRenderingHooks(); // Hooks früh registrieren
});

Hooks.once("ready", () => {
  buildSnapshot(); // Settings jetzt sicher
  console.log("GBT ready");
});

Hooks.on("canvasReady", () => {
  // Szene-/Weltwechsel: Snapshot auffrischen
  buildSnapshot();
});

// Optional: bei Settings-Änderung Snapshot erneuern
Hooks.on("updateSetting", (setting) => {
  if (setting?.key?.startsWith("greybearded-tokens.")) buildSnapshot();
});
