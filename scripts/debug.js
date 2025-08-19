// debug.js
export function regDebugSetting() {
  game.settings.register("greybearded-tokens", "debug", {
    name: "Debug Logging aktivieren",
    hint: "Schaltet ausführliche Konsolen-Logs ein.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
}

export function dbg(...args) {
  try {
    if (game.settings.get("greybearded-tokens", "debug")) {
      console.debug("🟣[GBT]", ...args);
    }
  } catch {
    // falls game.settings beim very-early-init noch nicht kochbar ist
  }
}

export function warn(...args) {
  console.warn("🟠[GBT]", ...args);
}

export function err(...args) {
  console.error("🔴[GBT]", ...args);
}
