import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"



let editor = new EditorView({
  state: EditorState.create({
    extensions: [basicSetup]
  }),
  parent: document.getElementById("editor")
})

let theme = editor.theme({
    "&": {
        backgroundColor: "white",
        fontSize: "16px",
        fontFamily: "serif",
        color: "pink"
    },
    ".cm-content": {
        backgroundColor: "white",
        fontSize: "16px",
        fontFamily: "serif",
        color: "pink"
    }
}, {dark: true})