const KEYWORDS = {
  set: 'SET',
  to: 'TO',
  say: 'SAY',
  if: 'IF',
  then: 'THEN',
  else: 'ELSE',
  elseif: 'ELSEIF',
  end: 'END',
  while: 'WHILE',
  do: 'DO',
  for: 'FOR',
  each: 'EACH',
  in: 'IN',
  step: 'STEP',
  define: 'DEFINE',
  as: 'AS',
  return: 'RETURN',
  ask: 'ASK',
  and: 'AND',
  or: 'OR',
  not: 'NOT',
  true: 'TRUE',
  false: 'FALSE',
  null: 'NULL_LIT',
  repeat: 'REPEAT',
  times: 'TIMES',
  break: 'BREAK',
  continue: 'CONTINUE',
  array: 'ARRAY',
  of: 'OF',
  mod: 'MOD',
};

const SYMBOLS = {
  '(': 'LPAREN',
  ')': 'RPAREN',
  '[': 'LBRACKET',
  ']': 'RBRACKET',
  ',': 'COMMA',
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
};

function tokenize(input) {
  const tokens = [];
  const lines = input.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const raw = lines[lineNum];
    const line = raw.replace(/\/\/.*$/, '').trim(); // strip line comments

    if (!line) continue;

    const regex = /`[^`]*`|"[^"]*"|'[^']*'|==|!=|>=|<=|[+\-*/%<>()\[\],]|[^\s+\-*/%<>()\[\],"'`]+/g;
    const words = line.match(regex) || [];

    for (let w = 0; w < words.length; w++) {
      const word = words[w];

      // Line comment already stripped above, but handle block comments inline
      if (word === '/*') {
        // Skip until closing */
        let rest = words.slice(w + 1).join(' ');
        // Also check remaining lines
        for (let ln = lineNum + 1; ln < lines.length; ln++) {
          rest += ' ' + lines[ln];
          if (rest.includes('*/')) break;
        }
        break; // skip rest of this line
      }

      if (OPERATORS[word]) {
        tokens.push({ type: OPERATORS[word], line: lineNum + 1 });
      } else if (SYMBOLS[word]) {
        tokens.push({ type: SYMBOLS[word], line: lineNum + 1 });
      } else if (word.startsWith('`') && word.endsWith('`')) {
        // Template string - store raw for later interpolation
        tokens.push({
          type: 'TEMPLATE_STRING',
          value: word.slice(1, -1),
          line: lineNum + 1,
        });
      } else if (word.startsWith('"')) {
        tokens.push({
          type: 'STRING',
          value: word.slice(1, -1),
          line: lineNum + 1,
        });
      } else if (!isNaN(word) && word !== '') {
        tokens.push({ type: 'NUMBER', value: Number(word), line: lineNum + 1 });
      } else if (KEYWORDS[word]) {
        tokens.push({ type: KEYWORDS[word], line: lineNum + 1 });
      } else if (word.startsWith('[')) {
        // Array literal - collect all tokens until closing bracket
        const arrContent = word.slice(1);
        if (arrContent.endsWith(']')) {
          // Single-token array like [1,2,3]
          const inner = arrContent.slice(0, -1).trim();
          if (inner) {
            const items = inner.split(',').map(s => s.trim()).filter(Boolean);
            const elements = items.map(item => {
              if (!isNaN(item)) return { type: 'NUMBER', value: Number(item), line: lineNum + 1 };
              if (item.startsWith('"')) return { type: 'STRING', value: item.slice(1, -1), line: lineNum + 1 };
              if (item === 'true' || item === 'false') return { type: 'TRUE', line: lineNum + 1 };
              return { type: 'IDENTIFIER', value: item, line: lineNum + 1 };
            });
            tokens.push({ type: 'ARRAY_LITERAL', elements, line: lineNum + 1 });
          } else {
            tokens.push({ type: 'ARRAY_LITERAL', elements: [], line: lineNum + 1 });
          }
        } else {
          // Multi-token array - collect until ]
          const elements = [];
          if (arrContent.trim()) {
            const firstItems = arrContent.split(',').map(s => s.trim()).filter(Boolean);
            for (const item of firstItems) {
              if (!isNaN(item)) elements.push({ type: 'NUMBER', value: Number(item), line: lineNum + 1 });
              else if (item.startsWith('"')) elements.push({ type: 'STRING', value: item.slice(1, -1), line: lineNum + 1 });
              else if (item === 'true' || item === 'false') elements.push({ type: 'TRUE', line: lineNum + 1 });
              else elements.push({ type: 'IDENTIFIER', value: item, line: lineNum + 1 });
            }
          }
          // Continue collecting on subsequent words until ]
          w++;
          while (w < words.length) {
            if (words[w] === ']') break;
            if (words[w] === ',') { w++; continue; }
            const item = words[w];
            if (!isNaN(item)) elements.push({ type: 'NUMBER', value: Number(item), line: lineNum + 1 });
            else if (item.startsWith('"')) elements.push({ type: 'STRING', value: item.slice(1, -1), line: lineNum + 1 });
            else if (item === 'true' || item === 'false') elements.push({ type: 'TRUE', line: lineNum + 1 });
            else elements.push({ type: 'IDENTIFIER', value: item, line: lineNum + 1 });
            w++;
          }
          tokens.push({ type: 'ARRAY_LITERAL', elements, line: lineNum + 1 });
        }
      } else if (word.endsWith(']') && word.length > 1) {
        // Array access like arr[0]
        const bracketPos = word.indexOf('[');
        const arrName = word.slice(0, bracketPos);
        const indexStr = word.slice(bracketPos + 1, -1).trim();
        tokens.push({ type: 'IDENTIFIER', value: arrName, line: lineNum + 1 });
        let indexToken;
        if (!isNaN(indexStr)) indexToken = { type: 'NUMBER', value: Number(indexStr), line: lineNum + 1 };
        else indexToken = { type: 'IDENTIFIER', value: indexStr, line: lineNum + 1 };
        tokens.push({ type: 'LBRACKET', line: lineNum + 1 });
        tokens.push(indexToken);
        tokens.push({ type: 'RBRACKET', line: lineNum + 1 });
      } else if (word.includes('[') && !word.startsWith('[')) {
        // Array access arr[index]
        const bracketPos = word.indexOf('[');
        const arrName = word.slice(0, bracketPos);
        const indexStr = word.slice(bracketPos + 1, -1).trim();
        tokens.push({ type: 'IDENTIFIER', value: arrName, line: lineNum + 1 });
        let indexToken;
        if (!isNaN(indexStr)) indexToken = { type: 'NUMBER', value: Number(indexStr), line: lineNum + 1 };
        else indexToken = { type: 'IDENTIFIER', value: indexStr, line: lineNum + 1 };
        tokens.push({ type: 'LBRACKET', line: lineNum + 1 });
        tokens.push(indexToken);
        tokens.push({ type: 'RBRACKET', line: lineNum + 1 });
      } else {
        tokens.push({
          type: 'IDENTIFIER',
          value: word,
          line: lineNum + 1,
        });
      }
    }
  }

  return tokens;
}

module.exports = { tokenize };