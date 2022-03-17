export function HTML(type, { children, style, ...props } = {}) {
  const element = document.createElement(type);

  if (props) {
    Object.assign(element, props);
  }

  if (style) {
    const styleString = Object.keys(style)
      .map((key) => {
        const value = style[key];
        let match = null;
        while ((match = key.match(/[A-Z]/)) !== null) {
          key = `${key.substring(0, match.index)}-${match[0].toLowerCase()}${key.substring(
            match.index + 1,
            key.length
          )}`;
        }
        return `${key}: ${value};`;
      })
      .join("");
    element.style = styleString;
  }

  if (children && Array.isArray(children)) {
    children.forEach((child) => element.appendChild(child));
  }

  return element;
}

export function HTMLAttach(element, children) {
  if (!children) return;
  if (Array.isArray(children)) {
    children.forEach((child) => element.appendChild(child));
  } else {
    element.appendChild(children);
  }
}
