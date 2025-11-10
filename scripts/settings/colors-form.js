// scripts/settings/colors-form.js
import { MOD_ID, DEFAULT_COLORS } from "../constants.js";
import { buildSnapshot } from "../settings-snapshot.js";

const ROLES = ["hostile", "neutral", "friendly", "secret", "character"];
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

export class ColorsForm extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "gb-colors-form",
    window: { title: "Greybearded Tokens — Colors", icon: "fas fa-palette" },
    tag: "form",
    classes: ["gb-colors-form"],
    position: { width: 520 }
  };

  /** Template mit Text+Color pro Rolle */
  get template() {
    return "modules/greybearded-tokens/templates/colors-form.hbs";
  }

  /** Daten fürs Template */
  async _prepareContext(_options) {
    const current = (game.settings.get(MOD_ID, "colors") ?? DEFAULT_COLORS) || DEFAULT_COLORS;
    const rows = ROLES.map((r) => {
      const val = current?.[r] ?? DEFAULT_COLORS[r] ?? "#000000";
      return { role: r, value: val };
    });
    return { rows };
  }

  /** Event-Handler */
  _onRender(_context, _options) {
    // Text und Color gegenseitig synchron halten
    for (const r of ROLES) {
      const txt = this.element.querySelector(`input[name="${r}-text"]`);
      const clr = this.element.querySelector(`input[name="${r}-color"]`);
      if (!txt || !clr) continue;

      txt.addEventListener("input", () => {
        if (HEX.test(txt.value)) clr.value = txt.value;
      });
      clr.addEventListener("input", () => {
        if (HEX.test(clr.value)) txt.value = clr.value;
      });
    }

    // Save-Button
    this.element.querySelector('button[type="submit"]')
      ?.addEventListener("click", (ev) => this.#onSubmit(ev));
  }

  async #onSubmit(ev) {
    ev.preventDefault();

    const next = {};
    for (const r of ROLES) {
      const txt = this.element.querySelector(`input[name="${r}-text"]`)?.value?.trim();
      const clr = this.element.querySelector(`input[name="${r}-color"]`)?.value?.trim();
      next[r] = HEX.test(txt) ? txt
              : HEX.test(clr) ? clr
              : (DEFAULT_COLORS[r] ?? "#000000");
    }

    await game.settings.set(MOD_ID, "colors", next);

    // Sofort anwenden
    buildSnapshot();

    this.close();
  }
}
