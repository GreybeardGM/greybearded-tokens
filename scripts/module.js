import { registerSettings } from "./settings.js";
import { registerRenderingHooks } from "./hooks.js";

Hooks.once("init", () => {
  registerSettings();
});

/*
Hooks.once("setup", () => {
  // Platzhalter, falls später notwendig (z.B. i18n vorbereiten)
});
*/

Hooks.once("ready", () => {
  registerRenderingHooks();
});
