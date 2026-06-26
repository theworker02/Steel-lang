function parse(tokens) {
  let i = 0;

  function current() {
    return tokens[i] || null;
  }

  function expect(type, msg) {
    const tok = tokens[i];
    if (!tok || tok.type !== type) {
      const loc = tok ? ` (line ${tok.line})` : ' (end of input)';
      throw new SyntaxError(msg + loc);
    }
    return tokens[i++];
  }

  function peek() {
    return tokens[i] || null;
  }

  /**
   * Parse a full expression with operator precedence using Pratt parsing.
   * Precedence levels (low to high):
   *   1: OR
   *   2: AND
   *   3: NOT (unary prefix)
   *   4: ==, !=
   *   5: <, >, <=, >=
   *   6: +, -
   *   7: *, /, %
   */
  function parseExpression(minPrecedence) {
    if (minPrecedence === undefined) minPrecedence = 0;

    // Handle unary NOT
    if (peek() && peek().type === 'NOT') {
      const notTok = tokens[i++];
      const operand = parseExpression(3); // NOT binds tighter than AND/OR
      return {
        type: 'UnaryExpression',
        operator: 'NOT',
        operand: notTok,
        right: operand,
      };
    }

    // Handle unary minus for negative numbers
    if (peek() && peek().type === 'MINUS') {
      const next = tokens[i + 1];
      // Only treat as unary if next is a number, identifier, or another minus
      if (next && (next.type === 'NUMBER' || next.type === 'IDENTIFIER' || next.type === 'MINUS')) {
        const minusTok = tokens[i++];
        const operand = parseExpression(7); // High precedence for unary minus
        return {
          type: 'UnaryExpression',
          operator: 'NEGATE',
          operand: minusTok,
          right: operand,
        };
      }
    }

    let left = parseAtom();

    while (true) {
      const tok = peek();
      if (!tok) break;

      const prec = getPrecedence(tok.type);
      if (prec === null || prec < minPrecedence) break;

      const op = tokens[i++];
      const rightMin = prec + 1; // Left-associative
      const right = parseExpression(rightMin);

      left = {
        type: 'BinaryExpression',
        left,
        operator: op.type,
        right,
      };
    }

    return left;
  }

  function getPrecedence(tokenType) {
    switch (tokenType) {
      case 'OR': return 1;
      case 'AND': return 2;
      case 'EQEQ':
      case 'NEQ': return 4;
      case 'GT':
      case 'LT':
      case 'GTE':
      case 'LTE': return 5;
      case 'PLUS':
      case 'MINUS': return 6;
      case 'STAR':
      case 'SLASH':
      case 'PERCENT': return 7;
      default: return null;
    }
  }

  function parseAtom() {
    const tok = peek();
    if (!tok) {
      throw new SyntaxError('Expected expression (end of input)');
    }

    // Parenthesized expression: ( expr )
    if (tok.type === 'LPAREN') {
      i++; // skip (
      const expr = parseExpression(0);
      if (!peek() || peek().type !== 'RPAREN') {
        throw new SyntaxError(`Expected ')' (line ${tok.line})`);
      }
      i++; // skip )
      return expr;
    }

    i++; // advance
    if (tok.type === 'NUMBER') return tok;
    if (tok.type === 'STRING') return tok;
    if (tok.type === 'TRUE') return tok;
    if (tok.type === 'FALSE') return tok;
    if (tok.type === 'IDENTIFIER') {
      // Check for function call: name with arg1, arg2
      if (peek() && peek().type === 'IDENTIFIER' && peek().value === 'with') {
        i++; // skip 'with'
        const args = parseArgumentList();
        return {
          type: 'CallExpression',
          name: tok.value,
          args,
          line: tok.line,
        };
      }
      return tok;
    }
    throw new SyntaxError(`Unexpected token "${tok.type}" (line ${tok.line})`);
  }

  /**
   * Parse any statement and return its AST node.
   */
  function parseStatement() {
    const token = peek();
    if (!token) return null;

    // set <name> to <expr>
    if (token.type === 'SET') {
      i++;
      const nameTok = expect('IDENTIFIER', "'SET' expects a variable name");
      expect('TO', "'SET' expects 'TO' after variable name");
      const value = parseExpression();
      return {
        type: 'VariableDeclaration',
        name: nameTok.value,
        value,
        line: token.line,
      };
    }

    // say <expr>
    if (token.type === 'SAY') {
      i++;
      const value = parseExpression();
      return {
        type: 'SayStatement',
        value,
        line: token.line,
      };
    }

    // if <cond> then ... [else ...] end
    if (token.type === 'IF') {
      return parseIfStatement();
    }

    // repeat <count> times ... end
    if (token.type === 'REPEAT') {
      i++;
      const count = parseExpression();
      expect('TIMES', "'REPEAT' expects 'TIMES' after count");
      const body = parseBlock();
      expect('END', "'REPEAT' block missing 'END'");
      return {
        type: 'RepeatStatement',
        count,
        body,
        line: token.line,
      };
    }

    // while <cond> do ... end
    if (token.type === 'WHILE') {
      i++;
      const condition = parseExpression();
      expect('DO', "'WHILE' expects 'DO' after condition");
      const body = parseBlock();
      expect('END', "'WHILE' block missing 'END'");
      return {
        type: 'WhileStatement',
        condition,
        body,
        line: token.line,
      };
    }

    // function <name> does ... end
    if (token.type === 'FUNCTION') {
      i++;
      const nameTok = expect('IDENTIFIER', "'FUNCTION' expects a function name");

      // Parse optional parameters (comma-separated)
      const params = [];
      while (peek() && peek().type === 'IDENTIFIER' && peek().value !== 'does') {
        params.push(tokens[i++].value);
        // Skip comma between params
        if (peek() && peek().type === 'COMMA') {
          i++;
        }
      }

      expect('DOES', "'FUNCTION' expects 'DOES' after name/params");
      const body = parseBlock();
      return {
        type: 'FunctionDeclaration',
        name: nameTok.value,
        params,
        body,
        line: token.line,
      };
    }

    // return <expr>
    if (token.type === 'RETURN') {
      i++;
      let value = null;
      if (peek() && peek().type !== 'END') {
        value = parseExpression();
      }
      return {
        type: 'ReturnStatement',
        value,
        line: token.line,
      };
    }

    // Function call as a statement: <identifier>(<args>)
    if (token.type === 'IDENTIFIER') {
      const nameTok = tokens[i++];
      if (peek() && peek().type === 'IDENTIFIER' && peek().value === 'with') {
        // call-style: name with arg1, arg2
        i++; // skip 'with'
        const args = parseArgumentList();
        return {
          type: 'CallExpression',
          name: nameTok.value,
          args,
          line: nameTok.line,
        };
      }
      // Otherwise it's a bare identifier — treat as a call with no args
      return {
        type: 'CallExpression',
        name: nameTok.value,
        args: [],
        line: nameTok.line,
      };
    }

    // Skip unknown tokens
    i++;
    return null;
  }

  /**
   * Parse if/else-if/else chain.
   * Syntax: if ... then ... [else if ... then ...]* [else ...] end
   * Only the outermost call expects END.
   */
  function parseIfStatement(isChain) {
    const ifTok = expect('IF', "Expected 'IF'");
    const condition = parseExpression();
    expect('THEN', "'IF' expects 'THEN' after condition");
    const body = parseBlock();

    let elseBody = null;

    // Check for else or else-if
    if (peek() && peek().type === 'ELSE') {
      i++; // skip ELSE
      if (peek() && peek().type === 'IF') {
        // else-if: parse recursively, passing isChain=true so inner ifs don't eat END
        elseBody = [parseIfStatement(true)];
      } else {
        elseBody = parseBlock();
      }
    }

    // Only the outermost if (or the caller of the chain) expects END
    if (!isChain) {
      expect('END', "'IF' block missing 'END'");
    }

    return {
      type: 'IfStatement',
      condition,
      body,
      elseBody,
      line: ifTok.line,
    };
  }

  /**
   * Parse a block of statements until END or ELSE is encountered.
   */
  function parseBlock() {
    const body = [];
    while (peek() && peek().type !== 'END' && peek().type !== 'ELSE') {
      const stmt = parseStatement();
      if (stmt) body.push(stmt);
    }
    return body;
  }

  /**
   * Parse comma-separated arguments for function calls.
   * Steel syntax: arg1, arg2, arg3
   */
  function parseArgumentList() {
    const args = [];
    if (!peek() || (peek().type === 'END' || peek().type === 'ELSE' || peek().type === 'RPAREN')) {
      return args;
    }
    args.push(parseExpression());
    while (peek() && peek().type === 'COMMA') {
      i++; // skip comma
      args.push(parseExpression());
    }
    return args;
  }

  // Parse all statements
  const ast = [];
  while (i < tokens.length) {
    const stmt = parseStatement();
    if (stmt) ast.push(stmt);
  }

  return ast;
}

module.exports = { parse };