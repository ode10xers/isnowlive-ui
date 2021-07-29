import React from 'react';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button } from 'antd';

import Routes from 'routes';

import VideoListCard from '../VideoListCard';

import { getLocalUserDetails } from 'utils/storage';
import {
  generateUrlFromUsername,
  isInCreatorDashboard,
  preventDefaults,
  isBrightColorShade,
  convertHexToRGB,
} from 'utils/helper';

import styles from './style.module.scss';

const VideoListView = ({ limit = 2, videos = [], profileColor }) => {
  const history = useHistory();

  const renderVideoCards = (video) => (
    <Col xs={24} sm={12} key={video.external_id}>
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
        <Row gutter={[16, 16]}>
          {videos.slice(0, limit).map(renderVideoCards)}
          {videos?.length > limit && (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button
                    className={classNames(
                      styles.moreButton,
                      profileColor
                        ? isBrightColorShade(convertHexToRGB(profileColor))
                          ? styles.lightBg
                          : undefined
                        : undefined
                    )}
                    type="primary"
                    onClick={handleMoreClicked}
                  >
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
