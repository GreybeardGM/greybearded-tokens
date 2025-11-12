// modules/greybearded-tokens/scripts/constants.js

export const MOD_ID = "greybearded-tokens";

// Tint Choices
export const TINT_CHOICES = {
  none: "GBT.Tint.None",
  disposition: "GBT.Tint.Disposition",
  unicolor: "GBT.Tint.Unicolor",
  advanced: "GBT.Tint.Advanced",
  custom: "GBT.Tint.Custom"
};

// Font Choices
export const FONT_CHOICES = {
  "Arial": "Arial",
  "Amiri": "Amiri",
  "Bruno Ace": "Bruno Ace",
  "Courier": "Courier",
  "Courier New": "Courier New",
  "Modesto Condensed": "Modesto Condensed",
  "Signika": "Signika",
  "Times": "Times",
  "Times New Roman": "Times New Roman"
};

export const DEFAULT_COLORS = {
  "hostile":   "#993333",
  "neutral":   "#B7A789",
  "friendly":  "#5F7A8A",
  "secret":    "#6B5E7A",
  "character": "#888888"
};

export const DEFAULT_NAMEPLATES = {
  enabled: false,
  baseFontSize: 22,
  fontFamily: "Signika",
  usePlayerColor: false,
  defaultColor: "#ffffff",
  tintMode: "NoTint",
  scaleWithToken: true
};

export const DEFAULT_FRAME1 = {
  path: "modules/greybearded-tokens/assets/frame-default.png",
  scale: 1,
  tintMode: "Disposition",
  usePlayerColor: false,
  defaultColor: "#888888"
};

export const DEFAULT_FRAME2 = {
  enabled: false,
  path: "modules/greybearded-tokens/assets/frame-secondary.png",
  scale: 1,
  tintMode: "Unicolor",
  usePlayerColor: true,
  defaultColor: "#888888"
};

export const DEFAULT_MASK = {
  enabled: true,
  path: "modules/greybearded-tokens/assets/mask-round.png"
};
