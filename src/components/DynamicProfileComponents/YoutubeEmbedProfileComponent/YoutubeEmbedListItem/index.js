import React, { useCallback, useEffect, useState } from 'react';

import { Image, Row, Col, Typography, Spin, Skeleton } from 'antd';

import { getYoutubeVideoDetails } from 'utils/video';

import styles from './style.module.scss';

const { Text } = Typography;

const YoutubeEmbedListItem = ({ url }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [videoDetails, setVideoDetails] = useState(null);

  const fetchYoutubeVideoDetails = useCallback(async (videoUrl) => {
    setIsLoading(true);

    try {
      const videoData = await getYoutubeVideoDetails(videoUrl);
      setVideoDetails(videoData);
    } catch (error) {
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (url) {
      fetchYoutubeVideoDetails(url);
    }
  }, [fetchYoutubeVideoDetails, url]);

  return (
    <Spin spinning={isLoading}>
      <div className={styles.youtubeVideoItem}>
        {isLoading ? (
          <Row gutter={[8, 8]}>
            <Col xs={24} className={styles.textAlignCenter}>
              <Skeleton.Image className={styles.placeholderImage} />
            </Col>
            <Col xs={24}>
              <Skeleton active={true} paragraph={{ rows: 1, width: '100%' }} />
            </Col>
          </Row>
        ) : videoDetails ? (
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <div className={styles.thumbnailContainer}>
                <Image
                  loading="lazy"
                  preview={false}
                  className={styles.thumbnailImage}
                  width="100%"
                  src={videoDetails.thumbnail_url}
                />
              </div>
            </Col>
            <Col xs={24} className={styles.textAlignCenter}>
              <Text className={styles.videoTitle}>{videoDetails.title}</Text>
            </Col>
          </Row>
        ) : null}
      </div>
    </Spin>
  );
};

export default YoutubeEmbedListItem;
