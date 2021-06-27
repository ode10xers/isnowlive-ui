import React, { useState, useEffect } from 'react';

import { Row, Col, Empty, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
// import PublicVideoList from 'components/PublicVideoList';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);

  useEffect(() => {
    const getVideosDetails = async () => {
      setIsVideosLoading(true);
      try {
        const { status, data } = await apis.videos.getVideosByUsername();

        if (isAPISuccess(status) && data) {
          setVideos(data);
          setIsVideosLoading(false);
        }
      } catch (error) {
        setIsVideosLoading(false);
        message.error('Failed to fetch videos for creator');
        console.error('Failed to load video details');
      }
    };
    getVideosDetails();
  }, []);

  const renderVideoCards = (video) => (
    <Col xs={24} sm={12} key={video.external_id}>
      <VideoListCard video={video} />
    </Col>
  );

  return (
    <div className={styles.videoPluginContainer}>
      <Loader loading={isVideosLoading} size="large" text="Loading videos">
        {/* <PublicVideoList videos={videos} /> */}
        {videos.length > 0 ? (
          <div className={styles.videoListContainer}>
            <Row gutter={[8, 16]}>{videos.map(renderVideoCards)}</Row>
          </div>
        ) : (
          <Empty className={styles.w100} description="No videos found for creator" />
        )}
      </Loader>
    </div>
  );
};

export default Videos;
