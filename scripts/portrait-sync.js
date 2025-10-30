// scripts/portrait-sync.js
// Minimal-invasives Sidecar-Skript für Actor→Prototype-Token Bild-Sync.
// Core v12+, keine Abhängigkeiten vom Rest deines Moduls.

import { MOD_ID } from "./constants.js";
const SETTING_KEY = "portraitSyncMode";
const SYNC_MODES = { ALWAYS: "always", DIALOG: "dialog", NOTHING: "nothing" };

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
    const mode = game.settings.get(MOD_ID, SETTING_KEY);
    if (mode === SYNC_MODES.NOTHING) return;
    if (!game.user.isGM) return;                     // nur ein GM führt aus

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
      return;
    }
  } catch (err) {
    console.error(`${MOD_ID} | Portrait sync failed:`, err);
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
  return new Promise((resolve) => {
    const title = game.i18n.localize("GBT.Sync.DialogTitle");
    const content = `
      <div style="max-width:100%; overflow:hidden;">
        <p>${game.i18n.localize("GBT.Sync.DialogText")}</p>
        <div style="display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:8px;">
          <div>
            <label><strong>${game.i18n.localize("GBT.Sync.ActorPortrait")}</strong></label>
            <div style="border:1px solid #888; border-radius:4px; padding:4px;">
              <img src="${newImg}" style="max-width:100%; height:auto; display:block; object-fit:contain;">
            </div>
            <code style="display:block; font-size:0.8em; overflow-wrap:anywhere; word-break:break-word;">${escapeHtml(newImg)}</code>
          </div>
          <div>
            <label><strong>${game.i18n.localize("GBT.Sync.ProtoToken")}</strong></label>
            <div style="border:1px solid #888; border-radius:4px; padding:4px;">
              <img src="${oldSrc ?? ""}" style="max-width:100%; height:auto; display:block; object-fit:contain;">
            </div>
            <code style="display:block; font-size:0.8em; overflow-wrap:anywhere; word-break:break-word;">${escapeHtml(oldSrc ?? "")}</code>
          </div>
        </div>
      </div>
    `;

    new Dialog({
      title,
      content,
      buttons: {
        sync: {
          icon: '<i class="fa-solid fa-link"></i>',
          label: game.i18n.localize("GBT.Sync.ButtonSync"),
          callback: async () => {
            await syncPrototypeTokenImage(actor, newImg);
            resolve(true);
          }
        },
        cancel: {
          icon: '<i class="fa-regular fa-circle-xmark"></i>',
          label: game.i18n.localize("GBT.Sync.ButtonCancel"),
          callback: () => resolve(false)
        }
      },
      default: "sync"
    }, { jQuery: false }).render(true);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"'`=\/]/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;" }[c])
  );
}
