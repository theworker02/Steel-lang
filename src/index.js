const fs = require('fs');

const { tokenize } = require('./lexer');

const { parse } = require('./parser');

const { interpret } = require('./interpreter');

const Environment = require('./environment');



const file = process.argv[2];



if (!file) {

  console.log("Usage: node src/index.js <file.steel>");

  process.exit(1);

}



try {

  const code = fs.readFileSync(file, 'utf-8');



  const tokens = tokenize(code);

  const ast = parse(tokens);



  const env = new Environment();



  interpret(ast, env);

} catch (err) {

  console.error("Error:", err.message);

}