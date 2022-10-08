import { evalSet, evalCall, evalFunction, evalAST } from "./eval.js";
import { Env } from "./env.js";

function skipToLocation(ast, loc) {
  for (const i in loc) {
    ast = ast.children[i];
  }

  return ast;
}

function stepEvalBlock(args, loc, env) {
  let result;
  // index of this ast relative to the parent.
  let index = loc[0] || 0;
  let blockLength = args.length;
  let childPath = loc.slice(1);
  let newLoc;

  // Skip to place in block.
  for (var i = 0; i < childPath[0]; i++) {
    args.shift();
  }

  // Execute next item of block
  [result, newLoc] = stepEvalAST(args.shift(), childPath, env);

  // newLoc points outside of the block's children
  if (newLoc[0] >= blockLength) {
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

  let result, childPath;
  let index = loc[0] || 0;
  if (loc.slice(1).length != 0) {
    childPath = loc.slice(1);
  } else {
    childPath = [1, 0];
  }

  let newLoc;

  let body = args[1];

  if (args[0].type == "Number" || args[0].type == "Symbol") {
    const times = evalAST(args[0], env);
    let iter = 0;

    if (env.get("iter0")) {
      iter = env.get("iter0");
    }

    [result, newLoc] = stepEvalAST(body, childPath, env);

    // if reached end of block
    if (newLoc[0] >= index + 1) {
      iter += 1;

      if (iter > times) {
        // if passed through loop enough times, move outside of loop
        newLoc = [index + 1];
      } else {
        // otherwise, move to the beginning of loop
        newLoc = [index, 0];
      }
    } else {
      newLoc.unshift(index);
    }

    env.set("iter0", iter);
  } else if (args[0].type == "Forever") {
    [result, newLoc] = stepEvalAST(body, childPath, env);

    // if reached end of block
    if (newLoc[0] >= index + 1) {
      // move to beginning of loop
      newLoc = [index, 0];
    } else {
      newLoc.unshift(index);
    }
  } else {
    throw new Error('Invalid "times" statement.');
  }

  return [result, newLoc];
}

function stepEvalIf(args, loc, env) {
  if (args.length != 2 && args.length != 3) {
    throw new Error('Invalid "if" statement.');
  }

  let result, childPath, cond;
  let newLoc;
  let index = loc[0] || 0;

  if (loc.slice(1).length != 0) {
    childPath = loc.slice(1);
  } else {
    childPath = [0];
  }

  if (childPath[0] == 0) {
    cond = evalAST(args[0], env);
    if (cond === null || cond === false) {
      childPath = [2, 0];
    } else {
      childPath = [1, 0];
    }
  }

  let elseExp = args[2];

  if (childPath[0] == 1) {
    let thenExp = args[1];
    [result, newLoc] = stepEvalAST(thenExp, childPath, env);

    if (newLoc[0] >= thenExp.length) {
      // move to next thing
      newLoc = [index + 1];
    } else {
      newLoc.unshift(index);
    }
  } else if (childPath[0] == 2) {
    if (elseExp) {
      [result, newLoc] = stepEvalAST(elseExp, childPath, env);

      if (newLoc[0] >= elseExp.length) {
        // move to next thing
        newLoc = [index + 1];
      } else {
        newLoc.unshift(index);
      }
    } else {
      result = null;
      newLoc = [index + 1];
    }
  } else {
    throw new Error("Invalid childpath.");
  }

  return [result, newLoc];
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
      [result, newLoc] = stepEvalIf(args, loc, env);
      break;
    case "SetStatement":
      result = evalSet(args, env);
      newLoc = [index + 1];
      break;
    case "CallStatement":
      result = evalCall(args, env);
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
