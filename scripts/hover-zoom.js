// hover-zoom.js (robust, multipliziert auf die Foundry-Basisskala)

// Konfig
const HOVER_SCALE = 1.06;
const HOVER_MS    = 150;
const EASING      = t => 1 - Math.pow(1 - t, 3); // easeOutCubic
const SELECT_SCALE = 1.08; // oder gleich HOVER_SCALE, Geschmackssache

// --- Neuer Kern: Basis robust rekonstruieren -------------------------------
function getVisualFactor(token) {
  return token?._gbVisualScale ?? 1.0; // unser Faktor, nicht Foundrys
}

// +++ NEU: Local Hover-Flag führen, damit controlToken weiß, wohin wir zurück sollen
function setLocalHover(token, hovered) {
  if (!token || token.destroyed) return;
  token._gbIsHovered = !!hovered;
}
function isLocalHover(token) {
  return !!(token && token._gbIsHovered);
}

// +++ NEU: Ziel-Faktor zentral bestimmen (Selection > Hover > Neutral)
function computeTargetFactor(token) {
  if (!token || token.destroyed) return 1.0;
  if (token.controlled) return SELECT_SCALE;
  return isLocalHover(token) ? HOVER_SCALE : 1.0;
}

// Rekonstruiert Basis als mesh.scale / visualFactor (falls möglich)
function recomputeBaseScale(token) {
  if (!token || token.destroyed) return;
  const s = token?.mesh?.scale;
  if (!s) return;

  const f = getVisualFactor(token);
  // Vermeide Division durch 0 & Unsinn
  const fx = (Math.abs(f) > 1e-6) ? f : 1.0;

  token._gbBaseScale = {
    x: s.x / fx,
    y: s.y / fx
  };
}

// Stellt sicher, dass _gbBaseScale existiert und plausibel ist
function ensureBaseScale(token) {
  if (!token || token.destroyed) return;
  const s = token?.mesh?.scale;
  if (!s) return;

  if (!token._gbBaseScale) {
    // Erstmalig: aus aktueller Mesh-Skala *und* unserem Faktor rekonstruieren
    recomputeBaseScale(token);
  } else {
    // Plausibilitätscheck: Wenn aktueller impliziter Faktor absurd ist, neu berechnen
    const bs = token._gbBaseScale;
    const impliedFactorX = s.x / bs.x;
    const impliedFactorY = s.y / bs.y;
    const implied = (Math.abs(impliedFactorX) + Math.abs(impliedFactorY)) / 2;

    // z.B. >2 oder <0.5 → deutet auf Foundry-Refresh/W/H-Change/Texture-Reload hin
    if (!isFinite(implied) || implied > 2.0 || implied < 0.5) {
      recomputeBaseScale(token);
    }
  }

  // Overlay anlegen/ausrichten
  if (!token._gbOverlay) {
    const overlay = new PIXI.Container();
    overlay.name = "gb-overlay";
    token.addChild(overlay);
    token._gbOverlay = overlay;
  }
  token._gbOverlay.position.set(token.w / 2, token.h / 2);
  token._gbOverlay.rotation = token.mesh.rotation;
  // Overlay immer an Mesh-Skala koppeln
  token._gbOverlay.scale.copyFrom(token.mesh.scale);
}

// Setzt sichtbaren Faktor -> Mesh = base * faktor
function applyVisualScale(token, factor) {
  if (!token || token.destroyed) return;
  ensureBaseScale(token);

  token._gbVisualScale = factor;

  const base = token._gbBaseScale ?? { x: 1, y: 1 };
  token.mesh.scale.set(base.x * factor, base.y * factor);
  token._gbOverlay?.scale?.copyFrom(token.mesh.scale);
}

function cancelHoverTween(token) {
  const t = token?._gbHoverTween;
  if (!t) return;
  if (t.raf) cancelAnimationFrame(t.raf);
  token._gbHoverTween = null;
}

