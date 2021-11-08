import { editor } from "./editor.js";

///////////////////////////////////////////////////////////////////////////////
//                                   Reader                                  //
///////////////////////////////////////////////////////////////////////////////

function tokenize(str) {
  // The stateful regular expression for consuming tokens in our language off of
  // str. First consume all the whitespace, then capture one of the following things:
  // 2. Any character of the string "()". (Control Characters)
  // 3. A string started by a double quote. (String Literals)
  // 4. Any part of one line starting with a semi-colon. (Comment)
  // 5. Any sequence of characters not from "[]{}()'`~^@". (Atoms)
  const re = /[\s,]*([()]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
  let tokens = [];
  let token;

  // re.exec(str)[1] is the first string captured by the regex
  while ((token = re.exec(str)[1]) != "") {
    if (token[0] === ";") {
      continue;
    }
    tokens.push(token);
  }

  return tokens;
}

function parse(tokens, index) {
  let currentToken = tokens[index++];
  const ast = { type: undefined, value: undefined, children: [] };

  switch (currentToken[0]) {
    // Comments
    case ";":
      return null;
      break;
    // Lists
    case ")":
      throw new Error("unexpected ')'");
    case "(":
      ast.type = "list";

      while (tokens[index] != ")") {
        const [child, new_index] = parse(tokens, index);
        ast.children.push(child);
        index = new_index;
      }

      index++;
      break;
    // Atoms
    default:
      if (currentToken.match(/-?\d+/)) {
        ast.type = "integer";
        ast.value = Number.parseInt(currentToken);
      } else if (currentToken.match(/[a-z]+/)) {
        ast.type = "symbol";
        ast.value = currentToken;
      } else {
        throw new Error("'" + currentToken + "' could not be parsed.");
      }

      break;
  }

  // Returns the ast starting at the given index, and the index of the token
  // following the ast.
  return [ast, index];
}

function iRead(text) {
  const tokens = tokenize(text);
  const [ast] = parse(tokens, 0);
  return ast;
}

///////////////////////////////////////////////////////////////////////////////
//                                    Eval                                   //
///////////////////////////////////////////////////////////////////////////////

class Env {
  parentEnv;
  map;

  constructor(parentEnv) {
    this.parentEnv = parentEnv;
    this.map = new Map();
  }

  set(key, value) {
    this.map.set(key, value);
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

function evalList(ast, env) {
  let f = ast.children[0];
  let result;

  switch (f.value) {
    case "let":
      let letEnv = new Env(env);
      let bindList = ast.children[1];

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
        letEnv.set(bindKey.value, iEval(bindValue, env));
      });

      let body = ast.children[2];
      result = iEval(body, letEnv);
      break;
    case "set!":
      let bindKey = ast.children[1].value;
      let bindValueAST = ast.children[2];
      let bindValue = iEval(bindValueAST, env);
      env.set(bindKey, bindValue);
      result = bindValue;
      break;
    default:
      let evaluatedChildren = ast.children.map((c) => iEval(c, env));
      let func = evaluatedChildren[0];
      result = func.apply(null, evaluatedChildren.slice(1));
      break;
  }

  return result;
}

function iEval(ast, env) {
  let result;

  switch (ast.type) {
    case "list":
      result = evalList(ast, env);
      break;
    case "integer":
      result = ast.value;
      break;
    case "symbol":
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

function printAST(ast) {
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
//                                    REPL                                   //
///////////////////////////////////////////////////////////////////////////////
const replEnvObject = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
};

const replEnv = new Env();
replEnv.setFromObject(replEnvObject);

function interpret(text) {
  return iPrint(iEval(iRead(text), replEnv));
}

const interpButton = document.getElementById("interp-button");

interpButton.addEventListener("click", () => {
  const lines = editor.state.doc.text;
  const text = lines.join("\n");
  console.log(interpret(text));
});
