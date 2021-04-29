import React from 'react';

import { Row, Col } from 'antd';

import VideoCard from 'components/VideoCard';

import { redirectToVideosPage } from 'utils/redirect';

import styles from './styles.module.scss';

const SimpleVideoCardsList = ({ passDetails, videos }) => {
  return (
    <div className={styles.videoListContainer}>
      <Row gutter={[16, 16]} justify="start">
        {videos.map((passVideo) => (
          <Col xs={24} lg={12} key={`${passDetails?.id || passDetails?.pass_id || ''}_${passVideo.external_id}`}>
            <VideoCard
              video={passVideo}
              buyable={false}
              hoverable={true}
              onCardClick={() => redirectToVideosPage(passVideo)}
              showDetailsBtn={false}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SimpleVideoCardsList;
