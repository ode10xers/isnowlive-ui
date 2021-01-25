import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Image, Typography, Button, Row, Col, Space, Tabs, Card, message, Radio, Empty } from 'antd';
import {
  TagsOutlined,
  VideoCameraOutlined,
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import parse from 'html-react-parser';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import MobileDetect from 'mobile-detect';
import Sessions from 'components/Sessions';
import ClassPasses from 'components/ClassPasses';
import EMCode from 'components/EMCode';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import { isAPISuccess, parseEmbedCode } from 'utils/helper';
import DefaultImage from 'components/Icons/DefaultImage/index';
import Share from 'components/Share';
import { generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import dateUtil from 'utils/date';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const { user, creator } = mixPanelEventTags;
const {
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const ProfilePreview = ({ username = null }) => {
  const history = useHistory();
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedSessionTab, setSelectedSessionTab] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnDashboard, setIsOnDashboard] = useState(false);
  const [profile, setProfile] = useState({});
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [view, setView] = useState('list');
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'month');
  const [calendarSession, setCalendarSession] = useState([]);
  const [selectedListTab, setSelectedListTab] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isPassesLoading, setIsPassesLoading] = useState(true);
  const [passes, setPasses] = useState([]);

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

  const getPassesDetails = useCallback(async () => {
    try {
      let profileUsername = '';

      if (username) {
        profileUsername = username;
      } else {
        profileUsername = getLocalUserDetails().username;
      }

      const { data } = await apis.passes.getPassesByUsername(profileUsername);

      if (data) {
        setPasses(
          data.map((pass) => ({
            ...pass,
            sessions:
              pass.sessions?.map((session) => ({
                ...session,
                key: `${pass.id}_${session.session_id}`,
                username: profileUsername,
              })) || [],
          }))
        );
        setIsPassesLoading(false);
      }
    } catch (error) {
      setIsPassesLoading(false);
      message.error('Failed to load class pass details');
    }
  }, [username]);

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnDashboard(true);
    }
    getProfileDetails();
    getSessionDetails('upcoming');
  }, [history.location.pathname, getProfileDetails, getSessionDetails]);

  const handleChangeListTab = (key) => {
    setIsListLoading(true);
    setSelectedListTab(key);

    if (parseInt(key) === 0) {
      handleChangeSessionTab(selectedSessionTab);
    } else {
      getPassesDetails();
    }

    setIsListLoading(false);
  };

  const handleChangeSessionTab = (key) => {
    setIsSessionLoading(true);
    setSelectedSessionTab(key);
    if (parseInt(key) === 0) {
      trackSimpleEvent(user.click.profile.upcomingSessionsTab);
      getSessionDetails('upcoming');
    } else {
      trackSimpleEvent(user.click.profile.pastSessionsTab);
      getSessionDetails('past');
    }
  };

  const trackAndNavigate = (destination, eventTag, newWindow = false) => {
    trackSimpleEvent(eventTag);

    if (newWindow) {
      window.open(destination);
    } else {
      history.push(destination);
    }
  };

  const showInventoryDetails = (session) => {
    trackSimpleEvent(user.click.profile.sessionCard, { inventory_id: session.inventory_id });
    const baseurl = generateUrlFromUsername(username || getLocalUserDetails().username);
    window.open(`${baseurl}/e/${session.inventory_id}`);
  };

  const handleViewChange = async (e) => {
    setView(e.target.value);
    if (e.target.value === 'calendar') {
      try {
        setIsSessionLoading(true);
        let profileUsername = '';
        if (username) {
          profileUsername = username;
        } else {
          profileUsername = getLocalUserDetails().username;
        }
        const UpcomingRes = await apis.user.getSessionsByUsername(profileUsername, 'upcoming');
        const PastRes = await apis.user.getSessionsByUsername(profileUsername, 'past');
        if (isAPISuccess(UpcomingRes.status) && isAPISuccess(PastRes.status)) {
          setCalendarSession([...UpcomingRes.data, ...PastRes.data]);
          setIsSessionLoading(false);
        }
      } catch (error) {
        setIsSessionLoading(false);
        message.error('Failed to load user session details');
      }
    }
  };

  const onViewChange = (e) => {
    setCalendarView(e);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      {isOnDashboard && (
        <Row>
          <Col span={24}>
            <Button
              className={styles.headButton}
              icon={<ArrowLeftOutlined />}
              onClick={() => trackAndNavigate('/creator/dashboard', creator.click.profile.backToDashboard)}
            >
              Dashboard
            </Button>
            <Button
              className={styles.headButton}
              icon={<EditOutlined />}
              onClick={() => trackAndNavigate('/creator/dashboard/profile/edit', creator.click.profile.editProfile)}
            >
              Edit Profile
            </Button>
            <Button
              className={styles.headButton}
              icon={<GlobalOutlined />}
              onClick={() =>
                trackAndNavigate(generateUrlFromUsername(profile.username), creator.click.profile.publicPage, true)
              }
            >
              Public Page
            </Button>
          </Col>
        </Row>
      )}

      <div className={isOnDashboard && styles.profilePreviewContainer}>
        {/* ======INTRO========= */}
        <div className={styles.imageWrapper}>
          <div className={styles.coverImageWrapper}>
            <Image
              preview={false}
              width={coverImage ? '100%' : 200}
              className={styles.coverImage}
              src={coverImage ? coverImage : 'error'}
              fallback={DefaultImage()}
            />
          </div>
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
        </div>
        <Row justify="space-between" align="middle">
          <Col xs={24} md={{ span: 22, offset: 1 }}>
            <Text type="secondary">{ReactHtmlParser(profile?.profile?.bio)}</Text>
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
                {profile.profile.social_media_links.linkedin_link && (
                  <a href={profile.profile.social_media_links.linkedin_link} target="_blank" rel="noopener noreferrer">
                    <LinkedinOutlined className={styles.socialIcon} />
                  </a>
                )}
              </Space>
            )}
          </Col>
        </Row>

        {/* =====TAB SELECT===== */}

        <Loader loading={isListLoading} size="large">
          <Tabs size="large" defaultActiveKey={selectedListTab} onChange={handleChangeListTab}>
            <Tabs.TabPane
              key={0}
              tab={
                <div className={styles.largeTabHeader}>
                  <VideoCameraOutlined />
                  Sessions
                </div>
              }
            >
              {/* =====SESSION======== */}
              <Row className={styles.mt20}>
                <Col span={24}>
                  <Title level={isMobileDevice ? 4 : 2}>Sessions</Title>
                  <Text type="primary" strong>
                    All event times shown below are in your local time zone ({getCurrentLongTimezone()})
                  </Text>
                </Col>
                <Col span={24} className={styles.mt10}>
                  <Radio.Group value={view} onChange={handleViewChange}>
                    <Radio.Button value="list">List View</Radio.Button>
                    <Radio.Button value="calendar">Calendar View</Radio.Button>
                  </Radio.Group>
                </Col>
                <Col span={24}>
                  {view === 'calendar' ? (
                    <Loader loading={isSessionLoading} size="large" text="Loading sessions">
                      {calendarSession.length > 0 ? (
                        <CalendarView
                          inventories={calendarSession}
                          onSelectInventory={showInventoryDetails}
                          onViewChange={onViewChange}
                          calendarView={calendarView}
                        />
                      ) : (
                        <Empty />
                      )}
                    </Loader>
                  ) : (
                    <Tabs defaultActiveKey={selectedSessionTab} onChange={handleChangeSessionTab}>
                      {['Upcoming Sessions', 'Past Sessions'].map((item, index) => (
                        <Tabs.TabPane tab={item} key={index}>
                          <Loader loading={isSessionLoading} size="large" text="Loading sessions">
                            <Sessions username={username} sessions={sessions} />
                          </Loader>
                        </Tabs.TabPane>
                      ))}
                    </Tabs>
                  )}
                </Col>
              </Row>
            </Tabs.TabPane>
            <Tabs.TabPane
              key={1}
              tab={
                <div className={styles.largeTabHeader}>
                  <TagsOutlined />
                  Passes
                </div>
              }
            >
              <Row className={styles.mt20}>
                <Col span={24}></Col>
                <Col span={24}>
                  <Loader loading={isPassesLoading} size="large" text="Loading class passes">
                    <ClassPasses passes={passes} />
                  </Loader>
                </Col>
              </Row>
            </Tabs.TabPane>
          </Tabs>
        </Loader>

        {/* =====TESTIMONIALS======== */}
        {profile && profile?.profile?.testimonials ? (
          <Row className={styles.mt50}>
            <Col span={24}>
              <Title level={isMobileDevice ? 4 : 2}>What attendees are saying</Title>
            </Col>
            <Col span={24}>
              <ResponsiveMasonry columnsCount={2} columnsCountBreakPoints={{ 350: 1, 650: 3 }}>
                <Masonry>
                  {profile.profile.testimonials.map((testimonial, index) => (
                    <Card key={index} bordered={false} className={styles.card} bodyStyle={{ padding: '0px' }}>
                      <EMCode>{parseEmbedCode(parse(testimonial))}</EMCode>
                    </Card>
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            </Col>
          </Row>
        ) : null}
      </div>
    </Loader>
  );
};

export default ProfilePreview;
