// modules/greybearded-tokens/scripts/settings/actor-type-colors-form.js
import { MOD_ID, DEFAULT_ACTOR_TYPE_COLORS, DEFAULT_ACTOR_TYPE_COLOR } from "./constants.js";
import { isHex, bindHexPairs } from "./helpers.js";
import { buildSnapshot } from "./snapshot.js";
import { updateFrame } from "../apply-frame.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function getActorTypes() {
  const types = game.documentTypes?.Actor ?? [];
  return [...new Set(types.filter((type) => typeof type === "string" && type.trim().length))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function getActorTypeLabel(type) {
  const labelKey = CONFIG.Actor?.typeLabels?.[type];
  if (typeof labelKey === "string" && labelKey.length) {
    const localized = game.i18n.localize(labelKey);
    if (localized && localized !== labelKey) return localized;
  }
  return type;
}

export class ActorTypeColorsForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gbtf-actor-type-colors-form",
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: ActorTypeColorsForm.onSubmit
    },
    position: {
      width: 330,
      height: "auto"
    },
    window: {
      title: "GBT.ActorTypeColors.Name",
      contentClasses: ["gbtf-frames", "gbtf-color-form"]
    }
  };

  static PARTS = {
    form: {
      template: "modules/greybearded-tokens/templates/actor-type-colors-form.hbs"
    }
  };

  async _prepareContext() {
    const actorTypes = getActorTypes();
    const actorTypeColors = (game.settings.get(MOD_ID, "actorTypeColors") ?? DEFAULT_ACTOR_TYPE_COLORS) || DEFAULT_ACTOR_TYPE_COLORS;
    const rows = actorTypes.map((type) => ({
      type,
      label: getActorTypeLabel(type),
      value: (typeof actorTypeColors?.[type] === "string" && isHex(actorTypeColors[type])) ? actorTypeColors[type] : DEFAULT_ACTOR_TYPE_COLOR
    }));

    return {
      tableName: game.i18n.localize("GBT.ActorTypeColors.ActorType"),
      rows
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const form = this.form;
    if (!form) return;

    bindHexPairs(form, getActorTypes());
    form.querySelector('[data-action="cancel"]')?.addEventListener("click", async (event) => {
      event.preventDefault();
      await this.close();
    });
  }

  static async onSubmit(_event, form, _formData) {
    const next = {};
    for (const type of getActorTypes()) {
      const t = form.querySelector(`input[name="${type}-text"]`)?.value?.trim();
      const c = form.querySelector(`input[name="${type}-color"]`)?.value?.trim();
      next[type] = isHex(t) ? t : (isHex(c) ? c : DEFAULT_ACTOR_TYPE_COLOR);
    }
    await game.settings.set(MOD_ID, "actorTypeColors", next);
    const S = buildSnapshot();
    if (canvas?.tokens?.placeables?.length) for (const t of canvas.tokens.placeables) updateFrame(t, S);
  }
}
