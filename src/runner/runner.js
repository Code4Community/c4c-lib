// import Phaser from "phaser";
import { createNamespace, stepRunInNamespace } from "../interpreter/index.js";

class ProgramRunner {
  constructor(config) {
    this.programText = "";
    this.location = [];
    this.result = null;
    this.namespace = createNamespace();
  }

  setProgram(t) {
    this.programText = t;
  }

  reset() {
    this.location = [];
    this.namespace = createNamespace();
  }

  step() {
    let [result, loc] = stepRunInNamespace(
      this.namespace,
      this.programText,
      this.location
    );
    this.result = result;
    this.location = loc;
  }
}

export { ProgramRunner };
