import React, { useEffect, useState, useCallback } from 'react';

import { Spin, Row, Col, Space, Typography, Button, message } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
// import 'grapesjs-blocks-flexbox';
import grapesjs from 'grapesjs';
// import 'grapesjs-preset-webpage';

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
import CustomTraits from '../Plugins/traits';
import CustomCommands from '../Plugins/commands';
import ReactComponentHandler from '../ReactComponentHandler';
import PassionSessionList from '../CustomComponents/PassionSessionList.js';
import PassionVideoList from '../CustomComponents/PassionVideoList.js';
import PassionCourseList from '../CustomComponents/PassionCourseList.js';
import PassionPassList from '../CustomComponents/PassionPassList.js';
import PassionSubscriptionList from '../CustomComponents/PassionSubscriptionList.js';
import Container from '../CustomComponents/Container.js';
import TextSection from '../CustomComponents/TextSection.js';
import TextWithImageSection from '../CustomComponents/TextWithImageSection.js';
import LinkButton from '../CustomComponents/LinkButton.js';

import { getLocalUserDetails } from 'utils/storage.js';
import { getSiblingElements, isAPISuccess } from 'utils/helper.js';
import { blankPageTemplate } from 'utils/pageEditorTemplates.js';
import { customEditorInitializationLogic } from 'utils/pageEditor.js';
import { isValidCSSColor } from 'utils/colors';

import { useGlobalContext } from 'services/globalContext.js';

//eslint-disable-next-line
import styles from './style.module.scss';
import { generatePath } from 'react-router-dom';

const { Text } = Typography;

const { BUILDER_CONTAINER_ID, TRAITS_PANEL_ID, LAYERS_PANEL_ID, BLOCKS_PANEL_ID } = elementIds;

