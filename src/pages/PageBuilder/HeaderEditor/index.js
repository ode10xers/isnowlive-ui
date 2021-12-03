import React, { useEffect, useState, useCallback } from 'react';

import { Spin, Row, Col, Space, Button, Typography, message } from 'antd';
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
import CustomTraits from '../Configs/traits';
import CustomCommands from '../Configs/commands';
import ReactComponentHandler from '../CustomComponents/ReactComponentHandler.js';
import LinkButton from '../CustomComponents/LinkButton.js';
import Header from '../CustomComponents/Header.js';
import Container from '../CustomComponents/Container.js';

import { getLocalUserDetails } from 'utils/storage.js';
import { websiteComponentTypes } from 'utils/constants.js';
import { headerTemplate } from 'utils/pageEditorTemplates.js';
import { isAPISuccess, getSiblingElements } from 'utils/helper.js';
import { customEditorInitializationLogic } from 'utils/pageEditor.js';

import { useGlobalContext } from 'services/globalContext.js';

import styles from './style.module.scss';
import SimpleTextWithImage from '../CustomComponents/SimpleTextWithImage.js';
import customCommands from '../Configs/strings/customCommands.js';

const { Text } = Typography;

const { BUILDER_CONTAINER_ID, TRAITS_PANEL_ID, LAYERS_PANEL_ID } = elementIds;

const { RIGHT, TOP, LEFT, EMPTY } = sectionIds;

const HeaderEditor = ({ match, history }) => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const [creatorAssets, setCreatorAssets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isComponentSelected, setIsComponentSelected] = useState(false);

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

      // editor.loadData(headerTemplate);
      editor.loadData({ components: [{ type: 'passion-header-block' }] });
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
        fallbackEditorInitialization();
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
      plugins: [
        ReactComponentHandler,
        Container,
        LinkButton,
        Header,
        SimpleTextWithImage,
        CustomCommands,
        CustomTraits,
      ],
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

    editor.on(`run:${customCommands.EDITOR_DEFAULT.PREVIEW}`, () => {
      document.getElementById(RIGHT).style.display = 'none';
      document.getElementById(TOP).style.display = 'none';
      document.getElementById(LEFT).style.display = 'none';
    });

    editor.on(`stop:${customCommands.EDITOR_DEFAULT.PREVIEW}`, () => {
      document.getElementById(RIGHT).style.display = 'block';
      document.getElementById(TOP).style.display = 'block';
      document.getElementById(LEFT).style.display = 'block';
    });
    //#endregion Start of Asset Listener Definition

    setGjsEditor(editor);
    fetchCreatorWebsiteAssets(editor);
    fetchCreatorHeaderComponent(editor);
  }, [fetchCreatorWebsiteAssets, fetchCreatorHeaderComponent, userDetails]);

  useEffect(() => {
    initializeGrapesJSEditor();

    return () => {
      window.onbeforeunload = null;
    };
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

  // Logic for updating autosave time
  useEffect(() => {
    if (isSaving) {
      setLastSaveTime(new Date());
    }
  }, [isSaving]);

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

  const handleSetDeviceDesktop = (e) => {
    runCommandAndToggleActiveStyles(e.target, customCommands.SET_DEVICE.DESKTOP);
  };

  const handleSetDeviceTablet = (e) => {
    runCommandAndToggleActiveStyles(e.target, customCommands.SET_DEVICE.TABLET);
  };

  const handleSetDeviceMobile = (e) => {
    runCommandAndToggleActiveStyles(e.target, customCommands.SET_DEVICE.MOBILE);
  };

  const handlePreview = () => {
    runSimpleCommand(customCommands.EDITOR_DEFAULT.PREVIEW);
  };

  const handleUndo = () => {
    runSimpleCommand(customCommands.EDITOR_DEFAULT.UNDO);
  };

  const handleRedo = () => {
    runSimpleCommand(customCommands.EDITOR_DEFAULT.REDO);
  };

  const handleSaveTemplate = () => {
    // Custom defined command in Plugins/commands.js
    runSimpleCommand(customCommands.SAVE_AS_JSON);
  };

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
                    <button className="helper-button fa fa-undo" onClick={handleUndo}>
                      Undo
                    </button>
                    <button className="helper-button fa fa-repeat" onClick={handleRedo}>
                      Redo
                    </button>
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

export default HeaderEditor;
