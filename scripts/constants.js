export const MOD_ID = "greybearded-tokens";

// Settings keys an einer Stelle – weniger Tippfehler
export const SETTING_KEYS = {
  defaultFrameColor: "defaultFrameColor",
  frameImagePath: "frameImagePath",
  frameScale: "frameScale",
  frameTintMode: "frameTintMode",

  secondaryFrameEnabled: "secondaryFrameEnabled",
  secondaryFrameImagePath: "secondaryFrameImagePath",
  secondaryFrameTintMode: "secondaryFrameTintMode",
  secondaryFrameScale: "secondaryFrameScale",

  // Disposition-Farben
  colorHostile: "color-hostile",
  colorNeutral: "color-neutral",
  colorFriendly: "color-friendly",
  colorSecret: "color-secret",
  colorCharacter: "color-character",
};

// Aktuelle Tint-Choices (noch inkl. PlayerColor – wird im nächsten Schritt ersetzt)
export const TINT_CHOICES = {
  Disposition: "Disposition",
  Unicolor: "Unicolor",
  Advanced: "Advanced",
  NoTint: "NoTint"
};
