Hooks.on("renderToken", (token, html) => {
  const framePath = "modules/greybearded-tokens/assets/frame-default.png";
  const tint = getTintColor(token);  // einfache Logik vorerst

  const img = document.createElement("img");
  img.src = framePath;
  img.classList.add("token-frame-overlay");
  img.style.position = "absolute";
  img.style.top = "0";
  img.style.left = "0";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.pointerEvents = "none";
  img.style.zIndex = "20";

  // Tint per Maske
  img.style.backgroundColor = tint;
  img.style.maskImage = `url(${framePath})`;
  img.style.webkitMaskImage = `url(${framePath})`;
  img.style.maskSize = "100% 100%";
  img.style.webkitMaskSize = "100% 100%`;

  html.append(img);
});
