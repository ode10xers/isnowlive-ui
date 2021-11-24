import { generateFontFamilyStylingText } from 'utils/helper.js';
import { generateContainerWrapper } from '../Configs/blocks';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import {
  backgroundTraits,
  contextualFontTraits,
  genericFontTraits,
  innerButtonTraits,
  socialLinksTraits,
} from '../Configs/common/trait_sets';

import defaultBlockToolbar from '../Configs/common/toolbar.js';

const websiteIcon = require('assets/icons/website/website.svg');
const facebookIcon = require('assets/icons/facebook/facebook.svg');
const linkedinIcon = require('assets/icons/linkedin/linkedin.svg');
const instagramIcon = require('assets/icons/instagram/instagram.svg');
const twitterIcon = require('assets/icons/twitter/twitter.svg');

const textPropHandlers = {
  handleFontChange() {
    const font = this.props()['font-family'];

    const textSectionContainer = this.find('div.text-section-container') ?? [this];

    textSectionContainer.forEach((innerComp) => {
      innerComp.setStyle({
        ...innerComp.getStyle(),
        'font-family': `${generateFontFamilyStylingText(font)} !important`,
      });

      innerComp.components().forEach((comp) => {
        comp.setStyle({
          ...comp.getStyle(),
          'font-family': `${generateFontFamilyStylingText(font)} !important`,
        });
      });
    });
  },
  handleTextColorChange() {
    const textColor = this.props()['text-color'];
    const textSectionContainer =
      this.find('div.text-section-container') ??
      this.findType('text') ??
      this.findType('textnode') ??
      this.components();

    console.log(textSectionContainer);

    textSectionContainer.forEach((innerComp) => {
      innerComp.setStyle({
        ...innerComp.getStyle(),
        color: `${textColor} !important`,
      });

      innerComp.components().forEach((comp) => {
        comp.setStyle({
          ...comp.getStyle(),
          color: `${textColor} !important`,
        });
      });
    });
  },
};

export const textSectionPropHandlers = {
  ...textPropHandlers,
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
};

export const textSectionTraits = [
  {
    type: 'text-section-layout',
    name: 'layout',
  },
  ...genericFontTraits,
  ...backgroundTraits,
];

const textSectionBaseComponents = [
  {
    type: 'text-section-heading',
  },
  {
    type: 'text-section-content',
  },
];

