/**
 * Gibt eine Farbe für den Tokenrahmen basierend auf Disposition und Typ zurück.
 * Spielercharaktere (PCs) erhalten immer #888888.
 * @param {Token} token
 * @returns {string} CSS-Farbwert
 */
export function getTintColor(token) {
  const actor = token.actor;

  if (actor?.type === "character" && actor.hasPlayerOwner) {
    return "#7F7F7F"; // Spielercharakter
  }

  switch (token.document.disposition) {
    case -1: return "#993333"; // Feindlich
    case 0:  return "#B7A789"; // Neutral
    case 1:  return "#5F7A8A"; // Freundlich
    case 2:  return "#6B5E7A"; // Geheim
    default: return "#555555"; // Fallback
  }
}

