class Environment {
  constructor(parent) {
    this.variables = {};
    this.parent = parent || null;
  }

  set(name, value) {
    this.variables[name] = value;
  }

  get(name) {
    if (name in this.variables) {
      return this.variables[name];
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`Variable "${name}" is not defined`);
  }

  has(name) {
    if (name in this.variables) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }

  /**
   * Create a child scope (for function calls and blocks)
   */
  child() {
    return new Environment(this);
  }
}

module.exports = Environment;