// modules/greybearded-tokens/scripts/settings/frames-form.js
import {
  MOD_ID,
  TINT_CHOICES,
  DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK
} from "../constants.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";
import {
  num, bool, str, oneOf, isHex, bindHexPairs, readObjectSetting
} from "./helpers.js";

export class FramesForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gb-frames-form",
      title: "Greybearded Tokens — Frames & Mask",
      template: "modules/greybearded-tokens/templates/frames-form.hbs",
      classes: ["gb-frames-form"],
      width: 820
    });
  }

  async getData() {
    const cur = readObjectSetting(MOD_ID, "frames", {
      frame1: DEFAULT_FRAME1, frame2: DEFAULT_FRAME2, mask: DEFAULT_MASK
    });

    const f1 = {
      path:           str(cur.frame1?.path,         DEFAULT_FRAME1.path),
      scale:          num(cur.frame1?.scale,        DEFAULT_FRAME1.scale),
      tintMode:       oneOf(cur.frame1?.tintMode,   TINT_CHOICES, DEFAULT_FRAME1.tintMode),
      usePlayerColor: bool(cur.frame1?.usePlayerColor, DEFAULT_FRAME1.usePlayerColor),
      defaultColor:   isHex(cur.frame1?.defaultColor) ? cur.frame1.defaultColor : DEFAULT_FRAME1.defaultColor
    };

    const f2 = {
      enabled:        bool(cur.frame2?.enabled,     DEFAULT_FRAME2.enabled),
      path:           str(cur.frame2?.path,         DEFAULT_FRAME2.path),
      scale:          num(cur.frame2?.scale,        DEFAULT_FRAME2.scale),
      tintMode:       oneOf(cur.frame2?.tintMode,   TINT_CHOICES, DEFAULT_FRAME2.tintMode),
      usePlayerColor: bool(cur.frame2?.usePlayerColor, DEFAULT_FRAME2.usePlayerColor),
      defaultColor:   isHex(cur.frame2?.defaultColor) ? cur.frame2.defaultColor : DEFAULT_FRAME2.defaultColor
    };

    const mk = {
      enabled:        bool(cur.mask?.enabled,       DEFAULT_MASK.enabled),
      path:           str(cur.mask?.path,           DEFAULT_MASK.path)
    };

    return { f1, f2, mk, TINT_CHOICES };
  }

  activateListeners(htmlJQ) {
    super.activateListeners(htmlJQ);
    const root = htmlJQ[0] ?? htmlJQ;

    bindHexPairs(root, ["frame1-defaultColor", "frame2-defaultColor"]);

    root.querySelectorAll('[data-action="fp"]').forEach(btn => {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const targetName = btn.dataset.target;
        const input = root.querySelector(`input[name="${targetName}"]`);
        const fp = new FilePicker({
          type: "image",
          current: input?.value || "",
          callback: (path) => { if (input) input.value = path; }
        });
        fp.render(true);
      });
    });
  }

  async _updateObject(_event, formData) {
    // Frame 1
    const f1Scale = num(formData["frame1-scale"], DEFAULT_FRAME1.scale);
    const f1Tint  = oneOf(String(formData["frame1-tintMode"] || ""), TINT_CHOICES, DEFAULT_FRAME1.tintMode);
    const f1Def   = isHex(formData["frame1-defaultColor-text"])
      ? formData["frame1-defaultColor-text"]
      : (isHex(formData["frame1-defaultColor-color"]) ? formData["frame1-defaultColor-color"] : DEFAULT_FRAME1.defaultColor);

    const frame1 = {
      path:           str(formData["frame1-path"], DEFAULT_FRAME1.path),
      scale:          f1Scale,
      tintMode:       f1Tint,
      usePlayerColor: bool(formData["frame1-usePlayerColor"], DEFAULT_FRAME1.usePlayerColor),
      defaultColor:   f1Def
    };

    // Frame 2
    const f2Scale = num(formData["frame2-scale"], DEFAULT_FRAME2.scale);
    const f2Tint  = oneOf(String(formData["frame2-tintMode"] || ""), TINT_CHOICES, DEFAULT_FRAME2.tintMode);
    const f2Def   = isHex(formData["frame2-defaultColor-text"])
      ? formData["frame2-defaultColor-text"]
      : (isHex(formData["frame2-defaultColor-color"]) ? formData["frame2-defaultColor-color"] : DEFAULT_FRAME2.defaultColor);

    const frame2 = {
      enabled:        bool(formData["frame2-enabled"], DEFAULT_FRAME2.enabled),
      path:           str(formData["frame2-path"], DEFAULT_FRAME2.path),
      scale:          f2Scale,
      tintMode:       f2Tint,
      usePlayerColor: bool(formData["frame2-usePlayerColor"], DEFAULT_FRAME2.usePlayerColor),
      defaultColor:   f2Def
    };

    // Mask
    const mask = {
      enabled: bool(formData["mask-enabled"], DEFAULT_MASK.enabled),
      path:    str(formData["mask-path"],     DEFAULT_MASK.path)
    };

    const next = { frame1, frame2, mask };
    await game.settings.set(MOD_ID, "frames", next);

    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) {
      for (const t of canvas.tokens.placeables) updateFrame(t, S);
    }
  }
}
