// settings-snapshot.js
let SNAPSHOT;
export function getGbFrameSettings() {
  if (SNAPSHOT) return SNAPSHOT;
  SNAPSHOT = {
    path1:  game.settings.get("greybearded-tokens", "frameImagePath"),
    scale1: Number(game.settings.get("greybearded-tokens", "frameScale")) || 1,
    mode1:  game.settings.get("greybearded-tokens", "frameTintMode") ?? "Disposition",

    secondEnabled: !!game.settings.get("greybearded-tokens", "secondaryFrameEnabled"),
    path2:  game.settings.get("greybearded-tokens", "secondaryFrameImagePath"),
    scale2: Number(game.settings.get("greybearded-tokens", "secondaryFrameScale")) || 1,
    mode2:  game.settings.get("greybearded-tokens", "secondaryFrameTintMode") ?? "Disposition",
  };
  return SNAPSHOT;
}
