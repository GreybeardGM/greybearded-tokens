import { MOD_ID, DEFAULT_AUTO_ALIGN, ALIGN_CHOICES } from "./constants.js";
import { normalizeAutoAlignConfig } from "../utils/normalization.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AutoAlignForm extends HandlebarsApplicationMixin(ApplicationV2) {
  #showDefaults = false;

  static DEFAULT_OPTIONS = {
    id: "gbtf-auto-align-dialog",
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: AutoAlignForm.onSubmit
    },
    position: {
      width: 360,
      height: "auto"
    },
    window: {
      title: "GBTF.AutoAlign.Name",
      contentClasses: ["gbtf-frames", "gbtf-setting-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/auto-align-form.hbs"
    },
    actions: {
      template: "modules/greybearded-tokens/templates/form-actions.hbs"
    }
  };

  async _prepareContext() {
    const cur = this.#showDefaults ? DEFAULT_AUTO_ALIGN : game.settings.get(MOD_ID, "autoAlign");
    return {
      ...normalizeAutoAlignConfig(cur),
      verticalChoices: ALIGN_CHOICES.vertical,
      horizontalChoices: ALIGN_CHOICES.horizontal
    };
  }

  async _onClickAction(event, target) {
    if (target.dataset.action === "reset-form") {
      event.preventDefault();
      this.#showDefaults = false;
      await this.render({ force: true });
      return;
    }

    if (target.dataset.action === "defaults-form") {
      event.preventDefault();
      this.#showDefaults = true;
      await this.render({ force: true });
      return;
    }

    return super._onClickAction(event, target);
  }

  static async onSubmit(_event, _form, formData) {
    const data = formData.object;
    const next = normalizeAutoAlignConfig({
      ...data,
      enabled: Object.hasOwn(data, "enabled") ? data.enabled : false
    });

    await game.settings.set(MOD_ID, "autoAlign", next);
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}
