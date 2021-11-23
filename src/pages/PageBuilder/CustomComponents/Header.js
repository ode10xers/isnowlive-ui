import SignInButton from 'components/PageEditorPassionComponents/SignInButton';

// NOTE: In this case, the header is completely uninteractable (except selecting)
export default (editor) => {
  editor.Components.addType('SignInButton', {
    extend: 'react-component',
    model: {
      defaults: {
        component: SignInButton,
        stylable: false,
        resizable: false,
        editable: false,
        droppable: false,
        draggable: false,
        removable: false,
        highlightable: false,
        hoverable: false,
        copyable: false,
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
          // {
          //   type: 'link-button-list',
          // }
        ],
      },
    },
    isComponent: (el) => el.tagName === 'SIGNINBUTTON',
  });

  editor.Components.addType('header-brand', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Header Brand',
        droppable: false,
        draggable: false,
        removable: false,
        stylable: false,
        copyable: false,
        resizeable: false,
        layerable: false,
        highlightable: true,
        selectable: true,
        hoverable: true,
        badgeable: true,
        toolbar: [],
        attributes: {
          class: 'header-brand',
        },
        'brand-type': 'text',
        traits: [
          {
            type: 'brand-type-select',
          },
        ],
        components: [
          {
            tagName: 'h1',
            type: 'text',
            content: 'My Brand',
            name: 'My Brand',
            traits: [],
            toolbar: [],
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            hoverable: false,
            copyable: false,
          },
        ],
        styles: `
          .header-brand {
            flex: 1 1 auto;
            padding: 8px;
          }

          .header-brand h1 {
            font-size: 20px;
            font-weight: 500;
          }

          .header-brand img {
            max-height: 48px;
          }
        `,
      },
      init() {
        this.on('change:brand-type', this.handleBrandTypeChange);
      },
      handleBrandTypeChange() {
        const brandType = this.props()['brand-type'];

        let childQuery = null;
        let appendedComponent = null;

        if (brandType === 'text') {
          childQuery = 'text';
          appendedComponent = {
            tagName: 'h1',
            type: 'text',
            content: 'My Brand',
            name: 'My Brand',
            traits: [],
            toolbar: [],
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            editable: true,
            hoverable: false,
            copyable: false,
          };
        } else if (brandType === 'image') {
          childQuery = 'image';
          appendedComponent = {
            type: 'image',
            attributes: {
              loading: 'lazy',
            },
            removable: false,
            draggable: false,
            badgable: false,
            droppable: false,
            highlightable: false,
            hoverable: false,
            copyable: false,
            resizable: false,
            toolbar: [],
          };
        }

        if (!childQuery || !appendedComponent) {
          return;
        }

        const componentList = this.findType(childQuery);

        if (componentList.length <= 0) {
          this.components(appendedComponent);
        }
      },
    },
  });

  editor.Components.addType('navbar-header', {
    model: {
      defaults: {
        tagName: 'header',
        name: 'Navbar Header',
        droppable: false,
        draggable: false,
        removable: false,
        stylable: false,
        copyable: false,
        resizeable: false,
        layerable: false,
        highlightable: true,
        selectable: true,
        hoverable: true,
        badgeable: true,
        toolbar: [],
        attributes: {
          class: 'header-container',
        },
        'bg-color': 'transparent',
        traits: [
          {
            type: 'color',
            label: 'Background color',
            name: 'bg-color',
            changeProp: 1,
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
            type: 'color',
            value: bgColor,
          });
        });

        this.setStyle({
          ...this.getStyle(),
          'background-color': bgColor,
        });
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
