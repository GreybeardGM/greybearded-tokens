import { MOD_ID } from "./constants.js";
import { normalizeTokenToolsConfig } from "../utils/normalization.js";
import { refreshSceneControls } from "./helpers.js";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TokenToolsForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gb-token-tools-form",
    tag: "form",
    classes: ["gb-token-tools-form"],
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: TokenToolsForm.onSubmit
    },
    position: {
      width: 360,
      height: "auto"
    },
    window: {
      title: "GBT.Tools.Config.Name",
      contentClasses: ["gbt-frames"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/token-tools-form.hbs"
    }
  };

  async _prepareContext() {
    const cur = game.settings.get(MOD_ID, "tokenTools");
    return normalizeTokenToolsConfig(cur);
  }

  static async onSubmit(_event, _form, formData) {
    const data = formData.object;
    const next = normalizeTokenToolsConfig(data);
    await game.settings.set(MOD_ID, "tokenTools", next);
    await refreshSceneControls();
  }

  async _onClickAction(event, target) {
    if (target.dataset.action === "cancel") {
      event.preventDefault();
      await this.close();
      return;
    }

    return super._onClickAction(event, target);
  }
}
