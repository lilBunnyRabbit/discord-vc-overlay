export class ConfigEditor {
  #app = null;
  #states = {
    users: null,
    defaultUser: null,
  };
  #elements = {
    serverId: document.getElementById("input-config-server-id"),
    vcId: document.getElementById("input-config-vc-id"),
    url: document.getElementById("config-url"),
    height: document.getElementById("config-height"),
    customCss: document.getElementById("config-custom-css"),
    preview: document.getElementById("preview"),
    style: document.getElementById("custom-css"),
  };
  #baseCss = "";

  constructor(app) {
    this.#app = app;
    this.#states = {
      users: AppState.attach("users").addListener((users) => {
        this.#updateCustomCss(this.#states.defaultUser.get(), users);
      }),
      defaultUser: AppState.attach("defaultUser").addListener((defaultUser) => {
        this.#updateCustomCss(defaultUser, this.#states.users.get());
      }),
      server: AppState.attach("server").addListener((server) => {
        this.#updateUrl(server);
      }),
    };

    this.#init();
  }

  async #init() {
    this.#baseCss = await fetch("/src/css/overlay.css").then((res) => res.text());

    const server = this.#states.server.get();

    this.#updateHeight();
    this.#updateUrl(server);
    this.#updateCustomCss(this.#states.defaultUser.get(), this.#states.users.get());

    if (server.serverId && server.serverId.length > 0) {
      this.#elements.serverId.value = server.serverId;
    }

    if (server.vcId && server.vcId.length > 0) {
      this.#elements.vcId.value = server.vcId;
    }

    this.#addHandlers();
  }

  #addHandlers() {
    this.#elements.serverId.oninput = (e) => this.#setServerId(e.target.value.trim());
    this.#elements.vcId.oninput = (e) => this.#setVcId(e.target.value.trim());

    this.#elements.url.onclick = this.#app.selectText.bind(this);
    this.#elements.height.onclick = this.#app.selectText.bind(this);
    this.#elements.customCss.onclick = this.#app.selectText.bind(this);
  }

  #updateUrl(server) {
    let serverId = server.serverId;
    if (!serverId || serverId.length === 0) serverId = "<SERVER ID>";
    let vcId = server.vcId;
    if (!vcId || vcId.length === 0) vcId = "<VOICE CHAT ID>";
    this.#elements.url.innerText = `https://streamkit.discord.com/overlay/voice/${serverId}/${vcId}`;
  }

  #updateHeight() {
    this.#elements.height.innerText = this.#elements.preview.offsetHeight;
  }

  #updateCustomCss(defaultUser, users) {
    let customCss =
      this.#baseCss +
      this.#generateAnimationCss() +
      this.#generateDefaultUserCss(defaultUser) +
      this.#generateUsersCss(users);
    customCss = customCss.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s{2,}/g, " ");

    this.#elements.style.innerHTML = customCss;
    this.#elements.customCss.innerText = customCss;
  }

  #generateUsersCss(users) {
    return users
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
      .join(" ");
  }

  #generateDefaultUserCss(defaultUser) {
    if (defaultUser && Object.keys(defaultUser).length > 0) {
      return `
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

    return "";
  }

  #generateAnimationCss() {
    const anim1 = `
      .avatar {
        filter: brightness(50%);
        transition: filter 250ms;
      }
      .speaking {
        filter: brightness(100%);
      }
    `;

    const anim2 = `
      .avatar {
        filter: brightness(50%);
        transition: filter 250ms;
      }
      .speaking {
        filter: brightness(100%);
        animation-name: speaking-animation;
        animation-duration: 1.5s;
        animation-fill-mode: forwards;
        animation-iteration-count: infinite;
      }
      @keyframes speaking-animation {
        0% { bottom: 0px; }
        15% { bottom: 10px; }
        30% { bottom: 0px; }
      }
    `;

    const anim3 = `
      .avatar {
        filter: brightness(50%);
        transform: scale(0.95);
        transition: filter 250ms, transform 250ms;
      }
      .speaking {
        transform: scale(1);
        filter: brightness(100%);
      }
    `;

    return anim3;
  }

  // Tools
  #setServerId(serverId) {
    const server = this.#states.server.get();
    if (serverId.length === 0) {
      delete server.serverId;
      this.#states.server.set(server);
    } else {
      this.#states.server.set({ ...server, serverId });
    }
  }

  #setVcId(vcId) {
    const server = this.#states.server.get();
    if (vcId.length === 0) {
      delete server.vcId;
      this.#states.server.set(server);
    } else {
      this.#states.server.set({ ...server, vcId });
    }
  }
}
