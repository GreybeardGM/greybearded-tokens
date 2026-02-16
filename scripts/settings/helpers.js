// modules/greybearded-tokens/scripts/utils/helpers.js

/** Strikte HEX-Validierung (#RRGGBB oder #RRGGBBAA) */
export const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
export const isHex  = (v) => (typeof v === "string") && HEX_RE.test(v);

export function str(v, fb = "") {
  return (typeof v === "string" && v.length) ? v : fb;
}

/** Validiert String gegen Choice-Map (z. B. TINT_CHOICES, FONT_CHOICES). */
export function oneOf(v, choices, fb) {
  return (typeof v === "string" && v in choices) ? v : fb;
}

/** Flaches Objekt mit Defaults auffüllen (shallow). */
export function withDefaults(obj, defaults) {
  return Object.assign({}, defaults, (obj && typeof obj === "object") ? obj : {});
}

/** Setting als Objekt lesen, mit Defaults vereinigen. */
export function readObjectSetting(modId, key, defaults) {
  try {
    const v = game.settings.get(modId, key);
    return withDefaults(v, defaults);
  } catch {
    return structuredClone(defaults);
  }
}

/** Text- und Color-Input synchronisieren (HEX gewinnt). */
export function bindHexSync(textEl, colorEl) {
  if (!textEl || !colorEl) return;
  textEl.addEventListener("input", () => { if (isHex(textEl.value)) colorEl.value = textEl.value; });
  colorEl.addEventListener("input", () => { if (isHex(colorEl.value)) textEl.value = colorEl.value; });
}

/** Mehrere Paare nach Namenskonvention "<name>-text" / "<name>-color" binden. */
export function bindHexPairs(root, names) {
  for (const n of names) {
    const t = root.querySelector(`input[name="${n}-text"]`);
    const c = root.querySelector(`input[name="${n}-color"]`);
    bindHexSync(t, c);
  }
}

export function debugTokenToolsFlow(message, data) {
  if (data === undefined) {
    console.debug(`[greybearded-tokens] ${message}`);
    return;
  }

  console.debug(`[greybearded-tokens] ${message}`, data);
}

/** Scene Controls aktualisieren, ohne einen kompletten Seiten-Reload zu erzwingen. */
export async function refreshSceneControls() {
  if (!ui?.controls) {
    debugTokenToolsFlow("refreshSceneControls aborted: ui.controls missing");
    return;
  }

  if (!canvas?.ready) {
    debugTokenToolsFlow("refreshSceneControls aborted: canvas not ready", { canvasReady: canvas?.ready ?? false });
    return;
  }

  const controlsApp = ui.controls;
  const activeControlName = controlsApp.control?.name;
  const activeToolName = controlsApp.tool?.name;

  debugTokenToolsFlow("refreshSceneControls start", {
    activeControlName,
    activeToolName
  });

  await controlsApp.render({
    force: true,
    controls: activeControlName,
    tool: activeToolName
  });

  debugTokenToolsFlow("refreshSceneControls rendered", {
    activeControlNameAfterRender: controlsApp.control?.name,
    activeToolNameAfterRender: controlsApp.tool?.name
  });

  if (activeControlName && controlsApp.control?.name !== activeControlName) {
    debugTokenToolsFlow("refreshSceneControls reactivating previous control", {
      previousControl: activeControlName,
      previousTool: activeToolName
    });
    canvas?.[activeControlName]?.activate?.({ tool: activeToolName });
  }
}
