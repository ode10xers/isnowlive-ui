import { generateFontFamilyStylingText } from 'utils/helper.js';

export default (editor) => {
  editor.DomComponents.addType('simple-text-image-section', {
    model: {
      defaults: {
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
          class: 'text-image-section-container',
        },
        components: [
          {
            type: 'simple-text-section',
          },
          {
            type: 'custom-image',
          },
        ],
        styles: `
          .text-image-section-container {
            position: relative;
            display: flex;
            flex: 0 1 auto;
            gap: 12px;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 8px;
          }

          .text-image-section-container > img {
            width: 100%;
            max-width: 270px;
            height: auto;
            flex: 0 1 50%;
          }

          .text-image-section-container.image-left {
            flex-direction: row-reverse;
          }

          .text-image-section-container.image-right {
            flex-direction: row;
          }

          .text-image-section-container.image-top {
            flex-direction: column-reverse;
            flex: 1 1 100%;
          }

          .text-image-section-container.image-bottom {
            flex-direction: column;
            flex: 1 1 100%;
          }

          .text-image-section-container.image-bottom > img {
            align-self: center;
            max-width: 100%;
          }

          .text-image-section-container.image-top > img {
            align-self: center;
            max-width: 100%;
          }

          @media (max-width: 768px) {
            .text-image-section-container.image-left, .text-image-section-container {
              flex-direction: column-reverse;
              flex: 1 1 100%;
            }

            .text-image-section-container.image-right {
              flex-direction: column;
              flex: 1 1 100%;
            }

            .text-image-section-container > img {
              flex: 1 1 100%;
              max-width: 100%;
            }
          }
        `,
      },
    },
  });

  editor.DomComponents.addType('simple-text-with-image-block', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Simple Text with Image Section',
        droppable: false,
        attributes: {
          layout: 'center',
          class: 'text-image-section-container',
        },
        traits: [
          {
            type: 'image-position-layout',
          },
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
          {
            type: 'border-radius-slider',
            unit: '%',
          },
        ],
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
                    type: 'simple-text-image-section',
                  },
                ],
              },
            ],
          },
        ],
        'font-family': 'Arial',
        'text-color': '#000000',
        'bg-color': '#ffffff',
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

        if (textSectionContainer) {
          textSectionContainer.setStyle({
            ...textSectionContainer.getStyle(),
            'font-family': generateFontFamilyStylingText(font),
          });
        } else {
          this.setStyle({
            ...textSectionContainer.getStyle(),
            'font-family': generateFontFamilyStylingText(font),
          });
        }
      },
    },
  });
};
