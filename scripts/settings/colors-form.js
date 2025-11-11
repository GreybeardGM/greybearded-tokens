// modules/greybearded-tokens/scripts/settings/colors-form.js
import { MOD_ID, DEFAULT_COLORS } from "../constants.js";
import { buildSnapshot } from "../settings-snapshot.js";
import { updateFrame } from "../apply-frame.js";

const DISPOSITION = ["hostile", "neutral", "friendly", "secret", "character"];
const HEX   = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

export class ColorsForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gb-colors-form",
      title: "Greybearded Tokens — Colors",
      template: "modules/greybearded-tokens/templates/colors-form.hbs",
      classes: ["gb-colors-form"],
      width: 520
    });
  }

  async getData() {
    const cur = (game.settings.get(MOD_ID, "colors") ?? DEFAULT_COLORS) || DEFAULT_COLORS;
    const rows = DISPOSITION.map(d => ({
      disposition: d,
      value: (typeof cur?.[d] === "string" && HEX.test(cur[d])) ? cur[d] : (DEFAULT_COLORS[d] ?? "#000000")
    }));
    return { rows };
  }

  activateListeners(html) {
    super.activateListeners(html);
    for (const d of DISPOSITION) {
      const txt = html.find(`input[name="${d}-text"]`)[0];
      const clr = html.find(`input[name="${d}-color"]`)[0];
      if (!txt || !clr) continue;
      txt.addEventListener("input", () => { if (HEX.test(txt.value)) clr.value = txt.value; });
      clr.addEventListener("input", () => { if (HEX.test(clr.value)) txt.value = clr.value; });
    }
    html.find('[data-action="cancel"]').on("click", ev => { ev.preventDefault(); this.close(); });
  }

  async _updateObject(_event, formData) {
    // FormApplication liefert flache Map → wir lesen direkt aus dem DOM, um Text+Picker zu mergen
    const el = this.element[0];
    const next = {};
    for (const d of DISPOSITION) {
      const t = el.querySelector(`input[name="${d}-text"]`)?.value?.trim();
      const c = el.querySelector(`input[name="${d}-color"]`)?.value?.trim();
      next[d] = HEX.test(t) ? t : (HEX.test(c) ? c : (DEFAULT_COLORS[d] ?? "#000000"));
    }

    await game.settings.set(MOD_ID, "colors", next);

    const S = buildSnapshot();
    for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}
