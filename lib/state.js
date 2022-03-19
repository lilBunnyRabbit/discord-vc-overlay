/**
 * @author lilBunnyRabbit
 */

/**
 * Type of stored values
 * @typedef {(bigint | boolean | symbol | number | object | string)} StorageValue
 */

/**
 * Type of storage values type
 * @typedef {("bigint" | "boolean" | "symbol" | "number" | "object" | "string")} StorageValueType
 */

/**
 * Class representing app state
 * @extends EventTarget
 */
export class State extends EventTarget {
  /**
   * State storage
   * @private
   * @type {Map<string, StorageValue>}
   */
  #storage = new Map();

  /**
   * State elements
   * @private
   * @type {Map<string, StateElement>}
   */
  #elements = new Map();

  /**
   * State configuration
   * @private
   * @type {Object}
   */
  #config = {
    useEmitOnInit: false,
    useChangeEvent: false,
    useLogs: true,
  };

  /**
   * Represents a State
   * @constructor
   * @param {Object} [config] - State configuration
   * @param {boolean} [config.useEmitOnInit] - Dispatch event on init
   * @param {boolean} [config.useChangeEvent] - Dispatch "change" event when value is set
   * @param {boolean} [config.useLogs] - Enable/disable logging
   * @param {Object.<
   *  string,
   *  {
   *    defaultValue: StorageValue,
   *    config?: {
   *      useLocalStorage?: boolean,
   *      useEvents?: boolean
   *    }
   *  }
   * >} [initElements]
   */
  constructor(config, initElements) {
    super();

    if (config) {
      this.#config = config;
    }

    if (this.#config.useLogs) {
      console.log("State", {
        config: this.#config,
      });
    }

    if (initElements) {
      Object.keys(initElements).forEach((key) => {
        const initElement = initElements[key];
        this.init(key, initElement.defaultValue, initElement.config);
      });
    }
  }

  /**
   * @returns {Map<string, StorageValue>}
   */
  get storage() {
    return this.#storage;
  }

  /**
   * @returns {Map<string, StateElement>}
   */
  get elements() {
    return this.#elements;
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this.#config;
  }

  /**
   * Set state value
   * @param {string} key
   * @param {StorageValue} value
   * @param {Object} config
   * @param {boolean} [config.useLocalStorage] - Save to local storage
   * @param {boolean} [config.useEvents] - Dispatch events
   */
  set(key, value, config) {
    this.#storage.set(key, value);

    if (config.useLocalStorage) {
      localStorage.setItem(key, this.#valueToString(value));
    }

    if (config.useEvents) {
      this.dispatchEvent(new CustomEvent(key, { detail: value }));

      if (this.#config.useChangeEvent) {
        this.dispatchEvent(new CustomEvent("change", { detail: { key, value } }));
      }
    }
  }

  /**
   * Get state value
   * @param {string} key
   * @returns {StorageValue}
   */
  get(key) {
    return this.#storage.get(key);
  }

  /**
   * Convert value to string
   * @private
   * @param {StorageValue} value
   * @returns {string}
   * @throws {Error}
   */
  #valueToString(value) {
    switch (typeof value) {
      case "bigint":
      case "boolean":
      case "symbol":
      case "number":
        return value.toString();
      case "object":
        return JSON.stringify(value);
      case "string":
        return value;
      case "undefined":
      case "function":
      default:
        throw new Error(`Value type "${typeof value}" is not supported`);
    }
  }

  /**
   * Convert string to value
   * @private
   * @param {string} value
   * @param {StorageValueType} type - Value type
   * @returns {StorageValue}
   * @throws {Error}
   */
  #valueFromString(value, type) {
    switch (type) {
      case "bigint":
        return BigInt(value);
      case "boolean":
        return Boolean(value);
      case "symbol":
        return Symbol(value);
      case "number":
        return Number.parseFloat(value);
      case "object":
        return JSON.parse(value);
      case "string":
        return value;
      case "undefined":
      case "function":
      default:
        throw new Error(`Value type "${typeof value}" is not supported`);
    }
  }

  /**
   * Init new state element
   * @param {string} key
   * @param {StorageValue} defaultValue
   * @param {Object} config
   * @param {boolean} [config.useLocalStorage] - Save to local storage
   * @param {boolean} [config.useEvents] - Dispatch events
   * @param {function((StorageValue)): (StorageValue)} [config.onBeforeSet] - Callback before the value is set
   * @returns {StateElement}
   * @throws {Error}
   */
  init(key, defaultValue, config) {
    if (this.#elements.get(key)) {
      throw new Error("Element already initialized");
    }

    const type = typeof defaultValue;
    if (type === "function" || type === "undefined") {
      throw new Error(`Value type "${type}" is not supported`);
    }

    let value = defaultValue;
    if (config.useLocalStorage) {
      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        value = this.#valueFromString(localValue, type);
      }
    }

    this.set(key, value, { ...config, useEvents: this.#config.useEmitOnInit });

    const element = new StateElement(this, key, defaultValue, config);
    this.#elements.set(key, element);

    return element;
  }

  /**
   * Attach to StateElement
   * @param {string} key
   * @returns {StateElement}
   * @throws {Error}
   */
  attach(key) {
    const element = this.#elements.get(key);
    if (!element) {
      throw new Error("Element not initialized");
    }

    return element;
  }

  /**
   * Fetch all initialized elements
   * @returns {Map<string, StateElement>}
   */
  _getElements() {
    return this.#elements;
  }
}

