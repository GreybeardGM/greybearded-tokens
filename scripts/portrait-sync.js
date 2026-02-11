// scripts/portrait-sync.js
// Minimal-invasives Sidecar-Skript für Actor→Prototype-Token Bild-Sync.
// Core v12+, keine Abhängigkeiten vom Rest deines Moduls.

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
    name: "GBT.Sync.Name",          // <-- Key, nicht localize(...)
    hint: "GBT.Sync.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [SYNC_MODES.ALWAYS]: "GBT.Sync.ChoiceAlways", // <-- Keys
      [SYNC_MODES.DIALOG]: "GBT.Sync.ChoiceDialog",
      [SYNC_MODES.NOTHING]: "GBT.Sync.ChoiceNothing"
    },
    default: SYNC_MODES.DIALOG
  });
});

/**
 * Nach einem Actor-Update reagieren wir nur, wenn das Portrait (img) geändert wurde.
 * Wir führen die Aktion ausschließlich auf einem GM-Client aus, um Doppeltrigger zu vermeiden.
 */
Hooks.on("updateActor", async (actor, changed, options, userId) => {
  try {
    if (!("img" in changed)) return;                 // nichts zu tun, wenn Portrait unverändert
    if (options?.[SYNC_SOURCE_FLAG] === SYNC_SOURCES.TOKEN_TO_EMBEDDED_ACTOR) return;
    if (isEmbeddedActor(actor)) return;

    const mode = game.settings.get(MOD_ID, SETTING_KEY);
    if (mode === SYNC_MODES.NOTHING) return;
    if (userId !== game.user.id) return;            // Nur für auslösenden Nutzer anzeigen

    const newImg = actor.img;                        // bereits persistierter Wert
    if (!newImg) return;

    if (!actor.prototypeToken) return;               // Fallback-Guard (sollte nie passieren)
    const currentProtoSrc = actor.prototypeToken.texture?.src;

    // nichts tun, wenn bereits synchron
    if (currentProtoSrc === newImg) return;

    // Modusbehandlung
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
 * Unverlinkte Token mit eingebettetem Actor: Wird das Token-Bild geändert,
 * synchronisieren wir das Portrait des eingebetteten Actors.
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

/** Setzt das Prototype-Token-Image auf das Actor-Portrait. */
async function syncPrototypeTokenImage(actor, img) {
  // Dot-path Update für v10+ Dokumente
  await actor.prototypeToken.update({ "texture.src": img });
  ui.notifications?.info(game.i18n.format("GBT.Sync.DoneInfo", { name: actor.name }));
}

/** Einfache Bestätigungsabfrage mit zwei Buttons: Synchronize / Cancel. */
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
    window: { title: game.i18n.localize("GBT.Sync.DialogTitle") },
    content,
    contentClasses: ["gbt-frames"],
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
