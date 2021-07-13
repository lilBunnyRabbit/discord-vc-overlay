export const UserInput = (sharedState) =>
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