/**
 * Class representing state for unique key
 * @class
 */
class StateElement {
  /**
   * State that the element belongs to
   * @private
   * @type {State}
   */
  #state = null;

  /**
   * State element key
   * @private
   * @type {string}
   */
  #key = "";

  /**
   * State element default value
   * @private
   * @type {StorageValue}
   */
  #defaultValue = undefined;

  /**
   * State element value type
   * @private
   * @type {StorageValueType}
   */
  #type = "";

  /**
   * State element configuration
   * @private
   * @type {Object}
   */
  #config = {
    useLocalStorage: false,
    useEvents: false,
    onBeforeSet: null,
  };

  /**
   * Represents a StateElement
   * @constructor
   * @param {State} state - State that the element belongs to
   * @param {string} key - State element key
   * @param {StorageValue} defaultValue - State element default value
   * @param {Object} config - State element configuration
   * @param {boolean} [config.useLocalStorage] - Save to local storage
   * @param {boolean} [config.useEvents] - Dispatch events
   * @param {function((StorageValue)): (StorageValue)} [config.onBeforeSet] - Callback before the value is set
   */
  constructor(state, key, defaultValue, config) {
    this.#state = state;
    this.#key = key;
    this.#defaultValue = defaultValue;
    this.#type = typeof defaultValue;

    if (config) {
      this.#config = config;
    }

    if (this.#state.config.useLogs) {
      console.log("StateElement", {
        key: this.#key,
        defaultValue: this.#defaultValue,
        type: this.#type,
        config: this.#config,
      });
    }
  }

  /**
   * @returns {State}
   */
  get state() {
    return this.#state;
  }

  /**
   * @returns {string}
   */
  get key() {
    return this.#key;
  }

  /**
   * @returns {StorageValue}
   */
  get defaultValue() {
    return this.#defaultValue;
  }

  /**
   * @returns {StorageValueType}
   */
  get type() {
    return this.#type;
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this.#config;
  }

  /**
   * Fetch state element value
   * @returns {StorageValue}
   */
  get() {
    return this.#state.get(this.#key);
  }

  /**
   * Set state element value
   * @param {StorageValue} value
   */
  set(value) {
    if (typeof value !== this.#type) {
      throw new Error(`Expected value type "${this.#type}" but got "${typeof value}"`);
    }

    if (this.#config.onBeforeSet) {
      value = this.#config.onBeforeSet(value);
    }

    this.#state.set(this.#key, value, this.#config);
  }

  /**
   * Set state element value to it's default value
   */
  reset() {
    this.set(this.#defaultValue);
  }

  /**
   * Assign event listener for this element
   * @param {function(StorageValue): void} listener
   * @returns {StateElement}
   */
  addListener(listener) {
    this.#state.addEventListener(this.#key, ({ detail }) => listener(detail));
    return this;
  }
}

/**
 * Class representing component with StateElements
 * @class
 */
export class StateComponent {
  /**
   * State that the component belongs to
   * @private
   * @type {State}
   */
  #state = null;

  /**
   * Object of attached state elements
   * @type {Object.<string, StateElement>}
   */
  states = {};

  /**
   * Represents a StateComponent
   * @constructor
   * @param {State} state - State that the component belongs to
   * @param {string[] | boolean} [elements] - List of StateElement keys. If the value is "true" all initialized StateElement's will be added.
   */
  constructor(state, elements) {
    this.#state = state;

    const prototype = Object.getPrototypeOf(this);
    const overrides = {
      $onStateChange: prototype.hasOwnProperty("$onStateChange"),
    };

    if (elements === true) {
      for (const element of this.#state._getElements().values()) {
        const key = element.key;
        this.states[key] = element;
        if (overrides.$onStateChange) {
          this.states[key].addListener((value) => this.$onStateChange(key, value));
        }
      }
    } else if (elements) {
      elements.forEach((key) => {
        this.states[key] = this.#state.attach(key);
        if (overrides.$onStateChange) {
          this.states[key].addListener((value) => this.$onStateChange(key, value));
        }
      });
    } else if (overrides.$onStateChange) {
      this.#state.addEventListener("change", ({ detail }) => this.$onStateChange(detail.key, detail.value));
    }

    Object.freeze(this.states);

    if (this.#state.config.useLogs) {
      console.log("StateComponent", {
        class: this.constructor.name,
        stateElements: Object.keys(this.states),
        overrides,
      });
    }
  }

  /**
   * Triggered when state is changed
   * @param {string} key
   * @param {StorageValue} value
   */
  $onStateChange(key, value) {
    console.log(this.constructor.name, "$onStateChange", { key, value });
  }

  /**
   * Reset all attached StateElement's to their default value
   */
  $resetAll() {
    Object.keys(this.states).forEach((key) => this.states[key].reset());
  }
}
