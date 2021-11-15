import React, { useEffect, useState, useCallback } from 'react';

import { Spin, Row, Col, Space, Button, message } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';

import apis from 'apis';
import Routes from 'routes';
import config from 'config/index.js';

// These are to be put as part of the config
import elementIds from '../Configs/common/elementIds.js';
import sectionIds from '../Configs/common/sectionIds';
import commonEditorConfig from '../Configs/common/config';
// import definedPanels from '../Configs/panels.js';

// THese are to be put in plugins
import CustomTraits from '../Plugins/traits';
import CustomCommands from '../Plugins/commands';
import ReactComponentHandler from '../ReactComponentHandler';
import LinkButton from '../CustomComponents/LinkButton.js';
import Header from '../CustomComponents/Header.js';

import { getLocalUserDetails } from 'utils/storage.js';
import { websiteComponentTypes } from 'utils/constants.js';
import { headerTemplate } from 'utils/pageEditorTemplates.js';
import { isAPISuccess, getSiblingElements } from 'utils/helper.js';
import { customEditorInitializationLogic } from 'utils/pageEditor.js';

import { useGlobalContext } from 'services/globalContext.js';

import styles from './style.module.scss';

const {
  BUILDER_CONTAINER_ID,
  // SELECTOR_PANEL_ID,
  // STYLES_PANEL_ID,
  // BLOCKS_PANEL_ID,
  TRAITS_PANEL_ID,
  LAYERS_PANEL_ID,
} = elementIds;

const {
  EDITOR,
  RIGHT,
  RIGHT_INNER,
  TOP,
  LEFT,
  EMPTY,
  // STYLING,
} = sectionIds;

const HeaderEditor = ({ match, history }) => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const [creatorAssets, setCreatorAssets] = useState([]);
  const [isComponentSelected, setIsComponentSelected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCreatorHeaderComponent = useCallback(async (editor) => {
    const initializeEditorWithHeader = (headerData) => {
      editor.loadData(headerData.content);

      editor.StorageManager.add('passion-backend-header', {
        async store(payload, callback, errorCallback) {
          setIsSaving(true);
          try {
            const { status, data } = await apis.custom_pages.updateWebsiteComponent(headerData.external_id, {
              component_type: websiteComponentTypes.HEADER,
              content: payload,
            });

            if (isAPISuccess(status) && data) {
              callback(data);
            }
          } catch (error) {
            console.log('Error occured when storing header to API');
            console.error(error);
            errorCallback(error);
          }
          setIsSaving(false);
        },
        load(keysToLoad, callback, errorCallback) {
          console.log('FE will handle the loading');
        },
      });
    };

    const fallbackEditorInitialization = () => {
      editor.StorageManager.setCurrent('local');

      editor.loadData(headerTemplate);
    };

    try {
      const { status, data } = await apis.custom_pages.getWebsiteComponent(websiteComponentTypes.HEADER);

      if (isAPISuccess(status) && data) {
        initializeEditorWithHeader(data);
      }
    } catch (error) {
      console.log('First level error');
      console.error(error);
      if (error?.response?.status === 500 && error?.response?.data?.message === 'component doesnt exist') {
        try {
          const createResponse = await apis.custom_pages.createWebsiteComponent({
            content: headerTemplate,
            component_type: websiteComponentTypes.HEADER,
          });

          if (isAPISuccess(createResponse.status) && createResponse.data) {
            initializeEditorWithHeader(createResponse.data);
          }
        } catch (err) {
          console.log('Second level error');
          console.error(err);
          fallbackEditorInitialization();
        }
      } else {
        fallbackEditorInitialization();
      }
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

  const initializeGrapesJSEditor = useCallback(() => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    // When rendering in public [age]
    const editor = grapesjs.init({
      ...commonEditorConfig,
      storageManager: {
        id: '',
        type: 'passion-backend-header',
        autosave: true,
        stepsBeforeSave: 5,
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
      // Built-in props for styles
      // https://grapesjs.com/docs/modules/Style-manager.html#built-in-properties
      selectorManager: {},
      styleManager: {
        sectors: [],
      },
      blockManager: {
        blocks: [],
      },
      plugins: [ReactComponentHandler, LinkButton, Header, CustomCommands, CustomTraits],
    });

    customEditorInitializationLogic(editor);

    //#region Start of Asset Listener Definition
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
    //#endregion Start of Asset Listener Definition

    editor.runCommand('sw-visibility');

    setGjsEditor(editor);
    fetchCreatorWebsiteAssets(editor);
    fetchCreatorHeaderComponent(editor);
  }, [fetchCreatorWebsiteAssets, fetchCreatorHeaderComponent, userDetails]);

  useEffect(() => {
    initializeGrapesJSEditor();
  }, [initializeGrapesJSEditor]);

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

  const handleClickLayers = () => {
    runSimpleCommand('open-layers');
  };

  const handleClickTraits = () => {
    runSimpleCommand('open-tm');
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

  //#endregion End of Editor Button Handlers

  return (
    <Spin spinning={isLoading}>
      <div>
        <div id={EDITOR} className={styles.builderPage}>
          <div id={LEFT} className={styles.leftSection}>
            <div className={styles.topPanel}>
              {/* <button className="fa fa-th-large" onClick={handleClickBlocks}></button> */}
              <button className="fa fa-bars active" onClick={handleClickLayers}></button>
            </div>
            <div className={styles.panelContainer}>
              {/* <div id={BLOCKS_PANEL_ID}></div> */}
              <div id={LAYERS_PANEL_ID}></div>
            </div>
          </div>
          <div className={styles.middleSection}>
            <div id={TOP} className={styles.topPanel}>
              <Row gutter={8} justify="space-around" className={styles.buttonsContainer}>
                <Col flex="0 0 45%" className={styles.pageSelectorContainer}>
                  <Button
                    icon={<LeftOutlined />}
                    className={styles.backButton}
                    size="small"
                    type="link"
                    onClick={handleBackToDashboard}
                  >
                    Back to Dashboard
                  </Button>
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
                    {/* <button className="fa fa-code" onClick={handleShowCode}></button> */}
                    <button className="fa fa-undo" onClick={handleUndo}></button>
                    <button className="fa fa-repeat" onClick={handleRedo}></button>
                    {isSaving ? (
                      <button className="fa fa-spinner"></button>
                    ) : (
                      <button className="fa fa-floppy-o" onClick={handleSaveTemplate}></button>
                    )}
                    {/* <button className="fa fa-trash" onClick={handleCleanCanvas}></button> */}
                  </Space>
                </Col>
              </Row>
            </div>
            <div id={BUILDER_CONTAINER_ID}></div>
          </div>
          <div id={RIGHT} className={styles.rightSection}>
            <div className={styles.topPanel}>
              {/* <button className="fa fa-paint-brush" onClick={handleClickStyles}></button> */}
              <button className="fa fa-cog active" onClick={handleClickTraits}></button>
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

export default HeaderEditor;
