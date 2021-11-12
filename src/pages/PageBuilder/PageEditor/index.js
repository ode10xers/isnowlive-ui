import React, { useEffect, useState, useCallback } from 'react';

import { Spin, Row, Col, Space } from 'antd';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
// import 'grapesjs-blocks-flexbox';
import grapesjs from 'grapesjs';
import 'grapesjs-preset-webpage';

import config from 'config/index.js';

// These are to be put as part of the config
import definedBlocks from '../Configs/blocks.js';
// import definedPanels from '../Configs/panels.js';
import definedStylePanels from '../Configs/style_panel.js';

// THese are to be put in plugins
// import CustomTraits from '../Plugins/traits';
import CustomCommands from '../Plugins/commands';
import ReactComponentHandler from '../ReactComponentHandler';
// import TextSection from '../CustomComponents/TextSection.js';
// import TextWithImageSection from '../CustomComponents/TextWithImageSection.js';
// import LinkButton from '../CustomComponents/LinkButton.js';
// import SignInButton from '../CustomComponents/SignInButton.js';
import PassionSessionList from '../CustomComponents/PassionSessionList.js';
import PassionVideoList from '../CustomComponents/PassionVideoList.js';
import PassionCourseList from '../CustomComponents/PassionCourseList.js';
import PassionPassList from '../CustomComponents/PassionPassList.js';
import PassionSubscriptionList from '../CustomComponents/PassionSubscriptionList.js';
import Header from '../CustomComponents/Header.js';
import Container from '../CustomComponents/Container.js';

import { googleFonts } from 'utils/constants.js';
import { getLocalUserDetails } from 'utils/storage.js';

import http from 'services/http.js';

//eslint-disable-next-line
import styles from './style.module.scss';

