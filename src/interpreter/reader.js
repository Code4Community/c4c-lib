import { parser } from "../lang.js";
import { NodeProp } from "@lezer/common";

///////////////////////////////////////////////////////////////////////////////
//                                    Read                                   //
///////////////////////////////////////////////////////////////////////////////

function convertLezerTree(cursor) {
  const node = {
    type: cursor.name,
    from: cursor.from,
    to: cursor.to,
    children: [],
  };

  if (cursor.firstChild()) {
    do {
      const child = convertLezerTree(cursor);
      node.children.push(child);
    } while (cursor.nextSibling());

    cursor.parent();
  }

  return node;
}

function mapOverTree(tree, func) {
  func(tree);

  tree.children.forEach((t) => {
    mapOverTree(t, func);
  });
}

function parse(str) {
  const lezerTree = parser.parse(str);
  const tree = convertLezerTree(lezerTree.cursor());

  mapOverTree(tree, (t) => {
    const sourceString = str.substring(t.from, t.to);
    switch (t.type) {
      case "Number":
        t.value = Number.parseInt(sourceString);
        break;
      case "Boolean":
        t.value = sourceString == "true" ? true : false;
        break;
      case "Null":
        t.value = null;
        break;
      case "String":
        t.value = sourceString.substring(1, sourceString.length - 1);
        break;
      default:
        t.value = sourceString;
        break;
    }
  });

  return tree;
}

function iRead(str) {
  return parse(str);
}

export { iRead };
