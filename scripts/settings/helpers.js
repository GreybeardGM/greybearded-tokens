import { isHex } from "../utils/normalisation.js";

// modules/greybearded-tokens/scripts/utils/helpers.js

export function str(v, fb = "") {
  return (typeof v === "string" && v.length) ? v : fb;
}

/** Validate a string against a choice map (for example, TINT_CHOICES). */
export function oneOf(v, choices, fb) {
  return (typeof v === "string" && v in choices) ? v : fb;
}

/** Fill a shallow object with defaults. */
export function withDefaults(obj, defaults) {
  return Object.assign({}, defaults, (obj && typeof obj === "object") ? obj : {});
}

/** Read a setting as an object and merge it with defaults. */
export function readObjectSetting(modId, key, defaults) {
  try {
    const v = game.settings.get(modId, key);
    return withDefaults(v, defaults);
  } catch {
    return structuredClone(defaults);
  }
}

/** Synchronize text and color inputs; valid HEX values win. */
export function bindHexSync(textEl, colorEl) {
  if (!textEl || !colorEl) return;

  const syncTextToColor = () => {
    if (isHex(textEl.value)) colorEl.value = textEl.value;
  };

  const syncColorToText = () => {
    if (isHex(colorEl.value)) textEl.value = colorEl.value;
  };

  textEl.addEventListener("input", syncTextToColor);
  textEl.addEventListener("change", syncTextToColor);
  colorEl.addEventListener("input", syncColorToText);
  colorEl.addEventListener("change", syncColorToText);
}

/** Bind multiple pairs that follow the "<name>-text" / "<name>-color" naming convention. */
export function bindHexPairs(root, names) {
  for (const n of names) {
    bindHexSync(
      root.querySelector(`input[name="${n}-text"]`),
      root.querySelector(`input[name="${n}-color"]`)
    );
  }
}

/** Re-render Scene Controls with reset=true so tool definitions are rebuilt cleanly. */
export async function refreshSceneControls() {
  if (!ui?.controls || !canvas?.ready) return;

  const prev = {
    control: ui.controls.control?.name,
    tool: ui.controls.tool?.name
  };

  await ui.controls.render({
    ...prev,
    reset: true,
    force: true
  });
}

/** Read font families only from Foundry config, alphabetically and deduplicated. */
export function getConfiguredFontFamilies() {
  const families = Object.keys(CONFIG?.fontDefinitions ?? {});
  return [...new Set(families)]
    .filter((family) => typeof family === "string" && family.trim().length)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
