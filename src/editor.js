import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import {
  LRLanguage,
  LanguageSupport,
  foldNodeProp,
  foldInside,
  indentNodeProp,
  continuedIndent,
} from "@codemirror/language";
import { styleTags, tags as t } from "@codemirror/highlight";
import { completeFromList } from "@codemirror/autocomplete";
import { parser as ourParser } from "./lang.js";

const ourParserWithMetadata = ourParser.configure({
  props: [
    styleTags({
      Statement: t.variableName,
      Condition: t.bool,
      Number: t.number,
      Comment: t.comment,
    }),
    indentNodeProp.add({
      IfExpression: continuedIndent({ except: /^(elif|else|end)\b/ }),
      TimesExpression: continuedIndent({ except: /^end\b/ }),
    }),
    foldNodeProp.add({
      IfExpression: foldInside,
      TimesExpression: foldInside,
    }),
  ],
});

const ourLanguage = LRLanguage.define({
  parser: ourParserWithMetadata,
  languageData: {
    commentTokens: { line: "//" },
    autocomplete: completeFromList([
      { label: "times", type: "keyword" },
      { label: "end", type: "keyword" },
      { label: "move", type: "function" },
      { label: "jump", type: "function" },
    ]),
  },
});

const ourLanguageSupport = new LanguageSupport(ourLanguage);

const theme = EditorView.theme({
  ".cm-content": {
    fontSize: "1.5em",
    fontWeight: "500",
    fontFamily: "Oswald",
    color: "black",
  },
});

var editor;

function create(parentObject) {
  editor = new EditorView({
    state: EditorState.create({
      extensions: [ourLanguageSupport, basicSetup, theme],
    }),
    parent: parentObject,
  });

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

  console.log(transaction);

  return transaction;
}

function getText() {
  return editor.state.doc.toString();
}

export { create, getText, setText };
