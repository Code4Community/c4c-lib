import { parser } from "../lang.js";
import { NodeProp } from "@lezer/common";

///////////////////////////////////////////////////////////////////////////////
//                                    Read                                   //
///////////////////////////////////////////////////////////////////////////////

function convertLezerTree(cursor) {
  const node = {
    type: cursor.name,
    from: cursor.from,
    to: cursor.to,
    children: [],
  };

  if (cursor.firstChild()) {
    do {
      const child = convertLezerTree(cursor);
      node.children.push(child);
    } while (cursor.nextSibling());

    cursor.parent();
  }

  return node;
}

function mapOverTree(tree, func) {
  func(tree);

  tree.children.forEach((t) => {
    mapOverTree(t, func);
  });
}

function parse(str) {
  const lezerTree = parser.parse(str);
  const tree = convertLezerTree(lezerTree.cursor());

  mapOverTree(tree, (t) => {
    const sourceString = str.substring(t.from, t.to);
    switch (t.type) {
      case "Number":
        t.value = Number.parseInt(sourceString);
        break;
      case "Boolean":
        t.value = sourceString == "true" ? true : false;
        break;
      case "Null":
        t.value = null;
        break;
      case "String":
        t.value = sourceString.substring(1, sourceString.length - 1);
        break;
      default:
        t.value = sourceString;
        break;
    }
  });

  return tree;
}

function iRead(str) {
  return parse(str);
}

///////////////////////////////////////////////////////////////////////////////
//                                    Eval                                   //
///////////////////////////////////////////////////////////////////////////////

class Env {
  constructor(parentEnv, symbols, values) {
    this.parentEnv = parentEnv;
    this.map = new Map();

    if (symbols && values) {
      symbols.forEach((s, i) => {
        this.map.set(s, values[i]);
      });
    }
  }

  set(key, value) {
    return this.map.set(key, value);
  }

  setFromObject(o) {
    Object.entries(o).forEach(([key, value]) => {
      this.map.set(key, value);
    });
  }

  get(symbol) {
    let localResult = this.map.get(symbol);

    if (localResult !== undefined) {
      return localResult;
    } else if (this.parentEnv !== undefined) {
      return this.parentEnv.get(symbol);
    } else {
      return undefined;
    }
  }
}

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

      if (result instanceof Function && result.length == 0) {
        result = result.apply(null, []);
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

///////////////////////////////////////////////////////////////////////////////
//                                 Interface                                 //
///////////////////////////////////////////////////////////////////////////////
const primitivesObject = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  print: (a) => console.log(a),
};

const topLevelEnv = new Env();
topLevelEnv.setFromObject(primitivesObject);

function define(key, value) {
  return topLevelEnv.set(key, value);
}

function run(str) {
  return iEval(iRead(str), topLevelEnv);
}

export { define, run };
