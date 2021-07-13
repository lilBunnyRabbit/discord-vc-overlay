// https://streamkit.discord.com/overlay/voice/856169315908321290/864288607858065418
// https://streamkit.discord.com/overlay/voice/{{guild}}/{{channel}}

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

const sharedState = {
  users: [],
  baseCss: "",
  usersCss: "",
};

function generateUsersCss(users) {
  return (users || [])
    .map((user) => {
      return `
    .voice-state[data-reactid*="${user.id}"] {
      display: flex;
      margin-right: 6px;
    }
    
    .avatar[data-reactid*="${user.id}"] {
      content: url(${user.url});
    }
  
    .speaking[data-reactid*="${user.id}"] {
      content: url(${user.url_speaking}) !important;
    }
  `;
    })
    .join("\n");
}

Vue.component("app-container", {
  props: [],
  template: `
    <div class="app-container">
      <user-input></user-input>
      <overlay-preview></overlay-preview>
      <css-output></css-output>
    </div>
  `,
});

Vue.component("user-input", {
  props: [],
  data: () => sharedState,
  methods: {
    formSubmit(e) {
      const userId = e.target.elements["user-id"].value;
      if (typeof userId !== "string" || userId.length < 1) return;

      const userUrl = e.target.elements["user-url"].value;
      if (typeof userUrl !== "string" || userUrl.length < 1) return;

      const userUrlSpeaking = e.target.elements["user-url-speaking"].value;
      if (typeof userUrlSpeaking !== "string" || userUrlSpeaking.length < 1)
        return;

      e.target.elements["user-id"].value = "";
      e.target.elements["user-url"].value = "";
      e.target.elements["user-url-speaking"].value = "";

      this.users.push({
        id: userId,
        url: userUrl,
        url_speaking: userUrlSpeaking,
        obj_id: userId + Date.now(),
      });
    },
  },
  template: `
    <form
      @submit.prevent="formSubmit"
      class="user-form"
    >
      <div class="user-inputs">
        <div class="user-input-box">
          <div class="user-input-label">ID</div>
          <input class="user-input" type="text" id="user-id" />
        </div>

        <div class="user-input-box">
          <div class="user-input-label">URL</div>
          <input class="user-input" type="text" id="user-url" />
        </div>

        <div class="user-input-box">
          <div class="user-input-label">URL Speaking</div>
          <input class="user-input" type="text" id="user-url-speaking" />
        </div>
      </div>
      
      <input class="user-form-button" type="submit" value="Add User" />
    </form>
  `,
});

Vue.component("overlay-preview", {
  props: [],
  data: () => sharedState,
  methods: {
    updateUserClasses() {
      const userStyles = document.getElementById("user-styles");
      userStyles.innerHTML = generateUsersCss(this.users);
    },
    animateUsers() {
      Array.from(document.getElementsByClassName("avatar")).forEach((el) => {
        if (!document.body.classList.contains("speaking")) {
          el.classList.add("speaking");
        }
      });

      setTimeout(() => {
        Array.from(document.getElementsByClassName("speaking")).forEach(
          (el) => {
            el.classList.remove("speaking");
          }
        );
      }, 2000);
    },
    removeUser(id) {
      const index = this.users.findIndex((user) => user.obj_id == id);
      if (index === -1) return;
      this.users.splice(index, 1);
    },
  },
  mounted() {
    this.updateUserClasses();
    setInterval(this.animateUsers, 3000);
  },
  updated() {
    this.updateUserClasses();
  },
  template: `
    <div class="overlay-preview">
      <div class="voice-container">
        <ul class="voice-states">
          <li
            class="voice-state"
            v-for="user in users"
            :data-reactid="user.id"
          >
            <img
              class="avatar"
              src="https://www.programmingr.com/wp-content/uploads/2020/07/error-message.png"
              :data-reactid="user.id"
              :title="user.id"
            />

            <div class="remove-user-button" v-on:click="removeUser(user.obj_id)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="inherit"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-x"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `,
});

Vue.component("css-output", {
  data: () => sharedState,
  methods: {
    selectText() {
      var sel, range;
      var el = document.getElementById("css-output"); //get element id
      if (window.getSelection && document.createRange) {
        //Browser compatibility
        sel = window.getSelection();
        if (sel.toString() == "") {
          //no text selection
          window.setTimeout(function () {
            range = document.createRange(); //range object
            range.selectNodeContents(el); //sets Range
            sel.removeAllRanges(); //remove all ranges from selection
            sel.addRange(range); //add Range to a Selection.
          }, 1);
        }
      } else if (document.selection) {
        //older ie
        sel = document.selection.createRange();
        if (sel.text == "") {
          //no text selection
          range = document.body.createTextRange(); //Creates TextRange object
          range.moveToElementText(el); //sets Range
          range.select(); //make selection.
        }
      }
    },
    updateUserClasses() {
      this.usersCss = generateUsersCss(this.users);
    },
  },
  mounted() {
    fetch("./overlay.css")
      .then((res) => res.text())
      .then((baseCss) => (this.baseCss = baseCss));
    this.updateUserClasses();
  },
  updated() {
    this.updateUserClasses();
  },
  watch: {
    users() {
      this.updateUserClasses();
    },
  },
  template: `
    <div class="css-output" id="css-output" v-on:click="selectText">
      {{ baseCss }} {{ usersCss }}
    </div>
  `,
});

window.onload = async () => new Vue({ el: "#app" });
