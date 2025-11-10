// settings/colors-form.js
const { ApplicationV2: AppV2, HandlebarsApplicationMixin: HBM, FormApplicationMixin: FM } =
  foundry.applications.api;

import { MOD_ID, DEFAULT_COLORS } from "../constants.js";
import { buildSnapshot } from "../settings-snapshot.js";
import { updateFrame } from "../apply-frame.js";

const ROLES = ["hostile", "neutral", "friendly", "secret", "character"];
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

// Mixin-Kette wie in der Community-Doku
export class ColorsForm extends FM(HBM(AppV2)) {
  static DEFAULT_OPTIONS = {
    id: "gb-colors-form",
    window: { title: "Greybearded Tokens — Colors", icon: "fas fa-palette" },
    classes: ["gb-colors-form"],
    position: { width: 520 },
    tag: "form"
  };

  static PARTS = {
    body: {
      template: "modules/greybearded-tokens/templates/colors-form.hbs",
      // KORREKTE SIGNATUR: (app, part, options) → data
      getData: (_app, _part, _opts) => {
        let cur;
        try { cur = game.settings.get(MOD_ID, "colors"); } catch { cur = null; }
        const base = (cur && typeof cur === "object") ? cur : DEFAULT_COLORS;

        const rows = ROLES.map(r => {
          const v = base?.[r];
          const val = (typeof v === "string" && HEX.test(v)) ? v : (DEFAULT_COLORS?.[r] ?? "#000000");
          return { role: r, value: val };
        });

        return { rows };
      }
    }
  };

  activateListeners(root) {
    // Text <-> Color sync
    for (const r of ROLES) {
      const txt = root.querySelector(`input[name="${r}-text"]`);
      const clr = root.querySelector(`input[name="${r}-color"]`);
      if (!txt || !clr) continue;
      txt.addEventListener("input", () => { if (HEX.test(txt.value)) clr.value = txt.value; });
      clr.addEventListener("input", () => { if (HEX.test(clr.value)) txt.value = clr.value; });
    }

    root.querySelector('[data-action="cancel"]')?.addEventListener("click", (ev) => {
      ev.preventDefault(); this.close();
    });
    root.querySelector('[data-action="save"]')?.addEventListener("click", (ev) => this.#onSave(ev));
  }

  async #onSave(ev) {
    ev.preventDefault();
    const el = this.element;
    const next = {};
    for (const r of ROLES) {
      const t = el.querySelector(`input[name="${r}-text"]`)?.value?.trim();
      const c = el.querySelector(`input[name="${r}-color"]`)?.value?.trim();
      next[r] = HEX.test(t) ? t : (HEX.test(c) ? c : (DEFAULT_COLORS[r] ?? "#000000"));
    }

    await game.settings.set(MOD_ID, "colors", next);

    const S = buildSnapshot();
    for (const t of canvas.tokens.placeables) updateFrame(t, S);

    this.close();
  }
}
