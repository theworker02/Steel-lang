class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

class BreakSignal {}
class ContinueSignal {}

function interpret(ast, env) {
  for (let node of ast) {
    const result = executeNode(node, env);
    if (result instanceof ReturnSignal) return result;
    if (result instanceof BreakSignal) return result;
  }
  return null;
}

function executeNode(node, env) {
  if (!node) return null;

  // Variable assignment: set x to 5
  if (node.type === 'Assignment') {
    const value = evaluate(node.value, env);
    if (node.target.type === 'IndexAssignment') {
      const arr = env.get(node.target.object);
      const idx = evaluate(node.target.index, env);
      if (!Array.isArray(arr)) throw new Error('Cannot index into non-array');
      arr[idx] = value;
    } else {
      env.set(node.target.name, value);
    }
    return value;
  }

  // Say statement
  if (node.type === 'SayStatement') {
    const value = evaluate(node.value, env);
    if (Array.isArray(value)) {
      console.log('[' + value.map(v => formatValue(v)).join(', ') + ']');
    } else {
      console.log(formatValue(value));
    }
    return value;
  }

  // If/ElseIf/Else
  if (node.type === 'IfStatement') {
    for (const branch of node.branches) {
      const condition = evaluate(branch.condition, env);
      if (condition) {
        return interpret(branch.body, env);
      }
    }
    if (node.elseBody) {
      return interpret(node.elseBody, env);
    }
    return null;
  }

  // While loop
  if (node.type === 'WhileStatement') {
    while (evaluate(node.condition, env)) {
      const result = interpret(node.body, env);
      if (result instanceof BreakSignal) break;
      if (result instanceof ReturnSignal) return result;
      // ContinueSignal just continues the loop
    }
    return null;
  }

  // For loop (from 0 to N by step)
  if (node.type === 'ForStatement') {
    const endVal = evaluate(node.end, env);
    const stepVal = evaluate(node.step, env);
    for (let x = 0; x < endVal; x += stepVal) {
      env.set(node.varName, x);
      const result = interpret(node.body, env);
      if (result instanceof BreakSignal) break;
      if (result instanceof ReturnSignal) return result;
    }
    return null;
  }

  // For-each loop
  if (node.type === 'ForEachStatement') {
    const collection = evaluate(node.collection, env);
    if (!Array.isArray(collection)) {
      throw new Error('FOR EACH requires an array or range');
    }
    for (const item of collection) {
      env.set(node.itemName, item);
      const result = interpret(node.body, env);
      if (result instanceof BreakSignal) break;
      if (result instanceof ReturnSignal) return result;
    }
    return null;
  }

  // Repeat N times
  if (node.type === 'RepeatStatement') {
    const count = evaluate(node.count, env);
    for (let c = 0; c < count; c++) {
      env.set('_repeat_i', c);
      const result = interpret(node.body, env);
      if (result instanceof BreakSignal) break;
      if (result instanceof ReturnSignal) return result;
    }
    return null;
  }

  // Function declaration
  if (node.type === 'FunctionDeclaration') {
    env.defineFunction(node.name, node.params, node.body, env);
    return null;
  }

  // Return statement
  if (node.type === 'ReturnStatement') {
    const value = evaluate(node.value, env);
    return new ReturnSignal(value);
  }

  // Break statement
  if (node.type === 'BreakStatement') {
    return new BreakSignal();
  }

  // Continue statement
  if (node.type === 'ContinueStatement') {
    return new ContinueSignal();
  }

  // Expression statement
  if (node.type === 'ExpressionStatement') {
    return evaluate(node.expression, env);
  }

  // Ask (input) statement
  if (node.type === 'AskStatement') {
    const prompt = evaluate(node.prompt, env);
    // Synchronous input is limited in Node; use readline sync
    const answer = require('readline-sync').question(formatValue(prompt));
    if (node.varName) {
      // Try to convert to number
      const num = Number(answer);
      env.set(node.varName, isNaN(num) ? answer : num);
    }
    return answer;
  }

  return null;
}

function evaluate(node, env) {
  if (!node) return null;

  // Number literal
  if (node.type === 'NUMBER') return node.value;

  // String literal
  if (node.type === 'STRING') return node.value;

  // Template string - evaluate interpolations
  if (node.type === 'TEMPLATE_STRING') {
    return node.value.replace(/\$\{([^}]+)\}/g, (_, expr) => {
      const tokens = require('./lexer').tokenize(expr);
      const parsed = require('./parser').parse(tokens);
      if (parsed.length > 0) {
        const stmt = parsed[0];
        const val = stmt.type === 'ExpressionStatement'
          ? evaluate(stmt.expression, env)
          : evaluate(stmt.value ? stmt.value : stmt, env);
        return formatValue(val);
      }
      return '';
    });
  }

  // Boolean literal
  if (node.type === 'BOOLEAN') return node.value;

  // Null literal
  if (node.type === 'NULL') return null;

  // Identifier
  if (node.type === 'IDENTIFIER') {
    return env.get(node.value);
  }

  // Array literal
  if (node.type === 'ARRAY_LITERAL') {
    return node.elements.map(el => evaluate(el, env));
  }

  // Index access (e.g., arr[0])
  if (node.type === 'IndexAccess') {
    const obj = evaluate(node.object, env);
    const idx = evaluate(node.index, env);
    if (Array.isArray(obj)) return obj[idx];
    if (typeof obj === 'string') return obj[idx];
    throw new Error('Cannot index into ' + typeof obj);
  }

  // Binary expression
  if (node.type === 'BinaryExpression') {
    const left = evaluate(node.left, env);
    const right = evaluate(node.right, env);

    switch (node.operator) {
      case 'PLUS':
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        return left + right;
      case 'MINUS': return left - right;
      case 'STAR': return left * right;
      case 'SLASH':
        if (right === 0) throw new Error('Division by zero');
        return left / right;
      case 'PERCENT':
      case 'MOD':
        if (right === 0) throw new Error('Modulo by zero');
        return left % right;
      case 'GT': return left > right;
      case 'LT': return left < right;
      case 'GTE': return left >= right;
      case 'LTE': return left <= right;
      case 'EQEQ': return left === right;
      case 'NEQ': return left !== right;
      case 'AND': return Boolean(left) && Boolean(right);
      case 'OR': return Boolean(left) || Boolean(right);
    }
  }

  // Unary expression
  if (node.type === 'UnaryExpression') {
    const operand = evaluate(node.operand, env);
    if (node.operator === 'NOT') return !operand;
    if (node.operator === 'MINUS') return -operand;
  }

  // Function call
  if (node.type === 'CallExpression') {
    const funcName = node.callee.value;
    const args = node.args.map(a => evaluate(a, env));

    // Check if it's a built-in function
    if (env.has(funcName)) {
      const fn = env.get(funcName);
      if (fn && fn.type === 'builtin') {
        return fn.fn(...args);
      }
      if (fn && fn.type === 'function') {
        const { env: fnEnv, body } = env.callFunction(funcName, args);
        const result = interpret(body, fnEnv);
        if (result instanceof ReturnSignal) return result.value;
        return null;
      }
    }

    throw new Error(`Function "${funcName}" is not defined`);
  }

  return null;
}

function formatValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return '[' + value.map(v => formatValue(v)).join(', ') + ']';
  return String(value);
}

module.exports = { interpret, evaluate, formatValue };