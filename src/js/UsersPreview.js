import { HTML } from "../../lib/htmlBuilder.js";

export class UsersPreview {
  #app = null;
  #states = {
    users: null,
    defaultUser: null,
  };
  #elements = {
    voiceStates: document.getElementById("voice-states"),
  };

  constructor(app) {
    this.#app = app;
    this.#states = {
      users: AppState.attach("users").addListener((users) => {
        this.#updatePreview(this.#states.defaultUser.get(), users);
      }),
      defaultUser: AppState.attach("defaultUser").addListener((defaultUser) => {
        this.#updatePreview(defaultUser, this.#states.users.get());
      }),
    };

    this.#updatePreview(this.#states.defaultUser.get(), this.#states.users.get());
  }

  #updatePreview(defaultUser, users) {
    const preview = this.#elements.voiceStates;
    preview.innerHTML = "";
    if (defaultUser) preview.appendChild(this.#createUserPreview(defaultUser));
    users.forEach((user) => preview.appendChild(this.#createUserPreview(user)));
  }

  #createUserPreview(user) {
    const avatar = HTML("img", {
      className: "avatar",
      attributes: {
        "data-reactid": user.id || "default",
      },
      title: user.id || "default",
      onclick: () => user.id && this.#app.copyToClipboard(`<@${user.id}>`),
    });

    const animation = () => {
      setTimeout(() => {
        if (!avatar.classList.contains("speaking")) {
          avatar.classList.add("speaking");
        }

        setTimeout(() => {
          if (avatar.classList.contains("speaking")) {
            avatar.classList.remove("speaking");
          }
          animation();
        }, Math.floor(Math.random() * 3000) + 500);
      }, Math.floor(Math.random() * 5000) + 1500);
    };

    animation();
    return HTML("li", {
      className: "voice-state",
      attributes: {
        "data-reactid": user.id || "default",
      },
      onmouseenter: () => !avatar.classList.contains("speaking") && avatar.classList.add("speaking"),
      onmouseleave: () => avatar.classList.contains("speaking") && avatar.classList.remove("speaking"),
      children: [avatar],
    });
  }
}
