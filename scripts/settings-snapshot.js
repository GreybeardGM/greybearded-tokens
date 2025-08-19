// settings-snapshot.js
import { MOD_ID, SETTING_KEYS } from "./constants.js";

export function getGbFrameSettings() {
  const get = (k) => game.settings.get(MOD_ID, k);

  const S = {
    // Frame 1
    path1: get(SETTING_KEYS.frameImagePath),
    scale1: Number(get(SETTING_KEYS.frameScale)) || 1,
    tintMode1: get(SETTING_KEYS.frameTintMode),

    // Frame 2
    secondEnabled: !!get(SETTING_KEYS.secondaryFrameEnabled),
    path2: get(SETTING_KEYS.secondaryFrameImagePath),
    scale2: Number(get(SETTING_KEYS.secondaryFrameScale)) || 1,
    tintMode2: get(SETTING_KEYS.secondaryFrameTintMode),

    // Farben
    defaultColor: get(SETTING_KEYS.defaultFrameColor),
    colors: {
      hostile: get(SETTING_KEYS.colorHostile),
      neutral: get(SETTING_KEYS.colorNeutral),
      friendly: get(SETTING_KEYS.colorFriendly),
      secret: get(SETTING_KEYS.colorSecret),
      character: get(SETTING_KEYS.colorCharacter),
    }
  };

  return S;
}
