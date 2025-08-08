import { getTintColor } from "./get-tint-color.js";

Hooks.on("renderToken", (token, html) => {
  const framePath = "modules/greybearded-tokens/assets/frame-default.png";
  const tint = getTintColor(token);

  const img = document.createElement("img");
  img.src = framePath;
  img.classList.add("token-frame-overlay");

  // Mitskalierend positionieren
  Object.assign(img.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none",
    zIndex: "20",

    // Tint mit Maskierung
    backgroundColor: tint,
    maskImage: `url(${framePath})`,
    webkitMaskImage: `url(${framePath})`,
    maskSize: "100% 100%",
    webkitMaskSize: "100% 100%",
    mixBlendMode: "multiply",
    opacity: "0.9",
  });

  html.append(img);
});
