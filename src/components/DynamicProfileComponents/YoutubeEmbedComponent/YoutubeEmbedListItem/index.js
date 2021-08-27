import React, { useCallback, useEffect, useState } from 'react';

import { Image, Row, Col, Typography, Spin } from 'antd';

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
      {isLoading ? (
        <div></div>
      ) : videoDetails ? (
        <div className={styles.youtubeVideoItem}>
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <div className={styles.thumbnailContainer}>
                <Image
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
        </div>
      ) : null}
    </Spin>
  );
};

export default YoutubeEmbedListItem;
