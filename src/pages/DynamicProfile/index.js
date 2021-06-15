import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { message, Spin, Row, Col, Affix, Button, Space } from 'antd';
import { EditOutlined, MenuOutlined, SaveOutlined, CloseCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import CreatorProfile from 'components/CreatorProfile';
import SessionsProfileComponent from 'components/DynamicProfileComponents/SessionsProfileComponent';
import PassesProfileComponent from 'components/DynamicProfileComponents/PassesProfileComponent';

import { deepCloneObject, isAPISuccess, preventDefaults } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

// TODO: Define the Profile UI Configurations Sample Data here
const sampleUIConfig = {
  components: [
    {
      key: 'SESSIONS',
      props: {
        title: 'My Live Sessions',
      },
    },
    {
      key: 'PASSES',
      props: {
        title: 'Credit Passes',
      },
    },
  ],
};

const componentsMap = {
  PASSES: PassesProfileComponent,
  SESSIONS: SessionsProfileComponent,
};

// TODO: Style this
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
  const [creatorUIConfig, setCreatorUIConfig] = useState(sampleUIConfig);
  const [tempCreatorUIConfig, setTempCreatorUIConfig] = useState(null);

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

  const handleEditDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    setTempCreatorUIConfig(deepCloneObject(creatorUIConfig));
    setEditingMode(true);
  };

  const handleSaveDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    // TODO: Save the data here to API
    console.log(tempCreatorUIConfig);
    setCreatorUIConfig(deepCloneObject(tempCreatorUIConfig));
    setTempCreatorUIConfig(null);

    setEditingMode(false);
  };

  const handleCancelDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    setTempCreatorUIConfig(null);
    setEditingMode(false);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    const componentsList = tempCreatorUIConfig.components;
    const targetComponent = componentsList.find((component) => component.key === draggableId);

    if (targetComponent && destination) {
      componentsList.splice(source.index, 1);
      componentsList.splice(destination.index, 0, targetComponent);

      setTempCreatorUIConfig({
        ...tempCreatorUIConfig,
        components: componentsList,
      });
    }
  };

  const renderDraggableCustomComponents = (component, idx) => {
    const RenderedComponent = componentsMap[component.key];

    return (
      <Draggable isDragDisabled={!editingMode} draggableId={component.key} index={idx} key={component.key}>
        {(provided) => (
          <Col xs={24} {...provided.draggableProps} ref={provided.innerRef}>
            <DragAndDropHandle {...provided.dragHandleProps} isEditing={editingMode} />
            <RenderedComponent isEditing={editingMode} {...component.props} />
          </Col>
        )}
      </Draggable>
    );
  };

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
      <Affix offsetBottom={20} className={styles.editDynamicProfileButtonContainer}>
        {editingMode ? (
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
    </>
  );
};

export default DynamicProfile;
