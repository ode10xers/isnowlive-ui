import { backgroundTraits, contextualFontTraits, spacingTraits } from '../Configs/common/trait_sets';
import defaultToolbar from '../Configs/common/toolbar.js';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { textPropHandlers } from './SimpleTextSection';

import { imageTraits } from './SimpleTextWithImage.js';
import traitTypes from '../Configs/strings/traitTypes';

const containerBGHandler = {
  handleBGStyleChange() {
    const bgStyle = this.props()['bg-style'];

    this.setStyle({
      ...this.getStyle(),
      background: bgStyle,
    });
  },
};

export default (editor) => {
  // NOTE : Container Components
  editor.DomComponents.addType('flex-column-container', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Single Column Container',
        toolbar: defaultToolbar,
        resizable: {
          tl: 0, // Top left
          tc: 0, // Top center
          tr: 0, // Top right
          cl: 0, // Center left
          cr: 0, // Center right
          bl: 0, // Bottom left
          bc: 1, // Bottom center
          br: 0, // Bottom right
        },
        attributes: {
          class: 'flex-container',
        },
        'bg-style': '#ffffff',
        traits: [
          {
            type: traitTypes.FLEX.CONTAINER_JUSTIFY_CONTENT,
            label: 'Vertical Align',
          },
          ...spacingTraits,
          ...backgroundTraits,
        ],
        styles: `
          .flex-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 4px;
            min-height: 200px;
            width: 100%;
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when bg-style attribute changes
        this.on('change:bg-style', this.handleBGStyleChange);
      },
      ...containerBGHandler,
    },
  });

  editor.DomComponents.addType('flex-column-item', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Column Item',
        ...fullyDisabledComponentFlags,
        layerable: true,
        attributes: {
          class: 'column-item',
        },
        components: [
          {
            type: 'flex-column-container',
          },
        ],
        styles: `
          .column-item {
            min-height: 200px;
            flex: 1 0 auto;
          }
        `,
      },
    },
  });

  editor.DomComponents.addType('two-column-container', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Two Column Container',
        toolbar: defaultToolbar,
        droppable: false,
        resizable: {
          tl: 0, // Top left
          tc: 0, // Top center
          tr: 0, // Top right
          cl: 0, // Center left
          cr: 0, // Center right
          bl: 0, // Bottom left
          bc: 1, // Bottom center
          br: 0, // Bottom right
        },
        attributes: {
          class: 'two-column-container',
        },
        'bg-style': '#ffffff',
        components: [
          {
            type: 'flex-column-item',
          },
          {
            type: 'flex-column-item',
          },
        ],
        traits: [
          {
            type: traitTypes.FLEX.CONTAINER_ALIGN_ITEMS,
            label: 'Vertical Align',
          },
          ...spacingTraits,
          ...backgroundTraits,
        ],
        styles: `
          .two-column-container {
            display: flex;
            flex-flow: row wrap;
            flex: 1 0 100%;
            padding: 4px;
            min-height: 100px;
            align-items: center;
            justify-content: center;
          }

          .two-column-container .column-item {
            flex: 0 0 50%;
          }

          @media (max-width: 768px) {
            .two-column-container .column-item {
              flex: 0 0 100%;
            }
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when bg-style attribute changes
        this.on('change:bg-style', this.handleBGStyleChange);
      },
      ...containerBGHandler,
    },
  });

  // NOTE : Text & Image Components
  editor.DomComponents.addType('text-item', {
    extend: 'text',
    model: {
      defaults: {
        tagName: 'p',
        name: 'Text',
        editable: true,
        droppable: false,
        attributes: {
          class: 'text-item',
        },
        toolbar: defaultToolbar,
        'font-family': 'Times New Roman',
        'text-color': '#000000',
        content: `
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vestibulum vestibulum est at fringilla. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed tempus augue vel eros elementum mollis.
        `,
        traits: [
          {
            type: traitTypes.LAYOUTS.TEXT_SECTION_LAYOUT,
          },
          ...spacingTraits,
          ...contextualFontTraits,
        ],
        styles: `
          .text-item {
            width: auto;
          }
        `,
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

  editor.DomComponents.addType('image-item', {
    extend: 'image',
    model: {
      defaults: {
        name: 'Image',
        tagName: 'img',
        attributes: {
          loading: 'lazy',
        },
        toolbar: defaultToolbar,
        droppable: false,
        editable: true,
        traits: [
          {
            type: traitTypes.FLEX.ITEMS_ALIGN_SELF,
          },
          ...spacingTraits,
          ...imageTraits,
        ],
      },
    },
    view: {
      events: {
        dblclick: 'initResize',
        click: 'onActive',
        error: 'onError',
        load: 'onLoad',
        dragstart: 'noDrag',
      },
    },
  });
};
