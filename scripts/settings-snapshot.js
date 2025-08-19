// settings-snapshot.js
import { MOD_ID, SETTING_KEYS } from "./constants.js";

let _S = null;

function buildSnapshot() {
  const get = (k) => game.settings.get(MOD_ID, k);

  return {
    // Frame 1
    path1: get(SETTING_KEYS.frameImagePath),
    scale1: Number(get(SETTING_KEYS.frameScale)) || 1,
    tintMode1: get(SETTING_KEYS.frameTintMode),
    usePlayerColor1: !!get(SETTING_KEYS.usePlayerColor1),

    // Frame 2
    secondEnabled: !!get(SETTING_KEYS.secondaryFrameEnabled),
    path2: get(SETTING_KEYS.secondaryFrameImagePath),
    scale2: Number(get(SETTING_KEYS.secondaryFrameScale)) || 1,
    tintMode2: get(SETTING_KEYS.secondaryFrameTintMode),
    usePlayerColor2: !!get(SETTING_KEYS.usePlayerColor2),

    // Farben
    defaultColor: get(SETTING_KEYS.defaultFrameColor),
    colors: {
      hostile:   get(SETTING_KEYS.colorHostile),
      neutral:   get(SETTING_KEYS.colorNeutral),
      friendly:  get(SETTING_KEYS.colorFriendly),
      secret:    get(SETTING_KEYS.colorSecret),
      character: get(SETTING_KEYS.colorCharacter),
    }
  };
}

/** Liefert ein einmal erzeugtes Snapshot-Objekt (lazy). */
export function getGbFrameSettings() {
  return _S ?? (_S = buildSnapshot());
}

/** Optional – falls du jemals bewusst neu laden willst (Tests, Dev). */
export function invalidateGbFrameSettings() {
  _S = null;
}
