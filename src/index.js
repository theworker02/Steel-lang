const fs = require('fs');
const { tokenize } = require('./lexer');
const { parse } = require('./parser');
const { interpret, startRepl } = require('./interpreter');
const Environment = require('./environment');

const file = process.argv[2];

// No file argument — start REPL
if (!file) {
  startRepl();
  process.exit(0);
}

// Flags
const flags = process.argv.slice(3);
const showTokens = flags.includes('--tokens');
const showAst = flags.includes('--ast');
const showVersion = flags.includes('--version') || flags.includes('-v');
const showHelp = flags.includes('--help') || flags.includes('-h');

if (showVersion) {
  console.log('Steel Language v2.0.0');
  process.exit(0);
}

if (showHelp) {
  console.log(`
Steel Language — A simple, human-readable scripting language v2.0.0

Usage:
  node src/index.js                  Start interactive REPL
  node src/index.js <file.steel>     Run a Steel program
  node src/index.js <file.steel> --tokens   Show token output
  node src/index.js <file.steel> --ast      Show AST output

Language Features:
  Variables:    set x to 10
  Output:       say "Hello, World!"
  Arithmetic:   set y to x * 3 + 1
  Comparison:   if x > 5 then say "big" end
  Logic:        if x > 0 and x < 10 then ... end
  Strings:      set msg to "hello" + " world"
  Comments:     # this is a comment
  Boolean:      set flag to true
  Negation:     set inv to not flag

  Conditionals: if x > 5 then
                   say "big"
                 else if x == 0 then
                   say "zero"
                 else
                   say "small"
                 end

  Loops:        repeat 5 times
                   say "hello"
                 end

                 set i to 0
                 while i < 10 do
                   say i
                   set i to i + 1
                 end

  Functions:    function greet with name does
                   say "Hello, " + name + "!"
                 end
                 greet with "World"

                 function add a, b does
                   return a + b
                 end
                 set sum to add with 3, 4
                 say sum

  Built-ins:    length of "hello"    → 5
                 upper "hello"        → "HELLO"
                 lower "HELLO"        → "hello"
                 abs -5              → 5
                 round 3.7           → 4
                 sqrt 16             → 4
                 random_int 1, 100   → random integer
                 type_of 42          → "number"
                 to_string 42        → "42"

  Operators:    + - * / %  > < >= <= == !=  and or not
`);
  process.exit(0);
}

try {
  const code = fs.readFileSync(file, 'utf-8');

  const tokens = tokenize(code);

  if (showTokens) {
    console.log('=== Tokens ===');
    for (const t of tokens) {
      const val = t.value !== undefined ? ` = ${JSON.stringify(t.value)}` : '';
      console.log(`  ${t.type}${val}  (line ${t.line})`);
    }
    console.log('');
  }

  const ast = parse(tokens);

  if (showAst) {
    console.log('=== AST ===');
    console.log(JSON.stringify(ast, null, 2));
    console.log('');
  }

  const env = new Environment();
  interpret(ast, env);

} catch (err) {
  const lineInfo = err.line ? ` at line ${err.line}` : '';
  console.error(`Error${lineInfo}: ${err.message}`);
  process.exit(1);
}