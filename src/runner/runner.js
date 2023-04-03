// import Phaser from "phaser";
import { stepRun } from "../interpreter/index.js";

class ProgramRunner {
  constructor(config) {
    this.programText = "";
    this.location = [];
    this.result = null;
  }

  setProgram(t) {
    this.programText = t;
  }

  reset() {
    this.location = [];
  }

  step() {
    let [result, loc] = stepRun(this.programText, this.location);
    this.result = result;
    this.location = loc;
  }
}

export { ProgramRunner };
