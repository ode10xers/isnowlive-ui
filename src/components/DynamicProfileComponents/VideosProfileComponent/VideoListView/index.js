import React from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col } from 'antd';
import { BarsOutlined } from '@ant-design/icons';

import Routes from 'routes';

import VideoListCard from '../VideoListCard';

import { getLocalUserDetails } from 'utils/storage';
import { generateUrlFromUsername, isInCreatorDashboard, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const VideoListView = ({ limit = 5, videos = [] }) => {
  const history = useHistory();

  const renderVideoCards = (video) => (
    <Col xs={18} md={8} key={video.external_id}>
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
        <Row gutter={[16, 8]} className={styles.videoListContainer}>
          {videos.slice(0, limit).map(renderVideoCards)}
          {videos?.length > limit && (
            <Col xs={18} md={8} className={styles.fadedItemContainer}>
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
