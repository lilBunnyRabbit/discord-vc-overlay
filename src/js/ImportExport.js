import { States } from "../index.js";
import { StateComponent } from "../../lib/state.js";

export class ImportExport extends StateComponent {
  #app = null;
  #elements = {
    import: document.getElementById("import-button"),
    export: document.getElementById("export-button"),
    reset: document.getElementById("reset-button"),
  };

  constructor(app) {
    super(AppState, [States.DEFAULT_USER, States.USERS, States.SERVER]);

    this.#app = app;

    this.#addHandlers();
  }

  // Handlers
  #addHandlers() {
    this.#elements.reset.onclick = this.#handleReset.bind(this);
    this.#elements.import.onchange = this.#handleImport.bind(this);
    this.#elements.export.onclick = this.#handleExport.bind(this);
  }

  async #handleImport(e) {
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
    const data = await readFile(file).catch(() => null);
    if (!data) return;

    this.#handleReset();

    if (file.name.endsWith(".dvco")) return this.#handleDVCO(data);
    if (file.name.endsWith(".dvog")) return this.#handleDVOG(data);
  }

  #handleDVCO(data) {
    const server = {};
    if (data.serverId) server.serverId = data.serverId;
    if (data.vcId) server.vcId = data.vcId;
    if (Object.keys(server).length > 0) this.states.server.set(server);

    if (data.users) {
      this.states.users.set(
        data.users.map((user) => ({
          id: user.id,
          url: user.url,
          urlSpeaking: user.url_speaking,
        }))
      );
    }
  }

  #handleDVOG(data) {
    if (data.defaultUser && Object.keys(data.defaultUser).length > 0) {
      this.states.defaultUser.set(data.defaultUser);
    }

    if (data.users && data.users.length > 0) {
      this.states.users.set(data.users);
    }

    if (data.server && Object.keys(data.server).length > 0) {
      this.states.server.set(data.server);
    }
  }

  #handleExport() {
    const filename = `discord-vc-overlay-${new Date().toJSON().slice(0, 10)}.dvog`;
    const data = {};

    {
      const defaultUser = this.states.defaultUser.get();
      if (defaultUser && Object.keys(defaultUser).length > 0) data.defaultUser = defaultUser;

      const users = this.states.users.get();
      if (users && users.length > 0) data.users = users;

      const server = this.states.server.get();
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

  #handleReset() {
    this.#app.$resetAll();
  }
}
