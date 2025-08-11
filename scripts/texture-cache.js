// texture-cache.js
const _cache = new Map();

export function getCachedTexture(path) {
  if (!path) return null;
  if (_cache.has(path)) return _cache.get(path);

  const tex = PIXI.Texture.from(path);
  _cache.set(path, tex);
  return tex;
}

export function invalidateTexture(path) {
  _cache.delete(path);
}
