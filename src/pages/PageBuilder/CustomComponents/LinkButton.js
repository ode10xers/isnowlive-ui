export default (editor) => {
  editor.DomComponents.addType('link-buttons', {
    model: {
      defaults: {
        tagName: 'a',
        name: 'Button',
        attributes: {
          src: '',
          class: 'link-btn button-type-link',
        },
        'font-family': 'Arial',
        'text-color': '#000',
        // TODO: Add text color manipulation
        traits: [
          {
            type: 'text',
            label: 'Link',
            name: 'src',
          },
          {
            type: 'button-types',
          },
          {
            type: 'padding-slider',
          },
          {
            type: 'font-selector',
            name: 'font-family',
            changeProp: 1,
          },
          {
            type: 'color',
            label: 'Text color',
            name: 'text-color',
            changeProp: 1,
          },
        ],
        content: 'Link Button',
        editable: true,
        resizable: true,
        styles: `
          .link-btn {
            display: inline-block;
            padding: 8px;
            text-align: center;
          }
        `,
      },
    },
  });
};
