import { HTML } from "../../lib/htmlBuilder.js";

export class UsersEditor {
  #app = null;
  #states = {
    users: null,
    defaultUser: null,
  };
  #elements = {
    editor: document.getElementById("user-editor"),
  };

  constructor(app) {
    this.#app = app;
    this.#states = {
      users: AppState.attach("users").addListener((users) => {
        this.#updateEditor(this.#states.defaultUser.get(), users);
      }),
      defaultUser: AppState.attach("defaultUser").addListener((defaultUser) => {
        this.#updateEditor(defaultUser, this.#states.users.get());
      }),
    };

    this.#updateEditor(this.#states.defaultUser.get(), this.#states.users.get());
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
              onclick: () => !isDefaultUser && this.#app.copyToClipboard(`<@${user.id}>`),
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

  // Tools
  #updateDefaultUser(data) {
    const defaultUser = this.#states.defaultUser.get();
    this.#states.defaultUser.set({ ...defaultUser, data });
  }

  #removeDefaultUser() {
    if (this.#states.defaultUser.get()) {
      this.#states.defaultUser.set(null);
    }
  }

  #updateUser(userId, data) {
    const users = this.#states.users.get().map((user) => {
      if (user.id !== userId) return user;
      return {
        ...user,
        ...data,
      };
    });
    this.#states.users.set(users);
  }

  #removeUser(userId) {
    const users = this.#states.users.get().filter(({ id }) => id !== userId);
    this.#states.users.set(users);
  }
}
