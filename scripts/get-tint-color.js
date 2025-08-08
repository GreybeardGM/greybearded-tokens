export function getTintColor(token) {
  const disp = token.document.disposition;
  switch (disp) {
    case -1: return "#ff4444"; // hostile
    case 0:  return "#ffff00"; // neutral
    case 1:  return "#44ff44"; // friendly
    default: return "#888888"; // fallback
  }
}
