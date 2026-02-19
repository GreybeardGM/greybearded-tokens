// modules/greybearded-tokens/scripts/settings/ownership-colors-form.js
import { MOD_ID, DEFAULT_OWNERSHIP_COLORS } from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { isHex, bindHexPairs } from "./helpers.js";

const OWNERSHIP_LEVELS = ["owner", "observer", "limited", "none"];
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function buildRows(source) {
  return OWNERSHIP_LEVELS.map((level) => ({
    level,
    value: (typeof source?.[level] === "string" && isHex(source[level])) ? source[level] : (DEFAULT_OWNERSHIP_COLORS[level] ?? "#000000")
  }));
}

export class OwnershipColorsForm extends HandlebarsApplicationMixin(ApplicationV2) {
  #showDefaults = false;

  static DEFAULT_OPTIONS = {
    id: "gbtf-ownership-colors-form",
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: OwnershipColorsForm.onSubmit
    },
    position: {
      width: 330,
      height: "auto"
    },
    window: {
      title: "GBT.OwnershipColors.Name",
      contentClasses: ["gbtf-frames", "gbtf-color-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/ownership-colors-form.hbs"
    },
    actions: {
      template: "modules/greybearded-tokens/templates/form-actions.hbs"
    }
  };

  async _prepareContext() {
    const ownershipColors = this.#showDefaults
      ? DEFAULT_OWNERSHIP_COLORS
      : ((game.settings.get(MOD_ID, "ownershipColors") ?? DEFAULT_OWNERSHIP_COLORS) || DEFAULT_OWNERSHIP_COLORS);

    return {
      tableName: game.i18n.localize("GBT.OwnershipColors.Level"),
      rows: buildRows(ownershipColors)
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const form = this.form;
    if (!form) return;

    bindHexPairs(form, OWNERSHIP_LEVELS);
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

  static async onSubmit(_event, _form, _formData) {
    const next = {};
    for (const level of OWNERSHIP_LEVELS) {
      const t = _form.querySelector(`input[name="${level}-text"]`)?.value?.trim();
      const c = _form.querySelector(`input[name="${level}-color"]`)?.value?.trim();
      next[level] = isHex(t) ? t : (isHex(c) ? c : (DEFAULT_OWNERSHIP_COLORS[level] ?? "#000000"));
    }

    await game.settings.set(MOD_ID, "ownershipColors", next);
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}
