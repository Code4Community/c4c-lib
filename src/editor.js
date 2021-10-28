import {parser} from "./lang.grammar"
import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"

var theme = EditorView.theme({
  ".cm-content": {
      fontSize: "1.5em",
      fontWeight: "500",
      fontFamily: "'Oswald'",
      color: "black"
  }
})

let editor = new EditorView({
  state: EditorState.create({
    extensions: [basicSetup, theme]
  }),
  parent: document.getElementById("editor")
})

console.log(parser)