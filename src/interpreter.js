const readline = require('readline');

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

function interpret(ast, env) {
  let lastResult = null;
  for (let node of ast) {
    lastResult = executeStatement(node, env);
    if (lastResult instanceof ReturnSignal) {
      return lastResult; // propagate signal, don't unwrap
    }
  }
  return lastResult;
}

function executeStatement(node, env) {
  switch (node.type) {
    case 'VariableDeclaration': {
      const value = evaluate(node.value, env);
      env.set(node.name, value);
      return value;
    }

    case 'SayStatement': {
      const value = evaluate(node.value, env);
      console.log(formatValue(value));
      return value;
    }

    case 'IfStatement': {
      const condition = evaluate(node.condition, env);
      if (condition) {
        return interpret(node.body, env);
      } else if (node.elseBody) {
        return interpret(node.elseBody, env);
      }
      return null;
    }

    case 'RepeatStatement': {
      const count = evaluate(node.count, env);
      const iterations = Math.floor(Number(count));
      let lastResult = null;
      for (let idx = 0; idx < iterations; idx++) {
        lastResult = interpret(node.body, env);
        if (lastResult instanceof ReturnSignal) {
          return lastResult;
        }
      }
      return lastResult;
    }

    case 'WhileStatement': {
      let lastResult = null;
      let maxIterations = 100000;
      while (evaluate(node.condition, env)) {
        lastResult = interpret(node.body, env);
        if (lastResult instanceof ReturnSignal) {
          return lastResult;
        }
        maxIterations--;
        if (maxIterations <= 0) {
          throw new Error(`While loop exceeded 100,000 iterations (possible infinite loop) at line ${node.line}`);
        }
      }
      return lastResult;
    }

    case 'FunctionDeclaration': {
      env.set(node.name, {
        type: 'function',
        name: node.name,
        params: node.params,
        body: node.body,
        closure: env,
      });
      return null;
    }

    case 'ReturnStatement': {
      const value = node.value ? evaluate(node.value, env) : null;
      return new ReturnSignal(value);
    }

    case 'CallExpression': {
      return evaluate(node, env);
    }

    default:
      return null;
  }
}

function evaluate(node, env) {
  if (!node) return null;

  switch (node.type) {
    case 'NUMBER':
      return node.value;

    case 'STRING':
      return node.value;

    case 'TRUE':
      return true;

    case 'FALSE':
      return false;

    case 'IDENTIFIER': {
      // Check if it's a zero-argument builtin (like pi)
      const zeroArg = getBuiltin(node.value);
      if (zeroArg) {
        return zeroArg([], node.line);
      }
      return env.get(node.value);
    }

    case 'BinaryExpression': {
      // Short-circuit for AND/OR
      if (node.operator === 'AND') {
        const left = evaluate(node.left, env);
        if (!left) return left;
        return evaluate(node.right, env);
      }
      if (node.operator === 'OR') {
        const left = evaluate(node.left, env);
        if (left) return left;
        return evaluate(node.right, env);
      }

      const left = evaluate(node.left, env);
      const right = evaluate(node.right, env);

      switch (node.operator) {
        case 'PLUS': return left + right;
        case 'MINUS': return left - right;
        case 'STAR': return left * right;
        case 'SLASH': {
          if (right === 0) {
            const opLoc = node.left.line ? ` (line ${node.left.line})` : '';
            throw new Error(`Division by zero${opLoc}`);
          }
          return left / right;
        }
        case 'PERCENT': return left % right;
        case 'GT': return left > right;
        case 'LT': return left < right;
        case 'GTE': return left >= right;
        case 'LTE': return left <= right;
        case 'EQEQ': return left === right;
        case 'NEQ': return left !== right;
        default:
          return null;
      }
    }

    case 'UnaryExpression': {
      const operand = evaluate(node.right, env);
      if (node.operator === 'NOT') {
        return !operand;
      }
      if (node.operator === 'NEGATE') {
        return -operand;
      }
      return null;
    }

    case 'CallExpression': {
      // Check for built-in functions FIRST
      const builtin = getBuiltin(node.name);
      if (builtin) {
        const args = node.args.map(a => evaluate(a, env));
        return builtin(args, node.line);
      }

      // Then check user-defined functions
      const fn = env.get(node.name);
      if (!fn || typeof fn !== 'object' || fn.type !== 'function') {
        throw new Error(`"${node.name}" is not a function (line ${node.line})`);
      }

      // User-defined function call
      const argValues = node.args.map(a => evaluate(a, env));

      if (argValues.length !== fn.params.length) {
        throw new Error(
          `Function "${fn.name}" expects ${fn.params.length} argument(s) but got ${argValues.length} (line ${node.line})`
        );
      }

      // Create new scope with function parameters
      const callEnv = fn.closure.child();
      for (let p = 0; p < fn.params.length; p++) {
        callEnv.set(fn.params[p], argValues[p]);
      }

      const result = interpret(fn.body, callEnv);
      return result instanceof ReturnSignal ? result.value : null;
    }

    default:
      return null;
  }
}