// TODO: Refactor these into constants and configs of separate files
const PageEditor = ({ match, history }) => {
  const isPublicPage = match.path.includes('page-');

  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const [isComponentSelected, setIsComponentSelected] = useState(false);

  const initializeGrapesJSEditor = useCallback((previewOn = false) => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    // TODO: Export this config and separate it into parts
    // Since it's also going to be used in HeaderEditor and FooterEditor
    // When rendering in public [age]
    const editor = grapesjs.init({
      // Indicate where to init the editor. You can also pass an HTMLElement
      container: '#builder-editor',
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
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      // fromElement: true,
      // Size of the editor
      noticeOnUnload: !previewOn,
      height: 'calc(100vh - 40px)',
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
      // panels: definedPanels,
      // Built-in props for styles
      // https://grapesjs.com/docs/modules/Style-manager.html#built-in-properties
      selectorManager: {
        appendTo: '#selector-panel',
        componentFirst: true,
      },
      styleManager: {
        appendTo: '#styles-panel',
        clearProperties: true,
      },
      traitManager: {
        appendTo: '#traits-panel',
      },
      layerManager: {
        appendTo: '#layers-panel',
      },
      blockManager: {
        appendTo: '#blocks-panel',
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
            width: '426px', // this value will be used on canvas width
            widthMedia: '576px', // this value will be used in CSS @media
          },
        ],
      },
      plugins: [
        'gjs-preset-webpage',
        Container,
        ReactComponentHandler,
        PassionSubscriptionList,
        PassionVideoList,
        PassionCourseList,
        PassionSessionList,
        PassionPassList,
        CustomCommands,
        // CustomTraits,
        // TextSection,
        // TextWithImageSection,
        // LinkButton,
        // SignInButton,
        Header, // Needed for Public page rendering
      ],
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

    // Modify Wrapper stylability
    // Initially we can only modify background, but modifying
    // padding also makes sense
    const wrapper = editor.getWrapper();
    wrapper.set({
      stylable: [
        ...wrapper.get('stylable'),
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
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
    if (!previewOn) {
      const styleEls = iframeEl.parent.document.querySelectorAll("[type='text/css'], [rel='stylesheet']");
      if (styleEls.length) {
        styleEls.forEach((el) => {
          iframeEl.document.head.appendChild(el.cloneNode(true));
        });
      }
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

    editor.on('component:selected', () => {
      setIsComponentSelected(true);
    });
    editor.on('component:deselected', () => {
      setIsComponentSelected(false);
    });

    setGjsEditor(editor);
  }, []);

  useEffect(() => {
    initializeGrapesJSEditor(isPublicPage);
  }, [initializeGrapesJSEditor, isPublicPage]);

  useEffect(() => {
    if (gjsEditor) {
      // TODO: Separate logic for loading template in another file
      if (isPublicPage) {
        const headerComponents = localStorage.getItem('gjs-header-components');
        const headerStyles = localStorage.getItem('gjs-header-styles');
        const pageComponents = localStorage.getItem('gjs-components');
        const pageStyles = localStorage.getItem('gjs-styles');

        console.log({
          headerComponents,
          headerStyles,
          pageComponents,
          pageStyles,
        });

        gjsEditor.loadData({
          components: [...JSON.parse(headerComponents), ...JSON.parse(pageComponents)],
          styles: [...JSON.parse(headerStyles), ...JSON.parse(pageStyles)],
        });

        gjsEditor.onReady(() => {
          // Previously what we do is try to render everything inside the iframe
          // of the editor, but it might cause some issues when integrating
          // Now we instead take the contents of editor after load and put them
          // in the actual app (which is contained in #root)

          const iframeElement = gjsEditor.Canvas.getDocument();
          const editorElements = Array.from(iframeElement.body.children);

          if (editorElements.length > 0) {
            const reactRootElement = document.getElementById('root');
            const portalContainer = document.createElement('div');

            portalContainer.id = 'page-portal';

            editorElements.forEach((el) => {
              portalContainer.appendChild(el);
            });

            reactRootElement.appendChild(portalContainer);
          }

          setIsLoading(false);
        });
      } else {
        gjsEditor.load();
        gjsEditor.onReady(() => {
          document.querySelector('#layers-panel').style.display = 'none';
          document.querySelector('#traits-panel').style.display = 'none';
          console.log(gjsEditor.getSelectedAll());
        });
        setIsLoading(false);
      }
    }
  }, [gjsEditor, isPublicPage]);

  // Logic to handle rendering right panels
  useEffect(() => {
    if (!isComponentSelected) {
      document.querySelector('#right-panel').style.display = 'none';
      document.querySelector('#empty-selection').style.display = 'block';
    } else {
      document.querySelector('#right-panel').style.display = 'block';
      document.querySelector('#empty-selection').style.display = 'none';
    }
  }, [isComponentSelected]);

  // TODO: Refactor later
  //#region Start of Editor Button Handlers
  const handleClickBlocks = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-blocks');
      document.querySelector('#layers-panel').style.display = 'none';
      document.querySelector('#blocks-panel').style.display = 'block';
    }
  };

  const handleClickLayers = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-layers');
      document.querySelector('#layers-panel').style.display = 'block';
      document.querySelector('#blocks-panel').style.display = 'none';
    }
  };

  const handleClickStyles = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-sm');
      document.querySelector('#styling-section').style.display = 'block';
      document.querySelector('#traits-panel').style.display = 'none';
    }
  };

  const handleClickTraits = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-tm');
      document.querySelector('#styling-section').style.display = 'none';
      document.querySelector('#traits-panel').style.display = 'block';
    }
  };

  const handleSetDeviceDesktop = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('set-device-desktop');
    }
  };

  const handleSetDeviceTablet = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('set-device-tablet');
    }
  };

  const handleSetDeviceMobile = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('set-device-mobile');
    }
  };

  const handleSwitchVisibility = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('sw-visibility');
    }
  };

  const handlePreview = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('preview');
    }
  };

  const handleToggleFullscreen = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('fullscreen');
    }
  };

  const handleShowCode = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('export-template');
    }
  };

  const handleUndo = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('core:undo');
    }
  };

  const handleRedo = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('core:redo');
    }
  };

  const handleSaveTemplate = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('save-as-json');
    }
  };

  const handleCleanCanvas = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('canvas-clear');
    }
  };

  //#endregion End of Editor Button Handlers

  return (
    <Spin spinning={isLoading} tip="Loading template...">
      <div className={isPublicPage ? styles.hidden : undefined}>
        <div className={styles.builderPage}>
          <div className={styles.leftSection}>
            <div className={styles.topPanel}>
              <button className="fa fa-th-large" onClick={handleClickBlocks}></button>
              <button className="fa fa-bars" onClick={handleClickLayers}></button>
            </div>
            <div className={styles.panelContainer}>
              <div id="blocks-panel"></div>
              <div id="layers-panel"></div>
            </div>
          </div>
          <div className={styles.middleSection}>
            <div className={styles.topPanel}>
              <Row gutter={8} justify="space-around" className={styles.buttonsContainer}>
                <Col flex="0 0 45%">Page Selector Here</Col>
                <Col flex="0 0 120px" className={styles.textAlignCenter}>
                  <Space align="center">
                    <button className="fa fa-desktop" onClick={handleSetDeviceDesktop}></button>
                    <button className="fa fa-tablet" onClick={handleSetDeviceTablet}></button>
                    <button className="fa fa-mobile" onClick={handleSetDeviceMobile}></button>
                  </Space>
                </Col>
                <Col flex="1 0 auto" className={styles.textAlignRight}>
                  <Space align="center">
                    <button className="fa fa-square-o" onClick={handleSwitchVisibility}></button>
                    <button className="fa fa-eye" onClick={handlePreview}></button>
                    <button className="fa fa-arrows-alt" onClick={handleToggleFullscreen}></button>
                    <button className="fa fa-code" onClick={handleShowCode}></button>
                    <button className="fa fa-undo" onClick={handleUndo}></button>
                    <button className="fa fa-repeat" onClick={handleRedo}></button>
                    <button className="fa fa-floppy-o" onClick={handleSaveTemplate}></button>
                    <button className="fa fa-trash" onClick={handleCleanCanvas}></button>
                  </Space>
                </Col>
              </Row>
            </div>
            <div id="builder-editor"></div>
          </div>
          <div className={styles.rightSection}>
            <div className={styles.topPanel}>
              <button className="fa fa-paint-brush" onClick={handleClickStyles}></button>
              <button className="fa fa-cog" onClick={handleClickTraits}></button>
            </div>
            <div id="empty-selection">Please select a component first.</div>
            <div id="right-panel" className={styles.panelContainer}>
              <div id="styling-section">
                <div id="selector-panel"></div>
                <div id="styles-panel"></div>
              </div>
              <div id="traits-panel"></div>
            </div>
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default PageEditor;
