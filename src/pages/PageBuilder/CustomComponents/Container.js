import { isValidCSSColor } from 'utils/colors';

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
            type: 'color',
            label: 'Background color',
            name: 'bg-style',
            changeProp: true,
          },
        ],
        components: [],
        styles: `
          .fixed-container {
            display: block;
            padding: 8px;
            margin-left: auto;
            margin-right: auto;
            max-width: 980px;
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

  editor.DomComponents.addType('container', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Container',
        attributes: {
          class: 'simple-container',
        },
        'bg-style': '',
        traits: [
          {
            type: 'padding-slider',
          },
          {
            type: 'color',
            label: 'Background color',
            name: 'bg-style',
            changeProp: true,
          },
        ],
        components: [],
        styles: `
          .simple-container {
            display: block;
            padding: 8px;
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
};
