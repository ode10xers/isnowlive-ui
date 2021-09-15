import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import VideoDetailedListView from 'pages/DetailedListView/Videos';

import { Spin, Row, Col, Button, Typography, Select, message } from 'antd';
import { BarsOutlined, LeftOutlined, ControlOutlined, UserOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import AuthModal from 'components/AuthModal';

import { generateUrlFromUsername, getUsernameFromUrl, isAPISuccess } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title } = Typography;

const otherVideosKey = 'All Videos';
const videoItemsLimit = 6;

const Videos = () => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupView, setGroupView] = useState(null);

  const [showFilter, setShowFilter] = useState(true);
  const [selectedVideoGroupFilter, setSelectedVideoGroupFilter] = useState([]);

  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchCreatorVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setVideos(data);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to fetch videos');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorVideos();

    document.body.style.background = 'var(--video-widget-background-color, transparent)';
  }, [fetchCreatorVideos]);

  const videosByGroup = useMemo(() => {
    return videos.reduce((acc, video) => {
      let newAcc = { ...acc };

      // NOTE: BE is not implemented yet, so we make a workaround
      // and group every video under the otherVideosKey
      if ((video.groups ?? []).length <= 0) {
        return {
          ...newAcc,
          [otherVideosKey]: [...(newAcc[otherVideosKey] ?? []), video],
        };
      } else {
        video.groups.forEach((group) => {
          newAcc = {
            ...newAcc,
            [group]: [...(newAcc[group] ?? []), video],
          };
        });

        return newAcc;
      }
    }, {});
  }, [videos]);

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const redirectToAttendeeDashboard = () => {
    const baseUrl = generateUrlFromUsername(getUsernameFromUrl()) || 'app';
    window.open(`${baseUrl}${Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage}`, '_self');
  };

  const handleFilterToggleClicked = () => {
    setShowFilter((prevValue) => !prevValue);
  };

  const handleMoreClicked = (videoGroupName) => {
    setGroupView(videoGroupName);
  };

  const handleSignInClicked = () => {
    if (userDetails) {
      redirectToAttendeeDashboard();
    } else {
      setShowAuthModal(true);
    }
  };

  const groupFilters = (
    <Row gutter={[8, 12]} className={styles.filterSection}>
      <Col xs={12}>
        <Button
          className={styles.filterButton}
          type="primary"
          icon={<ControlOutlined />}
          onClick={handleFilterToggleClicked}
        >
          {showFilter ? 'Hide' : 'Show'} Filters
        </Button>
      </Col>
      <Col xs={12} className={styles.textAlignRight}>
        <Button className={styles.signupButton} type="primary" icon={<UserOutlined />} onClick={handleSignInClicked}>
          Sign In/Up
        </Button>
      </Col>
      {showFilter && (
        <Col xs={24} className={styles.filterContainer}>
          <Row gutter={[12, 4]}>
            <Col xs={24}>
              <Title level={5} className={styles.filterLabel}>
                Categories
              </Title>
              <Select
                allowClear
                showArrow
                mode="multiple"
                placeholder="Select category that you want to see"
                maxTagCount={3}
                loading={isLoading}
                className={styles.filterDropdown}
                options={Object.keys(videosByGroup).map((group) => ({ label: group, value: group }))}
                value={selectedVideoGroupFilter}
                onChange={setSelectedVideoGroupFilter}
              />
            </Col>
          </Row>
        </Col>
      )}
    </Row>
  );

  const groupedVideoList = (
    <>
      {Object.entries(videosByGroup)
        .filter(
          ([groupName, groupVideos]) =>
            selectedVideoGroupFilter.length === 0 || selectedVideoGroupFilter.includes(groupName)
        )
        .map(([groupName, groupVideos]) => (
          <div key={groupName}>
            <Row gutter={[8, 8]}>
              <Col xs={24}>
                <Row gutter={[4, 4]} align="middle">
                  <Col flex="1 1 auto">
                    <Title level={4} className={styles.videoGroupName}>
                      {groupName}
                    </Title>
                  </Col>
                  <Col flex="0 0 90px">
                    <Button className={styles.linkButton} type="link" onClick={() => handleMoreClicked(groupName)}>
                      See all ({groupVideos.length ?? 0})
                    </Button>
                  </Col>
                </Row>
              </Col>
              <Col xs={24}>
                <Row gutter={[8, 8]} className={styles.horizontalVideoList}>
                  {groupVideos?.slice(0, videoItemsLimit).map((video) => (
                    <Col xs={20} sm={18} md={9} lg={7} xl={5}>
                      <VideoListCard video={video} />
                    </Col>
                  ))}
                  {groupVideos?.length > videoItemsLimit && (
                    <Col xs={20} sm={18} md={9} lg={7} xl={5} className={styles.fadedItemContainer}>
                      <div className={styles.fadedOverlay}>
                        <div className={styles.seeMoreButton} onClick={() => handleMoreClicked(groupName)}>
                          <BarsOutlined className={styles.seeMoreIcon} />
                          SEE MORE
                        </div>
                      </div>
                      <div className={styles.fadedItem}>
                        <VideoListCard video={groupVideos[videoItemsLimit]} />
                      </div>
                    </Col>
                  )}
                </Row>
              </Col>
            </Row>
          </div>
        ))}
    </>
  );

  const moreVideoList = (
    <Row gutter={[8, 16]}>
      <Col xs={24}>
        <Button
          className={styles.backButton}
          ghost
          type="primary"
          onClick={() => setGroupView(null)}
          icon={<LeftOutlined />}
        >
          Back to video library
        </Button>
      </Col>
      <Col xs={24}>
        <Title level={4} className={styles.videoGroupName}>
          {groupView}
        </Title>
      </Col>
      <Col xs={24}>
        <Row gutter={[8, 8]}>
          {videosByGroup[groupView]?.map((video) => (
            <Col xs={24} sm={12} md={8} lg={6}>
              <VideoListCard video={video} />
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  );

  return (
    <div className={styles.videoPluginContainer}>
      <div className={styles.videoListContainer}>
        <AuthModal
          visible={showAuthModal}
          closeModal={closeAuthModal}
          onLoggedInCallback={redirectToAttendeeDashboard}
        />
        <Spin spinning={isLoading} tip="Fetching videos..">
          {/* Filters */}
          {!groupView && groupFilters}

          {/* List Groups */}
          {!groupView && videos.length > 0 && groupedVideoList}

          {/* See More */}
          {groupView && videosByGroup[groupView].length > 0 && moreVideoList}
        </Spin>
      </div>
    </div>
  );
};

export default Videos;
