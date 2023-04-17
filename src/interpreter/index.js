import { iRead } from "./reader.js";
import { iEval } from "./eval.js";
import { iCheck } from "./check.js";
import { stepEval } from "./stepEval.js";
import { Env } from "./env.js";

const primitivesObject = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  not: (a) => !a,
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

function check(str) {
  return iCheck(iRead(str), topLevelEnv);
}

function checkInNamespace(ns, str) {
  return iCheck(iRead(str), ns);
}

function stepRun(str, loc) {
  return stepEval(iRead(str), loc, topLevelEnv);
}

function runInNamespace(ns, str) {
  return iEval(iRead(str), ns);
}

function stepRunInNamespace(ns, str, loc) {
  return stepEval(iRead(str), loc, ns);
}

const Interpreter = {
  iRead: iRead,
  iEval: iEval,
  stepEval: stepEval,

  createNamespace: createNamespace,

  define: define,
  run: run,
  check: check,
  stepRun: stepRun,

  defineInNamespace: defineInNamespace,
  runInNamespace: runInNamespace,
  checkInNamespace: checkInNamespace,
  stepRunInNamespace: stepRunInNamespace,
};

export {
  Interpreter,
  createNamespace,
  define,
  defineInNamespace,
  run,
  check,
  stepRun,
  runInNamespace,
  checkInNamespace,
  stepRunInNamespace,
};
