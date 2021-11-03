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

// Codemirror Support for Our Language
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

// Creating the Editor View and Initial State
const theme = EditorView.theme({
  ".cm-content": {
    fontSize: "1.5em",
    fontWeight: "500",
    fontFamily: "'Oswald'",
    color: "black",
  },
});

const editor = new EditorView({
  state: EditorState.create({
    extensions: [ourLanguageSupport, basicSetup, theme],
  }),
  parent: document.getElementById("editor"),
});
