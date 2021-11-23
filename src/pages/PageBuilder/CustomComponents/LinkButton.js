import { generateFontFamilyStylingText } from 'utils/helper.js';
import { isValidCSSColor } from 'utils/colors';

// TODO: Add filled button type here
// TODO: Refactor and tidy up here
export default (editor) => {
  editor.DomComponents.addType('link-buttons', {
    model: {
      defaults: {
        tagName: 'a',
        name: 'Button',
        attributes: {
          href: '#',
          target: '_blank',
          class: 'link-btn button-type-link',
        },
        'font-family': 'Segoe UI',
        'text-color': '#000000',
        'bg-style': '#ffffff',
        traits: [
          {
            type: 'text',
            label: 'Link',
            name: 'href',
          },
          {
            type: 'select',
            label: 'Open in',
            name: 'target',
            options: [
              { id: '_blank', name: 'New Page' },
              { id: '_self', name: 'Same Page' },
            ],
          },
          {
            type: 'text',
            label: 'Text',
            name: 'content',
            changeProp: 1,
          },
          {
            type: 'button-types',
          },
          {
            type: 'font-size',
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
          {
            type: 'color',
            label: 'Background color',
            name: 'bg-style',
            changeProp: 1,
          },
          {
            type: 'border-radius-slider',
            name: 'border-radius',
            min: 0,
            max: 200,
          },
        ],
        editable: false,
        droppable: false,
        draggable: false,
        toolbar: [],
        content: 'Link button',
        styles: `
          .link-btn {
            display: inline-block;
            padding: 8px;
            width: fit-content;
            text-align: center;
            border: none;
          }

          .link-btn.button-type-link {
            border: none;
          }

          .link-btn.button-type-outlined {
            border: 1px solid currentColor;
            border-radius: 8px;
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-style', this.handleBGColorChange);
        this.on('change:font-family', this.handleFontChange);
      },
      handleTextColorChange() {
        const textColor = this.props()['text-color'];

        //Propagate this inside
        this.components().forEach((comp) => {
          comp.setStyle({
            ...comp.getStyle(),
            color: `${textColor} !important`,
          });
        });

        this.setStyle({
          ...this.getStyle(),
          color: `${textColor} !important`,
        });
      },
      handleBGColorChange() {
        const bgStyle = this.props()['bg-style'];
        const componentList = this.components();

        const isBackgroundColor = isValidCSSColor(bgStyle);

        // Check for child components with the same property
        const validChildList = componentList.filter((comp) => comp.props().hasOwnProperty('bg-style'));

        validChildList.forEach((childComp) => {
          // NOTE: Right now this only works if the prop name and trait name is same
          childComp.updateTrait('bg-style', {
            type: 'color',
            value: isBackgroundColor ? bgStyle : 'transparent',
          });
        });

        this.setStyle({
          ...this.getStyle(),
          background: bgStyle,
        });
      },
      handleFontChange() {
        const font = this.props()['font-family'];

        this.setStyle({
          ...this.getStyle(),
          'font-family': generateFontFamilyStylingText(font),
        });
      },
    },
  });

  editor.DomComponents.addType('text-section-link-button', {
    extend: 'link-buttons',
    model: {
      defaults: {
        attributes: {
          href: '#',
          target: '_blank',
          class: 'text-section-btn button-type-link',
        },
        styles: `
          .text-section-btn {
            display: flex;
            padding: 8px;
            width: fit-content;
            text-align: center;
            border: none;
          }

          .text-section-btn.button-type-link {
            border: none;
          }

          .text-section-btn.button-type-outlined {
            border: 1px solid currentColor;
            border-radius: 8px;
          }
        `,
      },
    },
  });
};
