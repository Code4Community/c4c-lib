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
  const re =
    /[\s,]*([()]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
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
    ast.type = "atom";
    ast.value = currentToken;
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

function iEval(ast, env) {
  return ast;
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
    // Atoms
  default:
    break;
  }

  return result;
}

function iPrint(exp) {
  return printAST(exp);
}

function interpret(text) {
  return iPrint(iEval(iRead(text), {}));
}

const interpButton = document.getElementById("interp-button");

interpButton.addEventListener("click", () => {
  const lines = editor.state.doc.text;
  const text = lines.join("\n");
  console.log(interpret(text));
});
