export default (editor) => {
  editor.DomComponents.addType('text-with-image-section', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Text with Image',
        droppable: false,
        attributes: {
          class: 'text-image-section-container',
        },
        'bg-color': '#fff',
        traits: [
          {
            type: 'padding-slider',
          },
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
          {
            type: 'color',
            label: 'Background color',
            name: 'bg-color',
            changeProp: 1,
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
            type: 'image',
            attributes: {
              loading: 'lazy',
            },
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            hoverable: false,
            copyable: false,
            resizable: true,
            toolbar: [],
          },
        ],
        styles: `
          .text-image-section-container {
            display: flex;
            flex: 0 1 auto;
            justify-content: space-between;
            width: 100%;
            padding: 8px;
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
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when bg-color attribute changes
        this.on('change:bg-color', this.handleBGColorChange);
      },
      // TODO: Make this propagate the changes inside
      // Seems like the propagation needs to be handled manually
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
    },
  });
};
