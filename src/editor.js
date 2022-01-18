import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  flatIndent,
  continuedIndent,
  indentNodeProp,
  foldNodeProp,
  foldInside,
} from "@codemirror/language";
import { styleTags, tags as t } from "@codemirror/highlight";
import { completeFromList } from "@codemirror/autocomplete";
import { parser as ourParser } from "./lang.js";

const ourParserWithMetadata = ourParser.configure({
  props: [
    styleTags({
      Symbol: t.name,
      IfStatement: t.keyword,
      TimesStatement: t.keyword,
      Forever: t.keyword,
      CallExpression: t.keyword,
      Function: t.keyword,
      Boolean: t.bool,
      Number: t.integer,
      Null: t.null,
      comment: t.lineComment,
      "( )": t.paren,
    }),
    indentNodeProp.add({
      IfStatement: continuedIndent({ except: /^else/ }),
      Block: delimitedIndent({ closing: "end" }),
    }),
    foldNodeProp.add({
      Application: foldInside,
    }),
  ],
});

const ourLanguage = LRLanguage.define({
  parser: ourParserWithMetadata,
  languageData: {
    commentTokens: { line: "//" },
    autocomplete: completeFromList([
      { label: "if", type: "keyword" },
      { label: "forever", type: "keyword" },
      { label: "times", type: "keyword" },
      { label: "else", type: "keyword" },
      { label: "end", type: "keyword" },
      { label: "function", type: "keyword" },
    ]),
  },
});

const ourLanguageSupport = new LanguageSupport(ourLanguage);

const ourTheme = EditorView.theme(
  {
    "&": {
      color: "black",
      backgroundColor: "white",
    },
    ".cm-content, .cm-gutter": {
      minHeight: "600px",
    },
    // "&.cm-focused .cm-cursor": {
    //   borderLeftColor: "#fcb",
    // },
    // "&.cm-focused .cm-selectionBackground, ::selection": {
    //   backgroundColor: "#074",
    // },
    // ".cm-gutters": {
    //   backgroundColor: "#045",
    //   color: "#222",
    //   border: "none",
    // },
  },
  { dark: false }
);

var editor;
var editorContainer;

function create(parentObject) {
  editor = new EditorView({
    state: EditorState.create({
      extensions: [ourLanguageSupport, basicSetup, ourTheme],
    }),
    parent: parentObject,
  });

  return editor;
}

function hide() {
  editor.dom.style.visibility = "hidden";
}

function show() {
  editor.dom.style.visibility = "visible";
}

function getDOM() {
  return editor.dom;
}

function setText(s) {
  let doc = editor.state.doc;

  const transaction = editor.state.update({
    changes: [
      { from: 0, to: doc.length },
      { from: 0, insert: s },
    ],
  });

  editor.dispatch(transaction);

  return transaction;
}

function getText() {
  return editor.state.doc.toString();
}

const window = {
  init: function (scene) {
    editorContainer = document.createElement("div");
    editorContainer.appendChild(editor.dom);
    editorContainer.style["min-height"] = "100%";
    editorContainer.style["width"] = "0%";
    editorContainer.style["transition"] = "width 0.5s";

    const editorObject = scene.add.dom(0, 0, editorContainer);
    editorObject.setOrigin(0, 0);
  },
  open: function () {
    editorContainer.style["width"] = "40%";
  },
  close: function () {
    editorContainer.style["width"] = "0%";
  },
  toggle: function () {
    const currentWidth = editorContainer.style["width"];
    if (currentWidth != "40%") {
      editorContainer.style["width"] = "40%";
    } else {
      editorContainer.style["width"] = "0%";
    }
  },
};

export { create, getDOM, getText, setText, show, hide, window };
