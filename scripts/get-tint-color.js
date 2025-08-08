/**
 * Gibt eine Farbe für den Tokenrahmen basierend auf Disposition und Typ zurück.
 * Spielercharaktere (PCs) erhalten immer #888888.
 * @param {Token} token
 * @returns {string} CSS-Farbwert
 */
export function getTintColor(token) {
  const disp = token.document.disposition;
  const actorType = token.actor?.type;

  const hasPlayerOwner = token.actor?.hasPlayerOwner;

  const colorFromSettings = (key, fallback) =>
    game.settings.get("greybearded-tokens", `color-${key}`) || fallback;

  // Spielercharakter?
  if (actorType === "character" && hasPlayerOwner) {
    return colorFromSettings("character", "#AAAAAA");
  }

  switch (disp) {
    case -1: return colorFromSettings("hostile", "#993333");
    case 0:  return colorFromSettings("neutral", "#B7A789");
    case 1:  return colorFromSettings("friendly", "#5F7A8A");
    case 2:  return colorFromSettings("secret", "#6B5E7A");
    default: return "#555555";
  }
}

