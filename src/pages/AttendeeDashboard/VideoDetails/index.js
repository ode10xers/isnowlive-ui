import React, { useCallback, useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Row, Col, Typography, Image, message, Button } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import apis from 'apis';
import Routes from 'routes';

import CreatorProfile from 'components/CreatorProfile';
import Loader from 'components/Loader';
import VideoCard from 'components/VideoCard';
import VideoPlayer from 'components/VideoPlayer';
import SessionCards from 'components/SessionCards';
import DefaultImage from 'components/Icons/DefaultImage';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess, reservedDomainName } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const VideoDetails = ({ match }) => {
  const { t: translate } = useTranslation();
  const location = useLocation();
  const history = useHistory();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [video, setVideo] = useState([]);
  const [videoToken, setVideoToken] = useState(null);
  const [startVideo, setStartVideo] = useState(false);

  const videoOrderDetails = location.state ? location.state.video_order : null;

  const getProfileDetails = useCallback(async (username) => {
    try {
      setIsLoading(true);
      const { status, data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (isAPISuccess(status) && data) {
        setProfile(data);
        setProfileImage(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error(translate('FAIL_TO_LOAD_PROFILE'));
      setIsLoading(false);
    }
  }, []);

  const getVideoDetails = useCallback(
    async (videoId) => {
      try {
        setIsLoading(true);
        const { status, data } = await apis.videos.getVideoById(videoId);

        if (isAPISuccess(status) && data) {
          setVideo(data);
          if (data.creator_username && !reservedDomainName.includes(data.creator_username)) {
            getProfileDetails(data.creator_username);
          }
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        if (error?.response?.status !== 404) {
          message.error(translate('FAIL_TO_LOAD_VIDEO_DETAILS'));
        } else {
          if (videoOrderDetails) {
            getProfileDetails(videoOrderDetails?.creator_username);
          }
        }
      }
    },
    [getProfileDetails, videoOrderDetails]
  );

  const getVideoToken = async (videoOrderId) => {
    try {
      setIsLoading(true);
      const { data, status } = await apis.videos.getAttendeeVideoToken(videoOrderId);

      if (isAPISuccess(status) && data) {
        setVideoToken(data.token);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      showErrorModal(translate('FAIL_TO_LOAD_VIDEO_TOKEN_TEXT'));
    }
  };

  useEffect(() => {
    if (match.params.video_id) {
      getVideoDetails(match.params.video_id);
    } else {
      setIsLoading(false);
      message.error(translate('FAIL_TO_LOAD_VIDEO_DETAILS_NOT_FOUND'));
    }

    //eslint-disable-next-line
  }, [match.params.video_id]);

  const playVideo = () => {
    setStartVideo(true);
    if (match.params.video_order_id) {
      getVideoToken(match.params.video_order_id);
    } else {
      message.error(translate('FAIL_TO_LOAD_VIDEO_TOKEN_NOT_FOUND'));
    }
  };

  return (
    <Loader loading={isLoading} size="large" text={translate('LOADING_VIDEO_DETAILS')}>
      <Row justify="start" className={styles.mb50}>
        <Col xs={24} md={4}>
          <Button
            className={styles.headButton}
            onClick={() => history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos)}
            icon={<ArrowLeftOutlined />}
          >
            {translate('BACK_TO_VIDEO_LIST')}
          </Button>
        </Col>
      </Row>
      <Row gutter={[8, 24]} className={classNames(styles.p50, styles.box)}>
        <Col xs={24} className={styles.showcaseCardContainer}>
          <VideoCard
            cover={
              startVideo && videoToken && !videoOrderDetails.isExpired ? (
                <VideoPlayer token={videoToken} />
              ) : videoOrderDetails.isExpired ? (
                <div className={classNames(styles.videoWrapper, styles.expired)}>
                  <Image
                    preview={false}
                    className={styles.videoThumbnail}
                    src={video?.thumbnail_url || videoOrderDetails?.thumbnail_url || translate('ERROR')}
                    alt={video?.title || videoOrderDetails?.title}
                    fallback={DefaultImage()}
                  />
                </div>
              ) : (
                <div className={styles.videoWrapper} onClick={() => playVideo()}>
                  <PlayCircleOutlined className={styles.playIcon} />
                  <div className={styles.imageOverlay}>
                    <Image
                      preview={false}
                      className={styles.videoThumbnail}
                      src={video?.thumbnail_url || videoOrderDetails?.thumbnail_url || translate('ERROR')}
                      alt={video?.title || videoOrderDetails?.title}
                      fallback={DefaultImage()}
                    />
                  </div>
                </div>
              )
            }
            video={video}
            buyable={false}
            hoverable={false}
            showOrderDetails={true}
            orderDetails={videoOrderDetails}
            showDesc={true}
          />
        </Col>
        <Col xs={24} className={styles.mt50}>
          {profile && <CreatorProfile profile={profile} profileImage={profileImage} />}
        </Col>
        <Col xs={24}>
          {video && (
            <Row className={styles.sessionListWrapper}>
              {video?.sessions?.length > 0 && (
                <Col xs={24}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24}>
                      <Text className={styles.ml20}> Related to these class(es) </Text>
                    </Col>
                    <Col xs={24}>
                      <SessionCards
                        sessions={video?.sessions}
                        shouldFetchInventories={true}
                        username={video?.username || videoOrderDetails?.creator_username}
                      />
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          )}
        </Col>
      </Row>
    </Loader>
  );
};

export default VideoDetails;
