import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { genericFontTraits } from '../Configs/common/trait_sets';
import { generateContainerWrapper } from '../CustomComponents/Container.js';
import { textSectionPropHandlers, textSectionTraits } from './SimpleTextSection';

import defaultBlockToolbar from '../Configs/common/toolbar.js';
import traitTypes from '../Configs/strings/traitTypes';
import customCommands from '../Configs/strings/customCommands';

export default (editor) => {
  editor.DomComponents.addType('testimonial-item', {
    extend: 'simple-text-image-section',
    model: {
      defaults: {
        ...fullyDisabledComponentFlags,
        selectable: true,
        badgable: true,
        hoverable: true,
        name: 'Testimonial Item',
        attributes: {
          class: 'testimonials-item',
        },
        'font-family': 'Times New Roman',
        'text-color': '#000000',
        traits: [
          {
            type: traitTypes.IMAGE.CUTOUT_SHAPE_SELECT,
          },
          {
            type: 'button',
            text: 'Click to set image',
            full: true,
            label: 'Set Image',
            command: customCommands.IMAGE.SET_URL,
          },
          ...genericFontTraits,
        ],
        components: [
          {
            type: 'custom-image',
          },
          {
            type: 'simple-text-section',
            components: [
              {
                tagName: 'h2',
                type: 'text-section-heading',
                content: 'John Doe',
              },
              {
                type: 'text-section-content',
              },
            ],
          },
        ],
        styles: `
          .testimonials-item {
            flex-direction: column;
            flex: 0 0 30%;
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
        ...fullyDisabledComponentFlags,
        attributes: {
          class: 'testimonial-items-container',
        },
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
          .testimonial-items-container {
            display: flex;
            width: 100%;
            flex: 1 0 100%;
            gap: 8px;
            justify-content: space-evenly;
            padding: 8px;
            text-align: center;
            flex-wrap: wrap;
          }

          @media (max-width: 768px) {
            .testimonial-items-container {
              flex-direction: column;
            }
          }
        `,
      },
    },
  });

  // Testimonials
  editor.DomComponents.addType('testimonials-block', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Testimonials',
        droppable: false,
        toolbar: defaultBlockToolbar,
        attributes: {
          class: 'testimonial-container',
        },
        traits: [
          ...textSectionTraits,
          {
            type: traitTypes.LIST_ITEMS.TESTIMONIAL_ITEMS,
            id: traitTypes.LIST_ITEMS.TESTIMONIAL_ITEMS,
            value: false,
          },
        ],
        components: generateContainerWrapper([
          { type: 'text-section-heading', attributes: {} },
          { type: 'testimonials' },
        ]),
        'font-family': 'Times New Roman',
        'text-color': '#000000',
        'bg-color': '#ffffff',
        styles: `
          .testimonial-container {
            text-align: center;
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-color', this.handleBGStyleChange);
        this.on('change:font-family', this.handleFontChange);

        const innerItemsList = this.findType('testimonials')[0] ?? null;
        const componentCollection = innerItemsList ? innerItemsList.components() : this.components();
        this.listenTo(componentCollection, 'add remove change', this.handleComponentsChange);
      },
      ...textSectionPropHandlers,
      handleComponentsChange() {
        // Here we're simply toggling the value
        // to trigger the trait update
        const targetTrait = traitTypes.LIST_ITEMS.TESTIMONIAL_ITEMS;
        const prevValue = this.getTrait(targetTrait).get('value');

        this.updateTrait(targetTrait, {
          value: !prevValue,
        });
      },
    },
  });
};
