import { AddUserForm } from "./js/AddUserForm.js";
import { AnimationEditor } from "./js/AnimationEditor.js";
import { ConfigEditor } from "./js/ConfigEditor.js";
import { DefaultUserForm } from "./js/DefaultUserForm.js";
import { ImportExport } from "./js/ImportExport.js";
import { UsersEditor } from "./js/UsersEditor.js";
import { UsersPreview } from "./js/UsersPreview.js";
import { State } from "../lib/state.js";

window.AppState = new State();

class App {
  #states = {
    defaultUser: null,
    users: null,
    server: null,
  };

  constructor() {
    this.#initStates();
    this.#initComponents();
  }

  #initStates() {
    this.#states = {
      defaultUser: AppState.init("defaultUser", null, { useLocalStorage: true, useEvents: true }),
      users: AppState.init("users", [], { useLocalStorage: true, useEvents: true, onBeforeSet: this.sortUsers }),
      server: AppState.init("server", {}, { useLocalStorage: true, useEvents: true }),
    };
  }

  resetState() {
    this.#states.defaultUser.set(null);
    this.#states.users.set([]);
    this.#states.server.set({});
  }

  #initComponents() {
    new DefaultUserForm(this);
    new AddUserForm(this);
    new UsersEditor(this);
    new AnimationEditor(this);
    new UsersPreview(this);
    new ConfigEditor(this);
    new ImportExport(this);
  }

  // Misc
  async copyToClipboard(text) {
    try {
      return navigator.clipboard.writeText(text);
    } catch (error) {
      console.error(error);
    }
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
}

new App();
