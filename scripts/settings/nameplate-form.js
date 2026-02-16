// modules/greybearded-tokens/scripts/settings/nameplate-form.js
import { MOD_ID, TINT_CHOICES, FONT_CHOICES, DEFAULT_NAMEPLATES } from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { toFiniteNumber, normalizeBoolean } from "../utils/normalization.js";
import { isHex, oneOf, bindHexSync } from "./helpers.js";

export class NameplateForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gb-nameplate-form",
      title: "GBT.Nameplate.Name",
      template: "modules/greybearded-tokens/templates/nameplate-form.hbs",
      classes: ["gb-nameplate-form"],
      width: 330,
      height: "auto",
      resizable: true,
      submitOnChange: false,
      closeOnSubmit: true
    });
  }

  async getData() {
    const cur = game.settings.get(MOD_ID, "nameplate") ?? {};
    return {
      enabled:        normalizeBoolean(cur.enabled,        DEFAULT_NAMEPLATES.enabled),
      baseFontSize:   toFiniteNumber(cur.baseFontSize,    DEFAULT_NAMEPLATES.baseFontSize),
      fontFamily:     oneOf(cur.fontFamily,    FONT_CHOICES,       DEFAULT_NAMEPLATES.fontFamily),
      usePlayerColor: normalizeBoolean(cur.usePlayerColor, DEFAULT_NAMEPLATES.usePlayerColor),
      defaultColor:   isHex(cur.defaultColor) ? cur.defaultColor : DEFAULT_NAMEPLATES.defaultColor,
      tintMode:       oneOf(cur.tintMode,      TINT_CHOICES,       DEFAULT_NAMEPLATES.tintMode),
      scaleWithToken: normalizeBoolean(cur.scaleWithToken, DEFAULT_NAMEPLATES.scaleWithToken),
      TINT_CHOICES, FONT_CHOICES
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0] ?? html;
    bindHexSync(
      root.querySelector('input[name="defaultColor-text"]'),
      root.querySelector('input[name="defaultColor-color"]')
    );
  }

  async _updateObject(_event, formData) {
    const baseFontSize = toFiniteNumber(formData.baseFontSize, DEFAULT_NAMEPLATES.baseFontSize);
    const fontFamily   = oneOf(String(formData.fontFamily || ""), FONT_CHOICES, DEFAULT_NAMEPLATES.fontFamily);
    const tintMode     = oneOf(String(formData.tintMode || ""), TINT_CHOICES, DEFAULT_NAMEPLATES.tintMode);
    const defaultColor = isHex(formData["defaultColor-text"])
      ? formData["defaultColor-text"]
      : (isHex(formData["defaultColor-color"]) ? formData["defaultColor-color"] : DEFAULT_NAMEPLATES.defaultColor);

    const next = {
      enabled:        normalizeBoolean(formData.enabled,        DEFAULT_NAMEPLATES.enabled),
      baseFontSize,
      fontFamily,
      usePlayerColor: normalizeBoolean(formData.usePlayerColor, DEFAULT_NAMEPLATES.usePlayerColor),
      defaultColor,
      tintMode,
      scaleWithToken: normalizeBoolean(formData.scaleWithToken, DEFAULT_NAMEPLATES.scaleWithToken)
    };

    await game.settings.set(MOD_ID, "nameplate", next);
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}
