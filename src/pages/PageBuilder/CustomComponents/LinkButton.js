import { generateFontFamilyStylingText } from 'utils/helper.js';
import componentTypes from '../Configs/strings/componentTypes';
import traitTypes from '../Configs/strings/traitTypes';

// TODO: Refactor and tidy up here
export default (editor) => {
  editor.DomComponents.addType(componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON, {
    model: {
      defaults: {
        tagName: 'a',
        name: 'Button',
        attributes: {
          href: '#',
          target: '_blank',
          class: 'link-btn',
        },
        'font-family': 'Segoe UI',
        'text-color': '#1890ff',
        'bg-color': '#ffffff',
        'border-color': '#ffffff',
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
            type: traitTypes.FONT.FONT_SIZE,
          },
          {
            type: traitTypes.FONT.FONT_FAMILY_SELECTOR,
            name: 'font-family',
            changeProp: 1,
          },
          {
            type: traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER,
            label: 'Text color',
            name: 'text-color',
            changeProp: 1,
          },
          {
            type: traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER,
            label: 'Background color',
            name: 'bg-color',
            changeProp: 1,
          },
          {
            type: traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER,
            label: 'Border color',
            name: 'border-color',
            changeProp: 1,
          },
          {
            type: traitTypes.IMAGE.BORDER_RADIUS_SLIDER,
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
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:font-family', this.handleFontChange);
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-color', this.handleBGColorChange);
        this.on('change:border-color', this.handleBorderColorChange);
      },
      handleFontChange() {
        const font = this.props()['font-family'];

        this.setStyle({
          ...this.getStyle(),
          'font-family': `${generateFontFamilyStylingText(font)} !important`,
        });
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
        const bgStyle = this.props()['bg-color'];

        this.setStyle({
          ...this.getStyle(),
          'background-color': bgStyle,
        });
      },
      handleBorderColorChange() {
        const bgStyle = this.props()['border-color'];

        this.setStyle({
          ...this.getStyle(),
          'border-color': bgStyle,
        });
      },
    },
  });

  editor.DomComponents.addType(componentTypes.CUSTOM_COMPONENTS.INNER.TEXT_SECTION_BUTTON, {
    extend: componentTypes.CUSTOM_COMPONENTS.LINK_BUTTON,
    model: {
      defaults: {
        attributes: {
          href: '#',
          target: '_blank',
          class: 'text-section-btn',
        },
        'font-family': 'Segoe UI',
        'text-color': '#ffffff',
        'bg-color': '#1890ff',
        'border-color': '#1890ff',
        styles: `
          .text-section-btn {
            display: flex;
            padding: 8px;
            width: fit-content;
            text-align: center;
            border: 2px solid #1890ff;
            background-color: #1890ff;
            color: #ffffff;
          }
        `,
      },
    },
  });
};
