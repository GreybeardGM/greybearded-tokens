// modules/greybearded-tokens/settings/nameplate-form.js
import { MOD_ID, TINT_CHOICES, FONT_CHOICES, DEFAULT_NAMEPLATES } from "../constants.js";
import { buildSnapshot } from "../settings-snapshot.js";
import { updateFrame } from "../apply-frame.js";

const HEX = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

export class NameplateForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gb-nameplate-form",
      title: "Greybearded Tokens — Nameplate",
      template: "modules/greybearded-tokens/templates/nameplate-form.hbs",
      classes: ["gb-nameplate-form"],
      width: 520
    });
  }

  async getData() {
    const cur = (game.settings.get(MOD_ID, "nameplate") ?? {});
    return {
      enabled:        !!cur.enabled,
      baseFontSize:   Number.isFinite(cur.baseFontSize) ? cur.baseFontSize : DEFAULT_NAMEPLATES.baseFontSize,
      fontFamily:     cur.fontFamily ?? DEFAULT_NAMEPLATES.fontFamily,
      usePlayerColor: !!cur.usePlayerColor,
      defaultColor:   (typeof cur.defaultColor === "string" && HEX.test(cur.defaultColor)) ? cur.defaultColor : DEFAULT_NAMEPLATES.defaultColor,
      tintMode:       cur.tintMode ?? DEFAULT_NAMEPLATES.tintMode,
      scaleWithToken: !!cur.scaleWithToken,
      TINT_CHOICES,
      FONT_CHOICES
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const txt = html.find('input[name="defaultColor-text"]')[0];
    const clr = html.find('input[name="defaultColor-color"]')[0];
    if (txt && clr) {
      txt.addEventListener("input", () => { if (HEX.test(txt.value)) clr.value = txt.value; });
      clr.addEventListener("input", () => { if (HEX.test(clr.value)) txt.value = clr.value; });
    }
  }

  async _updateObject(_event, formData) {
    // formData: flache Map → gezielt lesen
    const next = {
      enabled:        !!formData.enabled,
      baseFontSize:   Number.isFinite(Number(formData.baseFontSize)) ? Number(formData.baseFontSize) : 22,
      fontFamily:     String(formData.fontFamily || "Signika"),
      usePlayerColor: !!formData.usePlayerColor,
      defaultColor:   HEX.test(formData["defaultColor-text"]) ? formData["defaultColor-text"]
                     : HEX.test(formData["defaultColor-color"]) ? formData["defaultColor-color"]
                     : "#ffffff",
      tintMode:       String(formData.tintMode || "Unicolor"),
      scaleWithToken: !!formData.scaleWithToken
    };

    await game.settings.set(MOD_ID, "nameplate", next);

    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) {
      for (const t of canvas.tokens.placeables) updateFrame(t, S);
    }
  }
}
