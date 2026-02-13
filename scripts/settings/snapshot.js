// modules/greybearded-tokens/scripts/settings/snapshot.js
import { MOD_ID, DEFAULT_DISPOSITION_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK } from "./constants.js";
import { num, bool, str, readObjectSetting } from "./helpers.js";

let _S = null;

function deriveRuntimeFlags(snapshot) {
  const hasFrame1 = !!snapshot?.frame1?.path;
  const hasFrame2 = !!(snapshot?.frame2?.enabled && snapshot?.frame2?.path);
  const hasMask   = !!(snapshot?.mask?.enabled && snapshot?.mask?.path);
  const hasName   = !!snapshot?.nameplate?.enabled;

  return {
    hasFrame1,
    hasFrame2,
    hasMask,
    hasNameplate: hasName,
    hasAnyOverlay: hasFrame1 || hasFrame2,
    hasAnyVisuals: hasFrame1 || hasFrame2 || hasMask || hasName
  };
}

function _readAll() {
  const FR = readObjectSetting(MOD_ID, "frames", {
    frame1: DEFAULT_FRAME1, frame2: DEFAULT_FRAME2, mask: DEFAULT_MASK
  });
  const NP = readObjectSetting(MOD_ID, "nameplate", DEFAULT_NAMEPLATES);
  const CL = readObjectSetting(MOD_ID, "colors", DEFAULT_DISPOSITION_COLORS);

  const snap = {
    frame1: {
      path:           str(FR?.frame1?.path,         DEFAULT_FRAME1.path),
      scale:          num(FR?.frame1?.scale,        DEFAULT_FRAME1.scale),
      tintMode:       str(FR?.frame1?.tintMode,     DEFAULT_FRAME1.tintMode),
      usePlayerColor: bool(FR?.frame1?.usePlayerColor, DEFAULT_FRAME1.usePlayerColor),
      defaultColor:   str(FR?.frame1?.defaultColor, DEFAULT_FRAME1.defaultColor)
    },
    frame2: {
      enabled:        bool(FR?.frame2?.enabled,     DEFAULT_FRAME2.enabled),
      path:           str(FR?.frame2?.path,         DEFAULT_FRAME2.path),
      scale:          num(FR?.frame2?.scale,        DEFAULT_FRAME2.scale),
      tintMode:       str(FR?.frame2?.tintMode,     DEFAULT_FRAME2.tintMode),
      usePlayerColor: bool(FR?.frame2?.usePlayerColor, DEFAULT_FRAME2.usePlayerColor),
      defaultColor:   str(FR?.frame2?.defaultColor, DEFAULT_FRAME2.defaultColor)
    },
    mask: {
      enabled:        bool(FR?.mask?.enabled,       DEFAULT_MASK.enabled),
      path:           str(FR?.mask?.path,           DEFAULT_MASK.path)
    },
    nameplate: NP,
    colors:    CL
  };

  snap.runtime = deriveRuntimeFlags(snap);

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
    return _S;
  }
  return _readAll();
}

/** Erzwingt Neuaufbau und Memoisierung. */
export function buildSnapshot() {
  _S = _readAll();
  return _S;
}

/** Optionales manuelles Invalidieren (Tests/Reloads) */
export function invalidateGbFrameSettings() {
  _S = null;
}
