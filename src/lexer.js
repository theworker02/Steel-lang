const KEYWORDS = {
  set: 'SET',
  to: 'TO',
  say: 'SAY',
  if: 'IF',
  then: 'THEN',
  else: 'ELSE',
  end: 'END',
  repeat: 'REPEAT',
  times: 'TIMES',
  while: 'WHILE',
  do: 'DO',
  function: 'FUNCTION',
  does: 'DOES',
  return: 'RETURN',
  and: 'AND',
  or: 'OR',
  not: 'NOT',
  true: 'TRUE',
  false: 'FALSE',
  ask: 'ASK',
};

const OPERATORS = {
  '+': 'PLUS',
  '-': 'MINUS',
  '*': 'STAR',
  '/': 'SLASH',
  '%': 'PERCENT',
  '>': 'GT',
  '<': 'LT',
  '>=': 'GTE',
  '<=': 'LTE',
  '==': 'EQEQ',
  '!=': 'NEQ',
  '(': 'LPAREN',
  ')': 'RPAREN',
  ',': 'COMMA',
};

function tokenize(input) {
  const tokens = [];
  const lines = input.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // Strip comments (# to end of line), but not inside strings
    let cleaned = '';
    let inString = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"' && (c === 0 || line[c - 1] !== '\\')) {
        inString = !inString;
      }
      if (ch === '#' && !inString) {
        break; // rest is comment
      }
      cleaned += ch;
    }

    // Tokenize the cleaned line — parentheses and commas are split separately
    const regex = /"[^"]*"|>=|<=|==|!=|[+\-*\/%><(),]|[^\s(),]+/g;
    const words = cleaned.match(regex) || [];

    for (let col = 0; col < words.length; col++) {
      const word = words[col];

      if (OPERATORS[word]) {
        tokens.push({ type: OPERATORS[word], line: lineNum + 1, col: col + 1 });
      }
      else if (word === 'true') {
        tokens.push({ type: 'TRUE', value: true, line: lineNum + 1, col: col + 1 });
      }
      else if (word === 'false') {
        tokens.push({ type: 'FALSE', value: false, line: lineNum + 1, col: col + 1 });
      }
      else if (!isNaN(word) && word !== '') {
        tokens.push({ type: 'NUMBER', value: Number(word), line: lineNum + 1, col: col + 1 });
      }
      else if (word.startsWith('"')) {
        // Process string with escape sequences
        const raw = word.slice(1, -1);
        const processed = raw
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"');
        tokens.push({
          type: 'STRING',
          value: processed,
          line: lineNum + 1,
          col: col + 1
        });
      }
      else if (KEYWORDS[word]) {
        tokens.push({ type: KEYWORDS[word], line: lineNum + 1, col: col + 1 });
      }
      else {
        tokens.push({
          type: 'IDENTIFIER',
          value: word,
          line: lineNum + 1,
          col: col + 1
        });
      }
    }
  }

  return tokens;
}

module.exports = { tokenize };