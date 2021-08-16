import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import VideoListView from './VideoListView';
import VideoEditView from './VideoEditView';
import DragAndDropHandle from '../DragAndDropHandle';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const VideosProfileComponent = ({
  identifier = null,
  isEditing = false,
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
      console.error('Failed fetching videos for creator');
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorVideos();
  }, [fetchCreatorVideos]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return videos.length > 0 || isEditing ? (
    <Row className={styles.p10} align="middle" justify="center" id="sessions">
      {isEditing && (
        <Col xs={1}>
          {' '}
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        {isEditing ? (
          <Row gutter={[8, 8]} justify="center" align="center">
            <Col className={styles.textAlignCenter}>
              <Space align="center" className={styles.textAlignCenter}>
                <Text> The Vidoes you have created will show up here </Text>
                <Button
                  type="primary"
                  onClick={() =>
                    window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos, '_blank')
                  }
                >
                  Manage my Vidoes
                </Button>
              </Space>
            </Col>
          </Row>
        ) : (
          <Spin spinning={isLoading} tip="Fetching Vidoes">
            <VideoListView videos={videos} />
          </Spin>
        )}
      </Col>
      {isEditing && (
        <Col xs={1}>
          {' '}
          <VideoEditView configValues={customComponentProps} updateHandler={saveEditChanges} />{' '}
        </Col>
      )}
    </Row>
  ) : null;
};

export default VideosProfileComponent;
