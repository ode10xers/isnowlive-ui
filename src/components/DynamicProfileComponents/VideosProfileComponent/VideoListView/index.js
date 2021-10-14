import React from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col } from 'antd';
import { BarsOutlined } from '@ant-design/icons';

import Routes from 'routes';

import VideoListCard from '../VideoListCard';

import { generateUrlFromUsername } from 'utils/url';
import { getLocalUserDetails } from 'utils/storage';
import { isInCreatorDashboard, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const VideoListView = ({ limit = 5, videos = [], isContained = false }) => {
  const history = useHistory();

  const renderVideoCards = (video) => (
    <Col xs={isContained ? 24 : 18} md={isContained ? 12 : 8} key={video.external_id}>
      <VideoListCard video={video} />
    </Col>
  );

  const handleMoreClicked = (e) => {
    preventDefaults(e);

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      window.open(generateUrlFromUsername(localUserDetails?.username ?? 'app') + Routes.list.videos);
    } else {
      history.push(Routes.list.videos);
    }
  };

  return (
    <div>
      {videos?.length > 0 && (
        <Row gutter={[8, 8]} className={isContained ? undefined : styles.videoListContainer}>
          {videos.slice(0, limit).map(renderVideoCards)}
          {videos?.length > limit && (
            <Col xs={isContained ? 24 : 18} md={isContained ? 12 : 8} className={styles.fadedItemContainer}>
              <div className={styles.fadedOverlay}>
                <div className={styles.seeMoreButton} onClick={handleMoreClicked}>
                  <BarsOutlined className={styles.seeMoreIcon} />
                  SEE MORE
                </div>
              </div>
              <div className={styles.fadedItem}>
                <VideoListCard video={videos[limit]} />
              </div>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default VideoListView;
