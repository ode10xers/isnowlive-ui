import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dummy from 'data/dummy';

import VideoListView from './VideoListView';
import VideoEditView from './VideoEditView';
import DragAndDropHandle from '../DragAndDropHandle';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const VideosProfileComponent = ({
  identifier = null,
  isEditing = false,
  isContained = false,
  isLiveData = true,
  dummyTemplateType = 'YOGA',
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreatorVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setVideos(data.sort((a, b) => (b.thumbnail_url?.endsWith('.gif') ? 1 : -1)));
      }
    } catch (error) {
      console.error(error);
      message.error('Failed fetching videos for creator');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLiveData) {
      setVideos(dummy[dummyTemplateType].VIDEOS ?? []);
      setTimeout(() => setIsLoading(false), 800);
    } else {
      fetchCreatorVideos();
    }
  }, [fetchCreatorVideos, dummyTemplateType, isLiveData]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  const dragAndDropHandleComponent = <DragAndDropHandle {...dragHandleProps} />;

  const editingViewComponent = <VideoEditView configValues={customComponentProps} updateHandler={saveEditChanges} />;

  const componentChildren = isEditing ? (
    <Row gutter={[8, 8]} justify="center" align="center">
      <Col className={styles.textAlignCenter}>
        <Space align="center" className={styles.textAlignCenter}>
          <Text> The videos you have created will show up here </Text>
          <Button
            type="primary"
            onClick={() => window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos, '_blank')}
          >
            Manage my videos
          </Button>
        </Space>
      </Col>
    </Row>
  ) : (
    <Spin spinning={isLoading} tip="Fetching Videos">
      <VideoListView videos={videos} isContained={false} />
    </Spin>
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'VIDEOS',
    icon: <PlayCircleOutlined className={styles.mr10} />,
  };

  return !isContained && (videos.length > 0 || isEditing) ? (
    <Row className={styles.p10} align="middle" justify="center">
      <Col xs={24}>
        <DynamicProfileComponentContainer
          {...commonContainerProps}
          isEditing={isEditing}
          dragDropHandle={dragAndDropHandleComponent}
          editView={editingViewComponent}
        >
          {componentChildren}
        </DynamicProfileComponentContainer>
      </Col>
    </Row>
  ) : null;
};

export default VideosProfileComponent;
