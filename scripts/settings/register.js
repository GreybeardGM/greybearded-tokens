// settings/register.js
import { MOD_ID, DEFAULT_DISPOSITION_COLORS, DEFAULT_ACTOR_TYPE_COLORS, DEFAULT_OWNERSHIP_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK, DEFAULT_TOKEN_TOOLS, DEFAULT_AUTO_ALIGN } from "./constants.js";
import { DispositionColorsForm } from "./disposition-colors-form.js";
import { ActorTypeColorsForm } from "./actor-type-colors-form.js";
import { OwnershipColorsForm } from "./ownership-colors-form.js";
import { NameplateForm } from "./nameplate-form.js";
import { FramesForm } from "./frames-form.js";
import { TokenToolsForm } from "./token-tools-form.js";
import { AutoAlignForm } from "./auto-align-form.js";
import { refreshSceneControls } from "./helpers.js";
import { registerPortraitSyncSetting } from "../portrait-sync.js";

export function registerSettings() {
  registerPortraitSyncSetting();

  // Hidden data containers used by the config forms
  game.settings.register(MOD_ID, "frames", {
    name: "GBTF.Frames.Name",
    scope: "world",
    config: false,
    type: Object,
    default: { frame1: DEFAULT_FRAME1, frame2: DEFAULT_FRAME2, mask: DEFAULT_MASK }
  });

  game.settings.register(MOD_ID, "nameplate", {
    name: "GBTF.Nameplate.Name",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_NAMEPLATES
  });

  game.settings.register(MOD_ID, "colors", {
    name: "GBTF.DispositionColors.Name",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_DISPOSITION_COLORS
  });

  game.settings.register(MOD_ID, "actorTypeColors", {
    name: "GBTF.ActorTypeColors.Name",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_ACTOR_TYPE_COLORS
  });

  game.settings.register(MOD_ID, "ownershipColors", {
    name: "GBTF.OwnershipColors.Name",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_OWNERSHIP_COLORS
  });

  game.settings.register(MOD_ID, "autoAlign", {
    name: "GBTF.AutoAlign.Name",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_AUTO_ALIGN
  });

  game.settings.register(MOD_ID, "tokenTools", {
    name: "GBTF.Tools.Config.Name",
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
    name: "GBTF.Frames.Name",     // Settings menu: frame configuration
    label: "GBTF.Frames.Label",   // Open frame configuration dialog
    icon: "fas fa-images",
    type: FramesForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "nameplateMenu", {
    name: "GBTF.Nameplate.Name",   // Settings menu: nameplate configuration
    label: "GBTF.Nameplate.Label", // Open nameplate configuration dialog
    icon: "fas fa-font",
    type: NameplateForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "colorsMenu", {
    name: "GBTF.DispositionColors.Name",     // Settings menu: disposition color mapping
    label: "GBTF.DispositionColors.Label",   // Open disposition color configuration dialog
    icon: "fas fa-palette",
    type: DispositionColorsForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "actorTypeColorsMenu", {
    name: "GBTF.ActorTypeColors.Name",
    label: "GBTF.ActorTypeColors.Label",
    icon: "fas fa-users",
    type: ActorTypeColorsForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "ownershipColorsMenu", {
    name: "GBTF.OwnershipColors.Name",
    label: "GBTF.OwnershipColors.Label",
    icon: "fas fa-user-shield",
    type: OwnershipColorsForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "autoAlignMenu", {
    name: "GBTF.AutoAlign.Name",
    label: "GBTF.AutoAlign.Label",
    icon: "fas fa-arrows-to-eye",
    type: AutoAlignForm,
    restricted: true
  });

  game.settings.registerMenu(MOD_ID, "tokenToolsMenu", {
    name: "GBTF.Tools.Config.Name",
    label: "GBTF.Tools.Config.Label",
    icon: "fas fa-screwdriver-wrench",
    type: TokenToolsForm,
    restricted: true
  });

}
