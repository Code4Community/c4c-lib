import {
  createNamespace,
  define,
  defineInNamespace,
  run,
  runInNamespace,
} from "./interpreter.js";

const Interpreter = {
  createNamespace: createNamespace,
  define: define,
  defineInNamespace: defineInNamespace,
  run: run,
  runInNamespace: runInNamespace,
};

export { Interpreter };
