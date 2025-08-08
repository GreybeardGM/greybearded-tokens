export function getTintColor(token) {
  const disp = token.document.disposition;
  switch (disp) {
    case -1: return "#882211"; // hostile
    case 0:  return "#B79A75"; // neutral
    case 1:  return "#667788"; // friendly
    default: return "#778866"; // fallback
  }
}
