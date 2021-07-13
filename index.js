import { Config } from "./components/config/Config.js";
import { OverlayPreview } from "./components/overlay-preview/OverlayPreview.js";
import { UserInput } from "./components/user-input/UserInput.js";

const exampleUsers = [
  {
    id: "408279503802990603",
    url: "https://i.pinimg.com/originals/14/ed/11/14ed11802fa88719070a1f3f7ee0b2e0.png",
    url_speaking:
      "https://i.pinimg.com/originals/c6/31/6d/c6316d4449b56c73d5eb099415e8c5d8.png",
    obj_id: "123",
  },
  {
    id: "408279503802990605",
    url: "https://animesher.com/orig/1/116/1169/11690/animesher.com_anime-girl-tokyo-ghoul-chibi-1169029.png",
    url_speaking:
      "https://animesher.com/orig/1/116/1169/11690/animesher.com_anime-girl-tokyo-ghoul-chibi-1169029.png",
    obj_id: "456",
  },
];

export const sharedState = {
  users: [],
  baseCss: "",
  usersCss: "",
  serverId: "<INSERT SERVER ID>",
  vcId: "<INSERT VC ID>",
  overlayHeight: 0,
};

Config(sharedState);
UserInput(sharedState);
OverlayPreview(sharedState);

Vue.component("app-container", {
  props: [],
  template: `
    <div class="app-container">
      <div class="title">Discord Overlay Generator</div>

      <div class="category-title">Add User</div>
      <user-input></user-input>
      <overlay-preview></overlay-preview>

      <div class="category-title">Config</div>
      <overlay-config></overlay-config>
    </div>
  `,
});

window.onload = async () => new Vue({ el: "#app" });
