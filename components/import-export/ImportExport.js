export const ImportExport = (sharedState) =>
  Vue.component("import-export", {
    props: [],
    data: () => sharedState,
    methods: {
      exportData() {
        const filename = `discord_vc_overlay_${new Date()
          .toJSON()
          .slice(0, 10)}.dvco`;
        const data = {
          users: this.users && this.users.length > 0 ? this.users : undefined,
          serverId:
            this.serverId === "<INSERT SERVER ID>" ? undefined : this.serverId,
          vcId: this.vcId === "<INSERT VC ID>" ? undefined : this.vcId,
        };

        if (Object.keys(data).filter((key) => data[key]).length === 0) return;

        const file = new Blob([JSON.stringify(data)], {
          type: "application/json",
        });

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
      },
      importData(e) {
        const input = e.target;
        if (input && !!input["files"] && input.files.length > 0) {
          this.readFileContent(input.files[0])
            .then((content) => {
              try {
                const data = JSON.parse(content);
                if ("users" in data) {
                  this.users.splice(0, this.users.length);
                  this.users.push(...data.users);
                }

                if ("serverId" in data) {
                  this.serverId = data.serverId;
                  document.getElementById("serverId").value = data.serverId;
                }

                if ("vcId" in data) {
                  this.vcId = data.vcId;
                  document.getElementById("vcId").value = data.vcId;
                }
              } catch (error) {
                console.error(error);
              }
            })
            .catch((error) => console.log(error));
        }
      },
      readFileContent(file) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsText(file);
        });
      },
    },
    template: `
    <div class="import-export">
      <label
        for="input-file"
        class="import-file-input"
      >
        Import
      </label>
      <input type="file" id="input-file" accept=".dvco" @change="importData" style="display: none;">

      <div class="import-export-divider"></div>

      <button v-on:click="exportData" class="export-button">Export</button>
    </div>
  `,
  });
