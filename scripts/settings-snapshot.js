// settings-snapshot.js
import { MOD_ID, DEFAULT_COLORS } from "./constants.js";

let _S = null;
let _VER = 0;

function num(v, fb = 1)   { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function bool(v)          { return !!v; }
function str(v, fb = "")  { return (typeof v === "string" && v.length) ? v : fb; }

function _readAll() {
  const get = (k) => game.settings.get(MOD_ID, k);

  // Robuster Default für "default"-Farbe aus constants
  const DEFAULT_COLOR_GLOBAL =
    DEFAULT_COLORS?.default ??
    DEFAULT_COLORS?.defaultColor ??
    "#888888";

  const snap = {
    // ── Frame 1 ──────────────────────────────────────────────────────────────
    frame1: {
      path:           str(get("path1"), "modules/greybearded-tokens/assets/frame-default.png"),
      scale:          num(get("scale1"), 1),
      tintMode:       str(get("tintMode1"), "Disposition"),
      usePlayerColor: bool(get("usePlayerColor1"))
    },

    // ── Frame 2 ──────────────────────────────────────────────────────────────
    frame2: {
      enabled:        bool(get("secondEnabled")),
      path:           str(get("path2"), "modules/greybearded-tokens/assets/frame-secondary.png"),
      scale:          num(get("scale2"), 1),
      tintMode:       str(get("tintMode2"), "Unicolor"),
      usePlayerColor: bool(get("usePlayerColor2"))
    },

    // ── Mask ─────────────────────────────────────────────────────────────────
    mask: {
      enabled:  bool(get("maskEnabled")),
      path:     str(get("pathMask"), "modules/greybearded-tokens/assets/mask-round.png")
    },

    // ── Farben (mit BC für defaultColor vs color-default) ────────────────────
    colors: {
      default:   str(get("color-default") ?? get("defaultColor"), DEFAULT_COLOR_GLOBAL),
      hostile:   str(get("color-hostile"),   DEFAULT_COLORS?.hostile   ?? "#993333"),
      neutral:   str(get("color-neutral"),   DEFAULT_COLORS?.neutral   ?? "#B7A789"),
      friendly:  str(get("color-friendly"),  DEFAULT_COLORS?.friendly  ?? "#5F7A8A"),
      secret:    str(get("color-secret"),    DEFAULT_COLORS?.secret    ?? "#6B5E7A"),
      character: str(get("color-character"), DEFAULT_COLORS?.character ?? "#7F7F7F")
    },

    // ── Nameplates ───────────────────────────────────────────────────────────
    nameplate: {
      enabled:        bool(get("nameplateEnabled")),
      baseFontSize:   num(get("nameplateBaseFontSize"), 22),
      fontFamily:     str(get("nameplateFontFamily"), "Signika"),
      defaultColor:   str(get("nameplateDefaultColor"), "#ffffff"),
      tintMode:       str(get("nameplateTintMode"), "Unicolor"),
      scaleWithToken: bool(get("nameplateScaleWithToken"))
    },

    // ── Meta ─────────────────────────────────────────────────────────────────
    version: _VER,
    snapshotAt: Date.now()
  };

  // (Optional) Übergangs-Aliase – entfernen, sobald alles umgestellt ist
  snap.path1           = snap.frame1.path;
  snap.scale1          = snap.frame1.scale;
  snap.tintMode1       = snap.frame1.tintMode;
  snap.usePlayerColor1 = snap.frame1.usePlayerColor;

  snap.secondEnabled   = snap.frame2.enabled;
  snap.path2           = snap.frame2.path;
  snap.scale2          = snap.frame2.scale;
  snap.tintMode2       = snap.frame2.tintMode;
  snap.usePlayerColor2 = snap.frame2.usePlayerColor;

  snap.maskEnabled     = snap.mask.enabled;
  snap.pathMask        = snap.mask.path;

  snap.defaultColor    = snap.colors.default;

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
    _S = _readAll();
    _S.version = ++_VER;
    _S.snapshotAt = Date.now();
    return _S;
  }
  return _readAll();
}

/** Erzwingt Neuaufbau und Memoisierung. */
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
