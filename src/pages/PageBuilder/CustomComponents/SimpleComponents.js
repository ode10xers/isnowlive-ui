import { backgroundTraits } from '../Configs/common/trait_sets';
import defaultToolbar from '../Configs/common/toolbar.js';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';

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
            type: 'container-justify-content',
            label: 'Vertical Align',
          },
          {
            type: 'padding-slider',
            min: 0,
            max: 100,
          },
          {
            type: 'margin-slider',
          },
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
            type: 'container-align-items',
            label: 'Vertical Align',
          },
          {
            type: 'padding-slider',
            min: 0,
            max: 100,
          },
          {
            type: 'margin-slider',
          },
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
};
