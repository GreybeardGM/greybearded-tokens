// modules/greybearded-tokens/scripts/settings/colors-form.js
import { MOD_ID, DEFAULT_DISPOSITION_COLORS } from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { isHex, bindHexPairs } from "./helpers.js";

const DISPOSITION = ["hostile", "neutral", "friendly", "secret", "character"];
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ColorsForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gb-colors-form",
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: ColorsForm.onSubmit
    },
    position: {
      width: 330,
      height: "auto"
    },
    window: {
      title: "GBT.Colors.Name",
      contentClasses: ["gbt-frames", "gb-colors-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/colors-form.hbs"
    }
  };

  async _prepareContext() {
    const cur = (game.settings.get(MOD_ID, "colors") ?? DEFAULT_DISPOSITION_COLORS) || DEFAULT_DISPOSITION_COLORS;
    const rows = DISPOSITION.map((r) => ({
      tableName: "GBT.Colors.Disposition",
      role: r,
      value: (typeof cur?.[r] === "string" && isHex(cur[r])) ? cur[r] : (DEFAULT_DISPOSITION_COLORS[r] ?? "#000000")
    }));
    return { rows };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element?.[0] ?? this.element;
    if (!root) return;

    bindHexPairs(root, DISPOSITION);
    root.querySelector('[data-action="cancel"]')?.addEventListener("click", async (event) => {
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
