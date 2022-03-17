import { HTML } from "./htmlBuilder.js";
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
const userEditor = document.getElementById("user-editor");
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

      this.setDefaultUser({ url, urlSpeaking });
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

      this.addUser({
        id: userId,
        url: userUrl,
        urlSpeaking: userUrlSpeaking,
      });
    };

    input.config.serverId.oninput = (e) => this.setServerId(e.target.value.trim());
    input.config.vcId.oninput = (e) => this.setVcId(e.target.value.trim());

    config.url.onclick = this.selectText.bind(this);
    config.height.onclick = this.selectText.bind(this);
    config.customCss.onclick = this.selectText.bind(this);

    buttons.removeDefaultUser.onclick = () => this.removeDefaultUser();
    buttons.reset.onclick = this.handleReset.bind(this);
    buttons.import.onchange = this.handleImport.bind(this);
    buttons.export.onclick = this.handleExport.bind(this);
  }

  initElements() {
    config.height.innerText = preview.offsetHeight;
    this.handleServer(this.#state.server.get());
  }

  // Handlers
  handleUsers(defaultUser, users) {
    if (!defaultUser) defaultUser = this.#state.defaultUser.get();
    if (!users) users = this.#state.users.get();

    users = this.sortUsers(users);

    this.updateEditor(defaultUser, users);
    this.updatePreview(defaultUser, users);

    this.updateCss(defaultUser, users);
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

  // Tools
  setDefaultUser({ url, urlSpeaking }) {
    this.#state.defaultUser.set({ url, urlSpeaking });
  }

  removeDefaultUser() {
    if (this.#state.defaultUser.get()) {
      this.#state.defaultUser.set(null);
    }
  }

  updateDefaultUser(data) {
    this.#state.defaultUser.update(data);
  }

  addUser({ id, url, urlSpeaking }) {
    const users = this.#state.users.get();
    users.push({
      id,
      url,
      urlSpeaking,
      date: new Date().toUTCString(),
    });

    this.#state.users.set(users);
  }

  removeUser(userId) {
    const users = this.#state.users.get().filter(({ id }) => id !== userId);
    this.#state.users.set(users);
  }

  updateUser(userId, data) {
    let newUsers = this.#state.users.get();
    newUsers = newUsers.map((user) => {
      if (user.id !== userId) return user;
      return {
        ...user,
        ...data,
      };
    });

    this.#state.users.set(newUsers);
  }

  sortUsers(users) {
    return users.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      } else if (a.date) {
        return -1;
      } else if (b.date) {
        return 1;
      }

      return a.id.localeCompare(b.id);
    });
  }

  setServerId(serverId) {
    if (serverId.length === 0) {
      const server = this.#state.server.get();
      delete server.serverId;
      this.#state.server.set(server);
    } else {
      this.#state.server.update({ serverId });
    }
  }

  setVcId(vcId) {
    if (vcId.length === 0) {
      const server = this.#state.server.get();
      delete server.vcId;
      this.#state.server.set(server);
    } else {
      this.#state.server.update({ vcId });
    }
  }

  updateEditor(defaultUser, users) {
    const createUser = (user) => {
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
                  if (user.id) {
                    this.removeUser(user.id);
                  } else {
                    this.removeDefaultUser();
                  }
                },
              }),
            ],
          }),
        ],
      });

      form.onsubmit = (e) => {
        e.preventDefault();
        const userUrlElement = e.target.elements[0];
        const userUrlSpeakingElement = e.target.elements[1];

        const userUrl = userUrlElement.value.trim();
        const userUrlSpeaking = userUrlSpeakingElement.value.trim();

        const userData = {};

        if (userUrl.length > 0) {
          userUrlElement.value = "";
          userData.url = userUrl;
        }

        if (userUrlSpeaking.length > 0) {
          userUrlSpeakingElement.value = "";
          userData.urlSpeaking = userUrlSpeaking;
        }

        if (Object.keys(userData).length === 0) return;

        if (user.id) {
          this.updateUser(userId, userData);
        } else {
          this.updateDefaultUser(userData);
        }
      };

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
                onclick: () => user.id && this.copyToClipboard(`<@${user.id}>`),
                title: user.id ? `Copy "<@${user.id}>"` : "Default user",
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
    };

    userEditor.innerHTML = "";
    if (defaultUser) userEditor.appendChild(createUser(defaultUser));
    users.forEach((user) => userEditor.appendChild(createUser(user)));
  }

  updatePreview(defaultUser, users) {
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
        avatar.addEventListener("click", () => this.copyToClipboard(`<@${user.id}>`));
      }

      return element;
    };

    voiceStates.innerHTML = "";
    if (defaultUser) voiceStates.appendChild(createUser(defaultUser));
    users.forEach((user) => voiceStates.appendChild(createUser(user)));
  }

  updateCss(defaultUser, users) {
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

    const customCss = (
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
        .join(" ")
    )
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/\s{2,}/g, " ");
    style.innerHTML = customCss;
    config.customCss.innerText = customCss;
  }

  // Misc
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

  async copyToClipboard(text) {
    try {
      return navigator.clipboard.writeText(text);
    } catch (error) {
      console.error(error);
    }
  }
}

new App();
