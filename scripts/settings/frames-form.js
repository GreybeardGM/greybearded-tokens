// modules/greybearded-tokens/scripts/settings/frames-form.js
import {
  MOD_ID,
  TINT_CHOICES,
  DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK
} from "./constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import { toFiniteNumber, normalizeBoolean } from "../utils/normalization.js";
import { str, oneOf, isHex, bindHexPairs, readObjectSetting } from "./helpers.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FramesForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gbtf-frames-form",
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: FramesForm.onSubmit
    },
    position: {
      width: 820,
      height: "auto"
    },
    window: {
      title: "GBT.Frames.Name",
      contentClasses: ["gbtf-frames", "gbtf-frames-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/frames-form.hbs"
    },
    actions: {
      template: "modules/greybearded-tokens/templates/form-actions.hbs"
    }
  };

  async _prepareContext() {
    const cur = readObjectSetting(MOD_ID, "frames", {
      frame1: DEFAULT_FRAME1, frame2: DEFAULT_FRAME2, mask: DEFAULT_MASK
    });

    const f1 = {
      path: str(cur.frame1?.path, DEFAULT_FRAME1.path),
      scale: toFiniteNumber(cur.frame1?.scale, DEFAULT_FRAME1.scale),
      tintMode: oneOf(cur.frame1?.tintMode, TINT_CHOICES, DEFAULT_FRAME1.tintMode),
      usePlayerColor: normalizeBoolean(cur.frame1?.usePlayerColor, DEFAULT_FRAME1.usePlayerColor),
      defaultColor: isHex(cur.frame1?.defaultColor) ? cur.frame1.defaultColor : DEFAULT_FRAME1.defaultColor
    };

    const f2 = {
      enabled: normalizeBoolean(cur.frame2?.enabled, DEFAULT_FRAME2.enabled),
      path: str(cur.frame2?.path, DEFAULT_FRAME2.path),
      scale: toFiniteNumber(cur.frame2?.scale, DEFAULT_FRAME2.scale),
      tintMode: oneOf(cur.frame2?.tintMode, TINT_CHOICES, DEFAULT_FRAME2.tintMode),
      usePlayerColor: normalizeBoolean(cur.frame2?.usePlayerColor, DEFAULT_FRAME2.usePlayerColor),
      defaultColor: isHex(cur.frame2?.defaultColor) ? cur.frame2.defaultColor : DEFAULT_FRAME2.defaultColor
    };

    const mk = {
      enabled: normalizeBoolean(cur.mask?.enabled, DEFAULT_MASK.enabled),
      path: str(cur.mask?.path, DEFAULT_MASK.path)
    };

    return {
      f1,
      f2,
      mk,
      TINT_CHOICES
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const form = this.form;
    if (!form) return;

    bindHexPairs(form, ["frame1-defaultColor", "frame2-defaultColor"]);

    ["frame1-path", "frame2-path", "mask-path"].forEach((name) => {
      const inp = form.querySelector(`input[name="${name}"]`);
      const img = form.querySelector(`[data-preview-for="${name}"] img`);
      if (!inp || !img) return;
      inp.addEventListener("input", () => { img.src = inp.value || ""; });
      inp.addEventListener("change", () => { img.src = inp.value || ""; });
    });
  }

  async _onClickAction(event, target) {
    const action = target.dataset.action;
    if (action === "fp") {
      event.preventDefault();
      const form = this.form;
      const targetName = target.dataset.target;
      const input = form?.querySelector(`input[name="${targetName}"]`);
      const FilePickerImpl = foundry?.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
      if (!FilePickerImpl) return;

      const fp = new FilePickerImpl({
        type: "image",
        current: input?.value || "",
        callback: (path) => {
          if (input) input.value = path;
          const box = form?.querySelector(`[data-preview-for="${targetName}"] img`);
          if (box) box.src = path;
        }
      });
      fp.render(true);
      return;
    }


    return super._onClickAction(event, target);
  }

  static async onSubmit(_event, _form, formData) {
    const data = formData.object;

    const f1Scale = toFiniteNumber(data["frame1-scale"], DEFAULT_FRAME1.scale);
    const f1Tint = oneOf(String(data["frame1-tintMode"] || ""), TINT_CHOICES, DEFAULT_FRAME1.tintMode);
    const f1Def = isHex(data["frame1-defaultColor-text"])
      ? data["frame1-defaultColor-text"]
      : (isHex(data["frame1-defaultColor-color"]) ? data["frame1-defaultColor-color"] : DEFAULT_FRAME1.defaultColor);

    const frame1 = {
      path: str(data["frame1-path"], DEFAULT_FRAME1.path),
      scale: f1Scale,
      tintMode: f1Tint,
      usePlayerColor: normalizeBoolean(Object.hasOwn(data, "frame1-usePlayerColor") ? data["frame1-usePlayerColor"] : false, DEFAULT_FRAME1.usePlayerColor),
      defaultColor: f1Def
    };

    const f2Scale = toFiniteNumber(data["frame2-scale"], DEFAULT_FRAME2.scale);
    const f2Tint = oneOf(String(data["frame2-tintMode"] || ""), TINT_CHOICES, DEFAULT_FRAME2.tintMode);
    const f2Def = isHex(data["frame2-defaultColor-text"])
      ? data["frame2-defaultColor-text"]
      : (isHex(data["frame2-defaultColor-color"]) ? data["frame2-defaultColor-color"] : DEFAULT_FRAME2.defaultColor);

    const frame2 = {
      enabled: normalizeBoolean(Object.hasOwn(data, "frame2-enabled") ? data["frame2-enabled"] : false, DEFAULT_FRAME2.enabled),
      path: str(data["frame2-path"], DEFAULT_FRAME2.path),
      scale: f2Scale,
      tintMode: f2Tint,
      usePlayerColor: normalizeBoolean(Object.hasOwn(data, "frame2-usePlayerColor") ? data["frame2-usePlayerColor"] : false, DEFAULT_FRAME2.usePlayerColor),
      defaultColor: f2Def
    };

    const mask = {
      enabled: normalizeBoolean(Object.hasOwn(data, "mask-enabled") ? data["mask-enabled"] : false, DEFAULT_MASK.enabled),
      path: str(data["mask-path"], DEFAULT_MASK.path)
    };

    const next = { frame1, frame2, mask };
    await game.settings.set(MOD_ID, "frames", next);

    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) {
      for (const t of canvas.tokens.placeables) updateFrame(t, S);
    }
  }
}
