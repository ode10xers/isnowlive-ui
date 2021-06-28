import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { message, Spin, Row, Col, Button, Space, Modal, Typography } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseCircleOutlined,
  LikeOutlined,
  LinkOutlined,
  PlusCircleOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';
import PassesProfileComponent from 'components/DynamicProfileComponents/PassesProfileComponent';
import SubscriptionProfileComponent from 'components/DynamicProfileComponents/SubscriptionsProfileComponent';
import OtherLinksProfileComponent from 'components/DynamicProfileComponents/OtherLinksProfileComponent';
import CreatorProfileComponent from 'components/DynamicProfileComponents/CreatorProfileComponent';
import ProductsProfileComponent from 'components/DynamicProfileComponents/ProductsProfileComponent';

import {
  deepCloneObject,
  isAPISuccess,
  preventDefaults,
  isInCreatorDashboard,
  generateUrlFromUsername,
} from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import styles from './style.module.scss';

const { Paragraph } = Typography;

// {
//   "key": "DONATIONS",
//   "title": "Buy me a coffee!",
//   "values": [
//     5,
//     10,
//     15,
//     20
//   ]
// },

const componentsMap = {
  PRODUCTS: {
    icon: <LikeOutlined />,
    component: ProductsProfileComponent,
    label: 'Products',
    optional: false,
    defaultProps: {
      title: '',
      values: [
        {
          key: 'SESSIONS',
          title: 'My Sessions',
          values: null,
        },
        {
          key: 'COURSES',
          title: 'My Courses',
          values: null,
        },
        {
          key: 'VIDEOS',
          title: 'My Videos',
          values: null,
        },
      ],
    },
  },
  PASSES: {
    icon: <LikeOutlined />,
    label: 'Passes',
    optional: false,
    component: PassesProfileComponent,
    defaultProps: {
      title: 'CREDIT PASSES',
      values: null,
    },
  },
  SUBSCRIPTIONS: {
    icon: <LikeOutlined />,
    label: 'Memberships',
    optional: false,
    component: SubscriptionProfileComponent,
    defaultProps: {
      title: 'MEMBERSHIPS',
      values: null,
    },
  },
  OTHER_LINKS: {
    icon: <LinkOutlined />,
    label: 'Other Links',
    optional: true,
    component: OtherLinksProfileComponent,
    defaultProps: {
      title: 'OTHER LINKS',
      values: null,
    },
  },
};

