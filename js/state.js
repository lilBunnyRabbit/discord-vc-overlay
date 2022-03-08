export class State extends EventTarget {
  #state = new Map();
  #localStorage = window.localStorage;
  #config = {
    useLocalStorage: true,
    useEvents: true
  }

  constructor(config, defaultValues) {
    super();

    if (config) {
      this.#config = config;
    }

    if (defaultValues) {
      defaultValues.forEach(defaultValue => {
        this.initKey(defaultValue.key, defaultValue.value, {
          useLocalStorage: defaultValue.localStorage
        });
      });
    }
  }

  set(key, value, { useLocalStorage, disableEvent } = {}) {
    this.#state.set(key, value);

    if (useLocalStorage && this.#config.useLocalStorage) {
      const stringValue = JSON.stringify(value);
      if (stringValue !== undefined) {
        this.#localStorage.setItem(key, stringValue);
      }
    }

    if (!disableEvent && this.#config.useEvents) {
      this.dispatchEvent(new CustomEvent(key, { detail: value }));
    }
  }

  get(key) {
    return this.#state.get(key);
  }

  initKey(key, value, { useLocalStorage }) {
    if (this.get(key) !== undefined) return;

    if (useLocalStorage) {
      const stringValue = this.#localStorage.getItem(key);
      if (stringValue !== null) {
        const localValue = JSON.parse(stringValue);
        if (typeof value === "function") {
          return this.set(key, value(localValue), { disableEvent: true });
        } else {
          return this.set(key, localValue, { disableEvent: true });
        }
      }
    }

    if (value) {
      if (typeof value === "function") {
        return this.set(key, value(this.get(key)), { useLocalStorage, disableEvent: true });
      } else {
        return this.set(key, value, { useLocalStorage, disableEvent: true });
      }
    }
  }

  attach(key, config) {
    return new StateElement(this, key, config);
  }
}

export class StateElement {
  #state = null;
  #key = "";
  #config = {
    useLocalStorage: false,
  };

  constructor(state, key, config) {
    this.#state = state;
    this.#key = key;
    if (config) {
      this.#config = config;
    }
  }

  get() {
    return this.#state.get(this.#key);
  }

  set(value) {
    this.#state.set(this.#key, value, { useLocalStorage: this.#config.useLocalStorage });
  }

  // Works for updating a JSON object
  update(value) {
    const oldValue = this.get();
    if (oldValue !== undefined) {
      this.set({ ...oldValue, ...value });
    } else {
      this.set(value);
    }
  } 

  addEventListener(eventListener) {
    this.#state.addEventListener(this.#key, (e) => eventListener(e.detail));
    return this;
  }

  init(value) {
    this.#state.initKey(this.#key, value, { useLocalStorage: this.#config.useLocalStorage });
    return this;
  }
}
