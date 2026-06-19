// scripts/portrait-sync.js
// Minimally invasive sidecar script for actor-to-prototype-token image sync.
// Core v12+, no dependencies on the rest of this module.

import { MOD_ID } from "./settings/constants.js";
const SETTING_KEY = "portraitSyncMode";
const SYNC_DIALOG_TEMPLATE = `modules/${MOD_ID}/templates/portrait-sync-dialog.hbs`;
const SYNC_MODES = { ALWAYS: "always", DIALOG: "dialog", NOTHING: "nothing" };
const SYNC_SOURCE_FLAG = `${MOD_ID}.portraitSyncSource`;
const SYNC_SOURCES = {
  TOKEN_TO_EMBEDDED_ACTOR: "token-to-embedded-actor"
};

Hooks.once("init", () => {
  game.settings.register(MOD_ID, SETTING_KEY, {
    name: "GBT.Sync.Name",          // Key, not localize(...)
    hint: "GBT.Sync.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [SYNC_MODES.ALWAYS]: "GBT.Sync.ChoiceAlways", // Keys
      [SYNC_MODES.DIALOG]: "GBT.Sync.ChoiceDialog",
      [SYNC_MODES.NOTHING]: "GBT.Sync.ChoiceNothing"
    },
    default: SYNC_MODES.DIALOG
  });
});

/**
 * After an actor update, react only when the portrait (img) changed.
 * Run the action only on the triggering client to avoid duplicate prompts.
 */
Hooks.on("updateActor", async (actor, changed, options, userId) => {
  try {
    if (!("img" in changed)) return;                 // Nothing to do when the portrait is unchanged.
    if (options?.[SYNC_SOURCE_FLAG] === SYNC_SOURCES.TOKEN_TO_EMBEDDED_ACTOR) return;
    if (isEmbeddedActor(actor)) return;

    const mode = game.settings.get(MOD_ID, SETTING_KEY);
    if (mode === SYNC_MODES.NOTHING) return;
    if (userId !== game.user.id) return;            // Show only for the triggering user.

    const newImg = actor.img;                        // Already persisted value.
    if (!newImg) return;

    if (!actor.prototypeToken) return;               // Fallback guard; should never happen.
    const currentProtoSrc = actor.prototypeToken.texture?.src;

    // Nothing to do when already synchronized.
    if (currentProtoSrc === newImg) return;

    // Mode handling.
    if (mode === SYNC_MODES.ALWAYS) {
      await syncPrototypeTokenImage(actor, newImg);
      return;
    }

    if (mode === SYNC_MODES.DIALOG) {
      await promptSyncDialog(actor, currentProtoSrc, newImg);
    }
  } catch (err) {
    console.error(`${MOD_ID} | Portrait sync failed:`, err);
  }
});

/**
 * Unlinked tokens with embedded actors: when the token image changes,
 * synchronize the embedded actor portrait.
 */
Hooks.on("updateToken", async (tokenDoc, changed, options, userId) => {
  try {
    const newTokenImg = changed?.texture?.src;
    if (!newTokenImg) return;
    if (userId !== game.user.id) return;

    const mode = game.settings.get(MOD_ID, SETTING_KEY);
    if (mode === SYNC_MODES.NOTHING) return;

    if (tokenDoc.actorLink) return;

    const embeddedActor = tokenDoc.actor;
    if (!embeddedActor || !isEmbeddedActor(embeddedActor)) return;
    if (embeddedActor.img === newTokenImg) return;

    await embeddedActor.update(
      { img: newTokenImg },
      { [SYNC_SOURCE_FLAG]: SYNC_SOURCES.TOKEN_TO_EMBEDDED_ACTOR }
    );
  } catch (err) {
    console.error(`${MOD_ID} | Token → embedded actor portrait sync failed:`, err);
  }
});

/** Set the prototype token image to the actor portrait. */
async function syncPrototypeTokenImage(actor, img) {
  // Dot-path update for v10+ documents.
  await actor.prototypeToken.update({ "texture.src": img });
  ui.notifications?.info(game.i18n.format("GBT.Sync.DoneInfo", { name: actor.name }));
}

/** Simple confirmation prompt with two buttons: Synchronize / Cancel. */
async function promptSyncDialog(actor, oldSrc, newImg) {
  const DialogV2 = foundry?.applications?.api?.DialogV2;
  if (!DialogV2) {
    console.error(`${MOD_ID} | DialogV2 is not available.`);
    return false;
  }

  const content = await renderTemplate(SYNC_DIALOG_TEMPLATE, {
    text: game.i18n.localize("GBT.Sync.DialogText"),
    actorPortraitLabel: game.i18n.localize("GBT.Sync.ActorPortrait"),
    actorPortraitSrc: newImg,
    actorPortraitPath: newImg,
    protoTokenLabel: game.i18n.localize("GBT.Sync.ProtoToken"),
    protoTokenSrc: oldSrc ?? "",
    protoTokenPath: oldSrc ?? ""
  });

  const result = await DialogV2.wait({
    content,
    window: {
      title: game.i18n.localize("GBT.Sync.DialogTitle"),
      contentClasses: ["gbtf-frames"]
    },
    buttons: [
      {
        action: "sync",
        icon: "fa-solid fa-link",
        label: game.i18n.localize("GBT.Sync.ButtonSync"),
        callback: () => "sync"
      },
      {
        action: "cancel",
        icon: "fa-regular fa-circle-xmark",
        label: game.i18n.localize("GBT.Sync.ButtonCancel"),
        callback: () => "cancel",
        default: true
      }
    ],
    rejectClose: false
  });

  if (result !== "sync") return false;

  await syncPrototypeTokenImage(actor, newImg);
  return true;
}

function isEmbeddedActor(actor) {
  return actor?.parent?.documentName === "Token";
}
