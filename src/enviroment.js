class Environment {

  constructor() {

    this.variables = {};

  }



  set(name, value) {

    this.variables[name] = value;

  }



  get(name) {

    if (!(name in this.variables)) {

      throw new Error(`Variable "${name}" is not defined`);

    }

    return this.variables[name];

  }

}



module.exports = Environment;