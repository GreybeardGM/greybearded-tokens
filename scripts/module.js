import { getTintColor } from "./get-tint-color.js";

Hooks.once("init", () => {
  console.log("✅⭕Greybearded Token Frames initialized.");
});

// ACHTUNG: renderToken-Hook muss *nach* canvas existieren!
Hooks.once("ready", () => {
  console.log("✅⭕Greybearded Token Frames ready.");

  Hooks.on("renderToken", (token, html) => {
    console.log("⭕renderToken hook fired for", token.name);

    const framePath = "https://assets.forge-vtt.com/6409126bc31700d40e3ac139/Dungeon%20World/Tokens/Frames/player.png";
    const tint = getTintColor(token);

    const img = document.createElement("img");
    img.src = framePath;
    img.classList.add("token-frame-overlay");

    Object.assign(img.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      objectFit: "contain",
      pointerEvents: "none",
      zIndex: "20",
      backgroundColor: tint,
      maskImage: `url(${framePath})`,
      webkitMaskImage: `url(${framePath})`,
      maskSize: "100% 100%",
      webkitMaskSize: "100% 100%",
      mixBlendMode: "multiply",
      opacity: "0.9"
    });

    html.append(img);
  });
});
