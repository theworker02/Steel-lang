const fs = require('fs');
const { tokenize } = require('./lexer');
const { parse } = require('./parser');
const { interpret } = require('./interpreter');
const Environment = require('./environment');

const file = process.argv[2];

if (!file) {
  console.log("Steel Language Interpreter v2.0.0");
  console.log("Usage: node src/index.js <file.steel>");
  console.log("");
  console.log("Features:");
  console.log("  Variables:    set x to 10");
  console.log("  Output:       say \"Hello!\"");
  console.log("  Conditionals: if x > 5 then ... elseif x > 3 then ... else ... end");
  console.log("  Loops:        while x > 0 do ... end");
  console.log("  For loops:    for i to 10 ... end | for each item in arr ... end");
  console.log("  Repeat:       repeat 5 times ... end");
  console.log("  Functions:    define greet as (name) ... return \"Hello \" + name end");
  console.log("  Arrays:       set nums to [1, 2, 3, 4, 5]");
  console.log("  Operators:    + - * / % > < >= <= == != and or not");
  console.log("  Comments:     // this is a comment");
  console.log("  Templates:    say `Hello ${name}!`");
  console.log("  Booleans:     true, false, null");
  console.log("  Built-ins:    abs, round, floor, ceil, sqrt, pow, min, max, random");
  console.log("  Strings:      len, upper, lower, trim, substring, replace, split, join");
  console.log("  Arrays:       push, pop, shift, unshift, reverse, sort, slice, includes");
  console.log("  Types:        type, isNumber, isString, isArray, toString, toNumber");
  console.log("  Misc:         pi, e, clock, sleep, input, range");
  process.exit(1);
}

try {
  const code = fs.readFileSync(file, 'utf-8');
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const env = Environment.createGlobal();
  interpret(ast, env);
} catch (err) {
  console.error("Error: " + err.message);
  process.exit(1);
}