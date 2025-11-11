// modules/greybearded-tokens/scripts/settings/nameplate-form.js
import { MOD_ID, TINT_CHOICES, FONT_CHOICES, DEFAULT_NAMEPLATES } from "../constants.js";
import { buildSnapshot } from "../settings/snapshot.js";
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
    const cur = game.settings.get(MOD_ID, "nameplate") ?? {};
    // Nullish statt ||, damit false/0 nicht überschrieben werden
    const enabled        = (cur.enabled ?? DEFAULT_NAMEPLATES.enabled);
    const baseFontSize   = Number.isFinite(Number(cur.baseFontSize)) ? Number(cur.baseFontSize) : DEFAULT_NAMEPLATES.baseFontSize;
    const fontFamily     = (typeof cur.fontFamily === "string" && cur.fontFamily in FONT_CHOICES) ? cur.fontFamily : DEFAULT_NAMEPLATES.fontFamily;
    const usePlayerColor = (cur.usePlayerColor ?? DEFAULT_NAMEPLATES.usePlayerColor);
    const defaultColor   = (typeof cur.defaultColor === "string" && HEX.test(cur.defaultColor)) ? cur.defaultColor : DEFAULT_NAMEPLATES.defaultColor;
    const tintMode       = (typeof cur.tintMode === "string" && cur.tintMode in TINT_CHOICES) ? cur.tintMode : DEFAULT_NAMEPLATES.tintMode;
    const scaleWithToken = (cur.scaleWithToken ?? DEFAULT_NAMEPLATES.scaleWithToken);

    return {
      enabled, baseFontSize, fontFamily, usePlayerColor, defaultColor, tintMode, scaleWithToken,
      TINT_CHOICES, FONT_CHOICES
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
    // flache Map → Werte ziehen, Choices validieren, Defaults aus DEFAULT_NAMEPLATES
    let baseFontSize = Number(formData.baseFontSize);
    baseFontSize = Number.isFinite(baseFontSize) ? baseFontSize : DEFAULT_NAMEPLATES.baseFontSize;

    let fontFamily = String(formData.fontFamily || DEFAULT_NAMEPLATES.fontFamily);
    if (!(fontFamily in FONT_CHOICES)) fontFamily = DEFAULT_NAMEPLATES.fontFamily;

    let tintMode = String(formData.tintMode || DEFAULT_NAMEPLATES.tintMode);
    if (!(tintMode in TINT_CHOICES)) tintMode = DEFAULT_NAMEPLATES.tintMode;

    const defaultColor =
      HEX.test(formData["defaultColor-text"])  ? formData["defaultColor-text"]  :
      HEX.test(formData["defaultColor-color"]) ? formData["defaultColor-color"] :
      DEFAULT_NAMEPLATES.defaultColor;

    const next = {
      enabled:        !!formData.enabled,
      baseFontSize,
      fontFamily,
      usePlayerColor: !!formData.usePlayerColor,
      defaultColor,
      tintMode,
      scaleWithToken: !!formData.scaleWithToken
    };

    await game.settings.set(MOD_ID, "nameplate", next);

    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) {
      for (const t of canvas.tokens.placeables) updateFrame(t, S);
    }
  }
}
