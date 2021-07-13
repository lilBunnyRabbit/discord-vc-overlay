import { generateUsersCss } from "../config/Config.js";

export const OverlayPreview = (sharedState) => {
  Vue.component("overlay-preview", {
    props: [],
    data: () => sharedState,
    methods: {
      updateUserClasses() {
        const userStyles = document.getElementById("user-styles");
        userStyles.innerHTML = generateUsersCss(this.users);
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
    <div class="overlay-preview" id="overlay-preview">
      <div class="voice-container">
        <ul class="voice-states">
          <li
            class="voice-state"
            v-for="user in users"
            :data-reactid="user.id"
          >
            <user-avatar :user="user"></user-avatar>

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

  Vue.component("user-avatar", {
    props: ["user"],
    data: () => ({
      isHovering: false,
    }),
    template: `
      <img
        class="avatar"
        src="https://www.programmingr.com/wp-content/uploads/2020/07/error-message.png"
        :data-reactid="user.id"
        :title="user.id"
        @mouseover="isHovering = true" 
        @mouseout="isHovering = false" 
        :class="{speaking: isHovering}"
      />
    `,
  });
};
