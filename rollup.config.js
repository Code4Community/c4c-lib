import {nodeResolve} from "@rollup/plugin-node-resolve"
import {lezer} from "@lezer/generator/rollup"

export default {
  input: "src/editor.js",
  output: {
    file: "src/editor.bundle.js",
    format: "iife"
  },
  plugins: [nodeResolve(), lezer()]
}