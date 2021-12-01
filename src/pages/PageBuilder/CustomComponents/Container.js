import { isValidCSSColor } from 'utils/colors';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';

export const generateContainerWrapper = (innerComponents = [], isCompact = false) => [
  {
    type: 'container',
    ...fullyDisabledComponentFlags,
    components: [
      {
        type: isCompact ? 'compact-fixed-width-container' : 'fixed-width-container',
        ...fullyDisabledComponentFlags,
        components: innerComponents,
      },
    ],
  },
];

// TODO: Refactor these later
export default (editor) => {
  editor.DomComponents.addType('fixed-width-container', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Fixed Container',
        'bg-style': '#ffffff',
        attributes: {
          class: 'fixed-container',
        },
        traits: [
          {
            type: 'custom-color-picker',
            label: 'Background color',
            name: 'bg-style',
            changeProp: true,
          },
        ],
        components: [],
        styles: `
          .fixed-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin: 0 auto;
            max-width: 980px;
            width: 100%;
            min-height: 400px;
            padding: 4px;
          }

          @media (max-width: 768px) {
            margin: 16px 8px;
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
            type: 'custom-color-picker',
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

  editor.DomComponents.addType('compact-fixed-width-container', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Compact Fixed Container',
        'bg-style': '#ffffff',
        attributes: {
          class: 'compact-fixed-container',
        },
        traits: [
          {
            type: 'custom-color-picker',
            label: 'Background color',
            name: 'bg-style',
            changeProp: true,
          },
        ],
        components: [],
        styles: `
          .compact-fixed-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin: 0 auto;
            max-width: 980px;
            width: 100%;
            padding: 4px;
          }

          @media (max-width: 768px) {
            margin: 16px 8px;
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
            type: 'custom-color-picker',
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

  editor.DomComponents.addType('container', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Container',
        attributes: {
          class: 'simple-container',
        },
        'bg-style': '#ffffff',
        traits: [
          {
            type: 'padding-slider',
          },
          {
            type: 'custom-color-picker',
            label: 'Background color',
            name: 'bg-style',
            changeProp: true,
          },
        ],
        components: [],
        styles: `
          .simple-container {
            display: block;
            padding: 4px;
            width: 100%;
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
            type: 'custom-color-picker',
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
};
