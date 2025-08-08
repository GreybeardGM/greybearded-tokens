/**
 * Gibt eine Farbe für den Tokenrahmen basierend auf Disposition und Typ zurück.
 * Spielercharaktere (PCs) erhalten immer #888888.
 * @param {Token} token
 * @returns {string} CSS-Farbwert
 */
export function getTintColor(token) {
  const actor = token.actor;

  // Spielercharaktere erhalten immer diesen Grauton
  if (actor && actor.hasPlayerOwner) {
    return "#888888";
  }

  const disp = token.document.disposition;
  switch (disp) {
    case -1: return "#882211"; // hostile
    case 0:  return "#B79A75"; // neutral
    case 1:  return "#667788"; // friendly
    case 2:  return "#776688"; // secret
    default: return "#444444"; // fallback
  }
}
