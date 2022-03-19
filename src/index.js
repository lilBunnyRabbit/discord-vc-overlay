import { AddUserForm } from "./js/AddUserForm.js";
import { AnimationEditor } from "./js/AnimationEditor.js";
import { ConfigEditor } from "./js/ConfigEditor.js";
import { DefaultUserForm } from "./js/DefaultUserForm.js";
import { ImportExport } from "./js/ImportExport.js";
import { UsersEditor } from "./js/UsersEditor.js";
import { UsersPreview } from "./js/UsersPreview.js";
import { State, StateComponent } from "../lib/state.js";
import { sortUsers } from "./js/utils.js";

export const States = Object.freeze({
  DEFAULT_USER: "defaultUser",
  USERS: "users",
  SERVER: "server",
});

window.AppState = new State(
  { useEmitOnInit: false, useChangeEvent: true, useLogs: true },
  {
    [States.DEFAULT_USER]: {
      defaultValue: null,
      config: { useLocalStorage: true, useEvents: true },
    },
    [States.USERS]: {
      defaultValue: [],
      config: {
        useLocalStorage: true,
        useEvents: true,
        onBeforeSet: sortUsers,
      },
    },
    [States.SERVER]: {
      defaultValue: {},
      config: { useLocalStorage: true, useEvents: true },
    },
  }
);

class App extends StateComponent {
  constructor() {
    super(AppState, true);
    this.#initComponents();
  }

  #initComponents() {
    new DefaultUserForm();
    new AddUserForm();
    new UsersEditor();
    new AnimationEditor();
    new UsersPreview();
    new ConfigEditor();
    new ImportExport(this);
  }

  // Utils
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
}

new App();
