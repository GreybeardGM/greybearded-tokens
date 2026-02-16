import { MOD_ID } from "./constants.js";
import { normalizeTokenToolsConfig } from "../utils/normalization.js";


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
    const current = normalizeTokenToolsConfig(game.settings.get(MOD_ID, "tokenTools"));

    const next = normalizeTokenToolsConfig({
      ...current,
      ...data,
      size: Object.hasOwn(data, "size") ? data.size : false,
      toggleFrame: Object.hasOwn(data, "toggleFrame") ? data.toggleFrame : false,
      disposition: Object.hasOwn(data, "disposition") ? data.disposition : false
    }, current);

    await game.settings.set(MOD_ID, "tokenTools", next);

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
