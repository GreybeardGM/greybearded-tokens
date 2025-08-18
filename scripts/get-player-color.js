// get-player-cam.js (ESM)
// Snapshot: Map<actorId, color>
let _playerColorSnapshot = null;

/**
 * Baue den Snapshot neu auf:
 *  - iteriert über alle Users
 *  - nimmt deren Spielerfarbe (user.color)
 *  - und die ActorID des zugewiesenen Spielercharakters (user.character?.id)
 * Resultat: Map<actorId, color>
 */
function _rebuildPlayerColorSnapshot() {
  const map = new Map();
  // v12: game.users.contents liefert ein Array von Usern
  const users = game.users?.contents ?? [];
  for (const user of users) {
    const actorId = user.character?.id ?? null;
    const color = user.color ?? null;
    if (!actorId || !color) continue;
    // Falls mehrere User denselben Actor zugewiesen hätten, gewinnt der erste – ist i.d.R. egal.
    if (!map.has(actorId)) map.set(actorId, color);
  }
  _playerColorSnapshot = map;
  return _playerColorSnapshot;
}

/**
 * Gib die Spielerfarbe für eine ActorID zurück.
 * @param {string} actorId - ID des Actors (Spielercharakter)
 * @param {boolean} [rebuildSnapshot=false] - wenn true, Snapshot vorher neu bauen
 * @returns {string|null} Hex-Farbwert wie "#RRGGBB" oder null, wenn nicht gefunden
 */
export function getPlayerColor(actorId, rebuildSnapshot = false) {
  if (!actorId) return null;

  if (rebuildSnapshot || !_playerColorSnapshot) {
    _rebuildPlayerColorSnapshot();
  }
  return _playerColorSnapshot.get(actorId) ?? null;
}

/**
 * Optional: öffentliches Rebuild, falls du es manuell anstoßen willst.
 */
export function rebuildPlayerColorSnapshot() {
  return _rebuildPlayerColorSnapshot();
}
