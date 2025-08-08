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
    case -1: return colorFromSettings("hostile", "#882211");
    case 0:  return colorFromSettings("neutral", "#B79A75");
    case 1:  return colorFromSettings("friendly", "#667788");
    case 2:  return colorFromSettings("secret", "#888888");
    default: return "#776688";
  }
}

