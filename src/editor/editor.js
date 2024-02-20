import { EditorView, basicSetup } from "codemirror";
import {
  LRLanguage,
  LanguageSupport,
  indentNodeProp,
  delimitedIndent,
  continuedIndent,
  foldNodeProp,
  foldInside
} from "@codemirror/language";
import { completeFromList } from "@codemirror/autocomplete";
import { parser as ourParser } from "../lang.js";
import { styleTags, tags as t} from "@lezer/highlight"

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
      String: t.string,
      Comment: t.lineComment,
      Null: t.null,
      // comment: t.lineComment,
      
      "( )": t.paren,
    }),
    
    indentNodeProp.add({
      IfStatement: continuedIndent({ except: /^\s*(else|end)\b/ }),
      TimesStatement: continuedIndent({ except: /^\s*end\b/ }),
      Block: delimitedIndent({ closing: "end" }),
    }),
    foldNodeProp.add({
      Application: foldInside
    })
  ],
});



const defaultThemeObject = {
  "&": {
    color: "black",
    backgroundColor: "white",
  },
  ".cm-content, .cm-gutter": {
    minHeight: "600px",
  },
};

var editor;

function create(parentObject, themeObject, hidden = false, autocompleteFunctions = []) {
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
        ...autocompleteFunctions.map((f) => ({ label: f, type: "function" })),
      ]),
      indentOnInput: /^\s*(else|end)$/,
    },
  });
  
  const ourLanguageSupport = new LanguageSupport(ourLanguage);
  if (themeObject == null) {
    themeObject = defaultThemeObject;
  }

  var theme = EditorView.theme(themeObject, { dark: false });

  editor = new EditorView({
    extensions: [ourLanguageSupport, basicSetup, theme],
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
