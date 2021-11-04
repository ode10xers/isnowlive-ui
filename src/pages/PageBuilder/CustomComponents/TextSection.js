import { generateFontFamilyStylingText } from 'utils/helper.js';

export default (editor) => {
  editor.DomComponents.addType('text-section', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Text Section',
        droppable: false,
        attributes: {
          layout: 'left',
          class: 'text-section-container',
        },
        'font-family': 'Arial',
        'text-color': '#000',
        'bg-color': '#fff',
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
            type: 'color',
            label: 'Background color',
            name: 'bg-color',
            changeProp: 1,
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
          .text-section-container {
            display: block;
            padding: 8px;
          }
        `,
      },
      init() {
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
