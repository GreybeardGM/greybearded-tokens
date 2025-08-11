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
  async function preloadFrameTextures() {
    const S = getGbFrameSettings();
    const paths = [S.path1, S.secondEnabled ? S.path2 : null].filter(Boolean);
    if (PIXI.Assets?.load) {
      await Promise.all(paths.map(p => PIXI.Assets.load(p)));
    } else {
      // Fallback: einmal anstoßen
      paths.forEach(p => PIXI.Texture.from(p));
    }
  }
  
  function nextTick(fn) {
    // sicherstellen, dass alles gezeichnet ist (Bars etc.)
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }
  
  Hooks.on("canvasReady", async () => {
    await preloadFrameTextures();
    nextTick(() => {
      for (const t of canvas.tokens.placeables) applyFrameToToken(t);
    });
  });
  
  Hooks.on("drawToken", (token) => {
    // beim erstmaligen Zeichnen minimal verzögert anwenden
    nextTick(() => applyFrameToToken(token));
  });
  
  // Optional, aber sehr selten: wenn sich User-Farben ändern (PlayerColor-Mode)
  Hooks.on("updateUser", (user, change) => {
    if (!("color" in (change ?? {}))) return;
    for (const t of canvas.tokens.placeables) applyFrameToToken(t);
  });
});