const DynamicProfile = ({ creatorUsername = null }) => {
  const history = useHistory();

  const [isLoading, setIsLoading] = useState(true);
  const [creatorProfileData, setCreatorProfileData] = useState(null);
  const [editingMode, setEditingMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [addComponentModalVisible, setAddComponentModalVisible] = useState(false);
  const [creatorUIConfig, setCreatorUIConfig] = useState([]);
  const [tempCreatorUIConfig, setTempCreatorUIConfig] = useState([]);
  const [uiConfigChanged, setUiConfigChanged] = useState(false);

  const fetchCreatorProfileData = useCallback(async (username) => {
    if (!username) {
      return;
    }

    setIsLoading(true);
    try {
      const { status, data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfileData(data);
      }
    } catch (error) {
      message.error('Failed to load creator profile details');
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  //#region Start of Use Effects

  useEffect(() => {
    if (!creatorUsername) {
      fetchCreatorProfileData(getLocalUserDetails()?.username ?? '');
    } else {
      fetchCreatorProfileData(creatorUsername);
    }
  }, [fetchCreatorProfileData, creatorUsername]);

  useEffect(() => {
    setCreatorUIConfig(creatorProfileData?.profile?.sections ?? []);
  }, [creatorProfileData]);

  //#endregion End of Use Effects

  //#region Start Of Page Edit Button Handlers

  const getExistingComponentInstance = (identifier) =>
    tempCreatorUIConfig.find((component) => component.key === identifier);

  const addComponent = (identifier = null, props) => {
    if (!identifier) {
      showErrorModal('Invalid component identifier!');
      return;
    }

    const existingComponentInstance = getExistingComponentInstance(identifier);

    if (existingComponentInstance) {
      showErrorModal('Duplicate of this component already exists!');
      return;
    }

    const currentComponentsList = deepCloneObject(tempCreatorUIConfig) || [];
    currentComponentsList.push({
      key: identifier,
      ...props,
    });

    setTempCreatorUIConfig(currentComponentsList);
    setUiConfigChanged(false);
    setAddComponentModalVisible(false);
    showSuccessModal('Component added', `Make sure to save so you don't lose the changes`);
  };

  const disableEditingMode = () => {
    setTempCreatorUIConfig([]);
    setEditingMode(false);
    setPreviewMode(false);
  };

  // const handleTogglePreviewMode = (e) => {
  //   preventDefaults(e);
  //   setPreviewMode(!previewMode);
  // };

  const handleEditDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    setTempCreatorUIConfig(deepCloneObject(creatorUIConfig));
    setEditingMode(true);
    setPreviewMode(false);
    setUiConfigChanged(false);
  };

  const handleSaveDynamicProfileButtonClicked = async (e) => {
    preventDefaults(e);

    const newCreatorUIConfig = deepCloneObject(tempCreatorUIConfig);

    try {
      // NOTE: the API requires some fields, so we'll just pre-fill
      // with existing data
      const payload = {
        cover_image_url: creatorProfileData?.cover_image_url,
        profile_image_url: creatorProfileData?.profile_image_url,
        first_name: creatorProfileData?.first_name,
        last_name: creatorProfileData?.last_name,
        username: creatorProfileData?.username,
        profile: {
          sections: newCreatorUIConfig,
        },
      };

      const { status } = await apis.user.updateProfile(payload);

      if (isAPISuccess(status)) {
        setCreatorUIConfig(newCreatorUIConfig);
        setUiConfigChanged(false);
        disableEditingMode();
      }
    } catch (error) {
      showErrorModal('Failed updating Creator Profile UI', error?.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleCancelDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    if (uiConfigChanged) {
      Modal.confirm({
        mask: true,
        maskClosable: false,
        centered: true,
        width: 420,
        title: 'Unsaved changes detected',
        content: (
          <Paragraph>
            Are you sure you want to close editing mode? You have made changes that will not be saved if you close now.
          </Paragraph>
        ),
        onOk: disableEditingMode,
        okText: 'Close without saving',
        okButtonProps: {
          type: 'primary',
          danger: true,
        },
        cancelText: 'Cancel',
        cancelButtonProps: {
          type: 'default',
        },
        afterClose: resetBodyStyle,
      });
    } else {
      disableEditingMode();
    }
  };

  const handleAddComponentDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);
    setAddComponentModalVisible(true);
  };

  //#endregion End of Page Edit Button Handlers

  //#region Start of Dashboard Button Handlers

  const handleNavigateToDashboard = (e) => {
    preventDefaults(e);

    const navigateToDashboard = () => {
      disableEditingMode();
      history.push(Routes.creatorDashboard.rootPath);
    };

    if (uiConfigChanged) {
      Modal.confirm({
        mask: true,
        maskClosable: false,
        centered: true,
        width: 420,
        title: 'Unsaved changes detected',
        content: (
          <Paragraph>
            Are you sure you want to leave? You have made changes that will not be saved if you close now.
          </Paragraph>
        ),
        onOk: navigateToDashboard,
        okText: 'Close without saving',
        okButtonProps: {
          type: 'primary',
          danger: true,
        },
        cancelText: 'Cancel',
        cancelButtonProps: {
          type: 'default',
        },
        afterClose: resetBodyStyle,
      });
    } else {
      navigateToDashboard();
    }
  };

  const handleNavigateToPublicPage = (e) => {
    preventDefaults(e);

    const openPublicPage = () => {
      disableEditingMode();
      window.open(generateUrlFromUsername(creatorProfileData?.username ?? 'app'));
    };

    if (uiConfigChanged) {
      Modal.confirm({
        mask: true,
        maskClosable: false,
        centered: true,
        width: 420,
        title: 'Unsaved changes detected',
        content: (
          <Paragraph>
            Are you sure you want to leave? You have made changes that will not be saved if you close now.
          </Paragraph>
        ),
        onOk: openPublicPage,
        okText: 'Close without saving',
        okButtonProps: {
          type: 'primary',
          danger: true,
        },
        cancelText: 'Cancel',
        cancelButtonProps: {
          type: 'default',
        },
        afterClose: resetBodyStyle,
      });
    } else {
      openPublicPage();
    }
  };

  //#endregion End of Dashboard Button Handlers

  //#region Start Of Component Edit View Handlers

  const updateComponentConfig = (identifier = null, newConfig = null) => {
    if (!identifier) {
      showErrorModal('Invalid identifier passed');
      return;
    }

    if (!newConfig) {
      showErrorModal('Invalid configuration passed');
      return;
    }

    // Updates the temp config first, will be removed if user cancels
    const tempConfigComponents = deepCloneObject(tempCreatorUIConfig);
    const targetIndex = tempConfigComponents.findIndex((component) => component.key === identifier);
    const targetComponent = tempConfigComponents.find((component) => component.key === identifier);

    if (!targetComponent || targetIndex === -1) {
      showErrorModal(`Component with identifier ${identifier} not found!`);
      return;
    }

    // TODO: Adjust here when more customizability is required
    targetComponent.title = newConfig.title;
    targetComponent.values = newConfig.values ?? null;
    tempConfigComponents.splice(targetIndex, 1, targetComponent);
    setTempCreatorUIConfig(tempConfigComponents);
    setUiConfigChanged(true);
  };

  const removeComponent = (identifier = null) => {
    if (!identifier) {
      showErrorModal('Invalid identifier passed');
      return;
    }

    if (!componentsMap[identifier].optional) {
      showErrorModal('Component is not optional, cannot be removed!');
      return;
    }

    const tempConfigComponents = deepCloneObject(tempCreatorUIConfig);
    const targetIndex = tempConfigComponents.findIndex((component) => component.key === identifier);

    if (targetIndex === -1) {
      showErrorModal(`Component with identifier ${identifier} not found!`);
      return;
    }

    tempConfigComponents.splice(targetIndex, 1);
    setTempCreatorUIConfig(tempConfigComponents);
  };

  //#endregion End Of Component Edit View Handlers

  //#region Start Of Drag and Drop Handlers

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    const componentsList = deepCloneObject(tempCreatorUIConfig);
    const targetComponent = componentsList.find((component) => component.key === draggableId);

    if (targetComponent && destination && destination.index !== source.index) {
      componentsList.splice(source.index, 1);
      componentsList.splice(destination.index, 0, targetComponent);

      setUiConfigChanged(true);
      setTempCreatorUIConfig(componentsList);
    }
  };

  const renderDraggableCustomComponents = (component, idx) => {
    if (component.key === 'DONATIONS') {
      return null;
    }

    const RenderedComponent = componentsMap[component.key].component;

    return (
      <Draggable
        isDragDisabled={!editingMode || previewMode}
        draggableId={component.key}
        index={idx}
        key={component.key}
      >
        {(provided) => (
          <Col xs={24} {...provided.draggableProps} ref={provided.innerRef}>
            <RenderedComponent
              identifier={component.key}
              isEditing={editingMode && !previewMode}
              updateConfigHandler={updateComponentConfig}
              removeComponentHandler={removeComponent}
              dragHandleProps={provided.dragHandleProps}
              // TODO: Try to handle this later when more customization is needed
              title={component.title}
              values={component.values}
            />
          </Col>
        )}
      </Draggable>
    );
  };

  //#endregion End Of Drag and Drop Handlers

  return (
    <>
      {isInCreatorDashboard() && (
        <Row className={styles.mb30} align="center">
          <Col xs={24}>
            <Space size="large" className={styles.p10}>
              <Button icon={<ArrowLeftOutlined />} onClick={handleNavigateToDashboard}>
                Dashboard
              </Button>
              {editingMode ? (
                <>
                  <Button
                    type="primary"
                    className={styles.blueBtn}
                    icon={<PlusCircleOutlined />}
                    onClick={handleAddComponentDynamicProfileButtonClicked}
                  >
                    Add Component
                  </Button>
                  <Button
                    type="primary"
                    className={styles.greenBtn}
                    icon={<SaveOutlined />}
                    onClick={handleSaveDynamicProfileButtonClicked}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="primary"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={handleCancelDynamicProfileButtonClicked}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button type="primary" icon={<EditOutlined />} onClick={handleEditDynamicProfileButtonClicked}>
                    Edit
                  </Button>
                  <Button ghost type="primary" icon={<GlobalOutlined />} onClick={handleNavigateToPublicPage}>
                    Public Page
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      )}
      <div className={styles.creatorProfilePage}>
        <Spin spinning={isLoading} size="large" tip="Fetching creator details...">
          <Row gutter={8} justify="center">
            <Col xs={24}>
              <CreatorProfileComponent
                creatorProfile={creatorProfileData}
                isEditing={editingMode && !previewMode}
                refetchCreatorProfileData={() =>
                  fetchCreatorProfileData(creatorUsername ?? getLocalUserDetails()?.username ?? '')
                }
              />
            </Col>
            <Col xs={24} className={styles.mb20}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable
                  isDropDisabled={!editingMode || previewMode}
                  droppableId={creatorProfileData?.external_id || 'creator-profile-column'}
                >
                  {(provided) => (
                    <Row gutter={[8, 16]} justify="center" {...provided.droppableProps} ref={provided.innerRef}>
                      {editingMode
                        ? tempCreatorUIConfig?.map(renderDraggableCustomComponents)
                        : creatorUIConfig.map(renderDraggableCustomComponents)}
                      {provided.placeholder}
                    </Row>
                  )}
                </Droppable>
              </DragDropContext>
            </Col>
          </Row>
        </Spin>
      </div>
      {editingMode && (
        <Modal
          visible={addComponentModalVisible}
          title="Select a component to add"
          centered={true}
          footer={null}
          width={420}
          onCancel={() => setAddComponentModalVisible(false)}
          afterClose={resetBodyStyle}
        >
          <Row gutter={[8, 8]}>
            {Object.entries(componentsMap).map(([componentKey, componentOptions]) =>
              componentOptions.optional ? (
                <Col xs={24} sm={12} key={componentKey}>
                  <Button
                    block
                    type="text"
                    icon={componentOptions.icon}
                    disabled={getExistingComponentInstance(componentKey)}
                    onClick={() => addComponent(componentKey, componentOptions.defaultProps)}
                  >
                    {componentOptions.label}
                  </Button>
                </Col>
              ) : null
            )}
          </Row>
        </Modal>
      )}
    </>
  );
};

export default DynamicProfile;