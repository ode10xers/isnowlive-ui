import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Spin, Empty, Button, Affix, Space, Typography, message } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

import apis from 'apis';

import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

// TODO: Consider adding virtualized scroll later
// See react-infinite-load or react-virtualized
const VideoDetailedListView = ({ history }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState([]);

  const fetchCreatorVideos = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setVideos(data.sort((a, b) => (b.thumbnail_url?.endsWith('.gif') ? 1 : -1)));
      }
    } catch (error) {
      message.error('Failed to fetch videos for creator');
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorVideos();
  }, [fetchCreatorVideos]);

  const renderVideoCards = (video) => (
    <Col xs={24} sm={12} key={video.external_id}>
      <VideoListCard video={video} />
    </Col>
  );

  const handleBackClicked = () => history.goBack();

  return (
    <div className={styles.p10}>
      <Spin size="large" spinning={isLoading} tip="Fetching creator videos...">
        {videos.length > 0 ? (
          <>
            <Affix offsetTop={80}>
              <Space className={styles.stickyHeader}>
                <Button icon={<LeftOutlined />} onClick={handleBackClicked} />
                <Text> Can put filters here </Text>
              </Space>
            </Affix>
            <Row className={styles.mt30} gutter={[8, 16]} justify="center">
              {videos.map(renderVideoCards)}
            </Row>
          </>
        ) : (
          <Empty className={styles.w100} description="No videos found for creator" />
        )}
      </Spin>
    </div>
  );
};

export default VideoDetailedListView;
