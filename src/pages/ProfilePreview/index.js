import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Image, Typography, Button, Row, Col, Space, Tabs, Card, message } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  ArrowLeftOutlined,
  EditOutlined,
} from '@ant-design/icons';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import parse from 'html-react-parser';

import apis from 'apis';
import MobileDetect from 'mobile-detect';
import Sessions from 'components/Sessions';
import EMCode from 'components/EMCode';
import Loader from 'components/Loader';
import { parseEmbedCode } from 'utils/helper';
import DefaultImage from 'components/Icons/DefaultImage/index';
import Share from 'components/Share';
import { generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const ProfilePreview = ({ username = null }) => {
  const history = useHistory();
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnDashboard, setIsOnDashboard] = useState(false);
  const [profile, setProfile] = useState({});
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const getProfileDetails = useCallback(async () => {
    try {
      const { data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (data) {
        setProfile(data);
        setCoverImage(data.cover_image_url);
        setProfileImage(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error('Failed to load profile details');
      setIsLoading(false);
    }
  }, [username]);

  const getSessionDetails = useCallback(
    async (type) => {
      try {
        let profileUsername = '';
        if (username) {
          profileUsername = username;
        } else {
          profileUsername = getLocalUserDetails().username;
        }
        const { data } = await apis.user.getSessionsByUsername(profileUsername, type);
        if (data) {
          setSessions(data);
          setIsSessionLoading(false);
        }
      } catch (error) {
        setIsSessionLoading(false);
        message.error('Failed to load user session details');
      }
    },
    [username]
  );

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnDashboard(true);
    }
    getProfileDetails();
    getSessionDetails('upcoming');
  }, [history.location.pathname, getProfileDetails, getSessionDetails]);

  const handleChangeTab = (key) => {
    setIsSessionLoading(true);
    setSelectedTab(key);
    if (parseInt(key) === 0) {
      getSessionDetails('upcoming');
    } else {
      getSessionDetails('past');
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      {isOnDashboard && (
        <Row>
          <Col span={24}>
            <Button
              className={styles.headButton}
              onClick={() => history.push('/creator/dashboard')}
              icon={<ArrowLeftOutlined />}
            >
              Dashboard
            </Button>
            <Button
              className={styles.headButton}
              onClick={() => history.push('/creator/dashboard/profile/edit')}
              icon={<EditOutlined />}
            >
              Edit Profile
            </Button>
            <Button
              className={styles.headButton}
              onClick={() => window.open(generateUrlFromUsername(profile.username))}
              icon={<GlobalOutlined />}
            >
              Public Page
            </Button>
          </Col>
        </Row>
      )}

      {/* ======INTRO========= */}
      <div className={styles.imageWrapper}>
        <div className={styles.coverImageWrapper}>
          <Image
            width={coverImage ? '100%' : 200}
            height={300}
            className={styles.coverImage}
            src={coverImage ? coverImage : 'error'}
            fallback={DefaultImage()}
          />
        </div>

        <Image
          className={isMobileDevice ? styles.profileImageSmall : styles.profileImage}
          width={isMobileDevice ? 80 : 120}
          height={isMobileDevice ? 80 : 120}
          src={profileImage ? profileImage : 'error'}
          fallback={DefaultImage()}
        />
      </div>
      <Row justify="space-between" align="middle">
        <Col xs={6} md={24}></Col>
        <Col xs={12} md={{ span: 7, offset: 4 }}>
          <Title level={isMobileDevice ? 4 : 2}>
            {profile?.first_name} {profile?.last_name}
          </Title>
        </Col>
        <Col xs={6} md={{ span: 6, offset: 6 }}>
          <Share
            label="Share"
            shareUrl={generateUrlFromUsername(profile.username)}
            title={`${profile.first_name} ${profile.last_name}`}
          />
        </Col>
        <Col xs={24} md={{ span: 18, offset: 3 }}>
          <Text type="secondary">{profile?.profile?.bio}</Text>
        </Col>
        <Col xs={24} md={{ span: 18, offset: 3 }}>
          {profile?.profile?.social_media_links && (
            <Space size={'middle'}>
              {profile.profile.social_media_links.website && (
                <a href={profile.profile.social_media_links.website} target="_blank" rel="noopener noreferrer">
                  <GlobalOutlined className={styles.socialIcon} />
                </a>
              )}
              {profile.profile.social_media_links.facebook_link && (
                <a href={profile.profile.social_media_links.facebook_link} target="_blank" rel="noopener noreferrer">
                  <FacebookOutlined className={styles.socialIcon} />
                </a>
              )}
              {profile.profile.social_media_links.twitter_link && (
                <a href={profile.profile.social_media_links.twitter_link} target="_blank" rel="noopener noreferrer">
                  <TwitterOutlined className={styles.socialIcon} />
                </a>
              )}
              {profile.profile.social_media_links.instagram_link && (
                <a href={profile.profile.social_media_links.instagram_link} target="_blank" rel="noopener noreferrer">
                  <InstagramOutlined className={styles.socialIcon} />
                </a>
              )}
            </Space>
          )}
        </Col>
      </Row>

      {/* =====SESSION======== */}
      <Row className={styles.mt50}>
        <Col span={24}>
          <Title level={isMobileDevice ? 4 : 2}>Sessions</Title>
        </Col>
        <Col span={24}>
          <Tabs defaultActiveKey={selectedTab} onChange={handleChangeTab}>
            <Tabs.TabPane tab="Upcoming Sessions" key="0">
              <Loader loading={isSessionLoading} size="large" text="Loading sessions">
                <Sessions username={username} sessions={sessions} />
              </Loader>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Past Sesions" key="1">
              <Loader loading={isSessionLoading} size="large" text="Loading sessions">
                <Sessions username={username} sessions={sessions} />
              </Loader>
            </Tabs.TabPane>
          </Tabs>
        </Col>
      </Row>

      {/* =====TESTIMONIALS======== */}
      <Row className={styles.mt50}>
        <Col span={24}>
          <Title level={isMobileDevice ? 4 : 2}>What attendees are saying</Title>
        </Col>
        <Col span={24}>
          <ResponsiveMasonry columnsCount={2} columnsCountBreakPoints={{ 350: 1, 650: 3 }}>
            <Masonry>
              {profile && profile?.profile?.testimonials
                ? profile.profile.testimonials.map((testimonial, index) => (
                    <Card key={index} bordered={false} className={styles.card} bodyStyle={{ padding: '0px' }}>
                      <EMCode>{parseEmbedCode(parse(testimonial))}</EMCode>
                    </Card>
                  ))
                : null}
            </Masonry>
          </ResponsiveMasonry>
        </Col>
      </Row>
    </Loader>
  );
};
export default ProfilePreview;
