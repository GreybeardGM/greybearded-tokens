// modules/greybearded-tokens/scripts/settings/nameplate-form.js
import { MOD_ID, TINT_CHOICES, FONT_CHOICES, DEFAULT_NAMEPLATES } from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { toFiniteNumber, normalizeBoolean } from "../utils/normalization.js";
import { isHex, oneOf, bindHexSync } from "./helpers.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class NameplateForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gb-nameplate-form",
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: NameplateForm.onSubmit
    },
    position: {
      width: 330,
      height: "auto"
    },
    window: {
      title: "GBT.Nameplate.Name",
      contentClasses: ["gbt-frames", "gb-nameplate-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/nameplate-form.hbs"
    }
  };

  async _prepareContext() {
    const cur = game.settings.get(MOD_ID, "nameplate") ?? {};
    return {
      enabled: normalizeBoolean(cur.enabled, DEFAULT_NAMEPLATES.enabled),
      baseFontSize: toFiniteNumber(cur.baseFontSize, DEFAULT_NAMEPLATES.baseFontSize),
      fontFamily: oneOf(cur.fontFamily, FONT_CHOICES, DEFAULT_NAMEPLATES.fontFamily),
      usePlayerColor: normalizeBoolean(cur.usePlayerColor, DEFAULT_NAMEPLATES.usePlayerColor),
      defaultColor: isHex(cur.defaultColor) ? cur.defaultColor : DEFAULT_NAMEPLATES.defaultColor,
      tintMode: oneOf(cur.tintMode, TINT_CHOICES, DEFAULT_NAMEPLATES.tintMode),
      scaleWithToken: normalizeBoolean(cur.scaleWithToken, DEFAULT_NAMEPLATES.scaleWithToken),
      TINT_CHOICES,
      FONT_CHOICES
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element?.[0] ?? this.element;
    if (!root) return;

    bindHexSync(
      root.querySelector('input[name="defaultColor-text"]'),
      root.querySelector('input[name="defaultColor-color"]')
    );
  }

  static async onSubmit(_event, _form, formData) {
    const data = formData.object;

    const baseFontSize = toFiniteNumber(data.baseFontSize, DEFAULT_NAMEPLATES.baseFontSize);
    const fontFamily = oneOf(String(data.fontFamily || ""), FONT_CHOICES, DEFAULT_NAMEPLATES.fontFamily);
    const tintMode = oneOf(String(data.tintMode || ""), TINT_CHOICES, DEFAULT_NAMEPLATES.tintMode);
    const defaultColor = isHex(data["defaultColor-text"])
      ? data["defaultColor-text"]
      : (isHex(data["defaultColor-color"]) ? data["defaultColor-color"] : DEFAULT_NAMEPLATES.defaultColor);

    const next = {
      enabled: normalizeBoolean(Object.hasOwn(data, "enabled") ? data.enabled : false, DEFAULT_NAMEPLATES.enabled),
      baseFontSize,
      fontFamily,
      usePlayerColor: normalizeBoolean(Object.hasOwn(data, "usePlayerColor") ? data.usePlayerColor : false, DEFAULT_NAMEPLATES.usePlayerColor),
      defaultColor,
      tintMode,
      scaleWithToken: normalizeBoolean(Object.hasOwn(data, "scaleWithToken") ? data.scaleWithToken : false, DEFAULT_NAMEPLATES.scaleWithToken)
    };

    await game.settings.set(MOD_ID, "nameplate", next);
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}
