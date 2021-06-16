import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { message, Spin, Row, Col, Affix, Button, Space, Modal, Typography } from 'antd';
import {
  EditOutlined,
  MenuOutlined,
  SaveOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
  LikeOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import CreatorProfile from 'components/CreatorProfile';
import SessionsProfileComponent from 'components/DynamicProfileComponents/SessionsProfileComponent';
import PassesProfileComponent from 'components/DynamicProfileComponents/PassesProfileComponent';

import { deepCloneObject, isAPISuccess, preventDefaults } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

const { Paragraph } = Typography;

// TODO: Define the Profile UI Configurations Sample Data here
const sampleUIConfig = {
  components: [
    {
      key: 'SESSIONS',
      props: {
        title: 'My Live Sessions',
      },
    },
    // {
    //   key: 'PASSES',
    //   props: {
    //     title: 'Credit Passes',
    //   },
    // },
  ],
};

const componentsMap = {
  SESSIONS: {
    icon: <VideoCameraOutlined />,
    label: 'Sessions',
    component: SessionsProfileComponent,
    defaultProps: {
      title: 'SESSIONS',
    },
  },
  PASSES: {
    icon: <LikeOutlined />,
    label: 'Passes',
    component: PassesProfileComponent,
    defaultProps: {
      title: 'CREDIT PASSES',
    },
  },
};

const DragAndDropHandle = ({ isEditing = false, ...props }) =>
  isEditing ? (
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
  const [addComponentModalVisible, setAddComponentModalVisible] = useState(false);
  const [creatorUIConfig, setCreatorUIConfig] = useState(sampleUIConfig);
  const [tempCreatorUIConfig, setTempCreatorUIConfig] = useState(null);
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

  const getExistingComponentInstance = (identifier) => {
    const currentComponentsList = tempCreatorUIConfig.components;
    const duplicateComponent = currentComponentsList.find((component) => component.key === identifier);

    return duplicateComponent;
  };

  const addComponent = (identifier = null, props) => {
    if (!identifier) {
      showErrorModal('Invalid component identifier!');
      return;
    }

    // TODO: Confirm whether we want uniqueness or not here
    // Currently all of them will be unique (no duplicate allowed)
    const existingComponentInstance = getExistingComponentInstance(identifier);

    if (existingComponentInstance) {
      showErrorModal('Duplicate of this component already exists!');
      return;
    }

    const currentComponentsList = deepCloneObject(tempCreatorUIConfig).components || [];
    currentComponentsList.push({
      key: identifier,
      props: props,
    });

    setTempCreatorUIConfig({
      ...tempCreatorUIConfig,
      components: currentComponentsList,
    });
    setUiConfigChanged(false);
    setAddComponentModalVisible(false);
    showSuccessModal('Component added', `Make sure to save so you don't lose the changes`);
  };

  const disableEditingMode = () => {
    setTempCreatorUIConfig(null);
    setEditingMode(false);
    setAddComponentModalVisible(false);
  };

  const handleEditDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    setTempCreatorUIConfig(deepCloneObject(creatorUIConfig));
    setEditingMode(true);
    setUiConfigChanged(false);
    setAddComponentModalVisible(false);
  };

  const handleSaveDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    // TODO: Save the data here to API
    console.log(tempCreatorUIConfig);
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

  const handleAddComponentDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);
    setAddComponentModalVisible(true);
  };

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
    const tempConfigComponents = tempCreatorUIConfig.components;
    const targetIndex = tempConfigComponents.findIndex((component) => component.key === identifier);
    const targetComponent = tempConfigComponents.find((component) => component.key === identifier);

    if (!targetComponent || targetIndex === -1) {
      showErrorModal(`Component with identifier ${identifier} not found!`);
      return;
    }

    targetComponent.props = newConfig;
    tempConfigComponents.splice(targetIndex, 1, targetComponent);
    setTempCreatorUIConfig({
      ...tempCreatorUIConfig,
      components: tempConfigComponents,
    });
    setUiConfigChanged(true);
  };

  const removeComponent = (identifier = null) => {
    if (!identifier) {
      showErrorModal('Invalid identifier passed');
      return;
    }

    const tempConfigComponents = tempCreatorUIConfig.components;
    const targetIndex = tempConfigComponents.findIndex((component) => component.key === identifier);

    if (targetIndex === -1) {
      showErrorModal(`Component with identifier ${identifier} not found!`);
      return;
    }

    tempConfigComponents.splice(targetIndex, 1);
    setTempCreatorUIConfig({
      ...tempCreatorUIConfig,
      components: tempConfigComponents,
    });
  };

  //#endregion End Of Component Edit View Handlers

  //#region Start Of Drag and Drop Handlers

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    const componentsList = tempCreatorUIConfig.components;
    const targetComponent = componentsList.find((component) => component.key === draggableId);

    if (targetComponent && destination && destination.index !== source.index) {
      componentsList.splice(source.index, 1);
      componentsList.splice(destination.index, 0, targetComponent);

      setUiConfigChanged(true);
      setTempCreatorUIConfig({
        ...tempCreatorUIConfig,
        components: componentsList,
      });
    }
  };

  const renderDraggableCustomComponents = (component, idx) => {
    const RenderedComponent = componentsMap[component.key].component;

    return (
      <Draggable isDragDisabled={!editingMode} draggableId={component.key} index={idx} key={component.key}>
        {(provided) => (
          <Col xs={24} {...provided.draggableProps} ref={provided.innerRef}>
            <DragAndDropHandle {...provided.dragHandleProps} isEditing={editingMode} />
            <RenderedComponent
              identifier={component.key}
              isEditing={editingMode}
              updateConfigHandler={updateComponentConfig}
              removeComponentHandler={removeComponent}
              {...component.props}
            />
          </Col>
        )}
      </Draggable>
    );
  };

  //#endregion End Of Drag and Drop Handlers

  // TODO: Currently using old CreatorProfile, decide if we want to make a new one
  return (
    <>
      <Spin spinning={isLoading} size="large" tip="Fetching creator details...">
        <Row gutter={8} justify="center">
          <Col xs={24}>
            <CreatorProfile
              profile={creatorProfileData}
              profileImage={creatorProfileData?.profile_image_url}
              showCoverImage={true}
              coverImage={creatorProfileData?.cover_image_url}
            />
          </Col>
          <Col xs={24} className={styles.mb20}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable
                isDropDisabled={!editingMode}
                droppableId={creatorProfileData?.external_id || 'creator-profile-column'}
              >
                {(provided) => (
                  <Row gutter={[8, 16]} justify="center" {...provided.droppableProps} ref={provided.innerRef}>
                    {editingMode
                      ? tempCreatorUIConfig?.components.map(renderDraggableCustomComponents)
                      : creatorUIConfig.components.map(renderDraggableCustomComponents)}
                    {provided.placeholder}
                  </Row>
                )}
              </Droppable>
            </DragDropContext>
          </Col>
        </Row>
      </Spin>
      {editable && (
        <Affix offsetBottom={20} className={styles.editDynamicProfileButtonContainer}>
          {editingMode ? (
            <Row gutter={[8, 8]}>
              <Col xs={24}>
                <Space align="bottom" size="small">
                  <Button
                    className={classNames(styles.dynamicProfileButtons, styles.addBtn)}
                    type="primary"
                    shape="round"
                    size="large"
                    icon={<PlusCircleOutlined />}
                    onClick={handleAddComponentDynamicProfileButtonClicked}
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
        </Affix>
      )}
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
      )}
    </>
  );
};

export default DynamicProfile;
