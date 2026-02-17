// modules/greybearded-tokens/scripts/settings/nameplate-form.js
import { MOD_ID, TINT_CHOICES, DEFAULT_NAMEPLATES } from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { toFiniteNumber, normalizeBoolean } from "../utils/normalization.js";
import { isHex, oneOf, bindHexSync, getConfiguredFontFamilies } from "./helpers.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function buildFontChoices() {
  return getConfiguredFontFamilies().map((family) => ({ value: family, label: family }));
}


export class NameplateForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gbtf-nameplate-form",
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
      contentClasses: ["gbtf-frames", "gbtf-nameplate-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/nameplate-form.hbs"
    }
  };

  async _prepareContext() {
    const cur = game.settings.get(MOD_ID, "nameplate") ?? {};
    const fontChoices = buildFontChoices();

    return {
      enabled: normalizeBoolean(cur.enabled, DEFAULT_NAMEPLATES.enabled),
      baseFontSize: toFiniteNumber(cur.baseFontSize, DEFAULT_NAMEPLATES.baseFontSize),
      fontFamily: oneOf(cur.fontFamily, Object.fromEntries(fontChoices.map((f) => [f.value, true])), DEFAULT_NAMEPLATES.fontFamily),
      usePlayerColor: normalizeBoolean(cur.usePlayerColor, DEFAULT_NAMEPLATES.usePlayerColor),
      defaultColor: isHex(cur.defaultColor) ? cur.defaultColor : DEFAULT_NAMEPLATES.defaultColor,
      tintMode: oneOf(cur.tintMode, TINT_CHOICES, DEFAULT_NAMEPLATES.tintMode),
      scaleWithToken: normalizeBoolean(cur.scaleWithToken, DEFAULT_NAMEPLATES.scaleWithToken),
      TINT_CHOICES,
      fontChoices
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const form = this.form;
    if (!form) return;

    bindHexSync(
      form.querySelector('input[name="defaultColor-text"]'),
      form.querySelector('input[name="defaultColor-color"]')
    );
  }

  static async onSubmit(_event, _form, formData) {
    const data = formData.object;

    const baseFontSize = toFiniteNumber(data.baseFontSize, DEFAULT_NAMEPLATES.baseFontSize);
    const fontChoices = buildFontChoices();
    const allowedFonts = Object.fromEntries(fontChoices.map((f) => [f.value, true]));
    const fontFamily = oneOf(String(data.fontFamily || ""), allowedFonts, DEFAULT_NAMEPLATES.fontFamily);
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
