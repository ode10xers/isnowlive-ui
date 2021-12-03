import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { contextualFontTraits } from '../Configs/common/trait_sets';
import componentTypes from '../Configs/strings/componentTypes';
import traitTypes from '../Configs/strings/traitTypes';

import SignInButton from 'components/PageEditorPassionComponents/SignInButton';

import { generateContainerWrapper } from './Container';
import { textPropHandlers } from './SimpleTextSection';

// NOTE: In this case, the header is completely uninteractable (except selecting)
export default (editor) => {
  editor.Components.addType(componentTypes.CUSTOM_COMPONENTS.REACT_SIGN_IN_BUTTON, {
    extend: componentTypes.REACT_COMPONENT_HANDLER,
    isComponent: (el) => el.tagName === componentTypes.CUSTOM_COMPONENTS.REACT_SIGN_IN_BUTTON.toUpperCase(),
    model: {
      defaults: {
        component: SignInButton,
        ...fullyDisabledComponentFlags,
        highlightable: true,
        hoverable: true,
        selectable: true,
        badgable: true,
        attributes: {
          target: 'current',
          buttonType: 'primary',
        },
        traits: [
          {
            type: 'select',
            label: 'After Login',
            name: 'target',
            options: [
              { id: 'dashboard', name: 'Go to Dashboard' },
              { id: 'current', name: 'Stay in page' },
            ],
          },
          {
            type: 'select',
            label: 'Button Type',
            name: 'buttonType',
            options: [
              { id: 'primary', name: 'Filled' },
              { id: 'outlined', name: 'Outlined' },
              { id: 'link', name: 'Link Text' },
            ],
          },
        ],
      },
    },
  });

  editor.Components.addType(componentTypes.HEADER.INNER.TEXT_BRAND, {
    extend: 'text',
    model: {
      defaults: {
        tagName: 'h1',
        content: 'My Brand',
        name: 'My Brand',
        traits: contextualFontTraits,
        attributes: {
          class: 'brand-text',
        },
        'font-family': 'Times New Roman',
        'text-color': '#262626',
        ...fullyDisabledComponentFlags,
        editable: true,
        init() {
          // We put a listener that triggers when an attribute changes
          // In this case when text-color attribute changes
          this.on('change:text-color', this.handleTextColorChange);
          this.on('change:font-family', this.handleFontChange);
        },
        ...textPropHandlers,
      },
    },
  });

  editor.Components.addType(componentTypes.HEADER.INNER.BRAND_WRAPPER, {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Header Brand',
        ...fullyDisabledComponentFlags,
        attributes: {
          class: componentTypes.HEADER.INNER.BRAND_WRAPPER,
        },
        components: [
          {
            type: componentTypes.HEADER.INNER.TEXT_BRAND,
          },
        ],
        styles: `
          .header-brand {
            flex: 1 1 auto;
            padding: 8px;
          }

          .header-brand .brand-text {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 0 !important;
          }

          .header-brand .brand-image {
            max-height: 48px;
          }
        `,
      },
    },
  });

  editor.Components.addType(componentTypes.HEADER.NAVBAR_WRAPPER, {
    model: {
      defaults: {
        tagName: 'header',
        name: 'Navbar Header',
        ...fullyDisabledComponentFlags,
        layerable: true,
        attributes: {
          class: 'header-container',
        },
        components: [
          {
            type: componentTypes.HEADER.INNER.BRAND_WRAPPER,
          },
          {
            type: componentTypes.CUSTOM_COMPONENTS.REACT_SIGN_IN_BUTTON,
            highlightable: true,
            selectable: true,
            hoverable: true,
            badgable: true,
            layerable: true,
          },
        ],
        styles: `
          .header-container {
            display: flex;
            flex: 0 1 auto;
            flex-wrap: nowrap;
            column-gap: 12px;
            width: 100%;
            margin: 0px;
            padding: 12px;
            height: 64px;
            align-items: center;
          }
        `,
      },
    },
  });

  editor.Components.addType(componentTypes.BLOCKS.HEADER, {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Header',
        components: generateContainerWrapper([{ type: componentTypes.HEADER.NAVBAR_WRAPPER }], true),
        ...fullyDisabledComponentFlags,
        highlightable: true,
        selectable: true,
        hoverable: true,
        badgable: true,
        'bg-color': '#ffffff',
        'brand-type': 'text',
        traits: [
          {
            type: traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER,
            label: 'Background color',
            name: 'bg-color',
            changeProp: 1,
          },
          {
            type: traitTypes.HEADER.BRAND_TYPE_SELECT,
          },
          {
            type: traitTypes.LIST_ITEMS.NAV_LINKS,
            id: traitTypes.LIST_ITEMS.NAV_LINKS,
            value: false,
          },
        ],
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:bg-color', this.handleBGColorChange);
        this.on('change:brand-type', this.handleBrandTypeChange);

        const componentCollection = this.components();
        this.listenTo(componentCollection, 'add remove', this.handleComponentsChange);
      },
      handleBGColorChange() {
        const bgColor = this.props()['bg-color'];
        const componentList = this.components();
        // Check for child components with the same property
        const validChildList = componentList.filter((comp) => comp.props().hasOwnProperty('bg-color'));

        validChildList.forEach((childComp) => {
          // NOTE: Right now this only works if the prop name and trait name is same
          childComp.updateTrait('bg-color', {
            type: traitTypes.CUSTOM_REACT_INPUTS.CUSTOM_COLOR_PICKER,
            value: bgColor,
          });
        });

        this.setStyle({
          ...this.getStyle(),
          background: bgColor,
        });
      },
      handleBrandTypeChange() {
        const brandType = this.props()['brand-type'];

        let childQuery = null;
        let appendedComponent = null;

        if (brandType === 'text') {
          childQuery = componentTypes.HEADER.INNER.TEXT_BRAND;
          appendedComponent = {
            type: componentTypes.HEADER.INNER.TEXT_BRAND,
          };
        } else if (brandType === 'image') {
          childQuery = componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE;
          appendedComponent = {
            type: componentTypes.CUSTOM_COMPONENTS.CUSTOM_IMAGE,
            attributes: {
              class: 'brand-image',
            },
            highlightable: true,
            selectable: true,
            hoverable: true,
            editable: true,
            badgable: true,
          };
        }

        if (!childQuery || !appendedComponent) {
          return;
        }

        const brandContainer = this.findType(componentTypes.HEADER.INNER.BRAND_WRAPPER)[0] ?? null;

        if (brandContainer) {
          const componentList = brandContainer.findType(childQuery);

          if (componentList.length <= 0) {
            brandContainer.components(appendedComponent);
          }
        }
      },
      handleComponentsChange() {
        // Here we're simply toggling the value
        // to trigger the trait update
        const targetTrait = traitTypes.LIST_ITEMS.NAV_LINKS;
        const prevValue = this.getTrait(targetTrait).get('value');

        this.updateTrait(targetTrait, {
          value: !prevValue,
        });
      },
    },
  });
};
