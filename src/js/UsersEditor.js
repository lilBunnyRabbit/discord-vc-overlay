import { States } from "../index.js";
import { StateComponent } from "../../lib/state.js";
import { HTML } from "../../lib/htmlBuilder.js";
import { copyToClipboard } from "./utils.js";

export class UsersEditor extends StateComponent {
  #elements = {
    editor: document.getElementById("user-editor"),
  };

  constructor() {
    super(AppState, [States.DEFAULT_USER, States.USERS]);

    this.#updateEditor(this.states.defaultUser.get(), this.states.users.get());
  }

  $onStateChange(key, value) {
    switch (key) {
      case States.DEFAULT_USER:
        return this.#updateEditor(value, this.states.users.get());
      case States.USERS:
        return this.#updateEditor(this.states.defaultUser.get(), value);
      default:
        return;
    }
  }

  #updateEditor(defaultUser, users) {
    const editor = this.#elements.editor;
    editor.innerHTML = "";
    if (defaultUser) editor.appendChild(this.#createUserEditor(defaultUser));
    users.forEach((user) => editor.appendChild(this.#createUserEditor(user)));
  }

  #createUserEditor(user) {
    const isDefaultUser = !!user.id;
    const form = this.#createUserEditorForm(user);

    const normalDimensions = HTML("div", { innerText: "" });
    const speakingDimensions = HTML("div", { innerText: "" });

    const dimensions = {};

    const checkDimensions = () => {
      if (!dimensions.normal || !dimensions.speaking) return;
      if (
        dimensions.normal.width / dimensions.speaking.width ===
        dimensions.normal.height / dimensions.speaking.height
      ) {
        speakingDimensions.innerText += " ✔️";
      } else {
        speakingDimensions.innerText += " ❌";
        speakingDimensions.title = "Different ratios!";
      }
    };

    return HTML("div", {
      className: "user-editor-box",
      children: [
        HTML("div", {
          className: "user-editor-avatars",
          children: [
            HTML("img", {
              className: "user-editor-avatar",
              src: user.url,
              onload: (e) => {
                const dimensionsText = `${e.target.naturalWidth} x ${e.target.naturalHeight}`;
                e.target.title = dimensionsText;
                normalDimensions.innerText = `Normal: ${dimensionsText}`;
                dimensions.normal = { width: e.target.naturalWidth, height: e.target.naturalHeight };
                checkDimensions();
              },
            }),
            HTML("img", {
              className: "user-editor-avatar",
              src: user.urlSpeaking,
              onload: (e) => {
                const dimensionsText = `${e.target.naturalWidth} x ${e.target.naturalHeight}`;
                e.target.title = dimensionsText;
                speakingDimensions.innerText = `Speaking: ${dimensionsText}`;
                dimensions.speaking = { width: e.target.naturalWidth, height: e.target.naturalHeight };
                checkDimensions();
              },
            }),
          ],
        }),
        HTML("div", {
          className: "user-editor-info",
          children: [
            HTML("div", {
              className: "user-editor-info-title",
              innerText: user.id || "Default user",
              onclick: () => !isDefaultUser && copyToClipboard(`<@${user.id}>`),
              title: isDefaultUser ? "Default user" : `Copy "<@${user.id}>"`,
            }),
            HTML("div", {
              className: "user-editor-info-dimensions",
              children: [normalDimensions, speakingDimensions],
            }),
            form,
          ],
        }),
      ],
    });
  }

  #createUserEditorForm(user) {
    const isDefaultUser = !user.id;

    const form = HTML("form", {
      className: "form",
      children: [
        HTML("div", {
          className: "form-input",
          children: [HTML("div", { innerText: "URL" }), HTML("input", { type: "text" })],
        }),
        HTML("div", {
          className: "form-input",
          children: [HTML("div", { innerText: "URL Speaking" }), HTML("input", { type: "text" })],
        }),
        HTML("div", {
          className: "button-row",
          children: [
            HTML("button", {
              type: "submit",
              innerText: "Update user",
            }),
            HTML("button", {
              className: "error",
              type: "button",
              innerText: "Remove user",
              onclick: () => {
                if (isDefaultUser) {
                  this.#removeDefaultUser();
                } else {
                  this.#removeUser(user.id);
                }
              },
            }),
          ],
        }),
      ],
    });

    form.onsubmit = (e) => {
      e.preventDefault();
      const elements = e.target.elements;
      const urlElement = elements[0];
      const urlSpeakingElement = elements[1];

      const url = urlElement.value.trim();
      const urlSpeaking = urlSpeakingElement.value.trim();

      const userData = {};

      if (url.length > 0) {
        urlElement.value = "";
        userData.url = url;
      }

      if (urlSpeaking.length > 0) {
        urlSpeakingElement.value = "";
        userData.urlSpeaking = urlSpeaking;
      }

      if (Object.keys(userData).length === 0) return;

      if (isDefaultUser) {
        this.#updateDefaultUser(userData);
      } else {
        this.#updateUser(user.id, userData);
      }
    };

    return form;
  }

  // Utils
  #updateDefaultUser(data) {
    const defaultUser = this.states.defaultUser.get();
    this.states.defaultUser.set({ ...defaultUser, data });
  }

  #removeDefaultUser() {
    this.states.defaultUser.reset();
  }

  #updateUser(userId, data) {
    const users = this.states.users.get().map((user) => {
      if (user.id !== userId) return user;
      return {
        ...user,
        ...data,
      };
    });
    this.states.users.set(users);
  }

  #removeUser(userId) {
    const users = this.states.users.get().filter(({ id }) => id !== userId);
    this.states.users.set(users);
  }
}
