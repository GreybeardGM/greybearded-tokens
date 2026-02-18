// modules/greybearded-tokens/scripts/settings/ownership-colors-form.js
import { MOD_ID, DEFAULT_OWNERSHIP_COLORS } from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { isHex, bindHexPairs } from "./helpers.js";

const OWNERSHIP_LEVELS = ["owner", "observer", "limited", "none"];
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OwnershipColorsForm extends HandlebarsApplicationMixin(ApplicationV2) {
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
    const ownershipColors = (game.settings.get(MOD_ID, "ownershipColors") ?? DEFAULT_OWNERSHIP_COLORS) || DEFAULT_OWNERSHIP_COLORS;
    const rows = OWNERSHIP_LEVELS.map((level) => ({
      level,
      value: (typeof ownershipColors?.[level] === "string" && isHex(ownershipColors[level])) ? ownershipColors[level] : (DEFAULT_OWNERSHIP_COLORS[level] ?? "#000000")
    }));

    return {
      tableName: game.i18n.localize("GBT.OwnershipColors.Level"),
      rows
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const form = this.form;
    if (!form) return;

    bindHexPairs(form, OWNERSHIP_LEVELS);
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
