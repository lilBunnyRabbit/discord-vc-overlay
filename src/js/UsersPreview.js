import { States } from "../index.js";
import { StateComponent } from "../../lib/state.js";
import { HTML } from "../../lib/htmlBuilder.js";
import { copyToClipboard } from "./utils.js";

export class UsersPreview extends StateComponent {
  #elements = {
    voiceStates: document.getElementById("voice-states"),
  };

  constructor() {
    super(AppState, [States.DEFAULT_USER, States.USERS]);

    this.#updatePreview(this.states.defaultUser.get(), this.states.users.get());
  }

  $onStateChange(key, value) {
    switch (key) {
      case States.DEFAULT_USER:
        return this.#updatePreview(value, this.states.users.get());
      case States.USERS:
        return this.#updatePreview(this.states.defaultUser.get(), value);
      default:
        return;
    }
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
      onclick: () => user.id && copyToClipboard(`<@${user.id}>`),
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
