import { iRead } from "./reader.js";
import { iEval } from "./eval.js";
import { Env } from "./env.js";

const primitivesObject = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  print: (a) => console.log(a),
};

const topLevelEnv = new Env();
topLevelEnv.setFromObject(primitivesObject);

function createNamespace(parent = topLevelEnv) {
  return new Env(parent);
}

function define(key, value) {
  return topLevelEnv.set(key, value);
}

function defineInNamespace(ns, key, value) {
  return ns.set(key, value);
}

function run(str) {
  return iEval(iRead(str), topLevelEnv);
}

function runInNamespace(ns, str) {
  return iEval(iRead(str), ns);
}


const Interpreter = {
  iRead: iRead,
  iEval: iEval,

  createNamespace: createNamespace,

  define: define,
  run: run,

  defineInNamespace: defineInNamespace,
  runInNamespace: runInNamespace,
};

export { Interpreter };
