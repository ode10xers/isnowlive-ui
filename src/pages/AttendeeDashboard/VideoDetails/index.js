import React, { useCallback, useState, useEffect } from 'react';
import { Row, Col, Typography, Space, Image, message } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';

import Share from 'components/Share';
import Loader from 'components/Loader';
import VideoCard from 'components/VideoCard';
import VideoPlayer from 'components/VideoPlayer';
import SessionCards from 'components/SessionCards';
import DefaultImage from 'components/Icons/DefaultImage';

import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername } from 'utils/helper';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const reservedDomainName = ['app', ...(process.env.NODE_ENV !== 'development' ? ['localhost'] : [])];

const VideoDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [video, setVideo] = useState([]);

  const getProfileDetails = useCallback(async (username) => {
    try {
      const { data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (data) {
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
        const { data } = await apis.videos.getVideoById(videoId);

        if (data) {
          // Hardcoding this, if available from GET video API then we can use that
          // const username = window.location.hostname.split('.')[0];
          const dummyUsername = 'ellianto';

          //Dummy Data
          const videoData = {
            id: 3,
            cover_image: 'https://dkfqbuenrrvge.cloudfront.net/image/msJ9placWNxt8bGA_city01.jpeg',
            thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/mbzyHe0nLTcCMArD_difpsf3i2n68p22m_op.jpg',
            title: 'Test Video 3',
            description:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ipsum dolor, gravida et blandit et, pellentesque a justo. Aenean id nulla nibh. Mauris euismod erat et quam auctor lobortis. Duis posuere neque a diam sollicitudin consequat. Aliquam sapien metus, lacinia quis pulvinar eget, gravida quis augue. Sed non pretium enim. Morbi ornare dignissim arcu, eget mollis erat tempus at. Proin convallis dui id pellentesque accumsan. Aenean finibus nibh sed dictum ultrices. Maecenas rutrum, odio quis consequat bibendum, urna orci tempor libero, quis pharetra nibh nisi eget massa. Fusce in commodo magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed lacus nec mi ullamcorper pretium. 2',
            price: 0,
            currency: 'USD',
            validity: 24,
            username: dummyUsername,
            published: false,
            // ...data,
            sessions:
              data.sessions.map((session) => ({
                ...session,
                key: `${data.id}_${session.session_id}`,
                username: dummyUsername,
              })) || [],
          };

          setVideo(videoData);

          if (videoData.username && !reservedDomainName.includes(videoData.username)) {
            getProfileDetails(videoData.username);
          }

          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        message.error('Failed to load class video details');
      }
    },
    [getProfileDetails]
  );

  useEffect(() => {
    if (match.params.video_id) {
      getVideoDetails(match.params.video_id);
    } else {
      setIsLoading(false);
      message.error('Video details not found.');
    }

    //eslint-disable-next-line
  }, [match.params.video_id]);

  return (
    <Loader loading={isLoading} size="large" text="Loading video details">
      <Row gutter={[8, 24]} className={classNames(styles.p50, styles.box)}>
        <Col xs={24} className={styles.showcaseCardContainer}>
          <VideoCard cover={<VideoPlayer />} video={video} buyable={false} hoverable={false} />
        </Col>
        <Col xs={24}>
          <Row className={styles.imageWrapper} gutter={[8, 8]}>
            <Col xs={24} className={styles.profileImageWrapper}>
              <div className={styles.profileImage}>
                <Image
                  preview={false}
                  width={'100%'}
                  src={profileImage ? profileImage : 'error'}
                  fallback={DefaultImage()}
                />
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
