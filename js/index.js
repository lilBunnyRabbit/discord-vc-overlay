import { State } from "./state.js";

const style = document.getElementById("custom-css");

const form = {
  defaultUser: document.getElementById("form-default-user"),
  addUser: document.getElementById("form-add-user"),
};

const input = {
  config: {
    serverId: document.getElementById("input-config-server-id"),
    vcId: document.getElementById("input-config-vc-id"),
  },
};

const config = {
  url: document.getElementById("config-url"),
  height: document.getElementById("config-height"),
  customCss: document.getElementById("config-custom-css"),
};

const preview = document.getElementById("preview");
const voiceStates = document.getElementById("voice-states");

const buttons = {
  removeDefaultUser: document.getElementById("remove-default-user-button"),
  import: document.getElementById("import-button"),
  export: document.getElementById("export-button"),
  reset: document.getElementById("reset-button"),
};

window.state = new State();

class App {
  #state = {
    defaultUser: null,
    users: null,
    server: null,
  };

  #baseCss = "";

  constructor() {
    this.init();
  }

  // INIT
  async init() {
    this.#baseCss = await fetch("./css/overlay.css").then((res) => res.text());

    this.initStates();
    Object.keys(this.#state).forEach((key) => console.log({ [key]: this.#state[key].get() }));
    this.addHandlers();
    this.initElements();

    this.#state.defaultUser.set({
      url: "https://cdn.discordapp.com/attachments/424969467697823755/950531727628070982/lilbunnyrabbit_talking.png",
      urlSpeaking:
        "https://cdn.discordapp.com/attachments/424969467697823755/950531727628070982/lilbunnyrabbit_talking.png",
    });
    this.#state.users.set([
      {
        id: "134",
        url: "https://cdn.discordapp.com/attachments/424969467697823755/950185675196616794/potate_normal.png",
        urlSpeaking: "https://cdn.discordapp.com/attachments/424969467697823755/950185675683151872/potate_talking.png",
      },
      {
        id: "1345",
        url: "https://cdn.discordapp.com/attachments/424969467697823755/950531709567369276/lax_talking.png",
        urlSpeaking: "https://cdn.discordapp.com/attachments/424969467697823755/950531710423015465/lax_normal.png",
      },
    ]);
  }

  initStates() {
    this.#state = {
      defaultUser: window.state
        .attach("defaultUser", {
          useLocalStorage: true,
          useEvents: true,
        })
        .init({})
        .addEventListener((defaultUser) => this.handleUsers(defaultUser, null)),
      users: window.state
        .attach("users", {
          useLocalStorage: true,
          useEvents: true,
        })
        .init([])
        .addEventListener((users) => this.handleUsers(null, users)),
      server: window.state
        .attach("server", {
          useLocalStorage: true,
          useEvents: true,
        })
        .init({})
        .addEventListener(this.handleServer.bind(this)),
    };
  }

  addHandlers() {
    form.defaultUser.onsubmit = (e) => {
      e.preventDefault();
      const urlElement = e.target.elements["input-default-url"];
      const urlSpeakingElement = e.target.elements["input-default-url-speaking"];

      const url = urlElement.value.trim();
      const urlSpeaking = urlSpeakingElement.value.trim();

      if (url.length === 0 || urlSpeaking.length === 0) return;

      urlElement.value = "";
      urlSpeakingElement.value = "";

      this.#state.defaultUser.set({ url, urlSpeaking });
    };

    form.addUser.onsubmit = (e) => {
      e.preventDefault();
      const userIdElement = e.target.elements["input-user-id"];
      const userUrlElement = e.target.elements["input-user-url"];
      const userUrlSpeakingElement = e.target.elements["input-user-url-speaking"];

      const userId = userIdElement.value.trim();
      const userUrl = userUrlElement.value.trim();
      const userUrlSpeaking = userUrlSpeakingElement.value.trim();

      if (userId.length === 0 || userUrl.length === 0 || userUrlSpeaking.length === 0) return;

      userIdElement.value = "";
      userUrlElement.value = "";
      userUrlSpeakingElement.value = "";

      const users = this.#state.users.get();
      users.push({
        id: userId,
        url: userUrl,
        urlSpeaking: userUrlSpeaking,
      });

      this.#state.users.set(users);
    };

    input.config.serverId.oninput = (e) => {
      let serverId = e.target.value.trim();
      if (serverId.length === 0) serverId = "";
      this.#state.server.update({ serverId });
    };

    input.config.vcId.oninput = (e) => {
      let vcId = e.target.value.trim();
      if (vcId.length === 0) vcId = "";
      this.#state.server.update({ vcId });
    };

    config.url.onclick = this.selectText.bind(this);
    config.height.onclick = this.selectText.bind(this);
    config.customCss.onclick = this.selectText.bind(this);

    buttons.removeDefaultUser.onclick = () => {
      if (this.#state.defaultUser.get()) {
        this.#state.defaultUser.set(null);
      }
    };

    buttons.reset.onclick = this.handleReset.bind(this);
  }

  initElements() {
    config.height.innerText = preview.offsetHeight;
    {
      const server = this.#state.server.get();
      this.handleServer(server);
      if (server.serverId) input.config.serverId.value = server.serverId;
      if (server.vcId) input.config.vcId.value = server.vcId;
    }
  }

  // Handlers
  handleUsers(defaultUser, users) {
    if (!defaultUser) defaultUser = this.#state.defaultUser.get();
    if (!users) users = this.#state.users.get();

    const createUser = (user) => {
      const element = document.createElement("li");
      element.className = "voice-state";
      if (user.id) element.setAttribute("data-reactid", user.id);

      const avatar = document.createElement("img");
      avatar.className = "avatar";
      if (user.id) avatar.setAttribute("data-reactid", user.id);
      avatar.title = user.id || "default";

      avatar.onmouseenter = () => !avatar.classList.contains("speaking") && avatar.classList.add("speaking");
      avatar.onmouseleave = () => avatar.classList.contains("speaking") && avatar.classList.remove("speaking");
      element.appendChild(avatar);

      if (user.id) {
        const xButon = document.createElement("div");
        xButon.className = "remove-user-button";
        xButon.innerHTML = `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="feather feather-x"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        `;

        xButon.onclick = () => this.handleRemoveUser(user.id);
        xButon.title = `Remove user "${user.id}"`;
        element.appendChild(xButon);
      }

      return element;
    };

    console.log({ users });
    voiceStates.innerHTML = "";
    if (defaultUser) voiceStates.appendChild(createUser(defaultUser));
    users.forEach((user) => voiceStates.appendChild(createUser(user)));

    this.handleUpdateCss(null, users);
  }

  handleServer(server) {
    let serverId = server.serverId;
    if (!serverId || serverId.length === 0) serverId = "<SERVER ID>";
    let vcId = server.vcId;
    if (!vcId || vcId.length === 0) vcId = "<VOICE CHAT ID>";
    config.url.innerText = `https://streamkit.discord.com/overlay/voice/${serverId}/${vcId}`;
  }

  handleRemoveUser(userId) {
    const users = this.#state.users.get().filter(({ id }) => id !== userId);
    this.#state.users.set(users);
  }

  handleUpdateCss(defaultUser, users) {
    const customCss = this.generateCss(defaultUser, users);
    style.innerHTML = customCss;
    config.customCss.innerText = customCss;
  }

  handleReset() {
    this.#state.defaultUser.set(null);
    this.#state.server.set({});
    this.#state.users.set([]);
  }

  // Misc
  generateCss(defaultUser, users) {
    if (!defaultUser && users) defaultUser = this.#state.defaultUser.get();
    if (!users) users = this.#state.users.get();

    let defaultCss = "";
    if (defaultUser) {
      defaultCss = `
      .voice-state {
        display: flex !important;
        margin-right: 6px !important;
      }
      .avatar {
        content: url(${defaultUser.url});
      }
      .speaking {
        content: url(${defaultUser.urlSpeaking}) !important;
      }
      `;
    }

    return (
      this.#baseCss +
      defaultCss +
      users
        .map(
          (user) => `
        .voice-state[data-reactid*="${user.id}"] {
          display: flex !important;
          margin-right: 6px !important;
        }
        .avatar[data-reactid*="${user.id}"] {
          content: url(${user.url});
        }
        .speaking[data-reactid*="${user.id}"] {
          content: url(${user.urlSpeaking}) !important;
        }
        `
        )
        .join("")
    )
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/\s{2,}/g, " ");
  }

  selectText(e) {
    if (window.getSelection && document.createRange) {
      const selection = window.getSelection();
      if (selection.toString() == "") {
        window.setTimeout(() => {
          const range = document.createRange();
          range.selectNodeContents(e.target);
          selection.removeAllRanges();
          selection.addRange(range);
        }, 1);
      }
    }

    // IE
    else if (document.selection) {
      const selection = document.selection.createRange();
      if (selection.text == "") {
        const range = document.body.createTextRange();
        range.moveToElementText(e.target);
        range.select();
      }
    }
  }
}

new App();