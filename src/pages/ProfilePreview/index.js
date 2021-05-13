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
  ScheduleOutlined,
} from '@ant-design/icons';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import parse from 'html-react-parser';
import MobileDetect from 'mobile-detect';

import apis from 'apis';

import Sessions from 'components/Sessions';
import PublicPassList from 'components/PublicPassList';
import PublicVideoList from 'components/PublicVideoList';
import CreatorSubscriptions from 'components/CreatorSubscriptions';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';
import EMCode from 'components/EMCode';
import Loader from 'components/Loader';
import CalendarWrapper from 'components/CalendarWrapper';
import CreatorProfile from 'components/CreatorProfile';
import AuthModal from 'components/AuthModal';
import { showBookSingleSessionSuccessModal, showAlreadyBookedModal } from 'components/Modals/modals';

import {
  generateUrlFromUsername,
  isAPISuccess,
  parseEmbedCode,
  paymentSource,
  orderType,
  productType,
  isUnapprovedUserError,
} from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import dateUtil from 'utils/date';
import { formatPassesData, getLiveCoursesFromCourses, getVideoCoursesFromCourses } from 'utils/productsHelper';
import { getSessionCountByDate } from 'components/CalendarWrapper/helper';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';
import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const { creator } = mixPanelEventTags;
const {
  formatDate: { toLongDateWithTime },
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

const productKeys = {
  SESSION: 'session',
  PASS: 'pass',
  VIDEO: 'video',
  COURSE: 'course',
  SUBSCRIPTION: 'membership',
};

const ProfilePreview = ({ username = getLocalUserDetails().username || null }) => {
  const history = useHistory();
  const location = useLocation();
  const {
    state: { userDetails },
    showPaymentPopup,
  } = useGlobalContext();
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnDashboard, setIsOnDashboard] = useState(false);
  const [profile, setProfile] = useState({});
  const [view, setView] = useState('calendar');
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
  const [sessionCountByDate, setSessionCountByDate] = useState({});
  const [purchaseModalVisible, setAuthModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

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

  const getSessionDetails = useCallback(async (type) => {
    setIsSessionLoading(true);

    try {
      const { status, data } = await apis.user.getSessionsByUsername(type);
      if (isAPISuccess(status) && data) {
        setSessions(data);
        setIsSessionLoading(false);
      }
    } catch (error) {
      setIsSessionLoading(false);
      console.error('Failed to load user session details');
    }
  }, []);

  const getPassesDetails = useCallback(async () => {
    setIsPassesLoading(true);
    try {
      const { status, data } = await apis.passes.getPassesByUsername();

      if (isAPISuccess(status) && data) {
        setPasses(formatPassesData(data));
        setIsPassesLoading(false);
      }
    } catch (error) {
      setIsPassesLoading(false);
      console.error('Failed to load pass details');
    }
  }, []);

  const getVideosDetails = useCallback(async () => {
    setIsVideosLoading(true);
    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setVideos(data);
        setIsVideosLoading(false);
      }
    } catch (error) {
      setIsVideosLoading(false);
      console.error('Failed to load video details');
    }
  }, []);

  const getCoursesDetails = useCallback(async () => {
    setIsCoursesLoading(true);
    try {
      const { status, data } = await apis.courses.getCoursesByUsername();

      if (isAPISuccess(status) && data) {
        setLiveCourses(getLiveCoursesFromCourses(data));
        setVideoCourses(getVideoCoursesFromCourses(data));
        setIsCoursesLoading(false);
      }
    } catch (error) {
      setIsCoursesLoading(false);
      console.error('Failed to load courses details');
    }
  }, []);

  const getCalendarSessionDetails = useCallback(async () => {
    try {
      const UpcomingRes = await apis.user.getSessionsByUsername('upcoming');
      const PastRes = await apis.user.getSessionsByUsername('past');
      if (isAPISuccess(UpcomingRes.status) && isAPISuccess(PastRes.status)) {
        const res = getSessionCountByDate([...UpcomingRes.data, ...PastRes.data]);
        setSessionCountByDate(res);
        setCalendarSession([
          ...UpcomingRes.data.map((upcomingSessions) => ({
            ...upcomingSessions,
            isPast: false,
          })),
          ...PastRes.data.map((pastSessions) => ({
            ...pastSessions,
            isPast: true,
          })),
        ]);
      }
    } catch (error) {
      message.error('Failed to load user session details');
    }
  }, []);

  const getSubscriptionDetails = useCallback(async () => {
    setIsSubscriptionsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        setSubscriptions(data.sort((a, b) => a.price - b.price));
        setIsSubscriptionsLoading(false);
      }
    } catch (error) {
      setIsSubscriptionsLoading(false);
      console.error('Failed to load subscription details');
    }
  }, []);

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
    getCalendarSessionDetails();
  }, [
    history.location.pathname,
    getProfileDetails,
    getSessionDetails,
    getPassesDetails,
    getVideosDetails,
    getCoursesDetails,
    getSubscriptionDetails,
    getCalendarSessionDetails,
    userDetails,
  ]);

  const getDefaultTabToShow = useCallback(() => {
    let targetListTab = '';
    if (sessions.length > 0) {
      targetListTab = productKeys.SESSION;
    } else if (passes.length > 0) {
      targetListTab = productKeys.PASS;
    } else if (videos.length > 0) {
      targetListTab = productKeys.VIDEO;
    } else if (liveCourses.length > 0 || videoCourses.length > 0) {
      targetListTab = productKeys.COURSE;
    } else if (subscriptions.length > 0) {
      targetListTab = productKeys.SUBSCRIPTION;
    }

    return targetListTab;
  }, [sessions, passes, videos, liveCourses, videoCourses, subscriptions]);

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
      } else if (sectionToShow === productKeys.SUBSCRIPTION && subscriptions.length > 0) {
        targetListTab = productKeys.SUBSCRIPTION;
        targetElement = document.getElementById(productKeys.SUBSCRIPTION);
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
  }, [location.state, sessions, passes, videos, liveCourses, videoCourses, subscriptions, profile]);

  const handleChangeListTab = (key) => {
    setIsListLoading(true);
    setSelectedListTab(key);
    setIsListLoading(false);
  };

  const onEventBookClick = (event) => {
    showAuthModal(event);
  };

  const trackAndNavigate = (destination, eventTag, newWindow = false) => {
    trackSimpleEvent(eventTag);

    if (newWindow) {
      window.open(destination);
    } else {
      history.push(destination);
    }
  };

  const handleViewChange = (e) => {
    setView(e.target.value);
  };

  const showAuthModal = (inventory) => {
    setSelectedInventory(inventory);
    setAuthModalVisible(true);
  };

  const closeAuthModal = () => {
    setSelectedInventory(null);
    setAuthModalVisible(false);
  };

  const createOrder = async (couponCode = '', priceAmount = 0) => {
    // Currently discount engine has not been implemented for session
    // however this form of createOrder will be what is used to accomodate
    // the new Payment Popup

    // Some front end checks to prevent the logic below from breaking
    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return null;
    }

    setIsSessionLoading(true);

    try {
      let payload = {
        inventory_id: selectedInventory.inventory_id,
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        coupon_code: couponCode,
        payment_source: paymentSource.GATEWAY,
      };

      if (selectedInventory.pay_what_you_want) {
        payload = { ...payload, amount: priceAmount };
      }

      const { status, data } = await apis.session.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsSessionLoading(false);
        // Keeping inventory_id since it's needed in confirmation modal
        const inventoryId = selectedInventory.inventory_id;
        setSelectedInventory(null);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_type: orderType.CLASS,
            payment_order_id: data.order_id,
            inventory_id: inventoryId,
          };
        } else {
          showBookSingleSessionSuccessModal(inventoryId);
          return null;
        }
      }
    } catch (error) {
      setIsSessionLoading(false);

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }

      return null;
    }
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return;
    }

    const desc = toLongDateWithTime(selectedInventory.start_time);

    let flexiblePaymentDetails = null;

    if (selectedInventory.pay_what_you_want) {
      flexiblePaymentDetails = {
        enabled: true,
        minimumPrice: selectedInventory.price,
      };
    }

    const paymentPopupData = {
      productId: selectedInventory.session_external_id,
      productType: 'SESSION',
      itemList: [
        {
          name: selectedInventory.name,
          description: desc,
          currency: selectedInventory.currency,
          price: selectedInventory.price,
          pay_what_you_want: selectedInventory.pay_what_you_want,
        },
      ],
      flexiblePaymentDetails,
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <AuthModal
        visible={purchaseModalVisible}
        closeModal={closeAuthModal}
        onLoggedInCallback={showConfirmPaymentPopup}
      />
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
          <Tabs size="large" activeKey={selectedListTab} onChange={handleChangeListTab}>
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
                  <Col span={24} className={styles.mt20}>
                    <Radio.Group value={view} onChange={handleViewChange} buttonStyle="solid">
                      <Radio.Button className={styles.orangeRadio} value="list">
                        List View
                      </Radio.Button>
                      <Radio.Button className={styles.orangeRadio} value="calendar">
                        Calendar View
                      </Radio.Button>
                    </Radio.Group>
                  </Col>
                  <Col span={24}>
                    {view === 'calendar' ? (
                      <Loader loading={isSessionLoading} size="large" text="Loading sessions">
                        {calendarSession.length > 0 ? (
                          <CalendarWrapper
                            calendarSessions={calendarSession}
                            sessionCountByDate={sessionCountByDate}
                            onEventBookClick={onEventBookClick}
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
                      <PublicPassList passes={passes} />
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
                      <PublicVideoList videos={videos} />
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
                        <div className={styles.p10}>
                          <ShowcaseCourseCard username={username} courses={liveCourses} />
                        </div>
                      </Loader>
                    </Tabs.TabPane>
                  )}
                  {videoCourses.length > 0 && (
                    <Tabs.TabPane tab={<Title level={5}> Video Courses </Title>} key="videoCourses">
                      <Loader loading={isCoursesLoading} size="large" text="Loading video courses">
                        <div className={styles.p10}>
                          <ShowcaseCourseCard username={username} courses={videoCourses} />
                        </div>
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
                  <div className={styles.largeTabHeader} id="membership">
                    <ScheduleOutlined />
                    Membership
                  </div>
                }
              >
                <Row className={styles.mt20}>
                  <Col span={24}>
                    <Loader loading={isSubscriptionsLoading} size="large" text="Loading memberships">
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
