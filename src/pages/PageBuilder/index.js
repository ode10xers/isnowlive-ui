import React, { useEffect, useState, useCallback } from 'react';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';

import definedBlocks from './blocks.js';
import definedPanels from './panels.js';
// import stylePanelSectors from './style_panel.js';

//eslint-disable-next-line
import styles from './style.module.scss';

const DummyTemplate = {
  html:
    '<div layout="left" class="text-section-container"><h1>Section Title</h1><p>Section Content</p></div><div layout="right" id="ibyq" class="text-section-container"><h1>Section Title</h1><p>Section Content</p></div><div layout="center" id="iwt8" class="text-section-container"><h1>Section Title</h1><p>Section Content</p></div>',
  components:
    '[{"type":"text-section","classes":["text-section-container"],"attributes":{"layout":"left"},"components":[{"tagName":"h1","type":"text","name":"Section Title","removable":false,"draggable":false,"badgable":false,"highlightable":false,"hoverable":false,"content":"Section Title"},{"tagName":"p","type":"text","name":"Section Content","removable":false,"draggable":false,"badgable":false,"highlightable":false,"hoverable":false,"content":"Section Content"}]},{"type":"text-section","classes":["text-section-container"],"attributes":{"layout":"right","id":"ibyq"},"components":[{"tagName":"h1","type":"text","name":"Section Title","removable":false,"draggable":false,"badgable":false,"highlightable":false,"hoverable":false,"content":"Section Title"},{"tagName":"p","type":"text","name":"Section Content","removable":false,"draggable":false,"badgable":false,"highlightable":false,"hoverable":false,"content":"Section Content"}]},{"type":"text-section","classes":["text-section-container"],"attributes":{"layout":"center","id":"iwt8"},"components":[{"tagName":"h1","type":"text","name":"Section Title","removable":false,"draggable":false,"badgable":false,"highlightable":false,"hoverable":false,"content":"Section Title"},{"tagName":"p","type":"text","name":"Section Content","removable":false,"draggable":false,"badgable":false,"highlightable":false,"hoverable":false,"content":"Section Content"}]}]',
  css: '* { box-sizing: border-box; } body {margin: 0;}#ibyq{text-align:right;}#iwt8{text-align:center;}',
  styles:
    '[{"selectors":["#ibyq"],"style":{"text-align":"right"}},{"selectors":["#iwt8"],"style":{"text-align":"center"}}]',
};

