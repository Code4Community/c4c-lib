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
import { parser as ourParser } from "../lang.js";

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
      TimesStatement: continuedIndent(),
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

const defaultTheme = EditorView.theme(
  {
    "&": {
      color: "black",
      backgroundColor: "white",
    },
    ".cm-content, .cm-gutter": {
      minHeight: "600px",
    }
  },
  { dark: false }
);

var editor;

function create(parentObject, theme=defaultTheme, hidden = false) {
  editor = new EditorView({
    state: EditorState.create({
      extensions: [ourLanguageSupport, basicSetup, theme],
    }),
    parent: parentObject,
  });

  if (hidden) {
    editor.dom.style.width = "0px";
  }

  return editor;
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

function dom() {
  return editor.dom;
}

export { editor, create, getText, setText, dom };