export default (editor) => {
  // Base Components
  editor.DomComponents.addType('text-section-heading', {
    extend: 'text',
    model: {
      defaults: {
        tagName: 'h1',
        name: 'Section Title',
        attributes: {
          class: 'text-section-heading',
        },
        'font-family': 'Segoe UI',
        'text-color': '#262626',
        content: 'Ad astra per aspera',
        traits: contextualFontTraits,
        ...fullyDisabledComponentFlags,
        editable: true,
        badgable: true,
        selectable: true,
        hoverable: true,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:font-family', this.handleFontChange);
      },
      ...textPropHandlers,
    },
  });

  editor.DomComponents.addType('text-section-content', {
    extend: 'text',
    model: {
      defaults: {
        tagName: 'p',
        type: 'text',
        name: 'Section Content',
        attributes: {
          class: 'text-section-content',
        },
        'font-family': 'Segoe UI',
        'text-color': '#484949',
        content: `
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vestibulum vestibulum est at fringilla. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed tempus augue vel eros elementum mollis.
        `,
        traits: contextualFontTraits,
        ...fullyDisabledComponentFlags,
        editable: true,
        badgable: true,
        selectable: true,
        hoverable: true,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:font-family', this.handleFontChange);
      },
      ...textPropHandlers,
    },
  });

  // Text Section
  editor.DomComponents.addType('simple-text-section', {
    model: {
      defaults: {
        tagName: 'div',
        ...fullyDisabledComponentFlags,
        attributes: {
          class: 'text-section-container',
        },
        components: textSectionBaseComponents,
        styles: `
          .text-section-container {
            display: flex;
            flex: 0 1 auto;
            width: 100%;
            padding: 8px;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align:center;
          }

          .text-section-container * {
            position: relative;
            flex: 0 0 auto;
          }

          .text-section-container .text-section-heading {
            color: #262626;
          }

          .text-section-container .text-section-content {
            color: #484949;
          }
        `,
      },
    },
  });

  editor.DomComponents.addType('simple-text-section-block', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Simple Text Section',
        droppable: false,
        toolbar: defaultBlockToolbar,

        attributes: {
          layout: 'center',
          class: 'simple-text-section-block',
        },
        traits: textSectionTraits,
        components: generateContainerWrapper([{ type: 'simple-text-section' }]),
        'font-family': 'Segoe UI',
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

  // Text Section With Button
  editor.DomComponents.addType('simple-text-section-with-button', {
    extend: 'simple-text-section',
    model: {
      defaults: {
        components: [
          ...textSectionBaseComponents,
          {
            type: 'text-section-link-button',
            ...fullyDisabledComponentFlags,
          },
        ],
      },
    },
  });

  editor.DomComponents.addType('simple-text-section-with-button-block', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Simple Text With Button Section',
        droppable: false,
        toolbar: defaultBlockToolbar,

        attributes: {
          layout: 'center',
          class: 'simple-text-section-block',
        },
        traits: [...textSectionTraits, ...innerButtonTraits],
        components: generateContainerWrapper([{ type: 'simple-text-section-with-button' }]),
        'font-family': 'Segoe UI',
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

  // Bio Section with Links
  editor.DomComponents.addType('social-media-links', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Social Media Links',
        attributes: {
          class: 'social-icons-container',
        },
        ...fullyDisabledComponentFlags,
        'bg-style': '#ffffff',
        'facebook-link': 'https://www.facebook.com',
        'instagram-link': 'https://www.instagram.com',
        'linkedin-link': 'https://www.linkedin.com',
        'twitter-link': 'https://twitter.com',
        'website-link': '',
        traits: socialLinksTraits,
        styles: `
          .social-icons-container {
            gap: 12px;
            display: flex;
            width: fit-content;
            justify-items: space-evenly;
            align-content: center;
            padding: 8px 12px;
            background: white;
            text-align:center;
            box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.08), 0px 0px 16px 2px rgba(0, 0, 0, 0.05);
            border-radius: 22.5px;
          }
        `,
      },
      init() {
        this.on('change:facebook-link', this.handleLinkChanged);
        this.on('change:instagram-link', this.handleLinkChanged);
        this.on('change:linkedin-link', this.handleLinkChanged);
        this.on('change:twitter-link', this.handleLinkChanged);
        this.on('change:website-link', this.handleLinkChanged);

        this.handleLinkChanged();
      },
      handleLinkChanged() {
        const {
          'facebook-link': facebookLink,
          'instagram-link': instagramLink,
          'linkedin-link': linkedinLink,
          'twitter-link': twitterLink,
          'website-link': websiteLink,
        } = this.props();

        const linkArr = [];

        // TODO: Refactor this
        if (facebookLink) {
          linkArr.push({
            url: facebookLink,
            icon: facebookIcon,
            altText: 'Facebook',
          });
        }
        if (instagramLink) {
          linkArr.push({
            url: instagramLink,
            icon: instagramIcon,
            altText: 'Instagram',
          });
        }
        if (linkedinLink) {
          linkArr.push({
            url: linkedinLink,
            icon: linkedinIcon,
            altText: 'LinkedIn',
          });
        }
        if (twitterLink) {
          linkArr.push({
            url: twitterLink,
            icon: twitterIcon,
            altText: 'Twitter',
          });
        }
        if (websiteLink) {
          linkArr.push({
            url: websiteLink,
            icon: websiteIcon,
            altText: 'Website',
          });
        }

        this.components(
          linkArr.map((link) => ({
            type: 'link',
            attributes: {
              class: 'social-icon-item',
              href: link.url,
              target: '_blank',
            },
            ...fullyDisabledComponentFlags,
            components: [
              {
                type: 'image',
                ...fullyDisabledComponentFlags,
                attributes: {
                  loading: 'lazy',
                  src: link.icon,
                  alt: link.altText,
                  height: '32',
                  width: '32',
                },
              },
            ],
          }))
        );
      },
    },
  });

  editor.DomComponents.addType('simple-bio-section', {
    extend: 'simple-text-section',
    model: {
      defaults: {
        components: [
          ...textSectionBaseComponents,
          {
            type: 'social-media-links',
            ...fullyDisabledComponentFlags,
          },
        ],
      },
    },
  });
};