const PageBuilder = ({ match, history }) => {
  const [gjsEditor, setGjsEditor] = useState(null);

  const initializeGrapesJSEditor = useCallback(() => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    const TextSectionComponent = (editor) => {
      // TODO: Modify this according to the requirements
      editor.TraitManager.addType('text-section-layout', {
        // Expects as return a simple HTML string or an HTML element
        noLabel: true,
        templateInput: `<div class="custom-trait-layout">
        <div class="custom-trait-label">
          Layout
        </div>
        <div class="custom-trait-input" data-input>
        </div>
      </div>`,
        createInput({ trait }) {
          // Here we can decide to use properties from the trait
          const options = [
            { id: 'left', name: 'Left' },
            { id: 'right', name: 'Right' },
            { id: 'center', name: 'Centered' },
          ];

          // Create a new element container and add some content
          const el = document.createElement('div');
          el.innerHTML = `
          <select class="text-section-layout-select" style="color: 'black'">
            ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
          </select>
        `;

          return el;
        },
        // Update the component based on element changes
        // `elInput` is the result HTMLElement you get from `createInput`
        onEvent({ elInput, component, event }) {
          const inputType = elInput.querySelector('.text-section-layout-select');
          component.setStyle({
            'text-align': inputType.value ?? 'left',
          });
          component.addAttributes({
            layout: inputType.value,
            // style : `text-align:${inputType.value ?? 'left'}; padding: 20px; display:block;`
          });
        },
        // Update elements on the component change
        onUpdate({ elInput, component }) {
          const layout = component.getAttributes()['layout'] || 'left';
          const inputType = elInput.querySelector('.text-section-layout-select');
          inputType.value = layout;

          inputType.dispatchEvent(new CustomEvent('change'));
        },
      });

      editor.DomComponents.addType('text-section', {
        model: {
          defaults: {
            tagName: 'div',
            name: 'Text Section',
            droppable: false,
            attributes: {
              layout: 'left',
              // style: `text-align:left; padding: 20px; display: block;`,
              class: 'text-section-container',
            },
            traits: [
              {
                type: 'text-section-layout',
                name: 'layout',
              },
            ],
            // components: `
            //   <h1 class="text-section-title">Section Title</h1>
            //   <p class="text-section-content">You can place your section content here. Double click on this text to edit</p>
            // `,
            //? Above is the example of using default components with HTML strings
            //? Below we try to customize the behavior
            components: [
              {
                tagName: 'h1',
                type: 'text',
                content: 'Section Title',
                name: 'Section Title',
                attributes: {},
                traits: [],
                removable: false,
                draggable: false,
                badgable: false,
                droppable: false,
                highlightable: false,
                editable: true,
                hoverable: false,
                toolbar: [],
              },
              {
                tagName: 'p',
                type: 'text',
                content: 'Section Content',
                name: 'Section Content',
                attributes: {},
                traits: [],
                removable: false,
                draggable: false,
                badgable: false,
                droppable: false,
                highlightable: false,
                editable: true,
                hoverable: false,
                toolbar: [],
              },
            ],
            styles: `
              .text-section-container {
                display: block;
                padding: 20px;
              }
            `,
          },
        },
      });
    };

    const editor = grapesjs.init({
      // Indicate where to init the editor. You can also pass an HTMLElement
      container: '#builder-editor',
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      // fromElement: true,
      // Size of the editor
      height: '100vh',
      width: 'auto',
      storageManager: {
        id: 'gjs-', // Prefix identifier that will be used on parameters
        type: 'local', // Type of the storage
        autosave: true, // Store data automatically
        autoload: false, // Autoload stored data on init
        stepsBeforeSave: 1, // If autosave enabled, indicates how many changes are necessary before store method is triggered
      },
      keepUnusedStyles: false,
      // Avoid any default panel
      panels: definedPanels,
      // Built-in props for styles
      // https://grapesjs.com/docs/modules/Style-manager.html#built-in-properties
      // styleManager: {
      //   sectors: stylePanelSectors,
      // },
      blockManager: {
        blocks: definedBlocks,
      },
      deviceManager: {
        devices: [
          {
            name: 'Desktop',
            width: '', // default size
          },
          {
            name: 'Tablet',
            width: '768px', // this value will be used on canvas width
            widthMedia: '768px', // this value will be used in CSS @media
          },
          {
            name: 'Mobile',
            width: '576px', // this value will be used on canvas width
            widthMedia: '576px', // this value will be used in CSS @media
          },
        ],
      },
      plugins: [TextSectionComponent],
    });

    editor.Commands.add('set-device-desktop', {
      run: (editor) => editor.setDevice('Desktop'),
    });
    editor.Commands.add('set-device-tablet', {
      run: (editor) => editor.setDevice('Tablet'),
    });
    editor.Commands.add('set-device-mobile', {
      run: (editor) => editor.setDevice('Mobile'),
    });
    editor.Commands.add('save-as-json', {
      run: (editor) => console.log(JSON.stringify(editor.getComponents())),
    });

    setGjsEditor(editor);
  }, []);

  useEffect(() => {
    initializeGrapesJSEditor();
  }, [initializeGrapesJSEditor]);

  // Test loading template
  // useEffect(() => {
  //   if (gjsEditor) {
  //     console.log("Loading Template...");
  //     setTimeout(() => gjsEditor.load(), 2000);
  //   }
  // }, [gjsEditor]);

  return (
    <div id="builder-page">
      <div id="builder-editor"></div>
    </div>
  );
};

export default PageBuilder;
