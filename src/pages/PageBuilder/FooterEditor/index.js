import React, { useEffect, useState, useCallback } from 'react';

import { Spin } from 'antd';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';
import 'grapesjs-preset-webpage';

import config from 'config/index.js';

// These are to be put as part of the config
// import definedBlocks from '../Configs/blocks.js';
import definedPanels from '../Configs/panels.js';
import definedStylePanels from '../Configs/style_panel.js';

// THese are to be put in plugins
// import CustomTraits from '../Plugins/traits';
import CustomCommands from '../Plugins/commands';
// import ReactComponentHandler from '../ReactComponentHandler';
// import LinkButton from '../CustomComponents/LinkButton.js';
import Footer from '../CustomComponents/Footer.js';

import { googleFonts } from 'utils/constants.js';
import { getLocalUserDetails } from 'utils/storage.js';

import http from 'services/http.js';

//eslint-disable-next-line
import styles from './style.module.scss';

const FooterEditor = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const initializeGrapesJSEditor = useCallback(() => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    // TODO: Might need to modify a little bit of the config (for security)
    // When rendering in public [age]
    const editor = grapesjs.init({
      // Indicate where to init the editor. You can also pass an HTMLElement
      container: '#builder-editor',
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      // fromElement: true,
      // Size of the editor
      baseCss: `
      * {
        box-sizing: border-box;
      }
      html, body, [data-gjs-type=wrapper] {
        min-height: 100%;
      }
      body {
        margin: 0;
        height: 100%;
        background-color: #fff
      }
      [data-gjs-type=wrapper] {
        padding: 12px;
        overflow: auto;
        overflow-x: hidden;
      }
      * ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1)
      }
      * ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2)
      }
      * ::-webkit-scrollbar {
        width: 10px
      }
    `,
      noticeOnUnload: true,
      height: '100vh',
      width: 'auto',
      showOffsetsSelected: true,
      storageManager: {
        id: 'gjs-footer-', // Prefix identifier that will be used on parameters
        type: 'local', // Type of the storage
        autosave: true, // Store data automatically
        autoload: true, // Autoload stored data on init
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
      // panels: definedPanels,
      // selectorManager: {
      //   componentFirst: true,
      // },
      // Built-in props for styles
      // https://grapesjs.com/docs/modules/Style-manager.html#built-in-properties
      styleManager: {
        clearProperties: true,
      },
      blockManager: {
        blocks: [],
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
            width: '426px', // this value will be used on canvas width
            widthMedia: '576px', // this value will be used in CSS @media
          },
        ],
      },
      plugins: ['gjs-preset-webpage', CustomCommands, Footer],
      pluginsOpts: {
        'gjs-preset-webpage': {
          modalImportLabel: 'This is the data format that will be saved',
          modalImportButton: 'Save',
          modalImportContent: (editor) => {
            return JSON.stringify({
              html: editor.getHtml(),
              css: editor.getCss(),
              components: editor.getComponents(),
              styles: editor.getStyle(),
            });
          },
          blocksBasicOpts: {
            flexGrid: true,
            rowHeight: '120px',
          },
          countdownOpts: 0,
          navbarOpts: 0,
          customStyleManager: definedStylePanels,
        },
      },
    });

    // Loading external script and running certain logic
    // inside iframe. In this case it's loading the fonts
    // using WebFontLoader so the fonts are also visible
    // inside the iframes
    const iframeDoc = editor.Canvas.getDocument();
    const iframeHead = iframeDoc.head;
    const libScript = document.createElement('script');
    libScript.innerHTML = `
      WebFontConfig = {
        google: {
          families: ${JSON.stringify(Object.values(googleFonts))},
        }
      };

      (function(d) {
        var wf = d.createElement('script'), s = d.scripts[0];
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
        wf.async = true;
        s.parentNode.insertBefore(wf, s);
      })(document);
    `;
    iframeHead.appendChild(libScript);

    // Hacky way of copying styles to the iframe inside
    // Not sure if this will work dynamically or not
    const iframeEl = editor.Canvas.getWindow();
    const styleEls = iframeEl.parent.document.querySelectorAll("[type='text/css'], [rel='stylesheet']");
    if (styleEls.length) {
      styleEls.forEach((el) => {
        iframeEl.document.head.appendChild(el.cloneNode(true));
      });
    }

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

    setGjsEditor(editor);
  }, []);

  useEffect(() => {
    initializeGrapesJSEditor();
  }, [initializeGrapesJSEditor]);

  useEffect(() => {
    if (gjsEditor) {
      const footerData = localStorage.getItem('gjs-footer-components');

      if (footerData) {
        gjsEditor.load();
      } else {
        gjsEditor.addComponents([{ type: 'site-footer' }]);
      }
      setIsLoading(false);
    }
  }, [gjsEditor]);

  return (
    <Spin spinning={isLoading} tip="Loading template...">
      <div id="builder-page">
        <div id="builder-editor"></div>
      </div>
    </Spin>
  );
};

export default FooterEditor;
