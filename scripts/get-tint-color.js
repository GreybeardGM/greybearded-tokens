// get-tint-color.js
import { getPlayerColor } from "./get-player-color.js";
import { dbg } from "./debug.js";

export function getTintColor(token, tintMode = "Disposition") {
  const colorFromSettings = (key, fallback) =>
    game.settings.get("greybearded-tokens", `color-${key}`) || fallback;

  const defaultColor =
    game.settings.get("greybearded-tokens", "defaultFrameColor") || "#888888";

  const tokenInfo = () => ({
    tokenId: token?.id,
    name: token?.name,
    actorId: token?.actor?.id,
    actorType: token?.actor?.type,
    disp: token?.document?.disposition
  });

  switch (tintMode) {
    case "NoTint":
      dbg("getTintColor NoTint", tokenInfo());
      return null;

    case "Unicolor":
      dbg("getTintColor Unicolor", tokenInfo(), { color: defaultColor });
      return defaultColor;

    case "Advanced":
      dbg("getTintColor Advanced (placeholder)", tokenInfo(), { color: defaultColor });
      return defaultColor;

    case "PlayerColor": {
      const actorId = token?.actor?.id ?? null;
      const snapColor = actorId ? getPlayerColor(actorId) : null;
      dbg("getTintColor PlayerColor", tokenInfo(), { snapHit: !!snapColor, snapColor });
      return snapColor ?? defaultColor;
    }

    case "Disposition":
    default: {
      const disp = token.document?.disposition;
      const actorType = token.actor?.type;
      const hasPlayerOwner = token.actor?.hasPlayerOwner;

      let color;
      if (actorType === "character" && hasPlayerOwner) {
        color = colorFromSettings("character", defaultColor);
      } else {
        switch (disp) {
          case -2: color = colorFromSettings("secret",   defaultColor); break;
          case -1: color = colorFromSettings("hostile",  defaultColor); break;
          case  0: color = colorFromSettings("neutral",  defaultColor); break;
          case  1: color = colorFromSettings("friendly", defaultColor); break;
          default: color = defaultColor;
        }
      }
      dbg("getTintColor Disposition", tokenInfo(), { color });
      return color;
    }
  }
}
