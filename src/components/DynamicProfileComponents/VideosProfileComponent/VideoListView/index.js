import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Spin, Button, Typography } from 'antd';

import apis from 'apis';

import DetailsDrawer from 'components/DynamicProfileComponents/DetailsDrawer';
import VideoListCard from '../VideoListCard';

import { isAPISuccess, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const { Title } = Typography;

// TODO: Make this not show on viewing mode if videos are empty
// But still show up on editing mode
const VideoListView = ({ limit = 4 }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);

  const fetchCreatorVideos = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setVideos(data.sort((a, b) => (b.thumbnail_url?.endsWith('.gif') ? 1 : -1)));
      }
    } catch (error) {
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorVideos();
  }, [fetchCreatorVideos]);

  const showMoreVideoCards = (e) => {
    preventDefaults(e);
    setDetailsDrawerVisible(true);
  };

  const handleDrawerClose = (e) => {
    preventDefaults(e);
    setDetailsDrawerVisible(false);
  };

  const renderVideoCards = (video, restrictedWidth = true) => {
    return restrictedWidth ? (
      <Col xs={24} sm={12} key={video._external_id}>
        <VideoListCard video={video} />
      </Col>
    ) : (
      <Col xs={24} sm={12} md={8} xl={6} key={video._external_id}>
        <VideoListCard video={video} />
      </Col>
    );
  };

  return (
    <div>
      <Spin spinning={isLoading} tip="Fetching videos">
        {videos?.length > 0 && (
          <Row gutter={[16, 16]}>
            {videos.slice(0, limit).map((video) => renderVideoCards(video, true))}
            {videos?.length > limit && (
              <Col xs={24}>
                <Row justify="center">
                  <Col>
                    <Button className={styles.moreButton} type="primary" size="large" onClick={showMoreVideoCards}>
                      MORE
                    </Button>
                  </Col>
                </Row>
              </Col>
            )}
          </Row>
        )}
      </Spin>
      <DetailsDrawer
        visible={detailsDrawerVisible}
        onClose={handleDrawerClose}
        title={<Title level={4}> More Videos </Title>}
      >
        <Row gutter={[16, 16]} className={styles.mb50}>
          {videos.slice(0, limit * 5).map((video) => renderVideoCards(video, false))}
        </Row>
      </DetailsDrawer>
    </div>
  );
};

export default VideoListView;
