import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Empty, Spin, message } from 'antd';

import apis from 'apis';
import layouts from '../layouts';

import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const VideoList = ({ layout = layouts.GRID, padding = 8 }) => {
  const isGrid = layout === layouts.GRID;

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
    fetchCreatorVideos();
  }, [fetchCreatorVideos]);

  const renderVideoListItems = (video) => (
    <Col xs={isGrid ? 24 : 18} md={isGrid ? 12 : 9} lg={isGrid ? 8 : 5} key={video.external_id}>
      <VideoListCard video={video} />
    </Col>
  );

  return (
    <div
      style={{
        padding: typeof padding === 'string' ? parseInt(padding) : padding,
      }}
    >
      <Spin spinning={isLoading} tip="Fetching videos data...">
        {videos.length > 0 ? (
          <Row gutter={[8, 8]} className={isGrid ? undefined : styles.horizontalScrollableListContainer}>
            {videos.map(renderVideoListItems)}
          </Row>
        ) : (
          <Empty description="No videos found" />
        )}
      </Spin>
    </div>
  );
};

export default VideoList;
