import { applyFrameToToken } from "./apply-frame.js";

Hooks.once("init", () => {
  function requestReload() {
    // entweder nur Hinweis …
    ui.notifications?.info("Greybearded Tokens: Bitte Oberfläche neu laden (F5), um Änderungen zu übernehmen.");
    // … oder: sofort neu laden
    // window.location.reload();
  }

  game.settings.register("greybearded-tokens", "defaultFrameColor", {
    name: "Standardfarbe für Rahmen",
    hint: "Wird genutzt, wenn keine andere Farbe aus Disposition, Spielerfarbe oder Tint-Mode verfügbar ist.",
    scope: "world",
    config: true,
    type: String,
    default: "#888888"
  });
  
  // ──────────────────────────────────────────────────────────────────────────────
  // Einfärbemethoden
  // ──────────────────────────────────────────────────────────────────────────────
  const TINT_CHOICES = {
    Disposition: "Disposition",
    PlayerColor: "PlayerColor",
    Unicolor: "Unicolor",
    Advanced: "Advanced",
    NoTint: "NoTint"
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // Erster Rahmen: Settings
  // ──────────────────────────────────────────────────────────────────────────────
  game.settings.register("greybearded-tokens", "frameImagePath", {
    name: "Standardbild für Tokenrahmen",
    hint: "Pfad zum PNG/SVG-Bild, das als Tokenrahmen verwendet wird.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-default.png",
    filePicker: "image",
    onChange: requestReload
  });

  game.settings.register("greybearded-tokens", "frameScale", {
    name: "Token Frame Scale",
    hint: "Verändert die Größe des Tokenrahmens relativ zum Token selbst. 1 = exakt gleich groß, 1.05 = leicht größer, 0.95 = leicht kleiner.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    onChange: requestReload
  });
  
  game.settings.register("greybearded-tokens", "frameTintMode", {
    name: "Einfärbemethode (Rahmen 1)",
    hint: "Bestimmt, wie der erste Rahmen eingefärbt wird.",
    scope: "world",
    config: true,
    type: String,
    choices: TINT_CHOICES,
    default: "Disposition",
    onChange: requestReload
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Zweiter Rahmen: Settings
  // ──────────────────────────────────────────────────────────────────────────────
  game.settings.register("greybearded-tokens", "secondaryFrameEnabled", {
    name: "Zweiten Rahmen aktivieren",
    hint: "Wenn aktiviert, wird zusätzlich zum Standardrahmen ein zweiter Rahmen überlagert.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: requestReload
  });
  
  game.settings.register("greybearded-tokens", "secondaryFrameImagePath", {
    name: "Bildpfad für zweiten Rahmen",
    hint: "Pfad zum PNG/SVG, das als zweiter Tokenrahmen verwendet wird.",
    scope: "world",
    config: true,
    type: String,
    default: "modules/greybearded-tokens/assets/frame-secondary.png",
    filePicker: "image",
    onChange: requestReload
  });
  
  game.settings.register("greybearded-tokens", "secondaryFrameTintMode", {
    name: "Einfärbemethode (Rahmen 2)",
    hint: "Bestimmt, wie der zweite Rahmen eingefärbt wird.",
    scope: "world",
    config: true,
    type: String,
    choices: TINT_CHOICES,
    default: "PlayerColor",
    onChange: requestReload
  });
  
  game.settings.register("greybearded-tokens", "secondaryFrameScale", {
    name: "Skalierung des zweiten Rahmens",
    hint: "Größe relativ zum Token. 1 = exakt Token-Größe; 1.05 = etwas größer; 0.95 = etwas kleiner.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    onChange: requestReload
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Farben
  // ──────────────────────────────────────────────────────────────────────────────
  const defaultColors = {
    hostile: "#993333",
    neutral: "#B7A789",
    friendly: "#5F7A8A",
    secret: "#6B5E7A",
    character: "#7F7F7F"
  };

  for (const [key, defaultValue] of Object.entries(defaultColors)) {
    game.settings.register("greybearded-tokens", `color-${key}`, {
      name: `Farbe für ${key}`,
      hint: `Rahmenfarbe für ${key === "character" ? "Spielercharaktere" : `Disposition: ${key}`}`,
      scope: "world",
      config: true,
      type: String,
      default: defaultValue
    });
  }

  console.log("✅⭕ Greybearded Token Frames initialized.");
});

Hooks.once("ready", () => {
  // 1) bei neu gezeichneten Tokens
  Hooks.on("drawToken", token => applyFrameToToken(token));

  // 2) bei Token-Änderungen: nur bei relevanten Keys
  Hooks.on("updateToken", (doc, change) => {
    if (!doc?.object) return;
    if (shouldRefreshOnTokenChange(change)) {
      applyFrameToToken(doc.object);
    }
  });

  // 3a) optional – Actor-Änderungen können Tint beeinflussen (PC/Owner etc.)
  Hooks.on("updateActor", (actor, change) => {
    for (const token of actor.getActiveTokens(true)) {
      // PC-Flag, Disposition via prototypeToken, etc.
      if (shouldRefreshOnActorChange(change)) applyFrameToToken(token);
    }
  });

  // 3b) optional – PlayerColor-Mode: User-Farbwechsel
  Hooks.on("updateUser", (user, change) => {
    if (!("color" in (change ?? {}))) return;
    // only re-tint tokens owned by this user (cheap enough; kommt selten vor)
    canvas.tokens.placeables
      .filter(t => isOwnedByUser(t, user))
      .forEach(t => applyFrameToToken(t));
  });
});

function shouldRefreshOnTokenChange(change = {}) {
  // Größen-/Darstellungsrelevant
  if ("width" in change || "height" in change) return true;
  if ("scale" in change) return true; // (falls genutzt)
  if ("disposition" in change) return true; // Tint
  if ("hidden" in change) return true; // Z-Order/Visibility (optional)
  // Textur-Scale unter v12:
  if (change.texture && ("scaleX" in change.texture || "scaleY" in change.texture)) return true;
  return false;
}

function shouldRefreshOnActorChange(change = {}) {
  // z.B. Typwechsel, Ownership via prototypeToken, etc.
  if ("type" in change) return true;
  // wenn du Ownership am Actor auswertest, könnte auch ownership/folder/permission relevant sein
  if ("ownership" in change) return true;
  return false;
}

function isOwnedByUser(token, user) {
  try {
    const lvl = (globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER)
             ?? (globalThis.CONST?.DOCUMENT_PERMISSION_LEVELS?.OWNER) ?? 3;
    return token.document.testUserPermission(user, lvl) || token.actor?.testUserPermission(user, lvl);
  } catch { return false; }
}

