import { evalIf, evalSet, evalCall, evalFunction } from "./eval.js";
import { Env } from "./env.js";

function skipToLocation(ast, loc) {
  for (const i in loc) {
    console.log(i);
    ast = ast.children[i];
  }

  return ast;
}

function stepEvalBlock(args, loc, env) {
  let result;
  // index of this ast relative to the parent.
  let index = loc[0] || 0;
  let childPath = loc.slice(1);
  let newLoc;

  // Skip to place in block.
  for (var i = 0; i < childPath[0]; i++) {
    args.shift();
  }

  // Execute next item of block
  console.log("evalling item of block");
  [result, newLoc] = stepEvalAST(args.shift(), childPath, env);

  // newLoc points outside of the block's children
  if (newLoc[0] >= args.length) {
    newLoc = [index + 1];
  } else {
    newLoc.unshift(index);
  }

  return [result, newLoc];
}

function stepEvalTimes(args, loc, env) {
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

function stepEvalAST(ast, loc, env) {
  let result;
  // index of this ast relative to the parent.
  let index = loc[0] || 0;
  let args = ast.children;
  let newLoc;

  switch (ast.type) {
    case "Block":
      [result, newLoc] = stepEvalBlock(args, loc, env);
      break;
    // statements
    case "TimesStatement":
      [result, newLoc] = stepEvalTimes(args, loc, env);
      break;
    case "IfStatement":
      result = evalIf(args, env);
      break;
    case "SetStatement":
      result = evalSet(args, env);
      break;
    case "CallStatement":
      result = evalCall(args, env);
      console.log(index);
      newLoc = [index + 1];
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

  return [result, newLoc];
}

function stepEval(programAST, loc, env) {
  if (programAST.type != "Program") {
    throw new Error("iEval did not receive syntax tree with type 'Program'");
  }

  // technically the programs index relative to nothing.
  let index = loc[0] || 0;
  let result;
  let newLoc;

  // if loc[0] is not zero, we've reached outside the program.
  if (index == 0) {
    programAST.children.forEach((a) => {
      [result, newLoc] = stepEvalAST(a, loc, env);
    });

    if (newLoc[0] >= 1) {
      newLoc = [1];
    }
  } else {
    newLoc = [1];
  }

  return [result, newLoc];
}

export { skipToLocation, stepEvalBlock, stepEvalTimes, stepEvalAST, stepEval };
