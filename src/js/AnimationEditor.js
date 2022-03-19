export class AnimationEditor {
  #app = null;
  #elements = {
    select: document.getElementById("animation-select"),
    editor: document.getElementById("animation-editor")
  }

  constructor(app) {
    this.#app = app;
  }
}

class Animation {
  #generate = null;
  constructor(generate) {

  }
}