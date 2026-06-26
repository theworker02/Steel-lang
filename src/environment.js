class Environment {
  constructor(parent = null) {
    this.variables = {};
    this.parent = parent;
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

  // Function storage
  defineFunction(name, params, body, closureEnv) {
    this.variables[name] = {
      type: 'function',
      params,
      body,
      closure: closureEnv,
    };
  }

  isFunction(name) {
    const val = this.has(name) ? this.get(name) : undefined;
    return val && val.type === 'function';
  }

  callFunction(name, args) {
    const fn = this.get(name);
    if (!fn || fn.type !== 'function') {
      throw new Error(`"${name}" is not a function`);
    }
    const fnEnv = new Environment(fn.closure);
    for (let i = 0; i < fn.params.length; i++) {
      fnEnv.set(fn.params[i], args[i] !== undefined ? args[i] : null);
    }
    return { env: fnEnv, body: fn.body };
  }

  // Built-in functions
  static createGlobal() {
    const env = new Environment();

    // Math functions
    env.set('abs', { type: 'builtin', fn: Math.abs, name: 'abs' });
    env.set('round', { type: 'builtin', fn: (n) => Math.round(n), name: 'round' });
    env.set('floor', { type: 'builtin', fn: Math.floor, name: 'floor' });
    env.set('ceil', { type: 'builtin', fn: Math.ceil, name: 'ceil' });
    env.set('sqrt', { type: 'builtin', fn: Math.sqrt, name: 'sqrt' });
    env.set('pow', { type: 'builtin', fn: (a, b) => Math.pow(a, b), name: 'pow' });
    env.set('min', { type: 'builtin', fn: Math.min, name: 'min' });
    env.set('max', { type: 'builtin', fn: Math.max, name: 'max' });
    env.set('random', { type: 'builtin', fn: () => Math.random(), name: 'random' });
    env.set('pi', Math.PI);
    env.set('e', Math.E);

    // String functions
    env.set('len', { type: 'builtin', fn: (v) => {
      if (Array.isArray(v)) return v.length;
      if (typeof v === 'string') return v.length;
      return String(v).length;
    }, name: 'len' });
    env.set('upper', { type: 'builtin', fn: (s) => String(s).toUpperCase(), name: 'upper' });
    env.set('lower', { type: 'builtin', fn: (s) => String(s).toLowerCase(), name: 'lower' });
    env.set('trim', { type: 'builtin', fn: (s) => String(s).trim(), name: 'trim' });
    env.set('substring', { type: 'builtin', fn: (s, start, end) => {
      if (end !== undefined) return String(s).substring(start, end);
      return String(s).substring(start);
    }, name: 'substring' });
    env.set('replace', { type: 'builtin', fn: (s, from, to) => String(s).replaceAll(from, to), name: 'replace' });
    env.set('split', { type: 'builtin', fn: (s, sep) => String(s).split(sep), name: 'split' });
    env.set('join', { type: 'builtin', fn: (arr, sep) => Array.isArray(arr) ? arr.join(sep) : String(arr), name: 'join' });
    env.set('contains', { type: 'builtin', fn: (s, sub) => String(s).includes(sub), name: 'contains' });
    env.set('charAt', { type: 'builtin', fn: (s, i) => String(s).charAt(i), name: 'charAt' });
    env.set('indexOf', { type: 'builtin', fn: (s, sub) => String(s).indexOf(sub), name: 'indexOf' });
    env.set('startsWith', { type: 'builtin', fn: (s, prefix) => String(s).startsWith(prefix), name: 'startsWith' });
    env.set('endsWith', { type: 'builtin', fn: (s, suffix) => String(s).endsWith(suffix), name: 'endsWith' });
    env.set('repeat', { type: 'builtin', fn: (s, n) => String(s).repeat(n), name: 'repeat' });
    env.set('padStart', { type: 'builtin', fn: (s, n, ch) => String(s).padStart(n, ch || ' '), name: 'padStart' });
    env.set('padEnd', { type: 'builtin', fn: (s, n, ch) => String(s).padEnd(n, ch || ' '), name: 'padEnd' });

    // Type checking
    env.set('type', { type: 'builtin', fn: (v) => {
      if (v === null) return 'null';
      if (Array.isArray(v)) return 'array';
      if (typeof v === 'number') return 'number';
      if (typeof v === 'string') return 'string';
      if (typeof v === 'boolean') return 'boolean';
      return 'unknown';
    }, name: 'type' });
    env.set('isNumber', { type: 'builtin', fn: (v) => typeof v === 'number', name: 'isNumber' });
    env.set('isString', { type: 'builtin', fn: (v) => typeof v === 'string', name: 'isString' });
    env.set('isArray', { type: 'builtin', fn: (v) => Array.isArray(v), name: 'isArray' });
    env.set('toString', { type: 'builtin', fn: (v) => String(v), name: 'toString' });
    env.set('toNumber', { type: 'builtin', fn: (v) => Number(v), name: 'toNumber' });

    // Array functions
    env.set('push', { type: 'builtin', fn: (arr, item) => {
      if (!Array.isArray(arr)) throw new Error('push() requires an array');
      arr.push(item);
      return arr;
    }, name: 'push' });
    env.set('pop', { type: 'builtin', fn: (arr) => {
      if (!Array.isArray(arr)) throw new Error('pop() requires an array');
      return arr.pop();
    }, name: 'pop' });
    env.set('shift', { type: 'builtin', fn: (arr) => {
      if (!Array.isArray(arr)) throw new Error('shift() requires an array');
      return arr.shift();
    }, name: 'shift' });
    env.set('unshift', { type: 'builtin', fn: (arr, item) => {
      if (!Array.isArray(arr)) throw new Error('unshift() requires an array');
      arr.unshift(item);
      return arr;
    }, name: 'unshift' });
    env.set('reverse', { type: 'builtin', fn: (arr) => {
      if (!Array.isArray(arr)) throw new Error('reverse() requires an array');
      return [...arr].reverse();
    }, name: 'reverse' });
    env.set('sort', { type: 'builtin', fn: (arr) => {
      if (!Array.isArray(arr)) throw new Error('sort() requires an array');
      return [...arr].sort((a, b) => a - b);
    }, name: 'sort' });
    env.set('slice', { type: 'builtin', fn: (arr, start, end) => {
      if (!Array.isArray(arr)) throw new Error('slice() requires an array');
      if (end !== undefined) return arr.slice(start, end);
      return arr.slice(start);
    }, name: 'slice' });
    env.set('indexOf_arr', { type: 'builtin', fn: (arr, item) => {
      if (!Array.isArray(arr)) throw new Error('indexOf requires an array');
      return arr.indexOf(item);
    }, name: 'indexOf_arr' });
    env.set('includes', { type: 'builtin', fn: (arr, item) => {
      if (!Array.isArray(arr)) throw new Error('includes() requires an array');
      return arr.includes(item);
    }, name: 'includes' });
    env.set('flat', { type: 'builtin', fn: (arr, depth) => {
      if (!Array.isArray(arr)) throw new Error('flat() requires an array');
      return arr.flat(depth);
    }, name: 'flat' });
    env.set('range', { type: 'builtin', fn: (start, end, step) => {
      step = step || 1;
      const result = [];
      if (step > 0) {
        for (let i = start; i < end; i += step) result.push(i);
      } else {
        for (let i = start; i > end; i += step) result.push(i);
      }
      return result;
    }, name: 'range' });

    // I/O
    env.set('input', { type: 'builtin', fn: (prompt) => {
      if (typeof require !== 'undefined') {
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => {
          rl.question(prompt || '', (answer) => {
            rl.close();
            resolve(answer);
          });
        });
      }
      return null;
    }, name: 'input' });

    // Misc
    env.set('clock', { type: 'builtin', fn: () => Date.now(), name: 'clock' });
    env.set('sleep', { type: 'builtin', fn: (ms) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {} // busy wait
    }, name: 'sleep' });

    return env;
  }
}

module.exports = Environment;