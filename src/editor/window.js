import { editor } from "./editor.js";

var editorContainer;

function init(scene) {
  editorContainer = document.createElement("div");
  editorContainer.appendChild(editor.dom);
  editorContainer.style["min-height"] = "100%";
  editorContainer.style["width"] = "0%";
  editorContainer.style["transition"] = "width 0.5s";

  const editorObject = scene.add.dom(0, 0, editorContainer);
  editorObject.setOrigin(0, 0);

  editor.dom.style.width = "100%";
}

function open() {
  editorContainer.style["width"] = "40%";
}

function close() {
  editorContainer.style["width"] = "0%";
}

function toggle() {
  const currentWidth = editorContainer.style["width"];
  if (currentWidth != "40%") {
    editorContainer.style["width"] = "40%";
  } else {
    editorContainer.style["width"] = "0%";
  }
}

const Window = {
  init: init,
  open: open,
  close: close,
  toggle: toggle,
};

export { Window };
