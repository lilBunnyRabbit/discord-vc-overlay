import { States } from "../index.js";
import { StateComponent } from "../../lib/state.js";

export class DefaultUserForm extends StateComponent {
  #elements = {
    form: document.getElementById("form-default-user"),
    removeButton: document.getElementById("remove-default-user-button"),
  };

  constructor() {
    super(AppState, [States.DEFAULT_USER]);

    this.#addHandlers();
  }

  // Handlers
  #addHandlers() {
    const { form, removeButton } = this.#elements;
    form.onsubmit = this.#handleFormSubmit.bind(this);
    removeButton.onclick = this.#removeDefaultUser.bind(this);
  }

  #handleFormSubmit(e) {
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

  // Utils
  #setDefaultUser(defaultUser) {
    this.states.defaultUser.set(defaultUser);
  }

  #removeDefaultUser() {
    this.states.defaultUser.reset();
  }
}
