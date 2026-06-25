function interpret(ast, env) {

  for (let node of ast) {



    if (node.type === 'VariableDeclaration') {

      const value = evaluate(node.value, env);

      env.set(node.name, value);

    }



    if (node.type === 'SayStatement') {

      const value = evaluate(node.value, env);

      console.log(value);

    }



    if (node.type === 'IfStatement') {

      const condition = evaluate(node.condition, env);



      if (condition) {

        interpret(node.body, env);

      }

    }



  }

}



function evaluate(node, env) {

  if (node.type === 'NUMBER') return node.value;

  if (node.type === 'STRING') return node.value;



  if (node.type === 'IDENTIFIER') {

    return env.get(node.value);

  }



  if (node.type === 'BinaryExpression') {

    const left = evaluate(node.left, env);

    const right = evaluate(node.right, env);



    switch (node.operator) {

      case 'PLUS': return left + right;

      case 'MINUS': return left - right;

      case 'GT': return left > right;

      case 'LT': return left < right;

      case 'EQEQ': return left === right;

    }

  }



  return null;

}



module.exports = { interpret };


