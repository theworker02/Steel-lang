function parse(tokens) {

  let i = 0;



  function parseExpression() {

    const left = tokens[i++];



    if (tokens[i] && ['PLUS', 'MINUS', 'GT', 'LT', 'EQEQ'].includes(tokens[i].type)) {

      const operator = tokens[i++];

      const right = tokens[i++];



      return {

        type: 'BinaryExpression',

        left,

        operator: operator.type,

        right

      };

    }



    return left;

  }



  const ast = [];



  while (i < tokens.length) {

    const token = tokens[i];



    // set x to ...

    if (token.type === 'SET') {

      const name = tokens[i + 1].value;

      i += 3; // skip SET name TO



      const value = parseExpression();



      ast.push({

        type: 'VariableDeclaration',

        name,

        value

      });

    }



    // say ...

    else if (token.type === 'SAY') {

      i++;

      const value = parseExpression();



      ast.push({

        type: 'SayStatement',

        value

      });

    }



    // if condition then ... end

    else if (token.type === 'IF') {

      i++;



      const condition = parseExpression();



      i++; // skip THEN



      const body = [];



      while (tokens[i] && tokens[i].type !== 'END') {

        if (tokens[i].type === 'SAY') {

          i++;

          body.push({

            type: 'SayStatement',

            value: parseExpression()

          });

        } else {

          i++;

        }

      }



      i++; // skip END



      ast.push({

        type: 'IfStatement',

        condition,

        body

      });

    }



    else {

      i++;

    }

  }



  return ast;

}



module.exports = { parse };

