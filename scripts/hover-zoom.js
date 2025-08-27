// hover-zoom.js (lokal, leichtgewichtig)

// Konfig (ggf. später aus Settings-Snapshot holen)
const HOVER_SCALE = 1.06;      // 1.02–1.10 empfohlen
const HOVER_MS    = 150;       // 120–180 ms angenehm
const EASING      = t => 1 - Math.pow(1 - t, 3); // easeOutCubic

// Hilfsfunktionen: Lesen/Setzen der sichtbaren Skala (Artwork + Overlay)
function getVisualScale(token) {
  // Wir nehmen die Mesh-Skala als maßgeblich
  return token?.mesh?.scale?.x ?? 1.0;
}
function setVisualScale(token, s) {
  if (token?.mesh?.scale) token.mesh.scale.set(s, s);
  if (token?._gbOverlay?.scale) token._gbOverlay.scale.set(s, s);
}

// Tween-Controller am Token speichern, damit wir abbrechen können
function cancelHoverTween(token) {
  const t = token?._gbHoverTween;
  if (!t) return;
  if (t.raf) cancelAnimationFrame(t.raf);
  token._gbHoverTween = null;
}

// Startet einen einmaligen Tween von aktueller Skala → target
function tweenScale(token, target, ms = HOVER_MS) {
  cancelHoverTween(token);
  if (!token || token.destroyed) return;

  const startScale = getVisualScale(token);
  const delta = target - startScale;
  if (Math.abs(delta) < 0.001) return; // nichts zu tun

  const tState = {
    start: performance.now(),
    dur: ms,
    raf: null
  };
  token._gbHoverTween = tState;

  const step = (now) => {
    if (!token || token.destroyed) return cancelHoverTween(token);
    const elapsed = now - tState.start;
    const t = Math.min(1, elapsed / tState.dur);
    const eased = EASING(t);
    setVisualScale(token, startScale + delta * eased);

    if (t < 1) {
      tState.raf = requestAnimationFrame(step);
    } else {
      cancelHoverTween(token); // fertig
    }
  };

  tState.raf = requestAnimationFrame(step);
}

// Haupt-Hook: skaliert beim Hovern rein/raus
Hooks.on("hoverToken", (token, hovered) => {
  // Nur lokal, rein visuell
  if (!token || token.destroyed) return;

  // Optional: beim Drag kein Hover-Scale
  if (token._dragging) return;

  const target = hovered ? HOVER_SCALE : 1.0;
  tweenScale(token, target, HOVER_MS);
});

// Falls Token verschwindet / wechselt Zustand → zurücksetzen
Hooks.on("controlToken", (token, controlled) => {
  // Bei Control-Wechsel sicherheitshalber zurück auf 1
  cancelHoverTween(token);
  setVisualScale(token, 1.0);
});

Hooks.on("deleteToken", (scene, tokenData, options, userId) => {
  // defensive cleanup, falls nötig
  // (Bei echten Canvas-Objects kannst du optional in "destroyToken" zurücksetzen)
});

Hooks.on("canvasReady", () => {
  // Failsafe: Bei Neuladen alle sichtbaren Token normalisieren
  for (const t of canvas.tokens.placeables) {
    cancelHoverTween(t);
    setVisualScale(t, 1.0);
  }
});

// Optional: Beim Drag kein Hover-Zoom (sanft resetten)
Hooks.on("updateToken", (doc, changes) => {
  const t = canvas.tokens.get(doc.id);
  if (!t || t.destroyed) return;
  if (changes.x !== undefined || changes.y !== undefined) {
    // Wird typischerweise beim Drag getriggert → Skala neutral halten
    cancelHoverTween(t);
    setVisualScale(t, 1.0);
  }
});
