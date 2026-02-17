// modules/greybearded-tokens/scripts/settings/constants.js

export const MOD_ID = "greybearded-tokens";

export const TINT_CHOICES = {
  NoTint:      "GBT.Tint.None",
  Disposition: "GBT.Tint.Disposition",
  Ownership:   "GBT.Tint.Ownership",
  ActorType:   "GBT.Tint.ActorType",
  Unicolor:    "GBT.Tint.Unicolor",
  Custom:      "GBT.Tint.Custom"
};


export const DEFAULT_DISPOSITION_COLORS = {
  "hostile":   "#993333",
  "neutral":   "#B7A789",
  "friendly":  "#5F7A8A",
  "secret":    "#6B5E7A",
  "character": "#888888"
};

export const DEFAULT_ACTOR_TYPE_COLORS = {};
export const DEFAULT_ACTOR_TYPE_COLOR = "#888888";

export const DEFAULT_OWNERSHIP_COLORS = {
  owner: "#888888",
  observer: "#5F7A8A",
  limited: "#B7A789",
  none: "#993333"
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
  defaultColor: "#000000"
};

export const DEFAULT_MASK = {
  enabled: true,
  path: "modules/greybearded-tokens/assets/mask-round.png"
};

export const DEFAULT_TOKEN_TOOLS = {
  size: true,
  sizeMin: 1,
  sizeMax: 15,
  toggleFrame: true,
  disposition: true,
  mirrorArtwork: true
};
