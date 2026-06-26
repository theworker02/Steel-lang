# Steel Language v2.0

[![npm](https://img.shields.io/npm/v/steel-lang-2)](https://www.npmjs.com/package/steel-lang-2)

Steel is a simple, readable programming language designed to be easy to learn and intuitive to use. It focuses on clean syntax, minimal complexity, and fast execution through a custom JavaScript interpreter.

## Install

```bash
npm install steel-lang-2
```

## Features

- **Variables**: `set x to 10`
- **Output**: `say "Hello!"`
- **Template Strings**: `` `Hello ${name}!` ``
- **Conditionals**: `if / elseif / else / end`
- **Loops**: `while / for / for each / repeat`
- **Functions**: `define name as (params) ... return value end` with closures and recursion
- **Arrays**: `[1, 2, 3]` with index access, `set arr[0] to val`
- **Full Operators**: `+ - * / % > < >= <= == != and or not`
- **Comments**: `// line comments`
- **Booleans**: `true`, `false`, `null`
- **Operator Precedence**: Proper precedence climbing (multiplication before addition, etc.)

## Built-in Functions

### Math
`abs`, `round`, `floor`, `ceil`, `sqrt`, `pow`, `min`, `max`, `random`, `pi`, `e`

### String
`len`, `upper`, `lower`, `trim`, `substring`, `replace`, `split`, `join`, `contains`, `charAt`, `indexOf`, `startsWith`, `endsWith`, `repeat`, `padStart`, `padEnd`

### Array
`push`, `pop`, `shift`, `unshift`, `reverse`, `sort`, `slice`, `includes`, `flat`, `range`

### Type
`type`, `isNumber`, `isString`, `isArray`, `toString`, `toNumber`

### Misc
`clock`, `sleep`, `input`

## Quick Start

```bash
git clone https://github.com/magnexis/Steel-lang.git
cd Steel-lang
node src/index.js examples/hello.steel
```

## Example

```steel
// Variables and types
set name to "Steel"
set version to 2

// Functions with recursion
define factorial as (n)
  if n <= 1 then
    return 1
  end
  return n * factorial(n - 1)
end

say factorial(10)  // 3628800

// Arrays and loops
set nums to [1, 2, 3, 4, 5]
for each n in nums
  say n * n
end

// Higher-order patterns
define sum as (arr)
  set total to 0
  for each val in arr
    set total to total + val
  end
  return total
end

say sum(range(1, 101))  // 5050
```

## Project Structure

```
steel-lang/
├── src/           # Language engine
│   ├── lexer.js       # Tokenizer
│   ├── parser.js      # Recursive descent parser with precedence climbing
│   ├── interpreter.js # Tree-walking interpreter
│   ├── environment.js # Scope, built-ins, function closures
│   └── index.js       # CLI entry point
├── examples/      # Example programs
│   ├── hello.steel
│   ├── logic.steel
│   ├── variables.steel
│   ├── features-demo.steel
│   ├── control-flow.steel
│   └── functions-arrays.steel
└── stl/           # VS Code extension
```

## License

MIT
