import { generateFontFamilyStylingText } from 'utils/helper.js';
import { generateContainerWrapper } from '../Configs/blocks';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { backgroundTraits, fontTraits, innerButtonTraits } from '../Configs/common/trait_sets';

export const textSectionPropHandlers = {
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
        ...this.getStyle(),
        'font-family': generateFontFamilyStylingText(font),
      });
    }
  },
};

export const textSectionTraits = [
  {
    type: 'text-section-layout',
    name: 'layout',
  },
  ...fontTraits,
  ...backgroundTraits,
];

const textSectionBaseComponents = [
  {
    tagName: 'h1',
    type: 'text',
    content: 'Section Title',
    name: 'Section Title',
    attributes: {},
    traits: [],
    ...fullyDisabledComponentFlags,
    editable: true,
    badgable: true,
    selectable: true,
    hoverable: true,
  },
  {
    tagName: 'p',
    type: 'text',
    content: 'Section Content',
    name: 'Section Content',
    attributes: {},
    traits: [],
    ...fullyDisabledComponentFlags,
    editable: true,
    badgable: true,
    selectable: true,
    hoverable: true,
  },
];

export default (editor) => {
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
          }

          .text-section-container * {
            position: relative;
            flex: 0 0 auto;
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
        attributes: {
          layout: 'center',
          class: 'simple-text-section-block',
        },
        traits: textSectionTraits,
        components: generateContainerWrapper([{ type: 'simple-text-section' }]),
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
        attributes: {
          layout: 'center',
          class: 'simple-text-section-block',
        },
        traits: [...textSectionTraits, ...innerButtonTraits],
        components: generateContainerWrapper([{ type: 'simple-text-section-with-button' }]),
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
      ...textSectionPropHandlers,
    },
  });

  // Bio Section with Links
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
