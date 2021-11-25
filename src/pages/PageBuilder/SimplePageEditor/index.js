import React, { useEffect, useState, useCallback } from 'react';

import { Spin, Row, Col, Space, Typography, Button, message } from 'antd';
import { LeftOutlined, FileTextOutlined } from '@ant-design/icons';

// import 'ckeditor4';
// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
// import 'grapesjs-blocks-flexbox';
import grapesjs from 'grapesjs';
// import 'grapesjs-preset-webpage';
import 'grapesjs-plugin-ckeditor';

import apis from 'apis';
import config from 'config';
import Routes from 'routes';

import { showErrorModal } from 'components/Modals/modals.js';

// These are to be put as part of the config
import elementIds from '../Configs/common/elementIds.js';
import sectionIds from '../Configs/common/sectionIds';
import commonEditorConfig from '../Configs/common/config';
import definedBlocks from '../Configs/blocks.js';
// import definedStylePanels from '../Configs/style_panel.js';

// THese are to be put in plugins
import CustomTraits from '../Configs/traits';
import CustomCommands from '../Configs/commands';
import ReactComponentHandler from '../ReactComponentHandler';
import PassionProductsList from '../CustomComponents/PassionProductsList.js';
import Container from '../CustomComponents/Container.js';
import LinkButton from '../CustomComponents/LinkButton.js';
import Testimonials from '../CustomComponents/Testimonials.js';
import SimpleTextSection from '../CustomComponents/SimpleTextSection.js';
import SimpleTextWithImage from '../CustomComponents/SimpleTextWithImage.js';

import { getLocalUserDetails } from 'utils/storage.js';
import { getSiblingElements, isAPISuccess } from 'utils/helper.js';
import { blankPageTemplate } from 'utils/pageEditorTemplates.js';
import { confirmDirtyCount, customEditorInitializationLogic } from 'utils/pageEditor.js';

import { useGlobalContext } from 'services/globalContext.js';

//eslint-disable-next-line
import styles from './style.module.scss';

const { Text } = Typography;

const { BUILDER_CONTAINER_ID, TRAITS_PANEL_ID, LAYERS_PANEL_ID, BLOCKS_PANEL_ID } = elementIds;

const { RIGHT, TOP, LEFT, EMPTY } = sectionIds;

