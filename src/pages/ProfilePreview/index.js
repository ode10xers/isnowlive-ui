import React, { useState, useEffect } from 'react';
import { Image, Typography, Button, Row, Col, Space, Tabs, Card, message } from 'antd';
import {
  ShareAltOutlined,
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import apis from 'apis';
import MobileDetect from 'mobile-detect';
import Sessions from '../../components/Sessions';
import Loader from '../../components/Loader';
import parse from 'html-react-parser';
import { parseEmbedCode } from '../../utils/helper';
import DefaultImage from '../../components/Icons/DefaultImage/index';
import styles from './style.module.scss';

const { Title, Text } = Typography;

const ProfilePreview = () => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [upcomingSession, setUpcomingSession] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});

  const getProfileDetails = async () => {
    try {
      const { data } = await apis.user.getProfile();
      if (data) {
        setProfile(data);
        setCoverImage(data.profile.cover_image_url);
        setProfileImage(data.profile.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error('Failed to load profile details');
      setIsLoading(false);
    }
  };

  const getSessionDetails = async () => {
    try {
      const { data } = await apis.user.upcomingSession();
      if (data) {
        setUpcomingSession(data);
      }
    } catch (error) {
      message.error('Failed to load user session details');
    }
  };

  useEffect(() => {
    getProfileDetails();
    getSessionDetails();
  }, []);

  const handleChangeTab = (key) => {
    setSelectedTab(key);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
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
        <Col xs={8} md={24}></Col>
        <Col xs={10} md={{ span: 6, offset: 6 }}>
          <Title level={isMobileDevice ? 4 : 2}>{profile?.full_name}</Title>
        </Col>
        <Col xs={6} md={{ span: 6, offset: 6 }}>
          <Button size={isMobileDevice ? 'small' : 'middle'} icon={<ShareAltOutlined />}>
            Share
          </Button>
        </Col>
        <Col xs={24} md={{ span: 18, offset: 3 }}>
          <Text type="secondary">{profile?.profile?.description}</Text>
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
              <Sessions sessions={upcomingSession} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Past Sesions" key="1">
              <Sessions sessions={upcomingSession} />
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
          <ResponsiveMasonry columnsCount={2} columnsCountBreakPoints={{ 350: 1, 650: 2 }}>
            <Masonry>
              {profile && profile?.profile?.testimonials
                ? profile.profile.testimonials.map((testimonial, index) => (
                    <Card
                      key={index}
                      bordered={false}
                      hoverable
                      className={styles.card}
                      cover={parseEmbedCode(parse(testimonial))}
                    ></Card>
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
