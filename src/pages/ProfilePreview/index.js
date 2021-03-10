import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
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
  PlayCircleOutlined,
  BookOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import parse from 'html-react-parser';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import MobileDetect from 'mobile-detect';
import Sessions from 'components/Sessions';
import PublicPassList from 'components/PublicPassList';
import PublicVideoList from 'components/PublicVideoList';
import PublicCourseList from 'components/PublicCourseList';
import CreatorSubscriptions from 'components/CreatorSubscriptions';
import EMCode from 'components/EMCode';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import { isAPISuccess, parseEmbedCode } from 'utils/helper';
import DefaultImage from 'components/Icons/DefaultImage/index';
import Share from 'components/Share';
import { generateUrlFromUsername, courseType } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import dateUtil from 'utils/date';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const { user, creator } = mixPanelEventTags;
const {
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const productKeys = {
  SESSION: 'session',
  PASS: 'pass',
  VIDEO: 'video',
  LIVE_COURSE: 'live_course',
  VIDEO_COURSE: 'video_course',
};

const ProfilePreview = ({ username = null }) => {
  const history = useHistory();
  const location = useLocation();
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedSessionTab, setSelectedSessionTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnDashboard, setIsOnDashboard] = useState(false);
  const [profile, setProfile] = useState({});
  const [view, setView] = useState('list');
  const [calendarView, setCalendarView] = useState('month');
  const [calendarSession, setCalendarSession] = useState([]);
  const [selectedListTab, setSelectedListTab] = useState(productKeys.SESSION);
  const [isListLoading, setIsListLoading] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const [passes, setPasses] = useState([]);
  const [isPassesLoading, setIsPassesLoading] = useState(true);

  const [videos, setVideos] = useState([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);

  const [liveCourses, setLiveCourses] = useState([]);
  const [videoCourses, setVideoCourses] = useState([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);

  const [subscriptions, setSubscriptions] = useState([]);
  const [isSubscriptionsLoading, setIsSubscriptionsLoading] = useState(true);

  const getProfileDetails = useCallback(async () => {
    try {
      const { status, data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (isAPISuccess(status) && data) {
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
      setIsSessionLoading(true);

      try {
        let profileUsername = '';
        if (username) {
          profileUsername = username;
        } else {
          profileUsername = getLocalUserDetails().username;
        }
        const { status, data } = await apis.user.getSessionsByUsername(profileUsername, type);
        if (isAPISuccess(status) && data) {
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
    setIsPassesLoading(true);
    try {
      let profileUsername = '';

      if (username) {
        profileUsername = username;
      } else {
        profileUsername = getLocalUserDetails().username;
      }

      const { status, data } = await apis.passes.getPassesByUsername(profileUsername);

      if (isAPISuccess(status) && data) {
        setPasses(
          data.map((pass) => ({
            ...pass,
            sessions:
              pass.sessions?.map((session) => ({
                ...session,
                key: `${pass.id}_${session.session_id}`,
                username: profileUsername,
              })) || [],
            videos:
              pass.videos?.map((video) => ({
                ...video,
                key: `${pass.id}_${video.external_id}`,
                username: profileUsername,
              })) || [],
          }))
        );
        setIsPassesLoading(false);
      }
    } catch (error) {
      setIsPassesLoading(false);
      message.error('Failed to load pass details');
    }
  }, [username]);

  const getVideosDetails = useCallback(async () => {
    setIsVideosLoading(true);
    try {
      let profileUsername = '';

      if (username) {
        profileUsername = username;
      } else {
        profileUsername = getLocalUserDetails().username;
      }

      const { status, data } = await apis.videos.getVideosByUsername(profileUsername);

      if (isAPISuccess(status) && data) {
        setVideos(data);
        setIsVideosLoading(false);
      }
    } catch (error) {
      setIsVideosLoading(false);
      message.error('Failed to load video details');
    }
  }, [username]);

  const getCoursesDetails = useCallback(async () => {
    setIsCoursesLoading(true);
    try {
      let profileUsername = '';

      if (username) {
        profileUsername = username;
      } else {
        profileUsername = getLocalUserDetails().username;
      }

      const { status, data } = await apis.courses.getCoursesByUsername(profileUsername);

      if (isAPISuccess(status) && data) {
        setLiveCourses(data.filter((course) => course.type === courseType.MIXED || course.type === 'live'));
        setVideoCourses(
          data.filter((course) => course.type === courseType.VIDEO_NON_SEQ || course.type === courseType.VIDEO_SEQ)
        );
        setIsCoursesLoading(false);
      }
    } catch (error) {
      setIsCoursesLoading(false);
      message.error('Failed to load courses details');
    }
  }, [username]);

  const getSubscriptionDetails = useCallback(() => {
    setIsSubscriptionsLoading(true);

    try {
      let profileUsername = '';

      if (username) {
        profileUsername = username;
      } else {
        profileUsername = getLocalUserDetails().username;
      }

      console.log(profileUsername);

      //TODO: Implement API Here later
      const { status, data } = {
        status: 200,
        data: [
          {
            currency: 'SGD',
            external_id: 'yaba-daba-doo',
            is_published: true,
            name: 'Mock Subs',
            price: 20,
            validity: 30,
            color_code: '#ff0000',
            products: {
              SESSION: {
                access_types: ['PUBLIC'],
                credits: 15,
                product_ids: ['abcd', 'defg'],
              },
            },
          },
          {
            currency: 'SGD',
            external_id: 'doo-bee-doo-bee-doo-baa',
            is_published: true,
            name: 'Mock Subs but Better',
            price: 20,
            validity: 30,
            color_code: '#00ff00',
            products: {
              SESSION: {
                access_types: ['PUBLIC', 'MEMBERSHIP'],
                credits: 15,
                product_ids: ['abcd', 'defg'],
              },
              VIDEO: {
                access_types: ['PUBLIC', 'MEMBERSHIP'],
                credits: 15,
                product_ids: ['abcd', 'defg'],
              },
            },
          },
          {
            currency: 'SGD',
            external_id: 'scooby-dooby-doo',
            is_published: true,
            name: 'Even Better Mock Subs',
            price: 20,
            validity: 30,
            color_code: '#0000ff',
            products: {
              SESSION: {
                access_types: ['PUBLIC', 'MEMBERSHIP'],
                credits: 20,
                product_ids: ['abcd', 'defg'],
              },
              VIDEO: {
                access_types: ['PUBLIC', 'MEMBERSHIP'],
                credits: 20,
                product_ids: ['abcd', 'defg'],
              },
              COURSE: {
                access_types: ['PUBLIC', 'MEMBERSHIP'],
                credits: 10,
                product_ids: ['abcd', 'defg'],
              },
            },
          },
        ],
      };

      if (isAPISuccess(status) && data) {
        setSubscriptions(data);
        setIsSubscriptionsLoading(false);
      }
    } catch (error) {
      setIsSubscriptionsLoading(false);
      console.error('Failed to load subscription details');
    }
  }, [username]);

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnDashboard(true);
    }
    getProfileDetails();
    getSessionDetails('upcoming');
    getPassesDetails();
    getVideosDetails();
    getCoursesDetails();
    getSubscriptionDetails();
  }, [
    history.location.pathname,
    getProfileDetails,
    getSessionDetails,
    getPassesDetails,
    getVideosDetails,
    getCoursesDetails,
    getSubscriptionDetails,
  ]);

  useEffect(() => {
    if (location.state) {
      const sectionToShow = location.state.section;
      let targetElement = document.getElementById(productKeys.SESSION);

      //TODO: Add handler for navbar navigation to subscription section
      if (sectionToShow === productKeys.SESSION) {
        setSelectedListTab(sectionToShow);
      } else if (sectionToShow === productKeys.PASS) {
        if (passes.length) {
          setSelectedListTab(sectionToShow);
          targetElement = document.getElementById(productKeys.PASS);
        } else {
          // Fallback to show sessions
          setSelectedListTab(productKeys.SESSION);
        }
      } else if (sectionToShow === productKeys.VIDEO) {
        if (videos.length) {
          setSelectedListTab(sectionToShow);
          targetElement = document.getElementById(productKeys.VIDEO);
        } else {
          // Fallback to show sessions
          setSelectedListTab(productKeys.SESSION);
        }
      } else if (sectionToShow === 'home') {
        targetElement = document.getElementById('home');
        setSelectedListTab(productKeys.SESSION);
      } else if (sectionToShow === 'course') {
        if (liveCourses.length || videoCourses.length) {
          setSelectedListTab(sectionToShow);
          targetElement = document.getElementById('course');
        } else {
          // Fallback to show sessions
          setSelectedListTab(productKeys.SESSION);
        }
      }

      if (targetElement) {
        targetElement.scrollIntoView();

        if (targetElement !== 'home') {
          window.scrollBy(0, -100);
        }
      }
    }
  }, [location.state, passes, videos, liveCourses, videoCourses, profile]);

  const handleChangeListTab = (key) => {
    setIsListLoading(true);
    setSelectedListTab(key);

    if (key === 'session') {
      handleChangeSessionTab(selectedSessionTab);
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

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(username || session.username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
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

      <div className={isOnDashboard ? styles.profilePreviewContainer : undefined}>
        {/* ======INTRO========= */}
        <div className={styles.imageWrapper} id="home">
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
          <Tabs
            size="large"
            defaultActiveKey={selectedListTab}
            activeKey={selectedListTab}
            onChange={handleChangeListTab}
          >
            <Tabs.TabPane
              key={productKeys.SESSION}
              tab={
                <div className={styles.largeTabHeader} id="session">
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
                          onSelectInventory={redirectToSessionsPage}
                          onViewChange={onViewChange}
                          calendarView={calendarView}
                        />
                      ) : (
                        <Empty />
                      )}
                    </Loader>
                  ) : (
                    <Tabs defaultActiveKey={selectedSessionTab} onChange={handleChangeSessionTab}>
                      {['Upcoming Sessions'].map((item, index) => (
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
            {passes.length > 0 && (
              <Tabs.TabPane
                key={productKeys.PASS}
                tab={
                  <div className={styles.largeTabHeader} id="pass">
                    <TagsOutlined />
                    Passes
                  </div>
                }
              >
                <Row className={styles.mt20}>
                  <Col span={24}>
                    <Loader loading={isPassesLoading} size="large" text="Loading passes">
                      <PublicPassList passes={passes} username={username} />
                    </Loader>
                  </Col>
                </Row>
              </Tabs.TabPane>
            )}
            {videos.length > 0 && (
              <Tabs.TabPane
                key={productKeys.VIDEO}
                tab={
                  <div className={styles.largeTabHeader} id="video">
                    <PlayCircleOutlined />
                    Videos
                  </div>
                }
              >
                <Row className={styles.mt20}>
                  <Col span={24}>
                    <Loader loading={isVideosLoading} size="large" text="Loading videos">
                      <PublicVideoList videos={videos} username={username} />
                    </Loader>
                  </Col>
                </Row>
              </Tabs.TabPane>
            )}
            {(liveCourses.length > 0 || videoCourses.length > 0) && (
              <Tabs.TabPane
                key="course"
                tab={
                  <div className={styles.largeTabHeader} id="course">
                    <BookOutlined />
                    Courses
                  </div>
                }
              >
                <Tabs defaultActiveKey={selectedSessionTab} onChange={handleChangeSessionTab}>
                  {liveCourses.length > 0 && (
                    <Tabs.TabPane tab={<Title level={5}> Live Courses </Title>} key="liveCourses">
                      <Loader loading={isCoursesLoading} size="large" text="Loading live courses">
                        <PublicCourseList username={username} courses={liveCourses} />
                      </Loader>
                    </Tabs.TabPane>
                  )}
                  {videoCourses.length > 0 && (
                    <Tabs.TabPane tab={<Title level={5}> Video Courses </Title>} key="videoCourses">
                      <Loader loading={isCoursesLoading} size="large" text="Loading video courses">
                        <PublicCourseList username={username} courses={videoCourses} />
                      </Loader>
                    </Tabs.TabPane>
                  )}
                </Tabs>
              </Tabs.TabPane>
            )}
            {subscriptions.length > 0 && (
              <Tabs.TabPane
                key={productKeys.SUBSCRIPTION}
                tab={
                  <div className={styles.largeTabHeader} id="subscription">
                    <ScheduleOutlined />
                    Subscription
                  </div>
                }
              >
                <Row className={styles.mt20}>
                  <Col span={24}>
                    <Loader loading={isSubscriptionsLoading} size="large" text="Loading subscriptions">
                      <CreatorSubscriptions subscriptions={subscriptions} />
                    </Loader>
                  </Col>
                </Row>
              </Tabs.TabPane>
            )}
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