const SimplePageEditor = ({ match, history }) => {
  const targetPageId = match.params.page_id;

  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const [creatorAssets, setCreatorAssets] = useState([]);
  const [creatorPages, setCreatorPages] = useState([]);
  // eslint-disable-next-line
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

    // Since it's also going to be used in HeaderEditor and FooterEditor
    // When rendering in public [age]
    const editor = grapesjs.init({
      ...commonEditorConfig,
      // Adding padding to the wrapper
      exportWrapper: true,
      wrapperIsBody: false,
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
          min-height: 100vh;
          overflow: auto;
          overflow-x: hidden;
        }
        * ::-webkit-scrollbar-track {
          background: #dadada;
        }
        * ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.75);
          border-radius: 8px;
        }
        * ::-webkit-scrollbar {
          width: 10px
        }
      `,
      selectorManager: { appendTo: '', componentFirst: true },
      styleManager: { appendTo: '' },
      blockManager: {
        appendTo: '#' + BLOCKS_PANEL_ID,
        blocks: definedBlocks,
        appendOnClick: (block, editor) => {
          editor.getWrapper().append(block.get('content'));
          // const cnv = editor.Canvas;
          // if (cnv && cnv.getWindow()) {
          //   cnv.getWindow().scrollTo(0, cnv.getDocument()?.body.scrollHeight ?? 0);
          // }
          editor.Canvas.getWindow().scrollTo(0, editor.Canvas.getDocument().body.scrollHeight);
        },
      },
      domComponents: {
        storeWrapper: true,
      },

      storageManager: {
        id: '',
        type: 'passion-backend',
        autosave: true,
        stepsBeforeSave: 15,
        autoload: false,
      },

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

      // TODO: Can Probably group all passion components under a named plugin
      plugins: [
        Container,
        LinkButton,
        ReactComponentHandler,
        PassionProductsList,
        CustomCommands,
        CustomTraits,
        Testimonials,
        SimpleTextSection,
        SimpleTextWithImage,
        'gjs-plugin-ckeditor',
      ],
      pluginsOpts: {
        'gjs-plugin-ckeditor': {
          position: 'right',
          options: {
            forcePasteAsPlainText: true,
            // Refer to list of plugins to load here
            // https://github.com/ckeditor/ckeditor4/tree/f6dd30807a1c7cb585f376a38fb13dffd2213a75/plugins
            // plugins: ['contextmenu','basicstyles', 'sharedspace'],
            extraPlugins: 'sharedspace',
            toolbar: [['Bold', 'Italic', 'Underline', 'Strike']],
          },
        },
      },
    });

    customEditorInitializationLogic(editor);

    // Modify Wrapper stylability (I think this should only apply to pages)
    // Initially we can only modify background, but modifying
    // padding also makes sense
    const wrapper = editor.getWrapper();
    wrapper.addTrait({
      type: 'padding-slider',
    });
    wrapper.addTrait({
      type: 'custom-color-picker',
      label: 'Background color',
      name: 'bg-color',
      changeProp: true,
    });
    wrapper.on('change:bg-style', function () {
      const bgStyle = this.props()['bg-color'];
      wrapper.setStyle({
        ...wrapper.getStyle(),
        background: bgStyle,
      });
    });
    // TODO: This can also be the way to update component implementations
    // when they are outdated
    wrapper.set({
      'bg-style': '#ffffff',
    });
    const [bodyClassSelector] = wrapper.setClass(['page-body-section']);
    // NOTE: We can also hide the class by setting private: true
    bodyClassSelector.set({ protected: true });
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

    //#region Start of event listener hooks
    editor.on('storage:start:store', () => {
      setIsSaving(true);
    });

    editor.on('storage:end:store', () => {
      setIsSaving(false);
    });

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
      document.getElementById(RIGHT).style.display = 'none';
      document.getElementById(TOP).style.display = 'none';
      document.getElementById(LEFT).style.display = 'none';
    });

    editor.on('stop:preview', () => {
      document.getElementById(RIGHT).style.display = 'block';
      document.getElementById(TOP).style.display = 'block';
      document.getElementById(LEFT).style.display = 'block';
    });

    editor.onReady(() => {
      document.getElementById(LAYERS_PANEL_ID).style.display = 'none';
      editor.Blocks.render();
    });

    //#endregion End of event listener hooks

    // Initial definition for storage
    editor.StorageManager.add('passion-backend', {
      async store(payload, callback, errorCallback) {
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

    return () => {
      console.log('Unmounted');
      window.onbeforeunload = null;
    };
  }, [initializeGrapesJSEditor, fetchCreatorCustomPages]);

  // Logic for updating autosave time
  useEffect(() => {
    if (isSaving) {
      setLastSaveTime(new Date());
    }
  }, [isSaving]);

  useEffect(() => {
    if (gjsEditor) {
      const fallbackAction = () => {
        gjsEditor.loadData(blankPageTemplate.content);
      };

      if (selectedPageId) {
        const targetPageIndex = creatorPages.findIndex((page) => page.external_id === selectedPageId);
        const targetPage = creatorPages.find((page) => page.external_id === selectedPageId);

        if (targetPage) {
          // Override existing logic (especially the payload) with current page
          gjsEditor.StorageManager.add('passion-backend', {
            async store(payload, callback, errorCallback) {
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
            },
            load(keysToLoad, callback, errorCallback) {
              console.log('FE will handle the loading');
            },
          });

          // NOTE: Since we also export the wrapper, everytime this gets called
          // a wrapper is nested inside another wrapper, which causes issues when editing
          gjsEditor.loadData(targetPage.content ?? blankPageTemplate.content);
        } else {
          fallbackAction();
        }
      } else {
        fallbackAction();
      }

      setTimeout(() => setIsLoading(false), 1000);
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
      document.getElementById(TRAITS_PANEL_ID).style.display = 'none';
      document.getElementById(EMPTY).style.display = 'block';
    } else {
      document.getElementById(TRAITS_PANEL_ID).style.display = 'block';
      document.getElementById(EMPTY).style.display = 'none';
    }
  }, [isComponentSelected]);

  // Causes bugs, disable for the moment
  // const onSelectedPageChanged = (value) => {
  //   if (gjsEditor) {
  //     gjsEditor.store(
  //       // Success Callback
  //       () => {
  //         setSelectedPageId(value);
  //       },
  //       // Error Callback
  //       () => {
  //         message.error('Failed to save changes to current page!');
  //       }
  //     );
  //   }
  // };

  //#region Start of Editor Button Handlers
  const handleBackToDashboard = () => {
    if (confirmDirtyCount(gjsEditor)) {
      history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.customPages.list);
    }
  };

  const toggleActiveClass = (targetEl) => {
    targetEl.classList.add(['active']);
    getSiblingElements(targetEl).forEach((el) => el.classList.remove('active'));
  };

  const runSimpleCommand = (command) => {
    if (gjsEditor) {
      gjsEditor.runCommand(command);
    }
  };

  const runCommandAndToggleActiveStyles = (targetElement, command = '') => {
    if (gjsEditor && command) {
      gjsEditor.runCommand(command);
      toggleActiveClass(targetElement);
      return true; // run complete
    }
    return false; // run failed
  };

  const handleClickBlocks = (e) => {
    if (runCommandAndToggleActiveStyles(e.target, 'open-blocks')) {
      document.getElementById(LAYERS_PANEL_ID).style.display = 'none';
      document.getElementById(BLOCKS_PANEL_ID).style.display = 'block';
    }
  };

  const handleClickLayers = (e) => {
    if (runCommandAndToggleActiveStyles(e.target, 'open-layers')) {
      document.getElementById(LAYERS_PANEL_ID).style.display = 'block';
      document.getElementById(BLOCKS_PANEL_ID).style.display = 'none';
    }
  };

  // const handleClickStyles = (e) => {
  //   if (runCommandAndToggleActiveStyles(e.target, 'open-sm')) {
  //     document.getElementById(STYLING).style.display = 'block';
  //     document.getElementById(TRAITS_PANEL_ID).style.display = 'none';
  //   }
  // };

  // const handleClickTraits = (e) => {
  //   if (runCommandAndToggleActiveStyles(e.target, 'open-tm')) {
  //     // document.getElementById(STYLING).style.display = 'none';
  //     document.getElementById(TRAITS_PANEL_ID).style.display = 'block';
  //   }
  // };

  const handleSetDeviceDesktop = (e) => {
    runCommandAndToggleActiveStyles(e.currentTarget, 'set-device-desktop');
    // runCommandAndToggleActiveStyles(e.target, 'set-device-desktop');
  };

  const handleSetDeviceTablet = (e) => {
    runCommandAndToggleActiveStyles(e.currentTarget, 'set-device-tablet');
    // runCommandAndToggleActiveStyles(e.target, 'set-device-tablet');
  };

  const handleSetDeviceMobile = (e) => {
    runCommandAndToggleActiveStyles(e.currentTarget, 'set-device-mobile');
    // runCommandAndToggleActiveStyles(e.target, 'set-device-mobile');
  };

  // const handleSwitchVisibility = (e) => {
  //   if (gjsEditor) {
  //     const isVisibilityActive = gjsEditor.Commands.isActive('sw-visibility');

  //     if (isVisibilityActive) {
  //       gjsEditor.stopCommand('sw-visibility');
  //       e.target.classList.remove('active');
  //     } else {
  //       gjsEditor.runCommand('sw-visibility');
  //       e.target.classList.add('active');
  //     }
  //   }
  // };

  const handlePreview = () => {
    runSimpleCommand('preview');
  };

  // const handleToggleFullscreen = (e) => {
  //   if (gjsEditor) {
  //     const isInFullscreen = gjsEditor.Commands.isActive('fullscreen');

  //     if (isInFullscreen) {
  //       gjsEditor.stopCommand('fullscreen');
  //       e.target.classList.remove('active');
  //     } else {
  //       gjsEditor.runCommand('fullscreen', { target: document.getElementById(EDITOR) });
  //       e.target.classList.add(['active']);
  //     }
  //   }
  // };

  const handleUndo = () => {
    runSimpleCommand('core:undo');
  };

  const handleRedo = () => {
    runSimpleCommand('core:redo');
  };

  const handleSaveTemplate = () => {
    // Custom defined command in Plugins/commands.js
    runSimpleCommand('save-as-json');
  };

  // const handleCleanCanvas = () => {
  //   // Custom command, comes from grapesjs-preset-webpage
  //   // runSimpleCommand('canvas-clear');
  //   if (gjsEditor) {
  //     if (window.confirm('Are you sure you want to clear the canvas?')) {
  //       gjsEditor.runCommand('core:canvas-clear');
  //     }
  //   }
  // };

  // const handleAdvancedMode = () => {
  //   if (confirmDirtyCount(gjsEditor)) {
  //     history.push(generatePath(Routes.creatorDashboard.customPages.editor, { page_id: targetPageId }));
  //   }
  // };

  //#endregion End of Editor Button Handlers

  return (
    <Spin spinning={isLoading}>
      <Row style={{ height: '100vh' }}>
        <Col id={TOP} xs={24} className={styles.topPanelContainer}>
          <Row gutter={8} align="middle">
            <Col flex="0 0 15%">
              <Button
                icon={<LeftOutlined />}
                className={styles.dashboardButton}
                type="text"
                onClick={handleBackToDashboard}
              >
                Back to Dashboard
              </Button>
            </Col>
            <Col flex="1 0 auto" className={styles.textAlignCenter}>
              <Row gutter={8} align="middle">
                <Col flex="0 0 200px">
                  {isSaving ? (
                    <Spin />
                  ) : lastSaveTime ? (
                    <Text className={styles.saveTimeText}>Last Saved : {lastSaveTime.toLocaleTimeString()}</Text>
                  ) : null}
                </Col>
                <Col flex="1 0 auto">
                  <div className={styles.devicesContainer}>
                    <button className="device-button active fa fa-desktop" onClick={handleSetDeviceDesktop} />
                    <button className="device-button fa fa-tablet" onClick={handleSetDeviceTablet} />
                    <button className="device-button fa fa-mobile" onClick={handleSetDeviceMobile} />
                  </div>
                </Col>
                <Col flex="0 0 100px">
                  <Space className={styles.helperContainer}>
                    <button className="helper-button fa fa-undo" onClick={handleUndo} />
                    <button className="helper-button fa fa-repeat" onClick={handleRedo} />
                  </Space>
                </Col>
              </Row>
            </Col>
            <Col flex="0 0 15%" className={styles.textAlignRight}>
              <Space align="center" className={styles.ctaButtonContainer}>
                <Button className={styles.linkEditorButton} size="large" type="link" onClick={handlePreview}>
                  Preview
                </Button>
                <Button
                  className={styles.primaryEditorButton}
                  size="large"
                  type="primary"
                  loading={isSaving}
                  disabled={isSaving}
                  onClick={handleSaveTemplate}
                >
                  {isSaving ? 'Saving...' : 'Publish'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Row className={styles.contentContainer}>
            <Col id={LEFT} flex="0 0 15%" className={styles.sidePanelContainer}>
              <Row gutter={[12, 12]}>
                <Col xs={24}>
                  <Text className={styles.sectionHeading}>
                    <FileTextOutlined className={styles.mr10} />{' '}
                    {creatorPages?.find((page) => page.external_id === selectedPageId)?.name ?? ''}
                  </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.buttonsContainer}>
                    <button className="active" onClick={handleClickBlocks}>
                      Components
                    </button>
                    <button onClick={handleClickLayers}>Layer Blocks</button>
                  </div>
                </Col>
                <Col xs={24}>
                  <div id={BLOCKS_PANEL_ID}></div>
                  <div id={LAYERS_PANEL_ID}></div>
                </Col>
              </Row>
            </Col>
            <Col flex="1 0 auto" className={styles.middleContainer}>
              <div id={BUILDER_CONTAINER_ID}></div>
            </Col>
            <Col id={RIGHT} flex="0 0 15%" className={styles.sidePanelContainer}>
              <Row gutter={[12, 12]}>
                <Col xs={24}>
                  <Text className={styles.sectionHeading}>Customization</Text>
                </Col>
                {/* <Col xs={24}>
                  <div className={styles.buttonsContainer}>
                    <button className="active" onClick={handleClickTraits}>
                      Basic Mode
                    </button>
                    <button onClick={handleClickStyles}>
                      Advanced
                    </button>
                  </div>
                </Col> */}
                <Col xs={24}>
                  <div id={EMPTY}>Please select a component first.</div>
                  <div id={TRAITS_PANEL_ID}></div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
      </Row>
    </Spin>
  );
};

export default SimplePageEditor;
