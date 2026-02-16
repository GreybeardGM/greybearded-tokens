// settings/register.js
import { MOD_ID, DEFAULT_DISPOSITION_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK, DEFAULT_TOKEN_TOOLS } from "./constants.js";
import { ColorsForm } from "./colors-form.js";
import { NameplateForm } from "./nameplate-form.js";
import { FramesForm } from "./frames-form.js";
import { TokenToolsForm } from "./token-tools-form.js";
import { refreshSceneControls } from "./helpers.js";

export function registerSettings() {
  // Hidden data containers used by the config forms
  game.settings.register(MOD_ID, "frames", {
    name: "Frames",
    scope: "world",
    config: false,
    type: Object,
    default: { frame1: DEFAULT_FRAME1, frame2: DEFAULT_FRAME2, mask: DEFAULT_MASK }
  });

  game.settings.register(MOD_ID, "nameplate", {
    name: "Nameplate",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_NAMEPLATES
  });

  game.settings.register(MOD_ID, "colors", {
    name: "Colors",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_DISPOSITION_COLORS
  });

  game.settings.register(MOD_ID, "tokenTools", {
    name: "Token Tools",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_TOKEN_TOOLS,
    onChange: () => {
      void refreshSceneControls().catch((error) => {
        console.error("[greybearded-tokens] Failed to refresh scene controls after tokenTools change", error);
      });
    }
  });

  // Visible configuration menus
  game.settings.registerMenu(MOD_ID, "framesMenu", {
    name: "GBT.Frames.Name",     // Settings menu: frame configuration
    label: "GBT.Frames.Label",   // Open frame configuration dialog
    icon: "fas fa-images",
    type: FramesForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "nameplateMenu", {
    name: "GBT.Nameplate.Name",   // Settings menu: nameplate configuration
    label: "GBT.Nameplate.Label", // Open nameplate configuration dialog
    icon: "fas fa-font",
    type: NameplateForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "colorsMenu", {
    name: "GBT.Colors.Name",     // Settings menu: disposition color mapping
    label: "GBT.Colors.Label",   // Open color configuration dialog
    icon: "fas fa-palette",
    type: ColorsForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "tokenToolsMenu", {
    name: "GBT.Tools.Config.Name",
    label: "GBT.Tools.Config.Label",
    icon: "fas fa-screwdriver-wrench",
    type: TokenToolsForm,
    restricted: true
  });

}
