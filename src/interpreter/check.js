import {
  evalBlock,
  evalSet,
  evalCall,
  evalFunction,
  evalAST,
  iEval,
} from "./eval.js";

///////////////////////////////////////////////////////////////////////////////
//                                    Eval                                   //
///////////////////////////////////////////////////////////////////////////////

function checkBlock(args, env) {
  let result;

  args.forEach((a) => {
    result = checkAST(a, env);
  });

  return result;
}

function checkCall(args, env) {
  let evaluatedChildren = args.map((c) => evalAST(c, env));
  let func = evaluatedChildren[0];
  return null;
}

// modified version of eval times which only evaluates the loop body once
function checkTimes(args, env) {
  if (args.length != 2) {
    throw new Error('Invalid "times" statement.');
  }

  let result = null;
  let body = args[1];

  console.log("checking times");

  if (args[0].type == "Number" || args[0].type == "Symbol") {
    const times = evalAST(args[0], env);
    // only eval body once
    result = checkAST(body, env);
  } else if (args[0].type == "Forever") {
    result = checkAST(body, env);
  } else {
    throw new Error('Invalid "times" statement.');
  }

  return result;
}

function checkIf(args, env) {
  if (args.length != 2 && args.length != 3) {
    throw new Error('Invalid "if" statement.');
  }

  let cond = evalAST(args[0], env);
  let thenExp = args[1];
  let elseExp = args[2];

  // eval both the and else
  checkAST(thenExp, env);
  return checkAST(elseExp, env);
}

function checkAST(ast, env) {
  let result;
  let args = ast.children;

  switch (ast.type) {
    case "Block":
      result = checkBlock(args, env);
      break;
    // statements
    case "TimesStatement":
      result = checkTimes(args, env);
      break;
    case "IfStatement":
      result = checkIf(args, env);
      break;
    case "SetStatement":
      result = evalSet(args, env);
      break;
    case "CallStatement":
      result = checkCall(args, env);
      break;
    // expressions
    case "CallExpression":
      result = checkCall(args, env);
      break;
    case "Function":
      result = checkFunction(args, env);
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

function iCheck(programAST, env) {
  if (programAST.type != "Program") {
    throw new Error("iCheck did not receive syntax tree with type 'Program'");
  }

  let result;

  programAST.children.forEach((a) => {
    result = checkAST(a, env);
  });

  return result;
}

export { checkIf, checkTimes, checkAST, iCheck };