/**
 * Built-in standard library functions.
 */
function getBuiltin(name) {
  const builtins = {
    // String functions
    length: (args) => String(args[0]).length,
    upper: (args) => String(args[0]).toUpperCase(),
    lower: (args) => String(args[0]).toLowerCase(),
    trim: (args) => String(args[0]).trim(),
    split: (args) => String(args[0]).split(args[1] || ' '),
    join: (args) => Array.isArray(args[0]) ? args[0].join(args[1] || '') : String(args[0]),
    replace: (args) => String(args[0]).replaceAll(String(args[1]), String(args[2])),
    contains: (args) => String(args[0]).includes(String(args[1])),
    starts: (args) => String(args[0]).startsWith(String(args[1])),
    ends: (args) => String(args[0]).endsWith(String(args[1])),
    char_at: (args) => String(args[0])[Number(args[1])] || '',
    substring: (args) => String(args[0]).substring(Number(args[1]), Number(args[2])),
    repeat_str: (args) => String(args[0]).repeat(Number(args[1])),

    // Math functions
    abs: (args) => Math.abs(Number(args[0])),
    round: (args) => Math.round(Number(args[0])),
    floor: (args) => Math.floor(Number(args[0])),
    ceil: (args) => Math.ceil(Number(args[0])),
    sqrt: (args) => Math.sqrt(Number(args[0])),
    power: (args) => Math.pow(Number(args[0]), Number(args[1])),
    min: (args) => Math.min(Number(args[0]), Number(args[1])),
    max: (args) => Math.max(Number(args[0]), Number(args[1])),
    random: (args) => {
      const min = args.length > 0 ? Number(args[0]) : 0;
      const max = args.length > 1 ? Number(args[1]) : 1;
      return Math.random() * (max - min) + min;
    },
    random_int: (args) => {
      const min = args.length > 0 ? Number(args[0]) : 0;
      const max = args.length > 1 ? Number(args[1]) : 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    pi: () => Math.PI,

    // Type / conversion
    type_of: (args) => {
      const v = args[0];
      if (Array.isArray(v)) return 'array';
      if (typeof v === 'number') return 'number';
      if (typeof v === 'string') return 'string';
      if (typeof v === 'boolean') return 'boolean';
      if (v === null || v === undefined) return 'nothing';
      if (typeof v === 'object' && v.type === 'function') return 'function';
      return 'unknown';
    },
    to_number: (args) => Number(args[0]),
    to_string: (args) => formatValue(args[0]),
  };

  return builtins[name] || null;
}

/**
 * Format a value for display with `say`.
 */
function formatValue(value) {
  if (value === null || value === undefined) return 'nothing';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return '[' + value.map(formatValue).join(', ') + ']';
  if (typeof value === 'object' && value.type === 'function') return `<function ${value.name}>`;
  return String(value);
}

/**
 * Start an interactive REPL session.
 */
function startRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'steel> ',
  });

  const env = new (require('./environment'))();
  let buffer = '';

  console.log('Steel Language REPL v2.0.0');
  console.log('Type expressions or statements. Use Ctrl+C to clear, Ctrl+D to exit.');
  console.log('');

  rl.prompt();

  rl.on('line', (line) => {
    buffer += line + '\n';

    // Count block depth (if/repeat/while/function open blocks)
    const openBlocks = countOpenBlocks(buffer);

    if (openBlocks > 0) {
      // Inside a block — continue reading
      rl.setPrompt('  ... ');
      rl.prompt();
      return;
    }

    // Try to execute
    try {
      const { tokenize } = require('./lexer');
      const { parse } = require('./parser');

      const tokens = tokenize(buffer);
      const ast = parse(tokens);
      const result = interpret(ast, env);

      if (result instanceof ReturnSignal) {
        console.log('=> ' + formatValue(result.value));
      } else if (result !== null && result !== undefined) {
        console.log('=> ' + formatValue(result));
      }
    } catch (err) {
      console.error('Error: ' + err.message);
    }

    buffer = '';
    rl.setPrompt('steel> ');
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('');
    process.exit(0);
  });
}

/**
 * Count unclosed block keywords in source to determine if we're in a multi-line block.
 */
function countOpenBlocks(source) {
  const tokens = source.split(/\s+/).filter(Boolean);
  let depth = 0;

  const openers = ['if', 'repeat', 'while', 'function'];
  const closers = ['end'];

  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (openers.includes(lower)) depth++;
    if (closers.includes(lower)) depth--;
  }

  return Math.max(0, depth);
}

module.exports = { interpret, evaluate, startRepl, formatValue, ReturnSignal };