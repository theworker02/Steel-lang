const KEYWORDS = {

  set: 'SET',

  to: 'TO',

  say: 'SAY',

  if: 'IF',

  then: 'THEN',

  end: 'END',

};

const OPERATORS = { 
    '+': 'PLUS',
    '-': 'MINUS',
    '>': 'GT',
    '<': 'LT',
    '==': 'EQEQ',
};



function tokenize(input) {

  const tokens = [];



  const regex = /"[^"]*"|==|[+\-<>]|[^\s]+/g;

  const words = input.match(regex) || [];



  for (let word of words) {

    if (OPERATORS[word]) {

      tokens.push({ type: OPERATORS[word] });

    }

    else if (!isNaN(word)) {

      tokens.push({ type: 'NUMBER', value: Number(word) });

    }

    else if (word.startsWith('"')) {

      tokens.push({

        type: 'STRING',

        value: word.slice(1, -1)

      });

    }

    else if (KEYWORDS[word]) {

      tokens.push({ type: KEYWORDS[word] });

    }

    else {

      tokens.push({

        type: 'IDENTIFIER',

        value: word

      });

    }

  }



  return tokens;

}



module.exports = { tokenize };

