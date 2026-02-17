// settings/register.js
import { MOD_ID, DEFAULT_DISPOSITION_COLORS, DEFAULT_ACTOR_TYPE_COLORS, DEFAULT_OWNERSHIP_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK, DEFAULT_TOKEN_TOOLS } from "./constants.js";
import { DispositionColorsForm } from "./disposition-colors-form.js";
import { ActorTypeColorsForm } from "./actor-type-colors-form.js";
import { OwnershipColorsForm } from "./ownership-colors-form.js";
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

  game.settings.register(MOD_ID, "actorTypeColors", {
    name: "Actor Type Colors",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_ACTOR_TYPE_COLORS
  });

  game.settings.register(MOD_ID, "ownershipColors", {
    name: "Ownership Colors",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_OWNERSHIP_COLORS
  });

  game.settings.register(MOD_ID, "tokenTools", {
    name: "Token Tools",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_TOKEN_TOOLS,
    onChange: () => {
      void refreshSceneControls().catch((error) => {
        console.error("[greybearded-tokens] tokenTools onChange controls refresh failed", error);
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
    name: "GBT.DispositionColors.Name",     // Settings menu: disposition color mapping
    label: "GBT.DispositionColors.Label",   // Open disposition color configuration dialog
    icon: "fas fa-palette",
    type: DispositionColorsForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "actorTypeColorsMenu", {
    name: "GBT.ActorTypeColors.Name",
    label: "GBT.ActorTypeColors.Label",
    icon: "fas fa-users",
    type: ActorTypeColorsForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "ownershipColorsMenu", {
    name: "GBT.OwnershipColors.Name",
    label: "GBT.OwnershipColors.Label",
    icon: "fas fa-user-shield",
    type: OwnershipColorsForm,
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
