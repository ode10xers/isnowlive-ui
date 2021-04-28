import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography, Tabs } from 'antd';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import Routes from 'routes';
import apis from 'apis';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';

import Share from 'components/Share';
import Loader from 'components/Loader';
import SignInForm from 'components/SignInForm';
import HostDetails from 'components/HostDetails';
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import VideoCard from 'components/VideoCard';
import AuthModal from 'components/AuthModal';
import SessionRegistration from 'components/SessionRegistration';
import SessionInventorySelect from 'components/SessionInventorySelect';

import { isMobileDevice } from 'utils/device';
import {
  generateUrlFromUsername,
  isAPISuccess,
  paymentSource,
  orderType,
  productType,
  reservedDomainName,
  isUnapprovedUserError,
} from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import dateUtil from 'utils/date';

import styles from './style.module.scss';
import {
  showErrorModal,
  showBookSessionWithPassSuccessModal,
  showPurchasePassAndBookSessionSuccessModal,
  showBookSingleSessionSuccessModal,
  showAlreadyBookedModal,
  showPurchaseSingleVideoSuccessModal,
  showBookSessionWithSubscriptionSuccessModal,
  showSetNewPasswordModal,
  sendNewPasswordEmail,
} from 'components/Modals/modals';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';

const { Title } = Typography;
const {
  formatDate: { toLongDateWithTime },
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
  timeCalculation: { isBeforeDate },
} = dateUtil;

const SessionDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const {
    state: { userDetails },
    logIn,
    logOut,
    showPaymentPopup,
  } = useGlobalContext();
  const [showDescription, setShowDescription] = useState(false);
  const [showPrerequisite, setShowPrerequisite] = useState(false);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [availablePasses, setAvailablePasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [userPasses, setUserPasses] = useState([]);
  const [usableUserSubscription, setUsableUserSubscription] = useState(null);
  const [createFollowUpOrder, setCreateFollowUpOrder] = useState(false);
  const [shouldSetDefaultPass, setShouldSetDefaultPass] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [sessionVideos, setSessionVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);
  const [username, setUsername] = useState(null);

  const getDetails = useCallback(
    async (session_id) => {
      try {
        const sessionDetailsResponse = await apis.session.getSessionDetails(session_id);

        if (isAPISuccess(sessionDetailsResponse.status) && sessionDetailsResponse.data) {
          const sessionDetails = sessionDetailsResponse.data;

          setSession({
            ...sessionDetails,
            inventory: sessionDetails.inventory.filter(
              (inventory) => inventory.num_participants < sessionDetails.max_participants
            ),
          });

          const latestInventories = sessionDetails.inventory
            .filter((inventory) => isBeforeDate(inventory.end_time))
            .filter((inventory) => inventory.num_participants < sessionDetails.max_participants)
            .sort((a, b) => (a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0));
          setSelectedInventory(latestInventories.length > 0 ? latestInventories[0] : null);

          setSessionVideos(sessionDetails.Videos || []);

          const creatorUsername = sessionDetails.creator_username || window.location.hostname.split('.')[0];
          setUsername(creatorUsername);
          const creatorDetailsResponse = await apis.user.getProfileByUsername(creatorUsername);

          if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
            setCreator(creatorDetailsResponse.data);
          } else {
            console.error('Failed to fetch creator for session', creatorDetailsResponse);
          }

          if (sessionDetails.is_course) {
            const courseDetailsResponse = await apis.courses.getCoursesBySessionId(session_id);

            if (isAPISuccess(courseDetailsResponse.status) && courseDetailsResponse.data) {
              setCourses(courseDetailsResponse.data || []);
            } else {
              console.error('Failed to fetch courses for session', courseDetailsResponse);
            }
          }

          const passesResponse = await apis.passes.getPassesBySessionId(session_id);

          if (isAPISuccess(passesResponse.status) && passesResponse.data) {
            setAvailablePasses(passesResponse.data);
          } else {
            console.error('Failed to fetch pass data for session', passesResponse);
          }

          setIsLoading(false);
        } else {
          console.error('Failed to fetch session data', sessionDetailsResponse);
        }
      } catch (error) {
        if (!isUnapprovedUserError(error.response)) {
          message.error(error.response?.data?.message || 'Something went wrong.');
        }
        setIsLoading(false);
        history.push(Routes.root);
      }
    },
    [history]
  );

  const getUsablePassesForUser = async () => {
    setIsLoading(true);
    try {
      const loggedInUserData = getLocalUserDetails();

      if (loggedInUserData && session) {
        const { status, data } = await apis.passes.getAttendeePassesForSession(session.session_id);

        if (isAPISuccess(status) && data) {
          setUserPasses(
            data.active.map((userPass) => ({
              ...userPass,
              id: userPass.pass_id,
              name: userPass.pass_name,
            }))
          );
        }
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
    setIsLoading(false);
  };

  const getUsableSubscriptionForUser = async () => {
    setIsLoading(true);

    try {
      const loggedInUserData = getLocalUserDetails();
      if (loggedInUserData && session) {
        const { status, data } = await apis.subscriptions.getUserSubscriptionForSession(session.session_external_id);

        if (isAPISuccess(status) && data) {
          if (data.active.length > 0) {
            // Choose a purchased subscription based on these conditions
            // 1. Should be usable for Session
            // 2. Still have credits to purchase sessions
            // 3. This session can be purchased by this subscription
            const usableSubscription =
              data.active.find(
                (subscription) =>
                  subscription.products['SESSION'] &&
                  subscription.products['SESSION']?.credits > 0 &&
                  subscription.products['SESSION']?.product_ids?.includes(session.session_external_id)
              ) || null;

            setUsableUserSubscription(usableSubscription);
          } else {
            setUsableUserSubscription(null);
          }
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed fetching usable subscription for user');
    }
    setIsLoading(false);
  };

  const getUserPurchasedPass = (getDefault = false) => {
    setShouldSetDefaultPass(false);

    if (userPasses.length) {
      if (selectedPass && !getDefault) {
        return userPasses.filter((userPass) => userPass.id === selectedPass.id)[0];
      }

      return userPasses[0];
    }

    return null;
  };

  useEffect(() => {
    if (match.params.session_id) {
      const domainUsername = window.location.hostname.split('.')[0];

      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getDetails(match.params.session_id);
      }
    } else {
      setIsLoading(false);
      message.error('Session details not found.');
    }
    if (getLocalUserDetails()) {
      setCurrentUser(getLocalUserDetails());
    }

    //eslint-disable-next-line
  }, [match.params.session_id]);

  // Logic for when user lands in the page already logged in
  useEffect(() => {
    if (session && getLocalUserDetails()) {
      if (userPasses.length === 0) {
        getUsablePassesForUser();
        setShouldSetDefaultPass(true);
      }

      if (!usableUserSubscription) {
        getUsableSubscriptionForUser();
      }
    }
    //eslint-disable-next-line
  }, [session]);

  useEffect(() => {
    if (createFollowUpOrder) {
      showConfirmPaymentPopup();
    }

    //eslint-disable-next-line
  }, [createFollowUpOrder]);

  useEffect(() => {
    if (userPasses.length && shouldSetDefaultPass) {
      setSelectedPass(getUserPurchasedPass(true));
    }
    //eslint-disable-next-line
  }, [userPasses, shouldSetDefaultPass]);

  useEffect(() => {
    setCurrentUser(getLocalUserDetails());
    if (!userDetails) {
      setUsableUserSubscription(null);
      setUserPasses([]);
    }
  }, [userDetails]);

  const signupUser = async (values) => {
    try {
      const { data } = await apis.user.signup({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        is_creator: false,
      });
      if (data) {
        setIsLoading(false);
        http.setAuthToken(data.auth_token);
        logIn(data, true);
        showConfirmPaymentPopup();
      }
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message === 'user already exists') {
        setIsLoading(false);
        setShowPasswordField(true);
        setCurrentUser(values);
        message.info('Enter password to register session');
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }
  };

  const bookClass = async (payload) => await apis.session.createOrderForUser(payload);
  const buyPass = async (payload) => await apis.passes.createOrderForUser(payload);

  const showConfirmPaymentPopup = () => {
    setCreateFollowUpOrder(false);

    if (selectedVideo) {
      const paymentPopupData = {
        productId: selectedVideo.external_id,
        productType: 'VIDEO',
        itemList: [
          {
            name: selectedVideo.title,
            description: `Can be watched up to ${selectedVideo.watch_limit} times, valid for ${selectedVideo.validity} days`,
            currency: selectedVideo.currency,
            price: selectedVideo.price,
          },
        ],
      };

      const payload = {
        video_id: selectedVideo.external_id,
        payment_source: paymentSource.GATEWAY,
      };

      showPaymentPopup(paymentPopupData, async (couponCode = '') => await buyVideo(payload, couponCode));
    } else if (usableUserSubscription) {
      const payload = {
        inventory_id: parseInt(selectedInventory.inventory_id),
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        payment_source: paymentSource.SUBSCRIPTION,
        source_id: usableUserSubscription.subscription_order_id,
      };

      const paymentPopupData = {
        productId: session.session_id,
        productType: 'SESSION',
        itemList: [
          {
            name: session.name,
            description: toLongDateWithTime(selectedInventory.start_time),
            currency: session.currency,
            price: session.price,
          },
        ],
        paymentInstrumentDetails: {
          type: 'SUBSCRIPTION',
          ...usableUserSubscription,
        },
      };

      showPaymentPopup(paymentPopupData, async () => await bookClassUsingSubscription(payload));
    } else if (selectedPass) {
      const usersPass = getUserPurchasedPass(false);

      if (usersPass) {
        const paymentPopupData = {
          productId: session.session_id,
          productType: 'SESSION',
          itemList: [
            {
              name: session.name,
              description: toLongDateWithTime(selectedInventory.start_time),
              currency: session.currency,
              price: session.price,
            },
          ],
          paymentInstrumentDetails: {
            type: 'PASS',
            ...usersPass,
          },
        };

        const payload = {
          inventory_id: parseInt(selectedInventory.inventory_id),
          user_timezone_offset: new Date().getTimezoneOffset(),
          user_timezone_location: getTimezoneLocation(),
          user_timezone: getCurrentLongTimezone(),
          payment_source: paymentSource.PASS,
          source_id: usersPass.pass_order_id,
        };

        showPaymentPopup(paymentPopupData, async () => await bookClassUsingPass(payload));
      } else {
        const paymentPopupData = {
          productId: selectedPass.external_id,
          productType: 'PASS',
          itemList: [
            {
              name: selectedPass.name,
              description: `${selectedPass.class_count} Credits, Valid for ${selectedPass.validity} days`,
              currency: selectedPass.currency,
              price: selectedPass.price,
            },
            {
              name: session.name,
              description: toLongDateWithTime(selectedInventory.start_time),
              currency: session.currency,
              price: 0,
            },
          ],
        };

        const payload = {
          pass_id: selectedPass.id,
          price: selectedPass.price,
          currency: selectedPass.currency.toLowerCase(),
        };

        showPaymentPopup(paymentPopupData, async (couponCode = '') => await buyPassAndBookClass(payload, couponCode));
      }
    } else {
      const paymentPopupData = {
        productId: session.session_id,
        productType: 'SESSION',
        itemList: [
          {
            name: session.name,
            description: toLongDateWithTime(selectedInventory.start_time),
            currency: session.currency,
            price: session.price,
          },
        ],
      };

      // Default case, book single class;
      const payload = {
        inventory_id: parseInt(selectedInventory.inventory_id),
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        payment_source: paymentSource.GATEWAY,
      };

      showPaymentPopup(paymentPopupData, async (couponCode = '') => await buySingleClass(payload, couponCode));
    }
  };

  const buySingleClass = async (payload, couponCode = '') => {
    setIsLoading(true);

    try {
      const { status, data } = await bookClass(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        const inventoryId = selectedInventory.inventory_id;

        if (data.payment_required) {
          return {
            ...data,
            payment_order_id: data.order_id,
            payment_order_type: orderType.CLASS,
            inventory_id: inventoryId,
          };
        } else {
          showBookSingleSessionSuccessModal(inventoryId);
          return null;
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      } else if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      }
    }

    return null;
  };

  const buyPassAndBookClass = async (payload, couponCode = '') => {
    setIsLoading(true);

    try {
      const { status, data } = await buyPass(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        const inventoryId = parseInt(selectedInventory.inventory_id);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_id: data.pass_order_id,
            payment_order_type: orderType.PASS,
            follow_up_booking_info: {
              productType: 'SESSION',
              productId: selectedInventory.inventory_id,
            },
          };
        } else {
          // If user (for some reason) buys a free pass (if any exists)
          // we then immediately followUp the Booking Process

          // Normally wouldn't trigger
          const followUpBooking = await bookClass({
            inventory_id: inventoryId,
            user_timezone_offset: new Date().getTimezoneOffset(),
            user_timezone: getCurrentLongTimezone(),
            payment_source: paymentSource.PASS,
            source_id: data.pass_order_id,
          });

          if (isAPISuccess(followUpBooking.status)) {
            showPurchasePassAndBookSessionSuccessModal(data.pass_order_id, inventoryId);
          }

          return null;
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      } else if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      }
    }

    return null;
  };

  const bookClassUsingPass = async (payload) => {
    setIsLoading(true);

    try {
      const { status, data } = await bookClass(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        showBookSessionWithPassSuccessModal(payload.source_id, payload.inventory_id);
        return null;
      }
    } catch (error) {
      setIsLoading(false);
      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      } else if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      }
    }

    return null;
  };

  const bookClassUsingSubscription = async (payload) => {
    setIsLoading(true);

    try {
      const { status, data } = await bookClass(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        showBookSessionWithSubscriptionSuccessModal(payload.inventory_id);
        return null;
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      }
    }

    return null;
  };

  const buyVideo = async (payload, couponCode = '') => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        setSelectedVideo(null);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_id: data.video_order_id,
            payment_order_type: orderType.VIDEO,
          };
        } else {
          showPurchaseSingleVideoSuccessModal(data.video_order_id);

          return null;
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }

    return null;
  };

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      setIncorrectPassword(false);
      // check if user is login

      // NOTE: Reason the check have getLocalUserDetails() and not currentUser
      // is beause if user aleady existing and have to login then value will be
      // set to currentUser where as getLocalUserDetails is only set if user has
      // actually login
      if (!getLocalUserDetails() && values.password) {
        try {
          const { data } = await apis.user.login({
            email: values.email,
            password: values.password,
          });
          if (data) {
            http.setAuthToken(data.auth_token);
            logIn(data, true);
            setCurrentUser(data);
            await getUsablePassesForUser();
            await getUsableSubscriptionForUser();
            setCreateFollowUpOrder(true);
          }
        } catch (error) {
          setIsLoading(false);

          if (error.response?.status === 403 && error.response?.data?.message === 'invalid password passed') {
            setIncorrectPassword(true);
            message.error('Incorrect email or password');
          } else if (!isUnapprovedUserError(error.response)) {
            message.error(error.response?.data?.message || 'Something went wrong');
          }
        }
      } else if (!getLocalUserDetails()) {
        setIsLoading(false);
        signupUser(values);
      } else {
        setIsLoading(false);
        showConfirmPaymentPopup();
      }
    } catch (error) {
      setIsLoading(false);
      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }
  };

  const handleSendNewPasswordEmail = async (email) => {
    try {
      setIsLoading(true);
      const { status } = await sendNewPasswordEmail(email);
      if (isAPISuccess(status)) {
        setIsLoading(false);
        showSetNewPasswordModal(email);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const hideSignInForm = () => {
    setShowSignInForm(false);
    setShowPasswordField(false);
    setIncorrectPassword(false);

    const userDetails = getLocalUserDetails();

    setCurrentUser(userDetails);

    if (userDetails) {
      getUsableSubscriptionForUser();
      getUsablePassesForUser();
      setShouldSetDefaultPass(true);
    }
  };

  const redirectToVideoPreview = (video) => {
    const baseUrl = generateUrlFromUsername(username || video?.username || 'app');
    window.open(`${baseUrl}/v/${video?.external_id}`);
  };

  const redirectToCourseDetails = (course) => {
    const baseUrl = generateUrlFromUsername(username || course?.username || 'app');
    window.open(`${baseUrl}/c/${course?.id}`);
  };

  const openAuthModal = (video) => {
    setSelectedVideo(video);
    setShowPurchaseVideoModal(true);
  };

  const closeAuthModal = (resetSelectedVideo = false) => {
    if (resetSelectedVideo) {
      setSelectedVideo(null);
    }

    setShowPurchaseVideoModal(false);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24}>
          <Image
            preview={false}
            width={'100%'}
            className={classNames(styles.coverImage, styles.mb20)}
            src={session?.session_image_url || 'error'}
            fallback={DefaultImage()}
          />
        </Col>
        <Col xs={24}>
          <Title level={isMobileDevice ? 2 : 1}>{session?.name}</Title>
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={18}>
          <SessionInfo session={session} />
        </Col>
        {creator && (
          <Col xs={6} lg={{ span: 3, offset: 3 }}>
            <Share
              label="Share"
              shareUrl={`${generateUrlFromUsername(creator?.username)}/s/${session.session_id}`}
              title={`${session?.name} - ${creator?.first_name} ${creator?.last_name}`}
            />
          </Col>
        )}
      </Row>
      <Row justify="space-between" className={styles.mt50} gutter={16}>
        <Col xs={24} lg={14}>
          <Title level={5}>Session Information</Title>
          {showDescription ? (
            <div className={styles.longTextExpanded}>{ReactHtmlParser(session?.description)}</div>
          ) : (
            <>
              <div className={styles.sessionDesc}>{ReactHtmlParser(session?.description)}</div>
              <div className={styles.readMoreText} onClick={() => setShowDescription(true)}>
                Read More
              </div>
            </>
          )}
          {session?.prerequisites && (
            <>
              <Title level={5} className={styles.mt50}>
                Session Prerequisite
              </Title>
              {showPrerequisite ? (
                <div className={styles.longTextExpanded}>{ReactHtmlParser(session?.prerequisites)}</div>
              ) : (
                <>
                  <div className={styles.sessionPrereq}>{ReactHtmlParser(session?.prerequisites)}</div>
                  <div className={styles.readMoreText} onClick={() => setShowPrerequisite(true)}>
                    Read More
                  </div>
                </>
              )}
            </>
          )}
        </Col>
        <Col xs={24} lg={{ span: 9, offset: 1 }} className={isMobileDevice ? styles.mt20 : styles.mt50}>
          {creator && <HostDetails host={creator} />}
        </Col>
      </Row>
      {session?.is_course && courses ? (
        courses?.length > 0 && (
          <div className={classNames(styles.mb50, styles.mt20)}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={5}> This session can only be attended by doing this course </Title>
              </Col>
              <Col xs={24}>
                <ShowcaseCourseCard
                  courses={courses}
                  onCardClick={(targetCourse) => redirectToCourseDetails(targetCourse)}
                  username={username}
                />
              </Col>
            </Row>
          </div>
        )
      ) : (
        <>
          <Row justify="space-between" className={styles.mt20} gutter={8}>
            <Col
              xs={24}
              lg={{ span: 14, offset: isMobileDevice ? 1 : 0 }}
              order={isMobileDevice ? 2 : 1}
              className={isMobileDevice ? styles.mt20 : styles.mt50}
            >
              {showSignInForm ? (
                <SignInForm
                  user={currentUser}
                  onSetNewPassword={handleSendNewPasswordEmail}
                  hideSignInForm={() => hideSignInForm()}
                  incorrectPassword={incorrectPassword}
                />
              ) : (
                <SessionRegistration
                  user={currentUser}
                  showPasswordField={showPasswordField}
                  incorrectPassword={incorrectPassword}
                  onFinish={onFinish}
                  onSetNewPassword={handleSendNewPasswordEmail}
                  availablePasses={availablePasses}
                  userPasses={userPasses}
                  setSelectedPass={setSelectedPass}
                  selectedPass={selectedPass}
                  classDetails={session}
                  selectedInventory={selectedInventory}
                  userSubscription={usableUserSubscription}
                  logOut={() => {
                    logOut(history, true);
                    setCurrentUser(null);
                    setSelectedPass(null);
                    setUserPasses([]);
                    setShowSignInForm(true);
                    setIncorrectPassword(false);
                  }}
                  showSignInForm={() => {
                    setShowPasswordField(false);
                    setShowSignInForm(true);
                    setIncorrectPassword(false);
                  }}
                />
              )}
            </Col>
            {!showSignInForm && (
              <Col
                xs={24}
                lg={{ span: 9, offset: isMobileDevice ? 0 : 1 }}
                order={isMobileDevice ? 1 : 2}
                className={isMobileDevice ? styles.mt20 : styles.mt50}
              >
                <SessionInventorySelect
                  inventories={
                    session?.inventory.sort((a, b) =>
                      a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0
                    ) || []
                  }
                  selectedSlot={selectedInventory}
                  handleSubmit={(val) => {
                    setSelectedInventory(val);
                  }}
                />
              </Col>
            )}
          </Row>
          {sessionVideos?.length > 0 && (
            <>
              <AuthModal
                visible={showPurchaseVideoModal}
                closeModal={closeAuthModal}
                onLoggedInCallback={showConfirmPaymentPopup}
              />
              <Row justify="space-between" className={styles.mt20}>
                <Col xs={24}>
                  <div className={styles.box}>
                    <Tabs size="large" defaultActiveKey="Buy" activeKey="Buy">
                      <Tabs.TabPane key="Buy" tab="Buy Recorded Videos" className={styles.videoListContainer}>
                        <Row gutter={[8, 20]}>
                          {sessionVideos?.length > 0 &&
                            sessionVideos?.map((videoDetails) => (
                              <Col xs={24} key={videoDetails.external_id}>
                                <VideoCard
                                  video={videoDetails}
                                  buyable={true}
                                  onCardClick={redirectToVideoPreview}
                                  showAuthModal={openAuthModal}
                                />
                              </Col>
                            ))}
                        </Row>
                      </Tabs.TabPane>
                    </Tabs>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </>
      )}
    </Loader>
  );
};

export default SessionDetails;
