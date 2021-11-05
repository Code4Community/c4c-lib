import { editor } from "./editor.js";

function iRead(text) {
  return text;
}

function iEval(ast, env) {
  return ast;
}

function iPrint(exp) {
  return exp;
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
