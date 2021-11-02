import React, { useEffect, useState, useCallback } from 'react';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';

import definedBlocks from './blocks.js';
import definedPanels from './panels.js';
// import stylePanelSectors from './style_panel.js';

//eslint-disable-next-line
import styles from './style.module.scss';
import config from 'config/index.js';
import { getLocalUserDetails } from 'utils/storage.js';
import http from 'services/http.js';

const PageBuilder = ({ match, history }) => {
  const [gjsEditor, setGjsEditor] = useState(null);

  const initializeGrapesJSEditor = useCallback(() => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    //#region Start of Custom Components Definition
    const TextSectionComponent = (editor) => {
      editor.DomComponents.addType('text-section', {
        model: {
          defaults: {
            tagName: 'div',
            name: 'Text Section',
            droppable: false,
            attributes: {
              layout: 'left',
              class: 'text-section-container',
            },
            'text-color': '#000',
            'bg-color': '#fff',
            traits: [
              {
                type: 'text-section-layout',
                name: 'layout',
              },
              {
                type: 'padding-slider',
              },
              {
                type: 'color',
                label: 'Text color',
                name: 'text-color',
                changeProp: 1,
              },
              {
                type: 'color',
                label: 'Background color',
                name: 'bg-color',
                changeProp: 1,
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
                copyable: false,
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
                copyable: false,
                toolbar: [],
              },
            ],
            styles: `
              .text-section-container {
                display: block;
                padding: 8px;
              }
            `,
          },
          init() {
            // We put a listener that triggers when an attribute changes
            // In this case when text-color attribute changes
            this.on('change:text-color', this.handleTextColorChange);
            this.on('change:bg-color', this.handleBGColorChange);
          },
          handleTextColorChange() {
            const textColor = this.props()['text-color'];
            this.setStyle({
              color: textColor,
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
              'background-color': bgColor,
            });
          },
        },
      });
    };

    const TextWithImageSectionComponent = (editor) => {
      editor.DomComponents.addType('text-with-image-section', {
        model: {
          defaults: {
            tagName: 'div',
            name: 'Text with Image',
            droppable: false,
            attributes: {
              class: 'text-image-section-container',
            },
            'bg-color': '#fff',
            traits: [
              {
                type: 'padding-slider',
              },
              {
                type: 'image-position-layout',
                name: 'image-layout',
              },
              {
                type: 'button',
                text: 'Click to set image',
                full: true,
                label: 'Image',
                command: 'set-image-url',
              },
              {
                type: 'color',
                label: 'Background color',
                name: 'bg-color',
                changeProp: 1,
              },
            ],
            components: [
              {
                type: 'text-section',
                removable: false,
                draggable: false,
                droppable: false,
                copyable: false,
              },
              {
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
                resizable: true,
                toolbar: [],
              },
            ],
            styles: `
              .text-image-section-container {
                display: flex;
                flex: 0 1 auto;
                justify-content: space-between;
                width: 100%;
                padding: 8px;
              }

              .text-image-section-container.image-left {
                flex-direction: row-reverse;
              }

              .text-image-section-container.image-right {
                flex-direction: row;
              }

              .text-image-section-container.image-top {
                flex-direction: column-reverse;
                flex: 1 1 100%;
              }

              .text-image-section-container.image-bottom {
                flex-direction: column;
                flex: 1 1 100%;
              }

              .text-image-section-container.image-bottom > img {
                align-self: center;
              }

              .text-image-section-container.image-top > img {
                align-self: center;
              }
            `,
          },
          init() {
            // We put a listener that triggers when an attribute changes
            // In this case when bg-color attribute changes
            this.on('change:bg-color', this.handleBGColorChange);
          },
          // TODO: Make this propagate the changes inside
          // Seems like the propagation needs to be handled manually
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
              'background-color': bgColor,
            });
          },
        },
      });
    };
    //#region End of Custom Components Definition

    const editor = grapesjs.init({
      // Indicate where to init the editor. You can also pass an HTMLElement
      container: '#builder-editor',
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      // fromElement: true,
      // Size of the editor
      height: '100vh',
      width: 'auto',
      showOffsetsSelected: true,
      storageManager: {
        id: 'gjs-', // Prefix identifier that will be used on parameters
        type: 'local', // Type of the storage
        autosave: true, // Store data automatically
        autoload: false, // Autoload stored data on init
        stepsBeforeSave: 5, // If autosave enabled, indicates how many changes are necessary before store method is triggered
      },
      assetManager: {
        customFetch: (url, options) => http.post(url, options.body),
        upload: config.server.baseURL + '/secure/upload',
        uploadName: 'file',
        headers: {
          'auth-token': getLocalUserDetails()?.auth_token ?? '',
        },
        multiUpload: false,
        autoAdd: true,
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
      plugins: [TextSectionComponent, TextWithImageSectionComponent],
    });

    //#region Start of Custom Traits Definition
    editor.TraitManager.addType('padding-slider', {
      // Expects as return a simple HTML string or an HTML element
      noLabel: true,
      templateInput: `
      <div class="custom-trait-layout">
        <div class="custom-trait-label">
          Padding
        </div>
        <div class="custom-trait-input" data-input>
        </div>
      </div>
      `,
      createInput({ trait }) {
        // Create a new element container and add some content
        const minValue = 0;
        const maxValue = 100;
        const el = document.createElement('div');
        el.innerHTML = `
        <div class="padding-slider-container">
          <span class="padding-slider-text">${minValue}px</span>
          <input type="range" min="${minValue}" max="${maxValue}" class="padding-slider" />
          <span class="padding-slider-text">${maxValue}px</span>
        </div>
        <div class="padding-slider-value-container">
          Current Value: <span class="padding-slider-value"></span>
        </div>
        `;
        return el;
      },
      // Update the component based on element changes
      // `elInput` is the result HTMLElement you get from `createInput`
      onEvent({ elInput, component, event }) {
        const sliderInput = elInput.querySelector('.padding-slider');
        const valueText = elInput.querySelector('.padding-slider-value');
        valueText.innerHTML = sliderInput.value + 'px';
        component.setStyle({
          ...component.getStyle(),
          padding: sliderInput.value ?? 0,
        });
      },
      // Update elements on the component change
      onUpdate({ elInput, component }) {
        const componentStyle = component.getStyle();
        const padding = componentStyle['padding'] ?? 20;
        const sliderInput = elInput.querySelector('.padding-slider');
        sliderInput.value = padding;
        const valueText = elInput.querySelector('.padding-slider-value');
        valueText.innerHTML = padding + 'px';
        sliderInput.dispatchEvent(new CustomEvent('change'));
      },
    });

    editor.TraitManager.addType('text-section-layout', {
      // Expects as return a simple HTML string or an HTML element
      noLabel: true,
      templateInput: `<div class="custom-trait-layout">
      <div class="custom-trait-label">
        Text Layout
      </div>
      <div class="custom-trait-input" data-input>
      </div>
    </div>`,
      createInput({ trait }) {
        // Here we can decide to use properties from the trait
        const options = [
          { id: 'left', name: 'Left', class: 'fa fa-align-left' },
          { id: 'center', name: 'Centered', class: 'fa fa-align-center' },
          { id: 'right', name: 'Right', class: 'fa fa-align-right' },
        ];

        // Create a new element container and add some content
        const el = document.createElement('div');
        // el.classList.add(['trait-radio-button-container']);
        // el.innerHTML = `
        //   ${options.map((opt) => `
        //     <input type="radio" class="trait-radio-button ${opt.class}" name="${opt.name}" value="${opt.value}" />
        //   `)}
        // `;
        el.innerHTML = `
          <select class="text-section-layout-select">
            ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
          </select>
        `;

        return el;
      },
      // Update the component based on element changes
      // elInput` is the result HTMLElement you get from `createInput`
      onEvent({ elInput, component, event }) {
        const inputType = elInput.querySelector('.text-section-layout-select');
        component.setStyle({
          'text-align': inputType.value ?? 'left',
        });
        component.addAttributes({
          layout: inputType.value,
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

    editor.TraitManager.addType('image-position-layout', {
      // Expects as return a simple HTML string or an HTML element
      noLabel: true,
      templateInput: `
      <div class="custom-trait-layout">
        <div class="custom-trait-label">
          Image Layout
        </div>
        <div class="custom-trait-input" data-input>
        </div>
      </div>
      `,
      createInput({ trait }) {
        // Here we can decide to use properties from the trait
        const options = [
          { id: 'left', name: 'Left', class: 'fa fa-align-left' },
          { id: 'top', name: 'Top', class: 'fa fa-align-center' },
          { id: 'right', name: 'Right', class: 'fa fa-align-right' },
          { id: 'bottom', name: 'Bottom', class: 'fa fa-align-center' },
        ];

        // Create a new element container and add some content
        const el = document.createElement('div');
        el.innerHTML = `
          <select class="image-position-select">
            ${options.map((opt) => `<option value="${opt.id}">${opt.name}</option>`).join('')}
          </select>
        `;

        return el;
      },
      // Update the component based on element changes
      // `elInput` is the result HTMLElement you get from `createInput`
      onEvent({ elInput, component, event }) {
        const inputType = elInput.querySelector('.image-position-select');
        let classes = ['text-image-section-container'];

        if (inputType.value) {
          classes.push(`image-${inputType.value}`);
        }

        component.setClass(classes);
      },
      // Update elements on the component change
      onUpdate({ elInput, component }) {
        // This is getting the trait value from the set classes
        const layout =
          component
            .getClasses()
            .find((cls) => cls.startsWith('image-'))
            ?.split('-')[1] ?? 'right';
        const inputType = elInput.querySelector('.image-position-select');
        inputType.value = layout;

        inputType.dispatchEvent(new CustomEvent('change'));
      },
    });
    //#endregion End of Custom Traits Definition

    //#region Start of Asset Listener Definition
    // The upload is started
    editor.on('asset:upload:start', () => {
      console.log('Upload started');
    });

    // The upload is ended (completed or not)
    editor.on('asset:upload:end', () => {
      console.log('Upload ended');
    });

    // Error handling
    editor.on('asset:upload:error', (err) => {
      console.error(err);
    });

    // Do something on response
    editor.on('asset:upload:response', (response) => {
      console.log(response);
    });
    //#endregion Start of Asset Listener Definition

    //#region Start of Custom Commands Definition
    editor.Commands.add('set-device-desktop', {
      run: (editor) => editor.setDevice('Desktop'),
    });
    editor.Commands.add('set-device-tablet', {
      run: (editor) => editor.setDevice('Tablet'),
    });
    editor.Commands.add('set-device-mobile', {
      run: (editor) => editor.setDevice('Mobile'),
    });
    // Make use of StoreManagerAPI to actually store things
    editor.Commands.add('save-as-json', {
      run: (editor) => {
        const templateData = {
          html: editor.getHtml(),
          css: editor.getCss(),
          components: JSON.stringify(editor.getComponents()),
          styles: JSON.stringify(editor.getStyle()),
        };

        console.log(templateData);
        editor.StorageManager.store(templateData);
      },
    });

    editor.Commands.add('set-image-url', {
      run: (editor) => {
        editor.AssetManager.open({
          types: ['image'],
          select(asset, complete) {
            let isSet = false;
            const selected = editor.getSelected();
            if (selected && selected.is('image')) {
              selected.addAttributes({ src: asset.getSrc() });
              isSet = true;
            } else {
              const closestImage = selected.find('img')[0] ?? null;
              if (closestImage && closestImage.is('image')) {
                closestImage.addAttributes({ src: asset.getSrc() });
                isSet = true;
              }
            }

            // The default AssetManager UI will trigger `select(asset, false)` on asset click
            // and `select(asset, true)` on double-click
            if (isSet) {
              complete && editor.AssetManager.close();
            } else {
              editor.log('Failed to set image after Asset Manager Select', {
                ns: 'asset-manager-close',
                level: 'debug',
              });
            }
          },
        });
      },
    });
    //#endregion End of Custom Commands Definition

    setGjsEditor(editor);
  }, []);

  useEffect(() => {
    initializeGrapesJSEditor();
  }, [initializeGrapesJSEditor]);

  // Test loading template
  useEffect(() => {
    if (gjsEditor) {
      console.log('Loading Template...');
      setTimeout(() => gjsEditor.load(), 2000);
    }
  }, [gjsEditor]);

  return (
    <div id="builder-page">
      <div id="builder-editor"></div>
    </div>
  );
};

export default PageBuilder;
