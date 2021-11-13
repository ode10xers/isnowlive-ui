import React, { useEffect, useState, useCallback } from 'react';

import { Spin, Row, Col, Space, Select, Typography, message } from 'antd';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
// import 'grapesjs-blocks-flexbox';
import grapesjs from 'grapesjs';
import 'grapesjs-preset-webpage';

import apis from 'apis';
import config from 'config/index.js';

import { showErrorModal } from 'components/Modals/modals.js';

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
import Container from '../CustomComponents/Container.js';

import { googleFonts } from 'utils/constants.js';
import { getLocalUserDetails } from 'utils/storage.js';
import { getSiblingElements, isAPISuccess } from 'utils/helper.js';
import { blankPageTemplate } from 'utils/pageEditorTemplates.js';

import { useGlobalContext } from 'services/globalContext.js';

//eslint-disable-next-line
import styles from './style.module.scss';

const { Text } = Typography;

// TODO: Refactor these into constants and configs of separate files
const PageEditor = ({ match, history }) => {
  const targetPageId = match.params.page_id;

  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const [creatorAssets, setCreatorAssets] = useState([]);
  const [creatorPages, setCreatorPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(targetPageId ?? null);

  const [isComponentSelected, setIsComponentSelected] = useState(false);

  const fetchCreatorCustomPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.custom_pages.getAllPages();

      if (isAPISuccess(status) && data) {
        setCreatorPages(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed to fetch creator custom pages!',
        error?.response?.data?.message ?? 'Something went wrong.'
      );
    }
    setIsLoading(false);
  }, []);

  const fetchCreatorWebsiteAssets = useCallback(async (editor) => {
    try {
      const { status, data } = await apis.custom_pages.getAssets();

      if (isAPISuccess(status) && data) {
        setCreatorAssets(data);
        editor.AssetManager.load({
          assets: data.map((assetData) => ({
            type: assetData.type.toLowerCase(),
            src: assetData.src,
            ...assetData.properties,
            external_id: assetData.external_id,
          })),
        });
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // GrapesJS initialization
  const initializeGrapesJSEditor = useCallback(() => {
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
      noticeOnUnload: true,
      height: 'calc(100vh - 40px)',
      width: 'auto',
      showOffsetsSelected: true,
      // storageManager: {
      //   id: 'gjs-', // Prefix identifier that will be used on parameters
      //   type: 'local', // Type of the storage
      //   autosave: true, // Store data automatically
      //   autoload: false, // Autoload stored data on init
      //   stepsBeforeSave: 5, // If autosave enabled, indicates how many changes are necessary before store method is triggered
      // },
      storageManager: {
        id: '',
        type: 'passion-backend',
        autoSave: true,
        stepsBeforeSave: 15,
        autoload: false,
      },
      // storageManager: {
      //   id: '', // Prefix identifier that will be used on parameters
      //   type: 'remote', // Type of the storage
      //   autosave: true, // Store data automatically
      //   autoload: false, // Autoload stored data on init
      //   stepsBeforeSave: 5, // If autosave enabled, indicates how many changes are necessary before store method is triggered
      //   urlStore: config.server.baseURL + '/secure/creator/website/pages',
      //   headers: {
      //     'auth-token': userDetails?.auth_token ?? getLocalUserDetails()?.auth_token ?? '',
      //     'creator-username': getUsernameFromUrl() ?? '',
      //   },
      //   credentials: 'omit',
      //   fetchOptions: (currentOptions) => {
      //     console.log("Current Options: ", currentOptions)
      //     return currentOptions.method === 'post' ? { method: 'PATCH' } : {};
      //   }
      // },
      assetManager: {
        assets: [],
        // customFetch: (url, options) => http.post(url, options.body),
        uploadFile: async function (e) {
          const { module } = this.options;
          const formData = new FormData();

          const targetFile = e.target.files[0] ?? null;

          if (!targetFile) {
            console.log('No valid file found, ', e.target);
            return;
          }

          formData.append('file', targetFile);
          try {
            module && module.__propEv('asset:upload:start');
            const { data } = await apis.user.uploadImage(formData);
            module && module.__propEv('asset:upload:response', data);
          } catch (error) {
            console.error(error);
            module && module.__propEv('asset:upload:error', error);
          }
        },
        upload: config.server.baseURL + '/secure/upload',
        uploadName: 'file',
        headers: {
          'auth-token': userDetails?.auth_token ?? getLocalUserDetails()?.auth_token ?? '',
        },
        multiUpload: false,
        autoAdd: false,
        showUrlInput: false,
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

    //#region Start of Custom Initialization Logic

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
    const styleEls = iframeEl.parent.document.querySelectorAll("[type='text/css'], [rel='stylesheet']");
    styleEls.forEach((el) => {
      iframeEl.document.head.appendChild(el.cloneNode(true));
    });

    //#endregion End of Custom Initialization Logic

    //#region Start of event listener hooks
    editor.on('asset:upload:start', () => {
      setIsLoading(true);
    });

    editor.on('asset:upload:error', (error) => {
      message.error(error?.response?.data?.message ?? 'Failed uploading asset!');
    });

    editor.on('asset:upload:response', (assetUrl) => {
      editor.AssetManager.add(assetUrl);
    });

    editor.on('asset:add', async (asset) => {
      try {
        const assetInfo = asset.attributes;

        const additionalProperties =
          assetInfo.type === 'image'
            ? {
                unitDim: assetInfo.unitDim,
                height: assetInfo.height,
                width: assetInfo.width,
              }
            : assetInfo;

        const payload = {
          type: assetInfo.type.toUpperCase(),
          src: assetInfo.src,
          properties: additionalProperties,
        };

        const { status, data } = await apis.custom_pages.createAsset(payload);

        if (isAPISuccess(status) && data) {
          setCreatorAssets((prevAssets) => [...prevAssets, data]);
        }
      } catch (error) {
        console.error(error);
        message.error('Failed saving asset!');
      }
      setIsLoading(false);
    });

    editor.on('component:selected', () => {
      setIsComponentSelected(true);
    });

    editor.on('component:deselected', () => {
      setIsComponentSelected(false);
    });

    editor.on('run:preview', () => {
      document.querySelector('#right-section').style.display = 'none';
      document.querySelector('#left-section').style.display = 'none';
      document.querySelector('#top-section').style.display = 'none';
    });

    editor.on('stop:preview', () => {
      document.querySelector('#right-section').style.display = 'block';
      document.querySelector('#left-section').style.display = 'block';
      document.querySelector('#top-section').style.display = 'block';
    });

    editor.onReady(() => {
      document.querySelector('#layers-panel').style.display = 'none';
      document.querySelector('#traits-panel').style.display = 'none';
    });

    //#endregion End of event listener hooks

    editor.runCommand('sw-visibility');

    // Initial definition for storage
    editor.StorageManager.add('passion-backend', {
      async store(payload, callback, errorCallback) {
        setIsSaving(true);
        try {
          if (!payload.external_id) {
            console.error('Invalid Data format!');
            message.error('Something wrong has occurred! Failed to save!');
            return;
          }

          const { status, data } = await apis.custom_pages.updatePage(payload);

          if (isAPISuccess(status) && data) {
            callback(data);
          }
        } catch (error) {
          console.log('Error occured when storing page content to API');
          console.error(error);
          errorCallback(error);
        }
        setIsSaving(false);
      },
      load(keysToLoad, callback, errorCallback) {
        console.log('FE will handle the loading');
      },
    });

    setGjsEditor(editor);
    fetchCreatorWebsiteAssets(editor);
  }, [userDetails, fetchCreatorWebsiteAssets]);

  useEffect(() => {
    fetchCreatorCustomPages();
    initializeGrapesJSEditor();
  }, [initializeGrapesJSEditor, fetchCreatorCustomPages]);

  useEffect(() => {
    if (gjsEditor) {
      const fallbackAction = () => {
        gjsEditor.loadData(blankPageTemplate.content);
      };

      if (selectedPageId) {
        const targetPageIndex = creatorPages.findIndex((page) => page.external_id === selectedPageId);
        const targetPage = creatorPages.find((page) => page.external_id === selectedPageId);

        if (targetPage) {
          gjsEditor.StorageManager.add('passion-backend', {
            async store(payload, callback, errorCallback) {
              setIsSaving(true);

              try {
                const { status, data } = await apis.custom_pages.updatePage({
                  ...targetPage,
                  content: payload,
                });

                if (isAPISuccess(status) && data) {
                  setCreatorPages((prevPages) => {
                    prevPages.splice(targetPageIndex, 1, data);
                    return prevPages;
                  });
                  callback(data);
                }
              } catch (error) {
                console.log('Error occured when storing page content to API');
                console.error(error);
                errorCallback(error);
              }
              setIsSaving(false);
            },
            load(keysToLoad, callback, errorCallback) {
              console.log('FE will handle the loading');
            },
          });

          gjsEditor.loadData(targetPage.content ?? blankPageTemplate.content);
        } else {
          fallbackAction();
        }
      } else {
        fallbackAction();
      }

      setIsLoading(false);
    }
  }, [gjsEditor, selectedPageId, creatorPages]);

  // The asset remove listener is separate here because it depends on the creatorAssets
  useEffect(() => {
    if (gjsEditor) {
      // TODO: Later on we can move this to the initialization callback
      // once we figure out how to update the asset definition
      // That way we can attach external_ids to the asset themselves
      gjsEditor.off('asset:remove');
      gjsEditor.on('asset:remove', async (removedAsset) => {
        try {
          console.log(removedAsset);
          const assetUrl = removedAsset.attributes.src;

          const targetAsset = creatorAssets.find((asset) => asset.src === assetUrl);

          if (targetAsset && targetAsset.external_id) {
            const { status, data } = await apis.custom_pages.removeAsset(targetAsset.external_id);
            if (isAPISuccess(status) && data) {
              setCreatorAssets((prevAssets) =>
                prevAssets.filter((asset) => asset.external_id !== targetAsset.external_id)
              );
            }
          }
        } catch (error) {
          console.error(error);
          message.error('Failed saving asset!');
        }
      });
    }
  }, [gjsEditor, creatorAssets]);

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

  const toggleActiveClass = (targetEl) => {
    targetEl.classList.add(['active']);
    getSiblingElements(targetEl).forEach((el) => el.classList.remove('active'));
  };

  const onSelectedPageChanged = (value) => {
    if (gjsEditor) {
      gjsEditor.store(
        () => {
          setSelectedPageId(value);
        },
        () => {
          message.error('Failed to save changes to current page!');
        }
      );
    }
  };

  // TODO: Refactor later
  //#region Start of Editor Button Handlers
  const handleClickBlocks = (e) => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-blocks');
      toggleActiveClass(e.target);
      document.querySelector('#layers-panel').style.display = 'none';
      document.querySelector('#blocks-panel').style.display = 'block';
    }
  };

  const handleClickLayers = (e) => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-layers');
      toggleActiveClass(e.target);
      document.querySelector('#layers-panel').style.display = 'block';
      document.querySelector('#blocks-panel').style.display = 'none';
    }
  };

  const handleClickStyles = (e) => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-sm');
      toggleActiveClass(e.target);
      document.querySelector('#styling-section').style.display = 'block';
      document.querySelector('#traits-panel').style.display = 'none';
    }
  };

  const handleClickTraits = (e) => {
    if (gjsEditor) {
      gjsEditor.runCommand('open-tm');
      toggleActiveClass(e.target);
      document.querySelector('#styling-section').style.display = 'none';
      document.querySelector('#traits-panel').style.display = 'block';
    }
  };

  const handleSetDeviceDesktop = (e) => {
    if (gjsEditor) {
      gjsEditor.runCommand('set-device-desktop');
      toggleActiveClass(e.target);
    }
  };

  const handleSetDeviceTablet = (e) => {
    if (gjsEditor) {
      gjsEditor.runCommand('set-device-tablet');
      toggleActiveClass(e.target);
    }
  };

  const handleSetDeviceMobile = (e) => {
    if (gjsEditor) {
      gjsEditor.runCommand('set-device-mobile');
      toggleActiveClass(e.target);
    }
  };

  const handleSwitchVisibility = (e) => {
    if (gjsEditor) {
      const isVisibilityActive = gjsEditor.Commands.isActive('sw-visibility');

      if (isVisibilityActive) {
        gjsEditor.stopCommand('sw-visibility');
        e.target.classList.remove('active');
      } else {
        gjsEditor.runCommand('sw-visibility');
        e.target.classList.add('active');
      }
    }
  };

  const handlePreview = () => {
    if (gjsEditor) {
      gjsEditor.runCommand('preview');
    }
  };

  const handleToggleFullscreen = (e) => {
    if (gjsEditor) {
      const isInFullscreen = gjsEditor.Commands.isActive('fullscreen');

      if (isInFullscreen) {
        gjsEditor.stopCommand('fullscreen');
        e.target.classList.remove('active');
      } else {
        gjsEditor.runCommand('fullscreen', { target: document.querySelector('#builder-page') });
        e.target.classList.add(['active']);
      }
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
    <Spin spinning={isLoading}>
      <div>
        <div id="builder-page" className={styles.builderPage}>
          <div id="left-section" className={styles.leftSection}>
            <div className={styles.topPanel}>
              <button className="fa fa-th-large active" onClick={handleClickBlocks}></button>
              <button className="fa fa-bars" onClick={handleClickLayers}></button>
            </div>
            <div className={styles.panelContainer}>
              <div id="blocks-panel"></div>
              <div id="layers-panel"></div>
            </div>
          </div>
          <div className={styles.middleSection}>
            <div id="top-section" className={styles.topPanel}>
              <Row gutter={8} justify="space-around" className={styles.buttonsContainer}>
                <Col flex="0 0 45%" className={styles.pageSelectorContainer}>
                  <Space>
                    <Text className={styles.whiteText}>Page :</Text>
                    <Select
                      value={selectedPageId}
                      onChange={onSelectedPageChanged}
                      loading={isLoading}
                      options={creatorPages.map((page) => ({
                        label: page.name,
                        value: page.external_id,
                      }))}
                    />
                  </Space>
                </Col>
                <Col flex="0 0 120px" className={styles.textAlignCenter}>
                  <button className="fa fa-desktop active" onClick={handleSetDeviceDesktop}></button>
                  <button className="fa fa-tablet" onClick={handleSetDeviceTablet}></button>
                  <button className="fa fa-mobile" onClick={handleSetDeviceMobile}></button>
                </Col>
                <Col flex="1 0 auto" className={styles.textAlignRight}>
                  <Space align="center">
                    <button className="fa fa-square-o active" onClick={handleSwitchVisibility}></button>
                    <button className="fa fa-eye" onClick={handlePreview}></button>
                    <button className="fa fa-arrows-alt" onClick={handleToggleFullscreen}></button>
                    <button className="fa fa-code" onClick={handleShowCode}></button>
                    <button className="fa fa-undo" onClick={handleUndo}></button>
                    <button className="fa fa-repeat" onClick={handleRedo}></button>
                    {isSaving ? (
                      <button className="fa fa-spinner"></button>
                    ) : (
                      <button className="fa fa-floppy-o" onClick={handleSaveTemplate}></button>
                    )}
                    <button className="fa fa-trash" onClick={handleCleanCanvas}></button>
                  </Space>
                </Col>
              </Row>
            </div>
            <div id="builder-editor"></div>
          </div>
          <div id="right-section" className={styles.rightSection}>
            <div className={styles.topPanel}>
              <button className="fa fa-paint-brush active" onClick={handleClickStyles}></button>
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
