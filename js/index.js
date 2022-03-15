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

  // Init
  async init() {
    this.#baseCss = await fetch("./css/overlay.css").then((res) => res.text());

    this.initStates();
    this.addHandlers();
    this.initElements();
    this.handleUsers();
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
      if (serverId.length === 0) {
        const server = this.#state.server.get();
        delete server.serverId;
        this.#state.server.set(server);
      } else {
        this.#state.server.update({ serverId });
      }
    };
    input.config.vcId.oninput = (e) => {
      let vcId = e.target.value.trim();
      if (vcId.length === 0) {
        const server = this.#state.server.get();
        delete server.vcId;
        this.#state.server.set(server);
      } else {
        this.#state.server.update({ vcId });
      }
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
    buttons.import.onchange = this.handleImport.bind(this);
    buttons.export.onclick = this.handleExport.bind(this);
  }

  initElements() {
    config.height.innerText = preview.offsetHeight;
    {
      const server = this.#state.server.get();
      this.handleServer(server);
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

    voiceStates.innerHTML = "";
    if (defaultUser) voiceStates.appendChild(createUser(defaultUser));
    users.forEach((user) => voiceStates.appendChild(createUser(user)));

    this.handleUpdateCss(defaultUser, users);
  }

  handleServer(server) {
    if (server.serverId && input.config.serverId.value !== server.serverId) {
      input.config.serverId.value = server.serverId;
    }

    if (server.vcId && input.config.vcId.value !== server.vcId) {
      input.config.vcId.value = server.vcId;
    }

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

    input.config.serverId.value = "";
    input.config.vcId.value = "";
  }

  async handleImport(e) {
    const input = e.target;
    if (!input || !input["files"] || input.files.length === 0) return;

    const readFile = async (file) => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = (event) => {
          try {
            resolve(JSON.parse(event.target.result));
          } catch (error) {
            reject(null);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });
    };

    const file = input.files[0];
    if (!file.name.endsWith(".dvco") && !file.name.endsWith(".dvog")) return;
    const content = await readFile(file).catch(() => null);
    if (!content) return;

    this.handleReset();

    // Support for older version
    if (file.name.endsWith(".dvco")) {
      const server = {};
      if (content.serverId) server.serverId = content.serverId;
      if (content.vcId) server.vcId = content.vcId;
      if (Object.keys(server).length > 0) this.#state.server.set(server);

      if (content.users) {
        this.#state.users.set(
          content.users.map((user) => ({
            id: user.id,
            url: user.url,
            urlSpeaking: user.url_speaking,
          }))
        );
      }
    } else if (file.name.endsWith(".dvog")) {
      if (content.defaultUser && Object.keys(content.defaultUser).length > 0) {
        this.#state.defaultUser.set(content.defaultUser);
      }

      if (content.users && content.users.length > 0) {
        this.#state.users.set(content.users);
      }

      if (content.server && Object.keys(content.server).length > 0) {
        this.#state.server.set(content.server);
      }
    }
  }

  handleExport() {
    const filename = `discord-vc-overlay-${new Date().toJSON().slice(0, 10)}.dvog`;
    const data = {};

    {
      const defaultUser = this.#state.defaultUser.get();
      if (defaultUser && Object.keys(defaultUser).length > 0) data.defaultUser = defaultUser;
  
      const users = this.#state.users.get();
      if (users && users.length > 0) data.users = users;
  
      const server = this.#state.server.get();
      if (server && Object.keys(server).length > 0) data.server = server;
    }

    const file = new Blob([JSON.stringify(data)], { type: "application/json" });

    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
      const a = document.createElement("a");
      const url = URL.createObjectURL(file);

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  // Misc
  generateCss(defaultUser, users) {
    if (!defaultUser && users) defaultUser = this.#state.defaultUser.get();
    if (!users) users = this.#state.users.get();

    let defaultCss = "";
    if (defaultUser && Object.keys(defaultUser).length > 0) {
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
