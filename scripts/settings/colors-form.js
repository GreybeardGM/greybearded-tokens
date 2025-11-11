// modules/greybearded-tokens/scripts/settings/colors-form.js
import { MOD_ID, DEFAULT_COLORS } from "../constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { isHex, bindHexPairs } from "./helpers.js";

const DISPOSITION = ["hostile", "neutral", "friendly", "secret", "character"];

export class ColorsForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gb-colors-form",
      title: "Greybearded Tokens — Colors",
      template: "modules/greybearded-tokens/templates/colors-form.hbs",
      classes: ["gb-colors-form"],
      width: 520,
      height: "auto",
      resizable: true,
      submitOnChange: false,
      closeOnSubmit: true
    });
  }

  async getData() {
    const cur = (game.settings.get(MOD_ID, "colors") ?? DEFAULT_COLORS) || DEFAULT_COLORS;
    const rows = DISPOSITION.map(d => ({
      disposition: d,
      value: (typeof cur?.[d] === "string" && isHex(cur[d])) ? cur[d] : (DEFAULT_COLORS[d] ?? "#000000")
    }));
    return { rows };
  }

  activateListeners(html) {
    super.activateListeners(html);
    bindHexPairs(html[0] ?? html, DISPOSITION);
    (html.find?.('[data-action="cancel"]') ?? $(html).find('[data-action="cancel"]'))
      .on("click", ev => { ev.preventDefault(); this.close(); });
  }

  async _updateObject(_event, _formData) {
    const el = this.element[0];
    const next = {};
    for (const d of DISPOSITION) {
      const t = el.querySelector(`input[name="${d}-text"]`)?.value?.trim();
      const c = el.querySelector(`input[name="${d}-color"]`)?.value?.trim();
      next[d] = isHex(t) ? t : (isHex(c) ? c : (DEFAULT_COLORS[d] ?? "#000000"));
    }
    await game.settings.set(MOD_ID, "colors", next);
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}

