import { generateFontFamilyStylingText } from 'utils/helper.js';

export default (editor) => {
  editor.DomComponents.addType('testimonial-item', {
    extend: 'text-with-image-section',
    model: {
      defaults: {
        attributes: {
          class: 'testimonials-item',
        },
        traits: [],
        components: [
          {
            type: 'custom-image',
          },
          {
            type: 'text-section',
            removable: false,
            draggable: false,
            droppable: false,
            copyable: false,
            attributes: {
              class: 'text-section-container',
            },
            traits: [],
            components: [
              {
                tagName: 'h2',
                type: 'text',
                content: 'John Doe',
                name: 'Testimonial Name',
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
              {
                tagName: 'p',
                type: 'text',
                content: 'Overall satisfied and really happy!',
                name: 'Testimonial Content',
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
            ],
          },
        ],
        styles: `
          .testimonials-item {
            flex-direction: column;
            flex: 1 1 100%;
            text-align: center;
          }

          .testimonials-item img {
            align-self: center;
            margin: 12px auto;
            width: 100%;
            max-width: 270px;
            height: auto;
          }
        `,
      },
    },
  });

  editor.DomComponents.addType('testimonials', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Testimonials',
        droppable: false,
        attributes: {
          class: 'testimonials-container',
        },
        'font-family': 'Arial',
        'text-color': '#000000',
        traits: [
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
        components: [
          {
            type: 'testimonial-item',
          },
          {
            type: 'testimonial-item',
          },
          {
            type: 'testimonial-item',
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

          .testimonials-container {
            display: flex;
            width: 100%;
            flex: 1 0 100%;
            gap: 8px;
            justify-content: space-evenly;
            padding: 8px;
          }

          @media (max-width: 768px) {
            .testimonials-container {
              flex-direction: column;
            }
          }
        `,
      },
      init() {
        this.on('change:text-color', this.handleTextColorChange);
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
      handleFontChange() {
        const font = this.props()['font-family'];

        this.components().forEach((comp) => {
          comp.setStyle({
            ...comp.getStyle(),
            'font-family': generateFontFamilyStylingText(font),
          });
        });

        this.setStyle({
          ...this.getStyle(),
          'font-family': generateFontFamilyStylingText(font),
        });
      },
    },
  });
};
