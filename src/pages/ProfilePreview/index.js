import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Typography, Button, Row, Col, Tabs, Card, message, Radio, Empty } from 'antd';
import {
  TagsOutlined,
  VideoCameraOutlined,
  GlobalOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  PlayCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import parse from 'html-react-parser';
import MobileDetect from 'mobile-detect';

import apis from 'apis';

import Sessions from 'components/Sessions';
import PublicPassList from 'components/PublicPassList';
import PublicVideoList from 'components/PublicVideoList';
import PublicCourseList from 'components/PublicCourseList';
import EMCode from 'components/EMCode';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import CreatorProfile from 'components/CreatorProfile';

import { generateUrlFromUsername, courseType, isAPISuccess, parseEmbedCode } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import dateUtil from 'utils/date';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const { creator } = mixPanelEventTags;
const {
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const productKeys = {
  SESSION: 'session',
  PASS: 'pass',
  VIDEO: 'video',
  COURSE: 'course',
};

const ProfilePreview = ({ username = null }) => {
  const history = useHistory();
  const location = useLocation();
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnDashboard, setIsOnDashboard] = useState(false);
  const [profile, setProfile] = useState({});
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [view, setView] = useState('list');
  const [calendarView, setCalendarView] = useState('month');
  const [calendarSession, setCalendarSession] = useState([]);
  const [selectedListTab, setSelectedListTab] = useState(productKeys.SESSION);
  const [isListLoading, setIsListLoading] = useState(false);

  const [passes, setPasses] = useState([]);
  const [isPassesLoading, setIsPassesLoading] = useState(true);

  const [videos, setVideos] = useState([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);

  const [liveCourses, setLiveCourses] = useState([]);
  const [videoCourses, setVideoCourses] = useState([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);

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
        console.error('Failed to load user session details');
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
      console.error('Failed to load pass details');
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
      console.error('Failed to load video details');
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
      console.error('Failed to load courses details');
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
  }, [
    history.location.pathname,
    getProfileDetails,
    getSessionDetails,
    getPassesDetails,
    getVideosDetails,
    getCoursesDetails,
  ]);

  const getDefaultTabToShow = useCallback(() => {
    let targetListTab = '';
    if (sessions.length) {
      targetListTab = productKeys.SESSION;
    } else if (passes.length) {
      targetListTab = productKeys.PASS;
    } else if (videos.length) {
      targetListTab = productKeys.VIDEO;
    } else if (liveCourses.length || videoCourses.length) {
      targetListTab = productKeys.COURSE;
    }

    return targetListTab;
  }, [sessions, passes, videos, liveCourses, videoCourses]);

  useEffect(() => {
    let targetListTab = getDefaultTabToShow();

    if (location.state) {
      const sectionToShow = location.state.section;
      let targetElement = document.getElementById('home');

      if (sectionToShow === productKeys.SESSION && sessions.length > 0) {
        targetListTab = productKeys.SESSION;
        targetElement = document.getElementById(productKeys.SESSION);
      } else if (sectionToShow === productKeys.PASS && passes.length > 0) {
        targetListTab = productKeys.PASS;
        targetElement = document.getElementById(productKeys.PASS);
      } else if (sectionToShow === productKeys.VIDEO && videos.length > 0) {
        targetListTab = productKeys.VIDEO;
        targetElement = document.getElementById(productKeys.VIDEO);
      } else if (sectionToShow === productKeys.COURSE && (liveCourses.length > 0 || videoCourses.length > 0)) {
        targetListTab = productKeys.COURSE;
        targetElement = document.getElementById(productKeys.COURSE);
      } else if (sectionToShow === 'home') {
        targetElement = document.getElementById('home');
        targetListTab = getDefaultTabToShow();
      }

      if (targetElement) {
        targetElement.scrollIntoView();

        if (targetElement !== 'home') {
          window.scrollBy(0, -100);
        }
      }
    }

    setSelectedListTab(targetListTab);
    //eslint-disable-next-line
  }, [location.state, sessions, passes, videos, liveCourses, videoCourses, profile]);

  const handleChangeListTab = (key) => {
    setIsListLoading(true);
    setSelectedListTab(key);
    setIsListLoading(false);
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
        <CreatorProfile profile={profile} profileImage={profileImage} showCoverImage={true} coverImage={coverImage} />

        {/* =====TAB SELECT===== */}
        <Loader loading={isListLoading} size="large">
          <Tabs
            size="large"
            defaultActiveKey={getDefaultTabToShow()}
            activeKey={selectedListTab}
            onChange={handleChangeListTab}
          >
            {sessions.length > 0 && (
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
                      <Tabs defaultActiveKey={0}>
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
            )}
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
                <Tabs
                  defaultActiveKey={
                    liveCourses.length > 0 ? 'liveCourses' : videoCourses.length > 0 ? 'videoCourses' : ''
                  }
                >
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
          </Tabs>
        </Loader>

        {/* =====TESTIMONIALS======== */}
        {profile && profile?.profile?.testimonials ? (
          <Row className={styles.mt50}>
            <Col span={24}>
              <Title level={isMobileDevice ? 4 : 2}>What people are saying</Title>
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
