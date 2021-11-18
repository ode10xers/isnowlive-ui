import { isValidCSSColor } from 'utils/colors';

export default (editor) => {
  // TODO: Rename this type for better understanding
  editor.DomComponents.addType('image-with-padding', {
    extend: 'image',
    model: {
      defaults: {
        attributes: {
          loading: 'lazy',
        },
        traits: [
          // {
          //   type: 'padding-slider',
          // },
          {
            type: 'border-radius-slider',
            name: 'border-radius',
            unit: '%',
          },
        ],
        removable: false,
        draggable: false,
        droppable: false,
        highlightable: false,
        copyable: false,
        resizable: true,
        toolbar: [],
      },
    },
  });

  editor.DomComponents.addType('text-with-image-section', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Text with Image',
        droppable: false,
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
          class: 'text-image-section-container',
        },
        'bg-style': '',
        traits: [
          // {
          //   type: 'padding-slider',
          // },
          {
            type: 'image-position-layout',
            name: 'image-layout',
          },
          {
            type: 'button',
            text: 'Click to set image',
            full: true,
            label: 'Image',
            command: 'set-image-url',
          },
          // NOTE: the 2nd attribute is image picker because the
          // default value of bg-style is empty (which will show image bg)
          {
            type: 'background-styles',
            id: 'background-style-picker',
          },
          {
            id: 'bg-image-picker',
            type: 'button',
            text: 'Click to set image',
            full: true,
            label: 'Background Image',
            command: 'set-background-image',
          },
        ],
        components: [
          {
            type: 'text-section',
            removable: false,
            draggable: false,
            droppable: false,
            copyable: false,
          },
          {
            type: 'image-with-padding',
          },
        ],
        // NOTE : this class probably needs to be global, can put in baseCss
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
          }

          .text-image-section-container.image-top > img {
            align-self: center;
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
            }
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when bg-style attribute changes
        this.on('change:bg-style', this.handleBGStyleChange);
      },
      handleBGStyleChange() {
        const bgStyle = this.props()['bg-style'];
        const componentList = this.components();

        const isBackgroundColor = isValidCSSColor(bgStyle);

        // NOTE: We might want to only propagate changes if the bg is color
        // if not then just make it transparent
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
    },
  });

  editor.DomComponents.addType('text-button-with-image-section', {
    extend: 'text-with-image-section',
    model: {
      defaults: {
        components: [
          {
            type: 'text-section-with-button',
            removable: false,
            draggable: false,
            droppable: false,
            copyable: false,
          },
          {
            type: 'image-with-padding',
          },
        ],
      },
    },
  });
};
