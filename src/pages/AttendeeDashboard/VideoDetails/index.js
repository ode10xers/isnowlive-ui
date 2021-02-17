import React, { useCallback, useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Row, Col, Typography, Space, Image, message, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  PlayCircleOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import Routes from 'routes';

import Share from 'components/Share';
import Loader from 'components/Loader';
import VideoCard from 'components/VideoCard';
import VideoPlayer from 'components/VideoPlayer';
import SessionCards from 'components/SessionCards';
import DefaultImage from 'components/Icons/DefaultImage';
import { showErrorModal } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername, isAPISuccess, reservedDomainName } from 'utils/helper';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const VideoDetails = ({ match }) => {
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
      message.error('Failed to load profile details');
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
        message.error('Failed to load video details');
      }
    },
    [getProfileDetails]
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
      showErrorModal('Failed to load video token. Either video is expired or you have reached viewing limit of video');
    }
  };

  useEffect(() => {
    if (match.params.video_id) {
      getVideoDetails(match.params.video_id);
    } else {
      setIsLoading(false);
      message.error('Video details not found.');
    }

    //eslint-disable-next-line
  }, [match.params.video_id]);

  const playVideo = () => {
    setStartVideo(true);
    if (match.params.video_order_id) {
      getVideoToken(match.params.video_order_id);
    } else {
      message.error('Video token not found.');
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading video details">
      <Row justify="start" className={styles.mb50}>
        <Col xs={24} md={4}>
          <Button
            className={styles.headButton}
            onClick={() => history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos)}
            icon={<ArrowLeftOutlined />}
          >
            Back to Video List
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
                    src={video.thumbnail_url || 'error'}
                    alt={video.title}
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
                      src={video.thumbnail_url || 'error'}
                      alt={video.title}
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
        <Col xs={24}>
          <Row className={styles.imageWrapper} gutter={[8, 8]}>
            <Col xs={24} className={styles.profileImageWrapper}>
              <div className={styles.profileImage}>
                <Image preview={false} width={'100%'} src={profileImage || 'error'} fallback={DefaultImage()} />
                <div className={styles.userName}>
                  <Title level={isMobileDevice ? 4 : 2}>
                    {profile?.first_name} {profile?.last_name}
                  </Title>
                </div>
                <div className={styles.shareButton}>
                  <Share
                    label="Share"
                    shareUrl={generateUrlFromUsername(profile.username)}
                    title={`${profile.first_name} ${profile.last_name}`}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} md={{ span: 22, offset: 1 }}>
              <div className={styles.bio}>{ReactHtmlParser(profile?.profile?.bio)}</div>
            </Col>
            <Col xs={24} md={{ span: 22, offset: 1 }}>
              {profile?.profile?.social_media_links && (
                <Space size={'middle'}>
                  {profile.profile.social_media_links.website && (
                    <a href={profile.profile.social_media_links.website} target="_blank" rel="noopener noreferrer">
                      <GlobalOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.facebook_link && (
                    <a
                      href={profile.profile.social_media_links.facebook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FacebookOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.twitter_link && (
                    <a href={profile.profile.social_media_links.twitter_link} target="_blank" rel="noopener noreferrer">
                      <TwitterOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.instagram_link && (
                    <a
                      href={profile.profile.social_media_links.instagram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <InstagramOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.linkedin_link && (
                    <a
                      href={profile.profile.social_media_links.linkedin_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkedinOutlined className={styles.socialIcon} />
                    </a>
                  )}
                </Space>
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          {video && (
            <Row className={styles.sessionListWrapper}>
              {video.sessions?.length > 0 && (
                <Col xs={24}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24}>
                      <Text className={styles.ml20}> Related to these class(es) </Text>
                    </Col>
                    <Col xs={24}>
                      <SessionCards sessions={video.sessions} shouldFetchInventories={true} username={video.username} />
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
