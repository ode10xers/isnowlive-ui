import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, message, Typography } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';

import Routes from 'routes';
import apis from 'apis';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';

import Share from 'components/Share';
import Loader from 'components/Loader';
import SignInForm from 'components/SignInForm';
import HostDetails from 'components/HostDetails';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import SessionRegistration from 'components/SessionRegistration';
import {
  showErrorModal,
  showBookSingleSessionSuccessModal,
  showBookSessionWithPassSuccessModal,
  showPurchasePassAndBookSessionSuccessModal,
  showAlreadyBookedModal,
  showSetNewPasswordModal,
  sendNewPasswordEmail,
} from 'components/Modals/modals';

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

const { Title } = Typography;
const {
  formatDate: { getTimeDiff, toLongDateWithTime },
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

const SoldOutImage = require('assets/images/sold_out.png');

const InventoryDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
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
  const [createFollowUpOrder, setCreateFollowUpOrder] = useState(null);
  const [shouldSetDefaultPass, setShouldSetDefaultPass] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);

  const getDetails = useCallback(
    async (inventory_id) => {
      try {
        const inventoryDetailsResponse = await apis.session.getPublicInventoryById(inventory_id);

        if (isAPISuccess(inventoryDetailsResponse.status) && inventoryDetailsResponse.data) {
          const inventoryDetails = inventoryDetailsResponse.data;

          setSession(inventoryDetails);

          const creatorUsername = inventoryDetails.creator_username || window.location.hostname.split('.')[0];

          const creatorDetailsResponse = await apis.user.getProfileByUsername(creatorUsername);
          if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
            setCreator(creatorDetailsResponse.data);
          } else {
            console.error('Failed to fetch creator of inventory', creatorDetailsResponse);
          }

          const passesResponse = await apis.passes.getPassesBySessionId(inventoryDetails?.session_id);

          if (isAPISuccess(passesResponse.status) && passesResponse.data) {
            setAvailablePasses(passesResponse.data);
          } else {
            console.error('Failed to fetch pass related to inventory', passesResponse);
          }

          setIsLoading(false);
        } else {
          console.error('Failed to fetch inventoryDetails', inventoryDetailsResponse);
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
    try {
      const loggedInUserData = getLocalUserDetails();

      if (loggedInUserData && session) {
        const { data } = await apis.passes.getAttendeePassesForSession(session.session_id);
        setUserPasses(
          data.active.map((userPass) => ({
            ...userPass,
            id: userPass.pass_id,
            name: userPass.pass_name,
            sessions: userPass.session,
          }))
        );
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
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
    if (match.params.inventory_id) {
      const domainUsername = window.location.hostname.split('.')[0];
      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getDetails(match.params.inventory_id);
      }
    } else {
      setIsLoading(false);
      message.error('Session details not found.');
    }
    if (getLocalUserDetails()) {
      setCurrentUser(getLocalUserDetails());
    }

    //eslint-disable-next-line
  }, [match.params.inventory_id]);

  // Logic for when user lands in the page already logged in
  useEffect(() => {
    if (session && getLocalUserDetails() && userPasses.length === 0) {
      getUsablePassesForUser();
      setShouldSetDefaultPass(true);
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

    if (selectedPass) {
      const usersPass = getUserPurchasedPass(false);

      if (usersPass) {
        // Book class using pass
        const paymentPopupData = {
          productId: session.session_id,
          productType: 'SESSION',
          itemList: [
            {
              name: session.name,
              description: toLongDateWithTime(session.start_time),
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
          inventory_id: parseInt(match.params.inventory_id),
          user_timezone_offset: new Date().getTimezoneOffset(),
          user_timezone_location: getTimezoneLocation(),
          user_timezone: getCurrentLongTimezone(),
          payment_source: paymentSource.PASS,
          source_id: usersPass.pass_order_id,
        };

        showPaymentPopup(paymentPopupData, async (couponCode = '') => await bookClassUsingPass(payload, couponCode));
      } else {
        // Buy Pass and Book Class
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
              description: toLongDateWithTime(session.start_time),
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
      // Book Single Class
      const paymentPopupData = {
        productId: session.session_id,
        productType: 'SESSION',
        itemList: [
          {
            name: session.name,
            description: toLongDateWithTime(session.start_time),
            currency: session.currency,
            price: session.price,
          },
        ],
      };

      // Default case, book single class;
      const payload = {
        inventory_id: parseInt(match.params.inventory_id),
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
        const inventoryId = session.inventory_id;

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

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
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
        const inventoryId = parseInt(session.inventory_id);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_id: data.pass_order_id,
            payment_order_type: orderType.PASS,
            follow_up_booking_info: {
              productType: 'SESSION',
              productId: session.inventory_id,
            },
          };
        } else {
          // If user (for some reason) buys a free pass (if any exists)
          // we then immediately followUp the Booking Process

          // Normally wouldn't trigger
          const followUpBooking = await bookClass({
            inventory_id: inventoryId,
            user_timezone_offset: new Date().getTimezoneOffset(),
            user_timezone_location: getTimezoneLocation(),
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
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return null;
  };

  const bookClassUsingPass = async (payload, couponCode = '') => {
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
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
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
      getUsablePassesForUser();
      setShouldSetDefaultPass(true);
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24} className={classNames(styles.imageWrapper, styles.mb20)}>
          <img
            className={styles.coverImage}
            src={session?.session_image_url || DefaultImage()}
            alt="Session Detail"
            width="100%"
          />
          {session?.total_bookings >= session?.max_participants && (
            <div className={styles.darkOverlay}>
              <img className={styles.soldOutImage} src={SoldOutImage} alt="Sold out" />
            </div>
          )}
        </Col>
        <Col xs={24} lg={14}>
          <Title level={isMobileDevice ? 2 : 1}>{session?.name}</Title>
        </Col>
        <Col xs={24} lg={10}>
          <SessionDate schedule={session} />
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
              shareUrl={`${generateUrlFromUsername(creator?.username)}/e/${session.inventory_id}`}
              title={`${session?.name} - ${creator?.first_name} ${creator?.last_name}`}
            />
          </Col>
        )}
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} lg={15}>
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
        <Col xs={24} lg={{ span: 8, offset: 1 }} className={isMobileDevice ? styles.mt20 : styles.mt50}>
          <HostDetails host={creator} />
        </Col>
        <Col xs={24} lg={15} className={isMobileDevice ? styles.mt20 : styles.mt50}>
          {session?.end_time &&
            getTimeDiff(session?.end_time, moment(), 'minutes') > 0 &&
            (showSignInForm ? (
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
                selectedInventory={session}
                logOut={() => {
                  logOut(history, false);
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
            ))}
        </Col>
      </Row>
    </Loader>
  );
};

export default InventoryDetails;