const { EDITOR, RIGHT, RIGHT_INNER, TOP, LEFT, EMPTY } = sectionIds;

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
          background: rgba(0, 0, 0, 0.1)
        }
        * ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2)
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
        PassionSubscriptionList,
        PassionVideoList,
        PassionCourseList,
        PassionSessionList,
        PassionPassList,
        CustomCommands,
        CustomTraits,
        TextSection,
        TextWithImageSection,
      ],
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
      type: 'color',
      label: 'Background color',
      name: 'bg-style',
      changeProp: true,
    });
    wrapper.on('change:bg-style', function () {
      const bgStyle = wrapper.props()['bg-style'];
      const componentList = wrapper.components();

      const isBackgroundColor = isValidCSSColor(bgStyle);

      // Check for child components with the same property
      const validChildList = componentList.filter((comp) => comp.props().hasOwnProperty('bg-style'));
      validChildList.forEach((childComp) => {
        // NOTE: Right now this only works if the prop name and trait name is same
        childComp.updateTrait('bg-style', {
          type: 'color',
          value: isBackgroundColor ? bgStyle : 'transparent',
        });
      });

      wrapper.setStyle({
        ...wrapper.getStyle(),
        background: bgStyle,
      });
    });
    // TODO: This can also be the way to update component implementations
    // when they are outdated
    wrapper.set({
      'bg-style': '',
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

    editor.runCommand('sw-visibility');

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
      document.getElementById(RIGHT_INNER).style.display = 'none';
      document.getElementById(EMPTY).style.display = 'block';
    } else {
      document.getElementById(RIGHT_INNER).style.display = 'block';
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
    if (gjsEditor) {
      gjsEditor.store();
    }

    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.customPages.list);
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

  const handleClickTraits = (e) => {
    if (runCommandAndToggleActiveStyles(e.target, 'open-tm')) {
      // document.getElementById(STYLING).style.display = 'none';
      document.getElementById(TRAITS_PANEL_ID).style.display = 'block';
    }
  };

  const handleSetDeviceDesktop = (e) => {
    runCommandAndToggleActiveStyles(e.target, 'set-device-desktop');
  };

  const handleSetDeviceTablet = (e) => {
    runCommandAndToggleActiveStyles(e.target, 'set-device-tablet');
  };

  const handleSetDeviceMobile = (e) => {
    runCommandAndToggleActiveStyles(e.target, 'set-device-mobile');
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
    runSimpleCommand('preview');
  };

  const handleToggleFullscreen = (e) => {
    if (gjsEditor) {
      const isInFullscreen = gjsEditor.Commands.isActive('fullscreen');

      if (isInFullscreen) {
        gjsEditor.stopCommand('fullscreen');
        e.target.classList.remove('active');
      } else {
        gjsEditor.runCommand('fullscreen', { target: document.getElementById(EDITOR) });
        e.target.classList.add(['active']);
      }
    }
  };

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

  const handleCleanCanvas = () => {
    // Custom command, comes from grapesjs-preset-webpage
    // runSimpleCommand('canvas-clear');
    if (gjsEditor) {
      if (window.confirm('Are you sure you want to clear the canvas?')) {
        gjsEditor.runCommand('core:canvas-clear');
      }
    }
  };

  const handleAdvancedMode = () => {
    if (gjsEditor) {
      const dirtyCount = gjsEditor.getDirtyCount() ?? 0;

      if (dirtyCount > 0) {
        if (window.confirm('You will lose unsaved changes! Are you sure about this?')) {
          history.push(generatePath(Routes.creatorDashboard.customPages.editor, { page_id: targetPageId }));
        }
      } else {
        history.push(generatePath(Routes.creatorDashboard.customPages.editor, { page_id: targetPageId }));
      }
    } else {
      history.push(generatePath(Routes.creatorDashboard.customPages.editor, { page_id: targetPageId }));
    }
  };

  //#endregion End of Editor Button Handlers

  return (
    <Spin spinning={isLoading}>
      <div>
        <div id={EDITOR} className={styles.builderPage}>
          <div id={LEFT} className={styles.leftSection}>
            <div className={styles.topPanel}>
              <button
                data-tooltip="Component List"
                data-tooltip-pos="bottom"
                className="fa fa-th-large active"
                onClick={handleClickBlocks}
              ></button>
              <button
                data-tooltip="Navigator"
                data-tooltip-pos="bottom"
                className="fa fa-bars"
                onClick={handleClickLayers}
              ></button>
            </div>
            <div className={styles.panelContainer}>
              <div id={BLOCKS_PANEL_ID}></div>
              <div id={LAYERS_PANEL_ID}></div>
            </div>
          </div>
          <div className={styles.middleSection}>
            <div id={TOP} className={styles.topPanel}>
              <Row gutter={8} justify="space-around" className={styles.buttonsContainer}>
                <Col flex="0 0 45%" className={styles.pageSelectorContainer}>
                  <Space>
                    <Button
                      icon={<LeftOutlined />}
                      className={styles.backButton}
                      size="small"
                      type="link"
                      onClick={handleBackToDashboard}
                    >
                      Back to Dashboard
                    </Button>
                    <Text className={styles.whiteText} strong>
                      {creatorPages?.find((page) => page.external_id === selectedPageId)?.name ?? ''}
                    </Text>
                    {isSaving ? (
                      <Spin />
                    ) : lastSaveTime ? (
                      <Text className={styles.saveTimeText}>Last Saved : {lastSaveTime.toLocaleTimeString()}</Text>
                    ) : null}
                  </Space>
                </Col>
                <Col flex="0 0 120px" className={styles.textAlignCenter}>
                  <button
                    data-tooltip="Desktop mode"
                    data-tooltip-pos="bottom"
                    className="fa fa-desktop active"
                    onClick={handleSetDeviceDesktop}
                  ></button>
                  <button
                    data-tooltip="Tablet mode"
                    data-tooltip-pos="bottom"
                    className="fa fa-tablet"
                    onClick={handleSetDeviceTablet}
                  ></button>
                  <button
                    data-tooltip="Phone mode"
                    data-tooltip-pos="bottom"
                    className="fa fa-mobile"
                    onClick={handleSetDeviceMobile}
                  ></button>
                </Col>
                <Col flex="1 0 auto" className={styles.textAlignRight}>
                  <Space align="center">
                    <button
                      data-tooltip="Toggle component borders"
                      data-tooltip-pos="bottom"
                      className="fa fa-square-o active"
                      onClick={handleSwitchVisibility}
                    ></button>
                    <button
                      data-tooltip="Toggle preview"
                      data-tooltip-pos="bottom"
                      className="fa fa-eye"
                      onClick={handlePreview}
                    ></button>
                    <button
                      data-tooltip="Toggle fullscreen"
                      data-tooltip-pos="bottom"
                      className="fa fa-arrows-alt"
                      onClick={handleToggleFullscreen}
                    ></button>
                    {/* <button className="fa fa-code" onClick={handleShowCode}></button> */}
                    <button
                      data-tooltip="Undo"
                      data-tooltip-pos="bottom"
                      className="fa fa-undo"
                      onClick={handleUndo}
                    ></button>
                    <button
                      data-tooltip="Redo"
                      data-tooltip-pos="bottom"
                      className="fa fa-repeat"
                      onClick={handleRedo}
                    ></button>
                    {isSaving ? (
                      <button data-tooltip="Saving..." data-tooltip-pos="bottom" className="fa fa-spinner"></button>
                    ) : (
                      <button
                        data-tooltip="Save Page"
                        data-tooltip-pos="bottom"
                        className="fa fa-floppy-o"
                        onClick={handleSaveTemplate}
                      ></button>
                    )}
                    <button
                      data-tooltip="Clear canvas"
                      data-tooltip-pos="bottom"
                      className="fa fa-trash"
                      onClick={handleCleanCanvas}
                    ></button>
                    <button
                      data-tooltip="Advanced mode"
                      data-tooltip-pos="bottom"
                      className="fa fa-gears"
                      onClick={handleAdvancedMode}
                    ></button>
                  </Space>
                </Col>
              </Row>
            </div>
            <div id={BUILDER_CONTAINER_ID}></div>
          </div>
          <div id={RIGHT} className={styles.rightSection}>
            <div className={styles.topPanel}>
              {/* <button className="fa fa-paint-brush active" onClick={handleClickStyles}></button> */}
              <button
                data-tooltip="Component Settings"
                data-tooltip-pos="bottom"
                className="fa fa-cog active"
                onClick={handleClickTraits}
              ></button>
            </div>
            <div id={EMPTY}>Please select a component first.</div>
            <div id={RIGHT_INNER} className={styles.panelContainer}>
              {/* <div id={STYLING}>
                <div id={SELECTOR_PANEL_ID}></div>
                <div id={STYLES_PANEL_ID}></div>
              </div> */}
              <div id={TRAITS_PANEL_ID}></div>
            </div>
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default SimplePageEditor;
