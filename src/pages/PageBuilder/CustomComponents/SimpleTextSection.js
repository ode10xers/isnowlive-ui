import { generateFontFamilyStylingText } from 'utils/helper.js';

export default (editor) => {
  editor.DomComponents.addType('simple-text-section', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Simple Text Section',
        droppable: false,
        resizable: true,
        components: [
          {
            type: 'container',
            removable: false,
            draggable: false,
            droppable: false,
            highlightable: false,
            editable: false,
            copyable: false,
            selectable: false,
            badgable: false,
            hoverable: false,
            components: [
              {
                type: 'fixed-width-container',
                removable: false,
                draggable: false,
                droppable: false,
                highlightable: false,
                editable: false,
                copyable: false,
                selectable: false,
                badgable: false,
                hoverable: false,
                components: [
                  {
                    tagName: 'div',
                    removable: false,
                    draggable: false,
                    droppable: false,
                    highlightable: false,
                    editable: false,
                    copyable: false,
                    selectable: false,
                    badgable: false,
                    hoverable: false,
                    attributes: {
                      class: 'text-section-container',
                    },
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
                        droppable: false,
                        highlightable: false,
                        editable: true,
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
                        toolbar: [],
                        removable: false,
                        draggable: false,
                        droppable: false,
                        highlightable: false,
                        editable: true,
                        copyable: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        attributes: {
          layout: 'center',
          class: 'simple-text-section-block',
        },
        traits: [
          {
            type: 'text-section-layout',
            name: 'layout',
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
            type: 'background-image-picker',
          },
          {
            type: 'color',
            label: 'Background color',
            name: 'bg-color',
            changeProp: true,
          },
        ],
        'font-family': 'Arial',
        'text-color': '#000000',
        'bg-color': '#ffffff',
        styles: `
          .simple-text-section-block {
            position: relative;
          }

          .text-section-container {
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
        this.on('change:bg-color', this.handleBGStyleChange);
        this.on('change:font-family', this.handleFontChange);
      },
      handleTextColorChange() {
        const textColor = this.props()['text-color'];
        const textSectionContainer = this.find('div.text-section-container')[0];

        if (textSectionContainer) {
          textSectionContainer.setStyle({
            ...textSectionContainer.getStyle(),
            color: `${textColor} !important`,
          });

          textSectionContainer.components().forEach((comp) => {
            comp.setStyle({
              ...comp.getStyle(),
              color: `${textColor} !important`,
            });
          });
        } else {
          this.setStyle({
            ...this.getStyle(),
            color: `${textColor} !important`,
          });
        }
      },
      handleBGStyleChange() {
        const bgStyle = this.props()['bg-color'];
        // const componentList = this.components();

        // Check for child components with the same property
        // const validChildList = componentList.filter((comp) => comp.props().hasOwnProperty('bg-color'));
        // validChildList.forEach((childComp) => {
        //   // NOTE: Right now this only works if the prop name and trait name is same
        //   childComp.updateTrait('bg-color', {
        //     type: 'color',
        //     value: isBackgroundColor ? bgStyle : 'transparent',
        //   });
        // });

        // this.setStyle({
        //   ...this.getStyle(),
        //   background: bgStyle,
        // });

        const containerComponent = this.findType('container')[0];

        if (containerComponent) {
          containerComponent.setStyle({
            ...containerComponent.getStyle(),
            background: bgStyle,
          });
        } else {
          this.setStyle({
            ...this.getStyle(),
            background: bgStyle,
          });
        }
      },
      handleFontChange() {
        const font = this.props()['font-family'];

        const textSectionContainer = this.find('div.text-section-container')[0];

        console.log(textSectionContainer);

        if (textSectionContainer) {
          textSectionContainer.setStyle({
            ...textSectionContainer.getStyle(),
            'font-family': generateFontFamilyStylingText(font),
          });
        }

        // this.components().forEach((comp) => {
        //   comp.setStyle({
        //     ...comp.getStyle(),
        //     'font-family': generateFontFamilyStylingText(font),
        //   });
        // });

        // this.setStyle({
        //   ...this.getStyle(),
        //   'font-family': generateFontFamilyStylingText(font),
        // });
      },
    },
  });
};
