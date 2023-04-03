import { ProgramRunner } from "./runner.js";

function createRunner() {
  return new ProgramRunner();
}

const Runner = {
  createRunner: createRunner,
};

export { Runner };
