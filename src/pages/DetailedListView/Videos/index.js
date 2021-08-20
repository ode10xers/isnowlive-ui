import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Spin, Empty, Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';

import { isAPISuccess, reservedDomainName, getUsernameFromUrl } from 'utils/helper';
import { generateColorPalletteForProfile } from 'utils/colors';

import styles from './style.module.scss';

// TODO: Consider adding virtualized scroll later
// See react-infinite-load or react-virtualized
const VideoDetailedListView = ({ history }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [creatorProfile, setCreatorProfile] = useState(null);

  const fetchCreatorVideos = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setVideos(data.sort((a, b) => (b.thumbnail_url?.endsWith('.gif') ? 1 : -1)));
      }
    } catch (error) {
      message.error('Failed to fetch videos for creator');
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorProfileDetails = useCallback(async (creatorUsername) => {
    try {
      const { status, data } = creatorUsername
        ? await apis.user.getProfileByUsername(creatorUsername)
        : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
      }
    } catch (error) {
      message.error('Failed to fetch creator profile details');
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const domainUsername = getUsernameFromUrl();

    if (domainUsername && !reservedDomainName.includes(domainUsername)) {
      fetchCreatorProfileDetails(domainUsername);
    }

    fetchCreatorVideos();
  }, [fetchCreatorVideos, fetchCreatorProfileDetails]);

  useEffect(() => {
    let profileColorObject = null;
    if (creatorProfile && creatorProfile?.profile?.color) {
      profileColorObject = generateColorPalletteForProfile(
        creatorProfile?.profile?.color,
        creatorProfile?.profile?.new_profile
      );

      Object.entries(profileColorObject).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    }

    return () => {
      if (profileColorObject) {
        Object.keys(profileColorObject).forEach((key) => {
          document.documentElement.style.removeProperty(key);
        });
      }
    };
  }, [creatorProfile]);

  const renderVideoCards = (video) => (
    <Col xs={24} sm={12} md={8} key={video.external_id}>
      <VideoListCard video={video} />
    </Col>
  );

  const handleBackClicked = () => history.push(Routes.videos);

  return (
    <div className={styles.p10}>
      <Spin size="large" spinning={isLoading} tip="Fetching creator videos...">
        {videos.length > 0 ? (
          <>
            <Button
              ghost
              size="large"
              type="primary"
              className={styles.backButton}
              icon={<ArrowLeftOutlined />}
              onClick={handleBackClicked}
            >
              Back
            </Button>
            <Row className={styles.mt30} gutter={[8, 16]}>
              {videos.map(renderVideoCards)}
            </Row>
          </>
        ) : (
          <Empty className={styles.w100} description="No videos found for creator">
            <Button
              className={styles.backButton}
              ghost
              size="large"
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push(Routes.root)}
            >
              Back to home
            </Button>
          </Empty>
        )}
      </Spin>
    </div>
  );
};

export default VideoDetailedListView;
