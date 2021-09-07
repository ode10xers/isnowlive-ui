import React from 'react';

import { Row, Col } from 'antd';

// import VideoCard from 'components/VideoCard';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';

import styles from './styles.module.scss';

const SimpleVideoCardsList = ({ passDetails, videos }) => {
  return (
    <div className={styles.videoListContainer}>
      <Row gutter={[16, 16]} justify="start">
        {videos
          .sort((a, b) => (b.thumbnail_url?.endsWith('.gif') ? 1 : -1))
          .map((passVideo) => (
            <Col
              xs={24}
              md={12}
              lg={8}
              key={`${passDetails?.id || passDetails?.pass_id || ''}_${passVideo.external_id}`}
            >
              {/* <VideoCard video={passVideo} buyable={false} hoverable={true} showDetailsBtn={false} /> */}
              <VideoListCard video={passVideo} />
            </Col>
          ))}
      </Row>
    </div>
  );
};

export default SimpleVideoCardsList;
