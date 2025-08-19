import { registerSettings } from "./settings.js";
import { registerRenderingHooks } from "./hooks.js";
import { buildSnapshot } from "./settings-snapshot.js";

Hooks.once("init", () => {
  registerSettings();
  buildSnapshot();
});

/*
Hooks.once("setup", () => {
  // Platzhalter, falls später notwendig (z.B. i18n vorbereiten)
});
*/

Hooks.once("ready", () => {
  registerRenderingHooks();
});
