import SignInButton from 'components/PageEditorPassionComponents/SignInButton';
import { fullyDisabledComponentFlags } from '../Configs/common/component_flags';
import { contextualFontTraits } from '../Configs/common/trait_sets';
import { textPropHandlers } from './SimpleTextSection';

// NOTE: In this case, the header is completely uninteractable (except selecting)
export default (editor) => {
  editor.Components.addType('SignInButton', {
    extend: 'react-component',
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
    isComponent: (el) => el.tagName === 'SIGNINBUTTON',
  });

  editor.Components.addType('header-text-brand', {
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

  editor.Components.addType('header-brand', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Header Brand',
        ...fullyDisabledComponentFlags,
        attributes: {
          class: 'header-brand',
        },
        components: [
          {
            type: 'header-text-brand',
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

  editor.Components.addType('navbar-header', {
    model: {
      defaults: {
        tagName: 'header',
        name: 'Navbar Header',
        ...fullyDisabledComponentFlags,
        highlightable: true,
        selectable: true,
        hoverable: true,
        badgable: true,
        layerable: true,
        attributes: {
          class: 'header-container',
        },
        'bg-color': '#ffffff',
        'brand-type': 'text',
        traits: [
          {
            type: 'custom-color-picker',
            label: 'Background color',
            name: 'bg-color',
            changeProp: 1,
          },
          {
            type: 'brand-type-select',
          },
          {
            type: 'nav-links',
            id: 'nav-links',
            value: false,
          },
        ],
        components: [
          {
            type: 'header-brand',
          },
          {
            type: 'SignInButton',
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
            type: 'custom-color-picker',
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
          childQuery = 'header-text-brand';
          appendedComponent = {
            type: 'header-text-brand',
          };
        } else if (brandType === 'image') {
          childQuery = 'custom-image';
          appendedComponent = {
            type: 'custom-image',
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

        const brandContainer = this.findType('header-brand')[0] ?? null;

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
        const targetTrait = 'nav-links';
        const prevValue = this.getTrait(targetTrait).get('value');

        this.updateTrait(targetTrait, {
          value: !prevValue,
        });
      },
    },
  });
};
