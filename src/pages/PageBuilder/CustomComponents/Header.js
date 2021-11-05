import { generateFontFamilyStylingText } from 'utils/helper.js';

// NOTE: In this case, the header is completely uninteractable (except selecting)
export default (editor) => {
  editor.DomComponents.addType('navbar-header', {
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
        components: [
          {
            tagName: 'h1',
            type: 'text',
            content: 'My Brand',
            name: 'My Brand',
            attributes: {
              class: 'header-brand',
            },
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
          .header-container {
            display: flex;
            flex: 0 1 auto;
            flex-wrap: nowrap;
            width: 100%;
            margin: 0px;
            padding: 12px;
          }

          .header-container .header-brand {
            flex: 1 1 auto;
            padding: 8px;
          }
        `,
      },
      init() {
        // We put a listener that triggers when an attribute changes
        // In this case when text-color attribute changes
        this.on('change:text-color', this.handleTextColorChange);
        this.on('change:bg-color', this.handleBGColorChange);
        this.on('change:font-family', this.handleFontChange);
      },
      handleTextColorChange() {
        const textColor = this.props()['text-color'];

        //Propagate this inside
        this.components().forEach((comp) => {
          comp.setStyle({
            ...comp.getStyle(),
            color: `${textColor} !important`,
          });
        });

        this.setStyle({
          ...this.getStyle(),
          color: `${textColor} !important`,
        });
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
      handleFontChange() {
        const font = this.props()['font-family'];

        this.setStyle({
          ...this.getStyle(),
          'font-family': generateFontFamilyStylingText(font),
        });
      },
    },
  });
};
