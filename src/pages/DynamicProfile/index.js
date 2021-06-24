import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { message, Spin, Row, Col, Button, Space, Modal, Typography } from 'antd';
import {
  EditOutlined,
  MenuOutlined,
  SaveOutlined,
  BookOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
  LikeOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PlayCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';
import SessionsProfileComponent from 'components/DynamicProfileComponents/SessionsProfileComponent';
import PassesProfileComponent from 'components/DynamicProfileComponents/PassesProfileComponent';
import SubscriptionProfileComponent from 'components/DynamicProfileComponents/SubscriptionsProfileComponent';
import VideoProfileComponent from 'components/DynamicProfileComponents/VideosProfileComponent';
import CoursesProfileComponent from 'components/DynamicProfileComponents/CoursesProfileComponent';
import OtherLinksProfileComponent from 'components/DynamicProfileComponents/OtherLinksProfileComponent';

import { deepCloneObject, isAPISuccess, preventDefaults } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
import CreatorProfileComponent from 'components/DynamicProfileComponents/CreatorProfileComponent';
import ProductsProfileComponent from 'components/DynamicProfileComponents/ProductsProfileComponent';

const { Paragraph } = Typography;

// TODO: Define the Profile UI Configurations Sample Data here
const sampleUIConfig = [
  {
    key: 'PRODUCTS',
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
  {
    key: 'OTHER_LINKS',
    title: 'My other links',
    values: null,
  },
  {
    key: 'SUBSCRIPTIONS',
    title: 'My Memberships',
    values: null,
  },
  {
    key: 'PASSES',
    title: 'My Passes',
    values: null,
  },
  // {
  //   key: 'SESSIONS',
  //   title: 'My Sessions',
  //   values: null,
  // },
  // {
  //   key: 'COURSES',
  //   title: 'My Courses',
  //   values: null,
  // },
  // {
  //   key: 'VIDEOS',
  //   title: 'My Videos',
  //   values: null,
  // },
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
];

const componentsMap = {
  PRODUCTS: {
    icon: <LikeOutlined />,
    component: ProductsProfileComponent,
    label: 'Products',
    optional: false,
    defaultProps: {
      title: '',
    },
  },
  SESSIONS: {
    icon: <VideoCameraOutlined />,
    label: 'Sessions',
    optional: false,
    component: SessionsProfileComponent,
    defaultProps: {
      title: 'SESSIONS',
    },
  },
  VIDEOS: {
    icon: <PlayCircleOutlined />,
    label: 'Videos',
    optional: false,
    component: VideoProfileComponent,
    defaultProps: {
      title: 'VIDEOS',
    },
  },
  COURSES: {
    icon: <BookOutlined />,
    label: 'Courses',
    optional: false,
    component: CoursesProfileComponent,
    defaultProps: {
      title: 'COURSES',
    },
  },
  PASSES: {
    icon: <LikeOutlined />,
    label: 'Passes',
    optional: false,
    component: PassesProfileComponent,
    defaultProps: {
      title: 'CREDIT PASSES',
    },
  },
  SUBSCRIPTIONS: {
    icon: <LikeOutlined />,
    label: 'Memberships',
    optional: false,
    component: SubscriptionProfileComponent,
    defaultProps: {
      title: 'MEMBERSHIPS',
    },
  },
  OTHER_LINKS: {
    icon: <LinkOutlined />,
    label: 'Other Links',
    optional: true,
    component: OtherLinksProfileComponent,
    defaultProps: {
      title: 'OTHER LINKS',
      links: [],
    },
  },
};

const DragAndDropHandle = ({ visible = false, ...props }) =>
  visible ? (
    <div className={styles.dndHandle} {...props}>
      <MenuOutlined />
    </div>
  ) : null;

const DynamicProfile = ({ creatorUsername = null }) => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);
  const [creatorProfileData, setCreatorProfileData] = useState({});
  const [editable, setEditable] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  // const [addComponentModalVisible, setAddComponentModalVisible] = useState(false);
  const [creatorUIConfig, setCreatorUIConfig] = useState(sampleUIConfig);
  const [tempCreatorUIConfig, setTempCreatorUIConfig] = useState([]);
  const [uiConfigChanged, setUiConfigChanged] = useState(false);

  const fetchCreatorProfileData = useCallback(async (username) => {
    setIsLoading(true);
    try {
      const { status, data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfileData(data);

        if (data.external_id === getLocalUserDetails()?.external_id) {
          setEditable(true);
        }
      }
    } catch (error) {
      message.error('Failed to load creator profile details');
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  //#region Start of Use Effects

  useEffect(() => {
    fetchCreatorProfileData(creatorUsername);
  }, [fetchCreatorProfileData, creatorUsername]);

  // Handle state adjustments when user logs in from the page
  useEffect(() => {
    if (creatorProfileData?.external_id === userDetails?.external_id) {
      setEditable(true);
    } else {
      setEditable(false);
    }

    setEditingMode(false);
  }, [userDetails, creatorProfileData]);

  //#endregion End of Use Effects

  //#region Start Of Page Edit Button Handlers

  // const getExistingComponentInstance = (identifier) => {
  //   const currentComponentsList = tempCreatorUIConfig.components;
  //   const duplicateComponent = currentComponentsList.find((component) => component.key === identifier);

  //   return duplicateComponent;
  // };

  // const addComponent = (identifier = null, props) => {
  //   if (!identifier) {
  //     showErrorModal('Invalid component identifier!');
  //     return;
  //   }

  //   const existingComponentInstance = getExistingComponentInstance(identifier);

  //   if (existingComponentInstance) {
  //     showErrorModal('Duplicate of this component already exists!');
  //     return;
  //   }

  //   const currentComponentsList = deepCloneObject(tempCreatorUIConfig).components || [];
  //   currentComponentsList.push({
  //     key: identifier,
  //     props: props,
  //   });

  //   setTempCreatorUIConfig({
  //     ...tempCreatorUIConfig,
  //     components: currentComponentsList,
  //   });
  //   setUiConfigChanged(false);
  //   setAddComponentModalVisible(false);
  //   showSuccessModal('Component added', `Make sure to save so you don't lose the changes`);
  // };

  const disableEditingMode = () => {
    setTempCreatorUIConfig([]);
    setEditingMode(false);
    setPreviewMode(false);
  };

  const handleTogglePreviewMode = (e) => {
    preventDefaults(e);
    setPreviewMode(!previewMode);
  };

  const handleEditDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    setTempCreatorUIConfig(deepCloneObject(creatorUIConfig));
    setEditingMode(true);
    setPreviewMode(false);
    setUiConfigChanged(false);
  };

  const handleSaveDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    // TODO: Save the data here to API
    setCreatorUIConfig(deepCloneObject(tempCreatorUIConfig));
    setUiConfigChanged(false);
    disableEditingMode();
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

  // const handleAddComponentDynamicProfileButtonClicked = (e) => {
  //   preventDefaults(e);
  //   setAddComponentModalVisible(true);
  // };

  //#endregion End of Page Edit Button Handlers

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
    console.log(newConfig);
    targetComponent.title = newConfig.title;
    targetComponent.values = newConfig.values ?? null;
    tempConfigComponents.splice(targetIndex, 1, targetComponent);
    setTempCreatorUIConfig(tempConfigComponents);
    setUiConfigChanged(true);
  };

  // const removeComponent = (identifier = null) => {
  //   if (!identifier) {
  //     showErrorModal('Invalid identifier passed');
  //     return;
  //   }

  //   const tempConfigComponents = tempCreatorUIConfig.components;
  //   const targetIndex = tempConfigComponents.findIndex((component) => component.key === identifier);

  //   if (targetIndex === -1) {
  //     showErrorModal(`Component with identifier ${identifier} not found!`);
  //     return;
  //   }

  //   tempConfigComponents.splice(targetIndex, 1);
  //   setTempCreatorUIConfig({
  //     ...tempCreatorUIConfig,
  //     components: tempConfigComponents,
  //   });
  // };

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
    const RenderedComponent = componentsMap[component.key].component;

    if (component.key === 'PRODUCTS') {
      return (
        <RenderedComponent
          identifier={component.key}
          isEditing={editingMode && !previewMode}
          updateConfigHandler={updateComponentConfig}
          title={component.title}
          values={component.values}
        />
      );
    }

    return (
      <Draggable
        isDragDisabled={!editingMode || previewMode}
        draggableId={component.key}
        index={idx}
        key={component.key}
      >
        {(provided) => (
          <Col xs={24} {...provided.draggableProps} ref={provided.innerRef}>
            <DragAndDropHandle {...provided.dragHandleProps} visible={editingMode && !previewMode} />
            <RenderedComponent
              identifier={component.key}
              isEditing={editingMode && !previewMode}
              updateConfigHandler={updateComponentConfig}
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

  // TODO: Make new Creator Profile
  return (
    <>
      <div className={styles.creatorProfilePage}>
        <Spin spinning={isLoading} size="large" tip="Fetching creator details...">
          <Row gutter={8} justify="center">
            <Col xs={24}>
              <CreatorProfileComponent creatorProfile={creatorProfileData} isEditing={editingMode && !previewMode} />
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
      {(editable || true) && (
        <div className={styles.editDynamicProfileButtonContainer}>
          {editingMode ? (
            <Row gutter={[8, 8]}>
              <Col xs={24}>
                <Space align="bottom" size="small">
                  <Button
                    className={classNames(
                      styles.dynamicProfileButtons,
                      previewMode ? styles.orangeBtn : styles.darkBlueBtn
                    )}
                    type="primary"
                    shape="round"
                    size="large"
                    icon={previewMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={handleTogglePreviewMode}
                  />
                </Space>
              </Col>
              <Col xs={24}>
                <Space align="bottom" size="small">
                  <Button
                    className={classNames(styles.dynamicProfileButtons, styles.greenBtn)}
                    type="primary"
                    shape="round"
                    size="large"
                    icon={<SaveOutlined />}
                    onClick={handleSaveDynamicProfileButtonClicked}
                  />
                  <Button
                    className={classNames(styles.dynamicProfileButtons, styles.redBtn)}
                    type="primary"
                    shape="round"
                    size="large"
                    icon={<CloseCircleOutlined />}
                    onClick={handleCancelDynamicProfileButtonClicked}
                  />
                </Space>
              </Col>
            </Row>
          ) : (
            <Button
              className={styles.dynamicProfileButtons}
              type="primary"
              shape="round"
              size="large"
              icon={<EditOutlined />}
              onClick={handleEditDynamicProfileButtonClicked}
            />
          )}
        </div>
      )}
      {/* {editingMode && (
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
                {Object.entries(componentsMap).map(([componentKey, componentOptions]) => (
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
                ))}
              </Row>
            </Modal>
          )} */}
    </>
  );
};

export default DynamicProfile;
