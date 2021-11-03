import React, { useEffect, useState, useCallback } from 'react';

import { Spin } from 'antd';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';

import config from 'config/index.js';

// These are to be put as part of the config
import definedBlocks from './Configs/blocks.js';
import definedPanels from './Configs/panels.js';

// THese are to be put in plugins
import CustomTraits from './Plugins/traits';
import CustomCommands from './Plugins/commands';
import ReactComponentHandler from './ReactComponentHandler';
import TextSection from './CustomComponents/TextSection.js';
import TextWithImageSection from './CustomComponents/TextWithImageSection.js';
import PassionSessionList from './CustomComponents/PassionSessionList.js';
import PassionPassList from './CustomComponents/PassionPassList.js';

import { googleFonts } from 'utils/constants.js';
import { getLocalUserDetails } from 'utils/storage.js';

import http from 'services/http.js';

//eslint-disable-next-line
import styles from './style.module.scss';

const PageBuilder = ({ match, history }) => {
  const isPublicPage = match.path.includes('page');

  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const initializeGrapesJSEditor = useCallback((previewOn = false) => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    const editor = grapesjs.init({
      // Indicate where to init the editor. You can also pass an HTMLElement
      container: '#builder-editor',
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      // fromElement: true,
      // Size of the editor
      noticeOnUnload: !previewOn,
      height: '100vh',
      width: 'auto',
      showOffsetsSelected: true,
      storageManager: {
        id: 'gjs-', // Prefix identifier that will be used on parameters
        type: 'local', // Type of the storage
        autosave: !previewOn, // Store data automatically
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
      // selectorManager: {
      //   componentFirst: true,
      // },
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
      plugins: [
        ReactComponentHandler,
        PassionSessionList,
        PassionPassList,
        CustomCommands,
        CustomTraits,
        TextSection,
        TextWithImageSection,
      ],
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
    const styleEls = iframeEl.parent.document.querySelectorAll('style');
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
    initializeGrapesJSEditor(isPublicPage);
  }, [initializeGrapesJSEditor, isPublicPage]);

  // Test loading template
  useEffect(() => {
    if (gjsEditor) {
      setTimeout(() => {
        gjsEditor.load();

        if (isPublicPage) {
          gjsEditor.runCommand('preview');
        }

        setIsLoading(false);
      }, 2000);
    }
  }, [gjsEditor, isPublicPage]);

  return (
    <Spin spinning={isLoading} tip="Loading template...">
      <div
        id="builder-page"
        className={isPublicPage && isLoading ? styles.hidden : isPublicPage ? styles.pageRenderer : undefined}
      >
        <div id="builder-editor"></div>
      </div>
    </Spin>
  );
};

export default PageBuilder;
