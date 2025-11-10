// settings/colors-form.js
const AppV2 = globalThis.ApplicationV2 ?? foundry.applications.api.ApplicationV2;
const HbsApp = foundry.applications.api.HandlebarsApplicationMixin(AppV2);

import { MOD_ID, DEFAULT_COLORS } from "../constants.js";
import { buildSnapshot } from "../settings-snapshot.js";
import { updateFrame } from "../apply-frame.js";

const ROLES = ["hostile", "neutral", "friendly", "secret", "character"];
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

export class ColorsForm extends HbsApp {
  static DEFAULT_OPTIONS = {
    id: "gb-colors-form",
    window: { title: "Greybearded Tokens — Colors", icon: "fas fa-palette" },
    classes: ["gb-colors-form"],
    position: { width: 520 },
    tag: "form"
  };

  // Einfach: ein Template, Daten aus getData()
  get template() {
    return "modules/greybearded-tokens/templates/colors-form.hbs";
  }
  async getData() {
    const cur = (game.settings.get(MOD_ID, "colors") ?? DEFAULT_COLORS) || DEFAULT_COLORS;
    return {
      rows: ROLES.map((r) => ({ role: r, value: cur?.[r] ?? DEFAULT_COLORS[r] ?? "#000000" }))
    };
  }

  /** DOM-Events verdrahten */
  activateListeners(html) {
    // Text & Color gegenseitig synchron halten
    for (const r of ROLES) {
      const txt = html.querySelector(`input[name="${r}-text"]`);
      const clr = html.querySelector(`input[name="${r}-color"]`);
      if (!txt || !clr) continue;
      txt.addEventListener("input", () => { if (HEX.test(txt.value)) clr.value = txt.value; });
      clr.addEventListener("input", () => { if (HEX.test(clr.value)) txt.value = clr.value; });
    }

    html.querySelector('[data-action="cancel"]')?.addEventListener("click", (ev) => {
      ev.preventDefault();
      this.close();
    });

    html.querySelector('[data-action="save"]')?.addEventListener("click", (ev) => this.#onSave(ev));
  }

  async #onSave(ev) {
    ev.preventDefault();
    const root = this.element;
    const next = {};
    for (const r of ROLES) {
      const t = root.querySelector(`input[name="${r}-text"]`)?.value?.trim();
      const c = root.querySelector(`input[name="${r}-color"]`)?.value?.trim();
      next[r] = HEX.test(t) ? t : (HEX.test(c) ? c : (DEFAULT_COLORS[r] ?? "#000000"));
    }

    await game.settings.set(MOD_ID, "colors", next);

    // Sofort anwenden
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) {
      for (const t of canvas.tokens.placeables) updateFrame(t, S);
    }

    this.close();
  }
}
