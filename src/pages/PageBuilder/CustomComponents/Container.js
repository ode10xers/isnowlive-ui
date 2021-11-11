import { generateFontFamilyStylingText } from 'utils/helper.js';

export default (editor) => {
  editor.DomComponents.addType('container', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Container',
        attributes: {
          class: 'simple-container',
        },
        components: [],
        styles: `
          .simple-container {
            display: block;
            padding: 8px;
          }
        `,
      },
    },
  });
};
