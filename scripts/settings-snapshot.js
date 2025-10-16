// settings-snapshot.js
import { MOD_ID } from "./constants.js";

let _S = null;
let _VER = 0;

function num(v, fb = 1)   { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function bool(v)          { return !!v; }
function str(v, fb = "")  { return (typeof v === "string" && v.length) ? v : fb; }

function _readAll() {
  const get = (k) => game.settings.get(MOD_ID, k);

  const snap = {
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

    // Mask
    maskEnabled:     bool(get("maskEnabled")),
    pathMask:        str(get("pathMask"), "modules/greybearded-tokens/assets/mask-round.png"),

    // Farben
    defaultColor: str(get("defaultColor"), "#888888"),
    colors: {
      hostile:   str(get("color-hostile"),   "#993333"),
      neutral:   str(get("color-neutral"),   "#B7A789"),
      friendly:  str(get("color-friendly"),  "#5F7A8A"),
      secret:    str(get("color-secret"),    "#6B5E7A"),
      character: str(get("color-character"), "#7F7F7F"),
    },

    // Meta
    version: _VER,
    snapshotAt: Date.now()
  };

  return snap;
}

/**
 * Liefert den aktuellen Snapshot.
 * Vor `ready`: Live-Fallback ohne Memo (kein verfrühtes Cachen).
 * Ab `ready` (nach buildSnapshot): memoized Rückgabe.
 */
export function getGbFrameSettings() {
  if (_S) return _S;
  if (game?.ready) {
    // Falls jemand getGbFrameSettings() nach ready aber vor buildSnapshot() ruft:
    _S = _readAll();
    _S.version = ++_VER;
    _S.snapshotAt = Date.now();
    return _S;
  }
  // Vor ready: live lesen, NICHT cachen
  return _readAll();
}

/**
 * Erzwingt Neuaufbau und Memoisierung. Zu `ready`/`canvasReady` aufrufen.
 */
export function buildSnapshot() {
  _S = _readAll();
  _S.version = ++_VER;
  _S.snapshotAt = Date.now();
  return _S;
}

/** Optionales manuelles Invalidieren (Tests/Reloads) */
export function invalidateGbFrameSettings() {
  _S = null;
}
