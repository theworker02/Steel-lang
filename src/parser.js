function parse(tokens) {
  let i = 0;

  function peek() {
    return tokens[i] || null;
  }

  function expect(type) {
    if (!tokens[i] || tokens[i].type !== type) {
      const got = tokens[i] ? tokens[i].type : 'EOF';
      throw new SyntaxError(`Expected ${type} but got ${got} (line ${tokens[i] ? tokens[i].line : '?'})`);
    }
    return tokens[i++];
  }

  const PREC = {
    'OR': 1, 'AND': 2,
    'EQEQ': 3, 'NEQ': 3,
    'GT': 4, 'LT': 4, 'GTE': 4, 'LTE': 4,
    'PLUS': 5, 'MINUS': 5,
    'STAR': 6, 'SLASH': 6, 'PERCENT': 6, 'MOD': 6,
  };

  function parseExpression() {
    if (i >= tokens.length) {
      throw new SyntaxError('Unexpected end of input');
    }

    // Handle unary not / minus
    if (tokens[i] && (tokens[i].type === 'NOT' || tokens[i].type === 'MINUS')) {
      const op = tokens[i++];
      const operand = parsePrimary();
      const result = {
        type: 'UnaryExpression',
        operator: op.type === 'NOT' ? 'NOT' : 'MINUS',
        operand,
      };
      while (tokens[i] && PREC[tokens[i].type] >= 1) {
        const binOp = tokens[i++];
        const right = parseExpr(PREC[binOp.type] + 1);
        return { type: 'BinaryExpression', left: result, operator: binOp.type, right };
      }
      return result;
    }

    return parseExpr(0);
  }

  function parseExpr(minPrec) {
    let left = parsePrimaryWithPostfix();
    while (tokens[i] && PREC[tokens[i].type] >= minPrec) {
      const op = tokens[i++];
      const nextMinPrec = PREC[op.type] + 1;
      const right = parseExpr(nextMinPrec);
      left = { type: 'BinaryExpression', left, operator: op.type, right };
    }
    return left;
  }

  function parsePrimaryWithPostfix() {
    let left = parsePrimary();
    while (tokens[i]) {
      if (tokens[i].type === 'LBRACKET') {
        i++; // skip [
        const index = parseExpression();
        expect('RBRACKET');
        left = { type: 'IndexAccess', object: left, index };
      } else if (tokens[i].type === 'LPAREN' && left.type === 'IDENTIFIER') {
        i++; // skip (
        const args = [];
        if (tokens[i] && tokens[i].type !== 'RPAREN') {
          args.push(parseExpression());
          while (tokens[i] && tokens[i].type === 'COMMA') {
            i++; // skip comma
            args.push(parseExpression());
          }
        }
        expect('RPAREN');
        left = { type: 'CallExpression', callee: left, args };
      } else {
        break;
      }
    }
    return left;
  }

  function parsePrimary() {
    const token = tokens[i];
    if (!token) throw new SyntaxError('Unexpected end of input');

    if (token.type === 'NUMBER') {
      i++;
      return token;
    }
    if (token.type === 'STRING') {
      i++;
      return token;
    }
    if (token.type === 'TEMPLATE_STRING') {
      i++;
      return token;
    }
    if (token.type === 'TRUE') {
      i++;
      return { type: 'BOOLEAN', value: true };
    }
    if (token.type === 'FALSE') {
      i++;
      return { type: 'BOOLEAN', value: false };
    }
    if (token.type === 'NULL_LIT') {
      i++;
      return { type: 'NULL' };
    }
    if (token.type === 'IDENTIFIER') {
      i++;
      return token;
    }
    // Keywords used as identifiers in expression context (e.g., repeat("Ha", 3))
    const KEYWORD_AS_IDENT = {
      'REPEAT': 'repeat', 'ARRAY': 'array', 'OF': 'of',
      'IN': 'in', 'STEP': 'step', 'TIMES': 'times', 'MOD': 'mod',
    };
    if (KEYWORD_AS_IDENT[token.type]) {
      i++;
      return { type: 'IDENTIFIER', value: KEYWORD_AS_IDENT[token.type] };
    }
    // Array literal [1, 2, 3]
    if (token.type === 'LBRACKET') {
      i++; // skip [
      const elements = [];
      if (tokens[i] && tokens[i].type !== 'RBRACKET') {
        elements.push(parseExpression());
        while (tokens[i] && tokens[i].type === 'COMMA') {
          i++; // skip comma
          if (tokens[i] && tokens[i].type !== 'RBRACKET') {
            elements.push(parseExpression());
          }
        }
      }
      expect('RBRACKET');
      return { type: 'ARRAY_LITERAL', elements };
    }
    if (token.type === 'LPAREN') {
      i++; // skip (
      const expr = parseExpression();
      expect('RPAREN');
      return expr;
    }
    throw new SyntaxError(`Unexpected token ${token.type} (line ${token.line})`);
  }

  // Parse a block of statements until a terminator
  function parseBlock(terminators = ['END', 'ELSE', 'ELSEIF']) {
    const body = [];

    while (tokens[i] && !terminators.includes(tokens[i].type)) {
      const stmt = parseStatement();
      if (stmt) body.push(stmt);
    }

    return body;
  }

  function parseStatement() {
    const token = tokens[i];
    if (!token) return null;

    // set x to ...
    if (token.type === 'SET') {
      if (!tokens[i + 1] || tokens[i + 1].type !== 'IDENTIFIER') {
        throw new SyntaxError("'SET' expects a variable name");
      }
      const name = tokens[i + 1].value;

      if (tokens[i + 2] && tokens[i + 2].type === 'LBRACKET') {
        // Index assignment: set arr[idx] to val
        i += 2; // skip SET name
        i++; // skip [
        const index = parseExpression();
        expect('RBRACKET');
        expect('TO');
        const value = parseExpression();
        return { type: 'Assignment', target: { type: 'IndexAssignment', object: name, index }, value };
      }

      if (!tokens[i + 2] || tokens[i + 2].type !== 'TO') {
        throw new SyntaxError("'SET' expects 'TO' after variable name");
      }

      i += 3; // skip SET name TO
      const value = parseExpression();
      return { type: 'Assignment', target: { type: 'VariableAssignment', name }, value };
    }

    // say ...
    if (token.type === 'SAY') {
      i++;
      const value = parseExpression();
      return { type: 'SayStatement', value };
    }

    // if condition then ... [elseif ... then ...] [else ...] end
    if (token.type === 'IF') {
      i++;
      const condition = parseExpression();
      expect('THEN');

      const body = parseBlock(['END', 'ELSE', 'ELSEIF']);
      const branches = [{ condition, body }];

      // Handle elseif chains
      while (tokens[i] && tokens[i].type === 'ELSEIF') {
        i++; // skip ELSEIF
        const elifCond = parseExpression();
        expect('THEN');
        const elifBody = parseBlock(['END', 'ELSE', 'ELSEIF']);
        branches.push({ condition: elifCond, body: elifBody });
      }

      // Handle else
      let elseBody = null;
      if (tokens[i] && tokens[i].type === 'ELSE') {
        i++; // skip ELSE
        elseBody = parseBlock(['END']);
      }

      expect('END');
      return { type: 'IfStatement', branches, elseBody };
    }

    // while condition do ... end
    if (token.type === 'WHILE') {
      i++;
      const condition = parseExpression();
      expect('DO');
      const body = parseBlock(['END']);
      expect('END');
      return { type: 'WhileStatement', condition, body };
    }

    // for each item in collection ... end
    // for x from 1 to 10 ... end
    // for x from 1 to 10 step 2 ... end
    if (token.type === 'FOR') {
      i++;
      if (tokens[i] && tokens[i].type === 'EACH') {
        // for each item in collection ... end
        i++; // skip EACH
        const itemName = expect('IDENTIFIER').value;
        expect('IN');
        const collection = parseExpression();
        const body = parseBlock(['END']);
        expect('END');
        return { type: 'ForEachStatement', itemName, collection, body };
      } else {
        // for x from/to
        const varName = expect('IDENTIFIER').value;
        expect('TO');
        const start = { type: 'NUMBER', value: 0 }; // implicit start 0
        const end = parseExpression();
        let step = { type: 'NUMBER', value: 1 };
        if (tokens[i] && tokens[i].type === 'STEP') {
          i++; // skip STEP
          step = parseExpression();
        }
        const body = parseBlock(['END']);
        expect('END');
        return { type: 'ForStatement', varName, start, end, step, body };
      }
    }

    // repeat N times ... end (not a function call)
    if (token.type === 'REPEAT' && tokens[i + 1] && tokens[i + 1].type !== 'LPAREN') {
      i++;
      const count = parseExpression();
      if (tokens[i] && tokens[i].type === 'TIMES') {
        i++; // skip TIMES (optional)
      }
      const body = parseBlock(['END']);
      expect('END');
      return { type: 'RepeatStatement', count, body };
    }

    // define name as (params) ... end
    if (token.type === 'DEFINE') {
      i++;
      const name = expect('IDENTIFIER').value;
      const params = [];

      // Check for parameters: as (param1, param2)
      if (tokens[i] && tokens[i].type === 'AS') {
        i++; // skip AS
        if (tokens[i] && tokens[i].type === 'LPAREN') {
          i++; // skip (
          if (tokens[i] && tokens[i].type !== 'RPAREN') {
            params.push(expect('IDENTIFIER').value);
            while (tokens[i] && tokens[i].type === 'COMMA') {
              i++; // skip comma
              params.push(expect('IDENTIFIER').value);
            }
          }
          expect('RPAREN');
        }
      }

      const body = parseBlock(['END']);
      expect('END');
      return { type: 'FunctionDeclaration', name, params, body };
    }

    // return value
    if (token.type === 'RETURN') {
      i++;
      let value = { type: 'NULL' };
      if (tokens[i] && !['END', 'ELSE', 'ELSEIF'].includes(tokens[i].type)) {
        value = parseExpression();
      }
      return { type: 'ReturnStatement', value };
    }

    // break
    if (token.type === 'BREAK') {
      i++;
      return { type: 'BreakStatement' };
    }

    // continue
    if (token.type === 'CONTINUE') {
      i++;
      return { type: 'ContinueStatement' };
    }

    // ask "prompt" into var
    if (token.type === 'ASK') {
      i++;
      const prompt = parseExpression();
      let varName = null;
      // Check for "into" keyword or just use next identifier
      if (tokens[i] && tokens[i].type === 'IDENTIFIER') {
        varName = tokens[i].value;
        i++;
      }
      return { type: 'AskStatement', prompt, varName };
    }

    // Expression statement (bare expression or function call)
    const EXPR_STARTERS = ['IDENTIFIER', 'NUMBER', 'STRING', 'TEMPLATE_STRING', 'TRUE', 'FALSE',
         'NULL_LIT', 'LBRACKET', 'LPAREN', 'NOT', 'MINUS',
         'REPEAT', 'ARRAY', 'OF', 'IN', 'STEP', 'TIMES', 'MOD'];
    if (EXPR_STARTERS.includes(token.type)) {
      const expr = parseExpression();
      return { type: 'ExpressionStatement', expression: expr };
    }

    // Skip unknown tokens
    i++;
    return null;
  }

  const ast = [];
  while (i < tokens.length) {
    const stmt = parseStatement();
    if (stmt) ast.push(stmt);
  }

  return ast;
}

module.exports = { parse };