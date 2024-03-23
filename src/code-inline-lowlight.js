import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';

const CODE_MARK_TYPE = 'code';

function getHighlightNodes(result) {
  // `.value` for lowlight v1, `.children` for lowlight v2
  return result.value || result.children || [];
}

function parseNodes(nodes, className = []) {
  return nodes
    .map((node) => {
      const classes = [...className, ...(node.properties ? node.properties.className : [])];

      if (node.children) {
        return parseNodes(node.children, classes);
      }

      return {
        text: node.value,
        classes,
      };
    })
    .flat();
}

function getDecorations({ doc, name, lowlight }) {
  const decorations = [];

  findInlineCode(doc, name).forEach((block) => {
    let from = block.from;
    const to = block.to;

    const nodes = getHighlightNodes(lowlight.highlightAuto(block.text));

    parseNodes(nodes).forEach((node) => {
      if (node.classes.length) {
        const decoration = Decoration.inline(from, from + node.text.length, {
          class: node.classes.join(' '),
        });

        decorations.push(decoration);
      }
      from += node.text.length;
    });
  });

  return DecorationSet.create(doc, decorations);
}

function findInlineCode(doc, markType) {
  const inlineCodeSpans = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    node.marks.forEach((mark) => {
      if (mark.type.name === markType) {
        inlineCodeSpans.push({
          from: pos,
          to: pos + node.nodeSize,
          text: node.text,
          node: mark,
        });
      }
    });
  });
  return inlineCodeSpans;
}

function isFunction(param) {
  return typeof param === 'function';
}

export const CodeInlineLowlight = Extension.create({
  name: 'codeInlineLowlight',

  addOptions() {
    return {
      lowlight: {},
      defaultLanguage: null,
    };
  },

  addProseMirrorPlugins() {
    if (!['highlight', 'highlightAuto', 'listLanguages'].every((api) => isFunction(this.options.lowlight[api]))) {
      throw Error('You should provide an instance of lowlight to use the code-inline-lowlight extension');
    }
    const pluginKey = new PluginKey('codeInlineLowlight');
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init(_, { doc }) {
            return DecorationSet.empty;
          },
          apply: (tr, set, oldState, newState) => {
            const oldMarks = findInlineCode(oldState.doc, CODE_MARK_TYPE);
            const newMarks = findInlineCode(newState.doc, CODE_MARK_TYPE);

            if (
              tr.docChanged &&
              (newMarks.length !== oldMarks.length ||
                tr.steps.some((step) => {
                  return (
                    step.from !== undefined &&
                    step.to !== undefined &&
                    oldMarks.some((mark) => {
                      return step.from >= mark.from && step.to <= mark.to;
                    })
                  );
                }))
            ) {
              return getDecorations({
                doc: tr.doc,
                name: CODE_MARK_TYPE,
                lowlight: this.options.lowlight,
              });
            }

            return set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
