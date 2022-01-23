import { Window } from "./window.js";
import { create, getText, setText, dom } from "./editor.js";

var Editor = {
  Window: Window,
  create: create,
  getText: getText,
  setText: setText,
  dom: dom,
};

export { Editor };
