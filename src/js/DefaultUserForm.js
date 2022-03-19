export class DefaultUserForm {
  #app = null;
  #states = {
    defaultUser: null
  };
  #elements = {
    form: document.getElementById("form-default-user"),
    removeButton: document.getElementById("remove-default-user-button")
  }

  constructor(app) {
    this.#app = app;
    this.#states = {
      defaultUser: AppState.attach("defaultUser")
    };

    this.#addHandlers();
  }

  #addHandlers() {
    this.#elements.form.onsubmit = (e) => {
      e.preventDefault();
      const elements = e.target.elements;
      const urlElement = elements["input-default-url"];
      const urlSpeakingElement = elements["input-default-url-speaking"];

      const url = urlElement.value.trim();
      const urlSpeaking = urlSpeakingElement.value.trim();

      if (url.length === 0 || urlSpeaking.length === 0) return;

      urlElement.value = "";
      urlSpeakingElement.value = "";

      this.#setDefaultUser({ url, urlSpeaking });
    }

    this.#elements.removeButton.onclick = this.#removeDefaultUser.bind(this);
  }

  // Tools
  #setDefaultUser(defaultUser) {
    this.#states.defaultUser.set(defaultUser);
  }

  #removeDefaultUser() {
    this.#states.defaultUser.set(null);
  }
}