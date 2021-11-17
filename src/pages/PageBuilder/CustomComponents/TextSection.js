import { generateFontFamilyStylingText } from 'utils/helper.js';
import { isValidCSSColor } from 'utils/colors';

export default (editor) => {
  editor.DomComponents.addType('text-section', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Text Section',
        droppable: false,
        active: true,
        resizable: {
          tl: false, // Top left
          tc: false, // Top center
          tr: false, // Top right
          cl: false, // Center left
          cr: false, // Center right
          bl: false, // Bottom left
          bc: true, // Bottom center
          br: false, // Bottom right
        },
        attributes: {
          layout: 'left',
          class: 'text-section-container',
        },
        'font-family': 'Arial',
        'text-color': '#000000',
        'bg-style': '#ffffff',
        traits: [
          {
            type: 'text-section-layout',
            name: 'layout',
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
          {
            type: 'background-styles',
            id: 'background-style-picker',
          },
          {
            type: 'color',
            label: 'Background color',
            name: 'bg-style',
            changeProp: true,
          },
        ],
        // components: `
        //   <h1 class="text-section-title">Section Title</h1>
        //   <p class="text-section-content">You can place your section content here. Double click on this text to edit</p>
        // `,
        //? Above is the example of using default components with HTML strings
        //? Below we try to customize the behavior
        components: [
          {
            tagName: 'h1',
            type: 'text',
            content: 'Section Title',
            name: 'Section Title',
            attributes: {},
            traits: [],
            toolbar: [],
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            hoverable: false,
            copyable: false,
          },
          {
            tagName: 'p',
            type: 'text',
            content: 'Section Content',
            name: 'Section Content',
            attributes: {},
            traits: [],
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            hoverable: false,
            copyable: false,
            toolbar: [],
          },
        ],
        styles: `
        .with-background-image:before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-image: linear-gradient(to bottom right,rgba(0,0,0,0.6), rgba(0,0,0,0.6));
          opacity: .6; 
          z-index: 0;
        }

        .with-background-image * {
          z-index: 1;
        }
          .text-section-container {
            position: relative;
            display: flex;
            flex: 0 1 auto;
            width: 100%;
            padding: 8px;
            flex-direction: column;
            justify-content: center;
          }

          .text-section-container * {
            position: relative;
            flex: 0 0 auto;
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-style', this.handleBGStyleChange);
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
      handleBGStyleChange() {
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

  editor.DomComponents.addType('text-section-with-button', {
    extend: 'text-section',
    model: {
      defaults: {
        components: [
          {
            tagName: 'h1',
            type: 'text',
            content: 'Section Title',
            name: 'Section Title',
            attributes: {},
            traits: [],
            toolbar: [],
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            hoverable: false,
            copyable: false,
          },
          {
            tagName: 'p',
            type: 'text',
            content: 'Section Content',
            name: 'Section Content',
            attributes: {},
            traits: [],
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            hoverable: false,
            copyable: false,
            toolbar: [],
          },
          {
            type: 'text-section-link-button',
          },
        ],
      },
    },
  });
};
