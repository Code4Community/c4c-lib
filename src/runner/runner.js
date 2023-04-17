// import Phaser from "phaser";
import {
  createNamespace,
  stepRunInNamespace,
  checkInNamespace,
} from "../interpreter/index.js";

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

  check() {
    return checkInNamespace(this.namespace, this.programText);
  }

  reset() {
    this.location = [];
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
