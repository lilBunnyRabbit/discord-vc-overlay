const prefix = document.currentScript.getAttribute("prefix") || "";
const version = document.currentScript.getAttribute("version") || "";

let placement = (() => {
  const padding = "8px";
  switch (document.currentScript.getAttribute("placement")) {
    case "top-left": {
      return `
        top: ${padding};
        left: ${padding};
      `;
    }
    case "bottom-left": {
      return `
        bottom: ${padding};
        left: ${padding};
      `;
    }
    case "bottom-right": {
      return `
        bottom: ${padding};
        right: ${padding};
      `;
    }
    case "top-right":
    default: {
      return `
        top: ${padding};
        right: ${padding};
      `;
    }
  }
})();

const element = document.createElement("div");
element.innerText = prefix + version;
element.style = `
  position: absolute;
  ${placement}
  color: white;
  mix-blend-mode: difference;
  opacity: 0.25;
`;

window.addEventListener("load", () => document.body.prepend(element));

console.log(
  `%c${document.title}%c ${prefix + version}`,
  "font-weight: bold; font-size: 22px;",
  "font-weight: normal; font-size: 16px;"
);
