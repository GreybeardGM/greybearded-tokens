// module.js
import { registerSettings } from "./settings/register.js";
import { registerRenderingHooks } from "./hooks.js";
import { buildSnapshot } from "./settings/snapshot.js";

Hooks.once("init", () => {
  registerSettings();
  registerRenderingHooks(); // Register rendering hooks before other startup work
});

Hooks.once("ready", () => {
  buildSnapshot(); // Build initial settings snapshot once Foundry is ready
});

Hooks.on("canvasReady", () => {
  // Refresh cached settings when scenes/world state change
  buildSnapshot();
});
