import { nodeResolve } from "@rollup/plugin-node-resolve";
import { lezer } from "@lezer/generator/rollup";

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.bundle.js",
    format: "iife",
  },
  plugins: [nodeResolve(), lezer()],
};
