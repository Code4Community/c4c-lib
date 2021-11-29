import { parser } from "./lang.js";
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

    if (localResult != undefined) {
      return localResult;
    } else if (this.parentEnv != undefined) {
      return this.parentEnv.get(symbol);
    } else {
      return null;
    }
  }
}

function evalLet(args, env) {
  let letEnv = new Env(env);
  let bindList = args[0];

  if (bindList.type != "list") {
    throw new Error("First argument to bind must be a list.");
  }

  bindList.children.forEach((bindAST) => {
    if (bindAST.type != "list" && bindAST.children.length != 2) {
      throw new Error("First argument to bind is invalid.");
    }

    let bindKey = bindAST.children.shift();

    if (bindKey.type != "symbol") {
      throw new Error("Cannot bind to Non-Symbol.");
    }

    let bindValue = bindAST.children.shift();
    letEnv.set(bindKey.value, evalAST(bindValue, env));
  });

  let body = args[1];
  return evalAST(body, letEnv);
}

function evalSet(args, env) {
  let bindKey = args[0].value;
  let bindValueAST = args[1];
  let bindValue = evalAST(bindValueAST, env);
  env.set(bindKey, bindValue);
  return bindValue;
}

function evalDo(args, env) {
  let result;

  args.forEach((a) => {
    result = evalAST(a, env);
  });

  return result;
}

function evalIf(args, env) {
  if (args.length != 2 && args.length != 3) {
    throw new Error('Invalid "if" call.');
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
    throw new Error('Invalid "function" call.');
  }

  let fArgs = args[0].children.map((c) => c.value);
  let fBody = args[1];

  return function () {
    let fEnv = new Env(env, fArgs, arguments);
    return evalAST(fBody, fEnv);
  };
}

function evalList(ast, env) {
  let f = ast.children[0];
  let args = ast.children.slice(1);
  let result;

  switch (f.value) {
    case "let":
      result = evalLet(args, env);
      break;
    case "set!":
      result = evalSet(args, env);
      break;
    case "do":
      result = evalDo(args, env);
      break;
    case "if":
      result = evalIf(args, env);
      break;
    case "function":
      result = evalFunction(args, env);
      break;
    default:
      let evaluatedChildren = ast.children.map((c) => evalAST(c, env));
      let func = evaluatedChildren[0];
      result = func.apply(null, evaluatedChildren.slice(1));
      break;
  }

  return result;
}

function evalAST(ast, env) {
  let result;

  switch (ast.type) {
    case "List":
      result = evalList(ast, env);
      break;
    case "Null":
    case "Boolean":
    case "Number":
      result = ast.value;
      break;
    case "Symbol":
      if ((result = env.get(ast.value)) == null) {
        throw new Error("Symbol '" + ast.value + "' not found in scope.");
      }
      break;
    default:
      throw new Error("Type '" + ast.type + "' unrecognized.");
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
//                                   Print                                   //
///////////////////////////////////////////////////////////////////////////////

function printAST(ast) {
  if (!ast) {
    return null;
  }

  const currentType = ast.type;
  var result = "";

  switch (currentType) {
    case "list":
      result = "(" + ast.children.map(printAST).join(" ") + ")";
      break;
    case "atom":
      result = ast.value;
      break;
    default:
      result = ast;
      break;
  }

  return result;
}

function iPrint(exp) {
  return printAST(exp);
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
  return iPrint(iEval(iRead(str), topLevelEnv));
}

export { define, run };
