import { MOD_ID } from "./constants.js";
import { normalizeTokenToolsConfig } from "../utils/normalization.js";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TokenToolsForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gbtf-token-tools-dialog",
    tag: "form",
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
      contentClasses: ["gbtf-frames", "gbtf-setting-form"]
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
      disposition: Object.hasOwn(data, "disposition") ? data.disposition : false,
      mirrorArtwork: Object.hasOwn(data, "mirrorArtwork") ? data.mirrorArtwork : false,
      customTint: Object.hasOwn(data, "customTint") ? data.customTint : false
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
