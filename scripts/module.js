// module.js
import { registerSettings } from "./settings/register.js";
import { registerRenderingHooks } from "./rendering-hooks.js";
import { registerTokenToolsHooks } from "./token-tools.js";

Hooks.once("init", () => {
  registerSettings();
  registerRenderingHooks(); // Register rendering hooks before other startup work
  registerTokenToolsHooks();
});
