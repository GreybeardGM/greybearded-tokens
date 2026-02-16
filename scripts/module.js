// module.js
import { registerSettings } from "./settings/register.js";
import { registerRenderingHooks } from "./hooks.js";

Hooks.once("init", () => {
  registerSettings();
  registerRenderingHooks(); // Register rendering hooks before other startup work
});