function getActualFactorFromMesh(token) {
  if (!token || token.destroyed) return 1.0;
  const s = token.mesh?.scale; const b = token._gbBaseScale;
  if (!s || !b) return getVisualFactor(token);
  const fx = s.x / b.x, fy = s.y / b.y;
  // Mittelwert, robust gegen Floating Errors
  const f = (fx + fy) / 2;
  return (isFinite(f) && f > 0.01 && f < 100) ? f : getVisualFactor(token);
}

function tweenFactor(token, targetFactor, ms = HOVER_MS) {
  cancelHoverTween(token);
  if (!token || token.destroyed) return;

  ensureBaseScale(token);

  const start = getActualFactorFromMesh(token); // <— wichtiger Wechsel
  const delta = targetFactor - start;
  if (Math.abs(delta) < 0.001) return;

  const state = { startTS: performance.now(), dur: ms, raf: null };
  token._gbHoverTween = state;

  const step = (now) => {
    if (!token || token.destroyed) return cancelHoverTween(token);
    const t = Math.min(1, (now - state.startTS) / state.dur);
    const eased = EASING(t);
    applyVisualScale(token, start + delta * eased);
    if (t < 1) state.raf = requestAnimationFrame(step);
    else {
      // Nachlauf: sicherstellen, dass Mesh exakt base*target ist
      applyVisualScale(token, targetFactor);
      cancelHoverTween(token);
    }
  };
  state.raf = requestAnimationFrame(step);
}

// --- Hooks -------------------------------------------------------------------
// Hover: nur lokalen Hover-Status setzen & auf Ziel tweenen
Hooks.on("hoverToken", (token, hovered) => {
  if (!token || token.destroyed) return;
  if (token._dragging) return; // beim Drag weiterhin nicht zoomen
  setLocalHover(token, hovered);
  tweenFactor(token, computeTargetFactor(token), HOVER_MS);
});

// Auswahl: ausgewählt → groß bleiben; abgewählt → auf Hover-oder-1 zurück
Hooks.on("controlToken", (token, controlled) => {
  if (!token || token.destroyed) return;
  cancelHoverTween(token);
  // Re-basisieren für den Fall, dass Foundry gerade refreshed hat
  recomputeBaseScale(token);
  tweenFactor(token, computeTargetFactor(token), HOVER_MS);
});

// Canvas-Ready: Status sauber herstellen (z. B. bei Mehrfachauswahl)
Hooks.on("canvasReady", () => {
  for (const t of canvas.tokens.placeables) {
    cancelHoverTween(t);
    // Basen kalibrieren
    recomputeBaseScale(t);
    // Standard: kein Hover, aber Selection könnte true sein
    if (t.controlled) setLocalHover(t, false);
    applyVisualScale(t, computeTargetFactor(t)); // kein Tween beim Laden nötig
  }
});

// Update: bei Bewegung/Größen-/Texturwechsel defensiv re-basisieren und auf Ziel setzen
Hooks.on("updateToken", (doc, changes) => {
  const t = canvas.tokens.get(doc.id);
  if (!t || t.destroyed) return;
  if (
    changes.x !== undefined || changes.y !== undefined ||
    changes.width !== undefined || changes.height !== undefined ||
    changes.texture !== undefined
  ) {
    cancelHoverTween(t);
    recomputeBaseScale(t);
    // WICHTIG: nicht hart auf 1.0 zurück, sondern auf Selection/Hover-Ziel!
    applyVisualScale(t, computeTargetFactor(t));
  }
});

// Refresh: wenn Foundry neu rendert, Basis neu bestimmen & Faktor beibehalten
Hooks.on("refreshToken", (token) => {
  if (!token || token.destroyed) return;
  recomputeBaseScale(token);
  // aktuellen Faktor aus der Realität lesen (falls nötig) und wieder anwenden
  const f = getActualFactorFromMesh(token);
  applyVisualScale(token, f);
});

// Neue Tokens: sofort Basis setzen
Hooks.on("createToken", (scene, data) => {
  const t = canvas.tokens.get(data._id || data.id);
  if (t && !t.destroyed) {
    recomputeBaseScale(t);
    applyVisualScale(t, 1.0);
  }
});

