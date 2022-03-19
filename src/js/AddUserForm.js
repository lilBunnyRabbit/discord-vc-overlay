export class AddUserForm {
  #app = null;
  #states = {
    users: null
  };
  #elements = {
    form: document.getElementById("form-add-user"),
  };

  constructor(app) {
    this.#app = app;
    this.#states = {
      users: AppState.attach("users")
    };

    this.#addHandlers();
  }

  #addHandlers() {
    this.#elements.form.onsubmit = (e) => {
      e.preventDefault();
      const elements = e.target.elements;
      const idElement = elements["input-user-id"];
      const urlElement = elements["input-user-url"];
      const urlSpeakingElement = elements["input-user-url-speaking"];

      const id = idElement.value.trim();
      const url = urlElement.value.trim();
      const urlSpeaking = urlSpeakingElement.value.trim();

      if (id.length === 0 || url.length === 0 || urlSpeaking.length === 0) return;

      idElement.value = "";
      urlElement.value = "";
      urlSpeakingElement.value = "";

      this.#addUser({ id, url, urlSpeaking });
    };
  }

  // Tools
  #addUser(user) {
    const users = this.#states.users.get();
    users.push(user);
    this.#states.users.set(users);
  }
}
