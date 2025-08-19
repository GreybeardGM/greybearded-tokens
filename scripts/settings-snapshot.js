// settings-snapshot.js
import { MOD_ID } from "./constants.js"; // KEINE SETTING_KEYS MEHR

let _S = null;

function num(v, fb = 1)   { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function bool(v)          { return !!v; }
function str(v, fb = "")  { return (typeof v === "string" && v.length) ? v : fb; }

function buildSnapshot() {
  const get = (k) => game.settings.get(MOD_ID, k);

  return {
    // Frame 1
    path1:           str(get("path1"), "modules/greybearded-tokens/assets/frame-default.png"),
    scale1:          num(get("scale1"), 1),
    tintMode1:       str(get("tintMode1"), "Disposition"),
    usePlayerColor1: bool(get("usePlayerColor1")),

    // Frame 2
    secondEnabled:   bool(get("secondEnabled")),
    path2:           str(get("path2"), "modules/greybearded-tokens/assets/frame-secondary.png"),
    scale2:          num(get("scale2"), 1),
    tintMode2:       str(get("tintMode2"), "Unicolor"),
    usePlayerColor2: bool(get("usePlayerColor2")),

    // Farben
    defaultColor: str(get("defaultColor"), "#888888"),
    colors: {
      hostile:   str(get("color-hostile"),   "#993333"),
      neutral:   str(get("color-neutral"),   "#B7A789"),
      friendly:  str(get("color-friendly"),  "#5F7A8A"),
      secret:    str(get("color-secret"),    "#6B5E7A"),
      character: str(get("color-character"), "#7F7F7F"),
    }
  };
}

/** Lazy + memoized */
export function getGbFrameSettings() {
  return _S ?? (_S = buildSnapshot());
}

/** Nur für Tests/Reloads notwendig */
export function invalidateGbFrameSettings() {
  _S = null;
}
