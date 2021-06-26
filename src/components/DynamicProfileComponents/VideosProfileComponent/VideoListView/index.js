import React from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button } from 'antd';

import VideoListCard from '../VideoListCard';

import styles from './style.module.scss';
import Routes from 'routes';

const VideoListView = ({ limit = 2, videos = [] }) => {
  const history = useHistory();

  const renderVideoCards = (video, restrictedWidth = true) => {
    return restrictedWidth ? (
      <Col xs={24} sm={12} key={video.external_id}>
        <VideoListCard video={video} />
      </Col>
    ) : (
      <Col xs={24} sm={12} md={8} xl={6} key={video.external_id}>
        <VideoListCard video={video} />
      </Col>
    );
  };

  return (
    <div>
      {videos?.length > 0 && (
        <Row gutter={[16, 16]}>
          {videos.slice(0, limit).map((video) => renderVideoCards(video, true))}
          {videos?.length > limit && (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button className={styles.moreButton} type="primary" onClick={() => history.push(Routes.list.videos)}>
                    MORE
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default VideoListView;
