import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { socialLinksTraits } from '../Configs/common/trait_sets';
import { textSectionPropHandlers, textSectionTraits } from './SimpleTextSection';
import { generateContainerWrapper } from '../CustomComponents/Container.js';

import defaultBlockToolbar from '../Configs/common/toolbar.js';
import traitTypes from '../Configs/strings/traitTypes';
import customCommands from '../Configs/strings/customCommands';
import componentTypes from '../Configs/strings/componentTypes';

export const imageTraits = [
  {
    type: traitTypes.IMAGE.CUTOUT_SHAPE_SELECT,
  },
  {
    name: 'set-img-btn',
    type: 'button',
    text: 'Click to set image',
    full: true,
    label: 'Set Image',
    command: customCommands.IMAGE.SET_URL,
  },
];

const textSectionWithImageTraits = [
  {
    type: traitTypes.LAYOUTS.IMAGE_POSITION_LAYOUT,
  },
  ...imageTraits,
  ...textSectionTraits,
];

export default (editor) => {
  editor.DomComponents.addType(componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE, {
    extend: 'image',
    model: {
      defaults: {
        name: 'Image',
        attributes: {
          loading: 'lazy',
        },
        traits: imageTraits,
        ...fullyDisabledComponentFlags,
        editable: true,
      },
    },
    view: {
      events: {
        // We reverse click and dblclick event
        // NOTE: If we reverse it the behavior when changing
        // header brand into image might not work properly
        click: 'initResize',
        dblclick: 'onActive',
        error: 'onError',
        load: 'onLoad',
        dragstart: 'noDrag',
      },
    },
  });

  // Text with Image Section
  editor.DomComponents.addType(componentTypes.LAYOUTS.INNER.TEXT_IMAGE_SECTION_WRAPPER, {
    model: {
      defaults: {
        tagName: 'div',
        ...fullyDisabledComponentFlags,
        attributes: {
          class: 'text-image-section-container',
        },
        components: [
          {
            type: componentTypes.LAYOUTS.INNER.TEXT_SECTION_WRAPPER,
          },
          {
            type: componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE,
          },
        ],
        styles: `
          .text-image-section-container {
            position: relative;
            display: flex;
            flex: 0 1 auto;
            row-gap: 20px;
            column-gap: 80px;
            justify-content: space-between;
            align-items: center;
            width: 100%;
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
            max-width: 280px;
          }

          .text-image-section-container.image-top > img {
            align-self: center;
            max-width: 280px;
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
              max-width: 50%;
            }
          }

          @media (max-width: 576px) {
            .text-image-section-container > img {
              max-width: 100%;
            }
          }
        `,
      },
    },
  });

  editor.DomComponents.addType(componentTypes.BLOCKS.LAYOUT_TEXT_IMAGE_SECTION, {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Simple Text with Image Section',
        droppable: false,
        toolbar: defaultBlockToolbar,
        attributes: {
          layout: 'center',
          class: 'text-image-section-container',
        },
        traits: textSectionWithImageTraits,
        components: generateContainerWrapper([{ type: componentTypes.LAYOUTS.INNER.TEXT_IMAGE_SECTION_WRAPPER }]),
        'font-family': 'Times New Roman',
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
      ...textSectionPropHandlers,
    },
  });

  // Text Button with Image Section
  editor.DomComponents.addType(componentTypes.LAYOUTS.INNER.TEXT_IMAGE_BTN_SECTION_WRAPPER, {
    extend: componentTypes.LAYOUTS.INNER.TEXT_IMAGE_SECTION_WRAPPER,
    model: {
      defaults: {
        components: [
          {
            type: componentTypes.LAYOUTS.INNER.TEXT_SECTION_WITH_BTN_WRAPPER,
          },
          {
            type: componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE,
          },
        ],
      },
    },
  });

  editor.DomComponents.addType(componentTypes.BLOCKS.LAYOUT_TEXT_BTN_IMAGE_SECTION, {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Simple Text with Button and Image Section',
        droppable: false,
        toolbar: defaultBlockToolbar,

        attributes: {
          layout: 'center',
          class: 'text-image-section-container',
        },
        traits: [...textSectionWithImageTraits],
        components: generateContainerWrapper([{ type: componentTypes.LAYOUTS.INNER.TEXT_IMAGE_BTN_SECTION_WRAPPER }]),
        'font-family': 'Times New Roman',
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
      ...textSectionPropHandlers,
    },
  });

  // Bio section with image
  editor.DomComponents.addType(componentTypes.LAYOUTS.INNER.BIO_WITH_IMAGE_SECTION, {
    extend: componentTypes.LAYOUTS.INNER.TEXT_IMAGE_SECTION_WRAPPER,
    model: {
      defaults: {
        components: [
          {
            type: componentTypes.LAYOUTS.INNER.BIO_SECTION,
          },
          {
            type: componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE,
          },
        ],
      },
    },
  });

  editor.DomComponents.addType(componentTypes.BLOCKS.LAYOUT_BIO, {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Bio Section',
        droppable: false,
        toolbar: defaultBlockToolbar,

        attributes: {
          layout: 'center',
          class: 'text-image-section-container',
        },
        traits: [...textSectionWithImageTraits, ...socialLinksTraits],
        components: generateContainerWrapper([{ type: componentTypes.LAYOUTS.INNER.BIO_WITH_IMAGE_SECTION }]),
        'font-family': 'Times New Roman',
        'text-color': '#000000',
        'bg-color': '#ffffff',
        'facebook-link': 'https://www.facebook.com',
        'instagram-link': 'https://www.instagram.com',
        'linkedin-link': 'https://www.linkedin.com',
        'twitter-link': 'https://twitter.com',
        'website-link': '',
      },

      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-color', this.handleBGStyleChange);
        this.on('change:font-family', this.handleFontChange);

        this.on('change:facebook-link', this.handleLinkChanged);
        this.on('change:instagram-link', this.handleLinkChanged);
        this.on('change:linkedin-link', this.handleLinkChanged);
        this.on('change:twitter-link', this.handleLinkChanged);
        this.on('change:website-link', this.handleLinkChanged);

        this.handleLinkChanged();
      },
      ...textSectionPropHandlers,
      handleLinkChanged() {
        const {
          'facebook-link': facebookLink,
          'instagram-link': instagramLink,
          'linkedin-link': linkedinLink,
          'twitter-link': twitterLink,
          'website-link': websiteLink,
        } = this.props();

        const targetComponent = this.findType(componentTypes.CUSTOM_COMPONENTS.INNER.SOCIAL_MEDIA_LINKS)[0] ?? null;

        if (targetComponent) {
          targetComponent.set({
            'facebook-link': facebookLink,
            'instagram-link': instagramLink,
            'linkedin-link': linkedinLink,
            'twitter-link': twitterLink,
            'website-link': websiteLink,
          });
        }
      },
    },
  });
};
