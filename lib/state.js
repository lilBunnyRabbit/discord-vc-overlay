/**
 * Class representing app state
 * @extends EventTarget
 */
export class State extends EventTarget {
  /**
   * State storage
   * @private
   * @type {Map<string, bigint | boolean | symbol | number | object | string>}
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
  };

  /**
   * Represents a State
   * @constructor
   * @param {Object} [config] - State configuration
   * @param {boolean} [config.useEmitOnInit] - Dispatch event on init
   */
  constructor(config) {
    super();

    if (config) {
      this.#config = config;
    }
  }

  /**
   * Set state value
   * @param {string} key
   * @param {bigint | boolean | symbol | number | object | string} value
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
    }
  }

  /**
   * Get state value
   * @param {string} key
   * @returns {bigint | boolean | symbol | number | object | string}
   */
  get(key) {
    return this.#storage.get(key);
  }

  /**
   * Convert value to string
   * @private
   * @param {bigint | boolean | symbol | number | object | string} value
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
   * @param {"bigint" | "boolean" | "symbol" | "number" | "object" | "string"} type - Value type
   * @returns {bigint | boolean | symbol | number | object | string}
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
   * @param {bigint | boolean | symbol | number | object | string} defaultValue
   * @param {Object} config
   * @param {boolean} [config.useLocalStorage] - Save to local storage
   * @param {boolean} [config.useEvents] - Dispatch events
   * @param {function((bigint | boolean | symbol | number | object | string)): (bigint | boolean | symbol | number | object | string)} [config.onBeforeSet] - Callback before the value is set
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

    const element = new StateElement(this, key, type, config);
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
   * State element value type
   * @private
   * @type {"bigint" | "boolean" | "symbol" | "number" | "object" | "string"}
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
    onBeforeSet: null
  };

  /**
   * Represents a StateElement
   * @constructor
   * @param {State} state - State that the element belongs to
   * @param {string} key - State element key
   * @param {"bigint" | "boolean" | "symbol" | "number" | "object" | "string"} type - State element value type
   * @param {Object} config - State element configuration
   * @param {boolean} [config.useLocalStorage] - Save to local storage
   * @param {boolean} [config.useEvents] - Dispatch events
   * @param {function((bigint | boolean | symbol | number | object | string)): (bigint | boolean | symbol | number | object | string)} [config.onBeforeSet] - Callback before the value is set
   */
  constructor(state, key, type, config) {
    this.#state = state;
    this.#key = key;
    this.#type = type;

    if (config) {
      this.#config = config;
    }
  }

  /**
   * Fetch state element value
   * @returns {bigint | boolean | symbol | number | object | string}
   */
  get() {
    return this.#state.get(this.#key);
  }

  /**
   * Set state element value
   * @param {bigint | boolean | symbol | number | object | string} value
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
   * Assign event listener for this element
   * @param {function(bigint | boolean | symbol | number | object | string): void} listener
   * @returns {StateElement}
   */
  addListener(listener) {
    this.#state.addEventListener(this.#key, (e) => listener(e.detail));
    return this;
  }
}
