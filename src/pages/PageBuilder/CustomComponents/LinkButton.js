import { generateFontFamilyStylingText } from 'utils/helper.js';

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
        'font-family': 'Arial',
        'text-color': '#000',
        'bg-color': 'transparent',
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
            type: 'padding-slider',
          },
          {
            type: 'margin-slider',
          },
          {
            type: 'font-size-slider',
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
            name: 'bg-color',
            changeProp: 1,
          },
        ],
        editable: true,
        droppable: false,
        content: 'Link button',
        styles: `
          .link-btn, .link-btn.button-type-link {
            display: inline-block;
            padding: 8px;
            width: fit-content;
            text-align: center;
            border: none;
          }

          .link-btn.button-type-outlined {
            border: 1px solid currentColor;
            border-radius: 8px;
          }
        `,
      },
      init() {
        // Check the built it type
        const btnType =
          this.getClasses()
            .find((cls) => cls.startsWith('button-type-'))
            ?.split('-')[2] ?? 'link';

        // TODO: This logic is the similar to the one in the onEvent
        // of the button-type trait. Find a way to generalize it better
        if (btnType === 'link') {
          this.removeTrait('border-radius');
        } else {
          this.addTrait({
            type: 'border-radius-slider',
            name: 'border-radius',
          });
        }

        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-color', this.handleBGColorChange);
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
        const bgColor = this.props()['bg-color'];
        const componentList = this.components();
        // Check for child components with the same property
        const validChildList = componentList.filter((comp) => comp.props().hasOwnProperty('bg-color'));

        validChildList.forEach((childComp) => {
          // NOTE: Right now this only works if the prop name and trait name is same
          childComp.updateTrait('bg-color', {
            type: 'color',
            value: bgColor,
          });
        });

        this.setStyle({
          ...this.getStyle(),
          'background-color': bgColor,
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
};
