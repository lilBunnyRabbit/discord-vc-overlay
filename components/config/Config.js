export function generateUsersCss(users) {
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

export const Config = (sharedState) =>
  Vue.component("overlay-config", {
    data: () => sharedState,
    methods: {
      update(e) {
        this[e.target.id] = e.target.value;
      },
      selectText(e) {
        var sel, range;
        var el = e.target; //get element id
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

      this.overlayHeight =
        document.getElementById("overlay-preview").clientHeight;
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
    <div class="overlay-config">
      <div class="user-input-box">
        <div class="user-input-label">Server ID</div>
        <input class="user-input" type="text" id="serverId" @input="update" />
      </div>

      <div class="user-input-box">
        <div class="user-input-label">VC ID</div>
        <input class="user-input" type="text" id="vcId" @input="update" />
      </div>

      <div class="congifs">
        <div class="config-box">
          <div class="config-label">URL</div>
          <div class="config-data" v-on:click="selectText">https://streamkit.discord.com/overlay/voice/{{serverId}}/{{vcId}}</div>
        </div>

        <div class="config-box">
          <div class="config-label">Height</div>
          <div class="config-data" v-on:click="selectText">{{overlayHeight}}</div>
        </div>

        <div class="config-box">
          <div class="config-label">Custom CSS</div>
          <div class="config-data" v-on:click="selectText">{{baseCss}} {{ usersCss }}</div>
        </div>
      </div>
    </div>
  `,
  });
