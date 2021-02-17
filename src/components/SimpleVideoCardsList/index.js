import React from 'react';

import { Row, Col } from 'antd';

import VideoCard from 'components/VideoCard';

import { generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const SimpleVideoCardsList = ({ username, passDetails, videos }) => {
  const redirectToVideoDetails = (video) => {
    if (video?.external_id) {
      const baseUrl = generateUrlFromUsername(username || video?.username || 'app');
      window.open(`${baseUrl}/v/${video?.external_id}`);
    }
  };

  return (
    <div className={styles.videoListContainer}>
      <Row gutter={[16, 16]} justify="start">
        {videos.map((passVideo) => (
          <Col xs={24} md={12} key={`${passDetails?.id || passDetails?.pass_id || ''}_${passVideo.external_id}`}>
            <VideoCard
              video={passVideo}
              buyable={false}
              hoverable={true}
              onCardClick={() => redirectToVideoDetails(passVideo)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SimpleVideoCardsList;
