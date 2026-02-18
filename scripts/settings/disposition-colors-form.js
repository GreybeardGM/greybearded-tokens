// modules/greybearded-tokens/scripts/settings/disposition-colors-form.js
import { MOD_ID, DEFAULT_DISPOSITION_COLORS } from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { isHex, bindHexPairs } from "./helpers.js";

const DISPOSITION = ["hostile", "neutral", "friendly", "secret", "character"];
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class DispositionColorsForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gbtf-disposition-colors-form",
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: DispositionColorsForm.onSubmit
    },
    position: {
      width: 330,
      height: "auto"
    },
    window: {
      title: "GBT.DispositionColors.Name",
      contentClasses: ["gbtf-frames", "gbtf-color-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/disposition-colors-form.hbs"
    }
  };

  async _prepareContext() {
    const dispositionColors = (game.settings.get(MOD_ID, "colors") ?? DEFAULT_DISPOSITION_COLORS) || DEFAULT_DISPOSITION_COLORS;
    const rows = DISPOSITION.map((r) => ({
      role: r,
      value: (typeof dispositionColors?.[r] === "string" && isHex(dispositionColors[r])) ? dispositionColors[r] : (DEFAULT_DISPOSITION_COLORS[r] ?? "#000000")
    }));
    return {
      tableName: game.i18n.localize("GBT.DispositionColors.Disposition"),
      rows
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const form = this.form;
    if (!form) return;

    bindHexPairs(form, DISPOSITION);
    form.querySelector('[data-action="cancel"]')?.addEventListener("click", async (event) => {
      event.preventDefault();
      await this.close();
    });
  }

  static async onSubmit(_event, _form, _formData) {
    const next = {};
    for (const r of DISPOSITION) {
      const t = _form.querySelector(`input[name="${r}-text"]`)?.value?.trim();
      const c = _form.querySelector(`input[name="${r}-color"]`)?.value?.trim();
      next[r] = isHex(t) ? t : (isHex(c) ? c : (DEFAULT_DISPOSITION_COLORS[r] ?? "#000000"));
    }
    await game.settings.set(MOD_ID, "colors", next);
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}
