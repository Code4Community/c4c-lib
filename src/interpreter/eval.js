import { Env } from "./env.js";

///////////////////////////////////////////////////////////////////////////////
//                                    Eval                                   //
///////////////////////////////////////////////////////////////////////////////

function evalBlock(args, env) {
  let result;

  args.forEach((a) => {
    result = evalAST(a, env);
  });

  return result;
}

function evalSet(args, env) {
  let bindKey = args[0].value;
  let bindValueAST = args[1];
  let bindValue = evalAST(bindValueAST, env);

  if (bindValue === undefined) bindValue = null;

  env.set(bindKey, bindValue);
  return bindValue;
}

function evalTimes(args, env) {
  if (args.length != 2) {
    throw new Error('Invalid "times" statement.');
  }

  let result = null;
  let body = args[1];

  if (args[0].type == "Number" || args[0].type == "Symbol") {
    const times = evalAST(args[0], env);
    for (let i = 0; i < times; i++) {
      result = evalAST(body, env);
    }
  } else if (args[0].type == "Forever") {
    while (true) {
      evalAST(body, env);
    }
  } else {
    throw new Error('Invalid "times" statement.');
  }

  return result;
}

function evalIf(args, env) {
  if (args.length != 2 && args.length != 3) {
    throw new Error('Invalid "if" statement.');
  }

  let cond = evalAST(args[0], env);
  let thenExp = args[1];
  let elseExp = args[2];

  if (cond === null || cond === false) {
    return elseExp !== undefined ? evalAST(elseExp, env) : null;
  } else {
    return evalAST(thenExp, env);
  }
}

function evalFunction(args, env) {
  if (args.length != 2) {
    throw new Error('Invalid "function" statement.');
  }

  let fArgs = args[0].children.map((c) => c.value);
  let fBody = args[1];

  return function () {
    let fEnv = new Env(env, fArgs, arguments);
    return evalAST(fBody, fEnv);
  };
}

function evalCall(args, env) {
  let evaluatedChildren = args.map((c) => evalAST(c, env));
  let func = evaluatedChildren[0];
  return func.apply(null, evaluatedChildren.slice(1));
}

function evalAST(ast, env) {
  let result;
  let args = ast.children;

  switch (ast.type) {
    case "Block":
      result = evalBlock(args, env);
      break;
    // statements
    case "TimesStatement":
      result = evalTimes(args, env);
      break;
    case "IfStatement":
      result = evalIf(args, env);
      break;
    case "SetStatement":
      result = evalSet(args, env);
      break;
    case "CallStatement":
      result = evalCall(args, env);
      break;
    // expressions
    case "CallExpression":
      result = evalCall(args, env);
      break;
    case "Function":
      result = evalFunction(args, env);
      break;
    case "Symbol":
      result = env.get(ast.value);

      if (result === undefined) {
        throw new Error("Symbol '" + ast.value + "' not found in scope.");
      }

      break;
    // tokens
    case "Boolean":
    case "Number":
    case "Null":
    case "String":
      result = ast.value;
      break;
    case "SymbolList":
    default:
      throw new Error("Type '" + ast.type + "' unrecognized or unexpected.");
      break;
  }

  return result;
}

function iEval(programAST, env) {
  if (programAST.type != "Program") {
    throw new Error("iEval did not receive syntax tree with type 'Program'");
  }

  let result;

  programAST.children.forEach((a) => {
    result = evalAST(a, env);
  });

  return result;
}

export { evalIf, evalSet, evalCall, evalFunction, evalAST, iEval };
