/**
   | This traverses the AST step by step. Each step only evaluates one "atomic"
   | statement, like an assignment statement or a function call statement. The
   | stepping follows the semantics of the program. The order of statements
   | executed with stepEval is the same as the order of statements executed with
   | normal eval. To use it, you pass in the AST and an index / location into
   | the AST. It evaluates the first atomic element AT that index and returns
   | the result along with the index of the NEXT atomic element in the AST to
   | evaluate.

   | A tree location is a a list of integers. The absolute index of the root
   | node is [] or [0]. They are equivalent. The absolute index of the root
   | node's first child is [0, 0], the second child is [0, 1], etc. Sometimes an
   | index is expressed relative to a position in the tree. Assume the current
   | position is a block. The index of the block's first statement is [x, 0]
   | where x is the position of the block relative to its parent. If the current
   | context is a block that is the second child of its parent, the index for
   | the block's third child is [1, 2]. In keeping with the equivalence of []
   | and [0] for the root node, the index for the block's first child can be
   | expressed as [x, 0] or just [x]. Based on these rules, its also the case
   | that the first (bottom-left most statement) of the entire tree is []. This
   | is useful for pointing to the start of the program without knowing the
   | structure of the tree. The "real" index of the start will eventually be
   | unfolded as [0, 0, ..., 0] as stepEval runs.

   | Why do we need to pass the index relative to the parent to every stepEval
   | method? It's true that it is not necessary at all to step through that
   | function, but it is a compact way for a stepEval method to communicate when
   | done with its done with a segment of the tree. For instance, if a stepEval
   | is passed [4, 3] as a location and returns [5], its easy to see that we've
   | finished with the subtree rooted at [4] and have moved on to the sibling of
   | our tree (located at [5]). It could also work for each function to return a
   | separate boolean to say "I'm done", but they are not significantly
   | different.

   | stepEvalBlock(block, [], ns) evaluates the first item of the block and
   | returns the result of that expression along with the index of the next
   | expression to evaluate. So does stepEvalBlock(block, [x], ns), and
   | stepEvalBlock(block, [x, 0], ns). The next index can be either [x, 1] or
   | [x+1] depending on the length of the block. If the block has zero length,
   | any location argument will evaluate nothing, step out of the block, and
   | return [x+1].

   |--------------------------------------------------
*/

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

  if (args.length > 0) {
    // Execute next item of block
    [result, newLoc] = stepEvalAST(args.shift(), childPath, env);
  } else {
    newLoc = [blockLength];
  }

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

  // if (loc.length == 0) {
  //   console.log("First stepEvalTimes call");
  //   console.log("args", args);
  // }

  let result, childPath;

  let index = loc[0] || 0;

  // upon entry, the loc is [] or [0]. The loc for the items in the times
  // statement's block is [1, x] where 1 indicates that the block is this time
  // statement's second child. x is the index into the block.
  if (loc.slice(1).length != 0) {
    childPath = loc.slice(1);
  } else {
    // Get the current stack of iters, or just the empty stack if it hasn't been set yet
    let iters = env.get("__iters") || []
    
    // Add a 0 on the stack for the new times
    iters.push(0);

    env.set("__iters", iters);
    childPath = [1, 0];
  }

  let newLoc;

  let body = args[1];

  if (args[0].type == "Number" || args[0].type == "Symbol") {
    const times = evalAST(args[0], env);
    let iterStack = env.get("__iters");
    let iter = iterStack.pop();

    // If I don't put these brackets, it thinks I'm indexing iterStack.pop for some reason
    // Not sure why, and I also couldn't just put result, newLoc = ...
    {
      [result, newLoc] = stepEvalAST(body, childPath, env);
    }
    // console.log("FROM", childPath);
    // console.log("TO", newLoc);

    // if reached end of block
    if (newLoc[0] > 1) {
      iter += 1;

      if (iter >= times) {
        // if passed through loop enough times, move outside of loop
        newLoc = [index + 1];
      } else {
        // otherwise, move to the beginning of loop
        newLoc = [index, 1, 0];
        iterStack.push(iter);
      }
    } else {
      newLoc.unshift(index);
      iterStack.push(iter);
    }

    env.set("__iters", iterStack);
  } else if (args[0].type == "Forever") {
    [result, newLoc] = stepEvalAST(body, childPath, env);

    // if reached end of block
    if (newLoc[0] > 1) {
      // move to beginning of loop
      newLoc = [index, 1, 0];
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

    if (newLoc[0] > 1) {
      // move to next thing
      newLoc = [index + 1];
    } else {
      newLoc.unshift(index);
    }
  } else if (childPath[0] == 2) {
    if (elseExp) {
      [result, newLoc] = stepEvalAST(elseExp, childPath, env);

      if (newLoc[0] > 2) {
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