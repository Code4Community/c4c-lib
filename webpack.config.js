const path = require("path");

module.exports = {
  mode: "none",
  entry: "./src/index.js",
  output: {
    library: {
      name: "C4C",
      type: "var",
      export: "default",
    },
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
