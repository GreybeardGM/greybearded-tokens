function getTintColor(token) {
  switch (token.document.disposition) {
    case -1: return "#ff4444";
    case 0: return "#ffff00";
    case 1: return "#44ff44";
    default: return "#888888";
  }
}
