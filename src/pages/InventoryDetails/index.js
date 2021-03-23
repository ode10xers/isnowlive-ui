import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, message, Typography } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import Routes from 'routes';
import apis from 'apis';
import http from 'services/http';
import Share from 'components/Share';
import Loader from 'components/Loader';
import SignInForm from 'components/SignInForm';
import HostDetails from 'components/HostDetails';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import SessionRegistration from 'components/SessionRegistration';
import { isMobileDevice } from 'utils/device';
import {
  generateUrlFromUsername,
  isAPISuccess,
  paymentSource,
  orderType,
  productType,
  reservedDomainName,
} from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { useGlobalContext } from 'services/globalContext';
import dateUtil from 'utils/date';

import styles from './style.module.scss';
import {
  showErrorModal,
  showBookingSuccessModal,
  showAlreadyBookedModal,
  showSetNewPasswordModal,
  sendNewPasswordEmail,
} from 'components/Modals/modals';
import { useTranslation } from 'react-i18next';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Title } = Typography;
const {
  formatDate: { getTimeDiff },
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

const SoldOutImage = require('assets/images/sold_out.png');

const InventoryDetails = ({ match, history }) => {
  const { t: translate } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { logIn, logOut } = useGlobalContext();
  const [showDescription, setShowDescription] = useState(false);
  const [showPrerequisite, setShowPrerequisite] = useState(false);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [availablePasses, setAvailablePasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [userPasses, setUserPasses] = useState([]);
  const [createFollowUpOrder, setCreateFollowUpOrder] = useState(null);
  const [shouldSetDefaultPass, setShouldSetDefaultPass] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [username, setUsername] = useState(null);

  const getDetails = useCallback(
    async (inventory_id) => {
      try {
        const inventoryDetailsResponse = await apis.session.getPublicInventoryById(inventory_id);

        if (isAPISuccess(inventoryDetailsResponse.status) && inventoryDetailsResponse.data) {
          const inventoryDetails = inventoryDetailsResponse.data;

          setSession(inventoryDetails);

          const creatorUsername = inventoryDetails.creator_username || window.location.hostname.split('.')[0];
          setUsername(creatorUsername);

          const creatorDetailsResponse = await apis.user.getProfileByUsername(creatorUsername);
          if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
            setCreator(creatorDetailsResponse.data);
          } else {
            console.error('Failed to fetch creator of inventory', creatorDetailsResponse);
          }

          const passesResponse = await apis.passes.getPassesBySessionId(inventoryDetails?.session_id);

          if (isAPISuccess(passesResponse.response) && passesResponse.data) {
            setAvailablePasses(passesResponse.data);
          } else {
            console.error('Failed to fetch pass related to inventory', passesResponse);
          }

          setIsLoading(false);
        } else {
          console.error('Failed to fetch inventoryDetails', inventoryDetailsResponse);
        }
      } catch (error) {
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
      showErrorModal(translate('SOMETHING_WENT_WRONG'), error.response?.data?.message);
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
      message.error(translate('SESSION_DETAILS_NOT_FOUND'));
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
      createOrder(createFollowUpOrder);
    }

    //eslint-disable-next-line
  }, [createFollowUpOrder]);

  useEffect(() => {
    if (userPasses.length && shouldSetDefaultPass) {
      setSelectedPass(getUserPurchasedPass(true));
    }
    //eslint-disable-next-line
  }, [userPasses, shouldSetDefaultPass]);

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
        createOrder(values.email);
      }
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message === 'user already exists') {
        setIsLoading(false);
        setShowPasswordField(true);
        setCurrentUser(values);
        message.info(translate('ENTER_PASSWORD_TO_REGISTER_SESSION'));
      } else {
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
      }
    }
  };

  const initiatePaymentForOrder = async (orderDetails) => {
    setIsLoading(true);
    try {
      let payload = {
        order_id: orderDetails.order_id,
        order_type: selectedPass ? orderType.PASS : orderType.CLASS,
      };

      if (selectedPass) {
        payload = {
          ...payload,
          inventory_id: parseInt(match.params.inventory_id),
        };
      }

      const { data, status } = await apis.payment.createPaymentSessionForOrder(payload);

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...');
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }
    setIsLoading(false);
  };

  const bookClass = async (payload) => await apis.session.createOrderForUser(payload);
  const buyPass = async (payload) => await apis.passes.createOrderForUser(payload);

  const getAttendeeOrderDetails = async (orderId) => {
    try {
      const { status, data } = await apis.session.getAttendeeUpcomingSession();

      if (isAPISuccess(status) && data) {
        return data.find((orderDetails) => orderDetails.order_id === orderId);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || translate('FAILED_FETCH_ATTENDEE_ORDER_DETAILS'));
    }

    return null;
  };

  const createOrder = async (userEmail) => {
    setCreateFollowUpOrder(null);
    try {
      // Default payload if user book single class
      let payload = {
        inventory_id: parseInt(match.params.inventory_id),
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        payment_source: paymentSource.GATEWAY,
      };
      let usersPass = null;

      if (selectedPass) {
        // payment_source will be PAYMENT_GATEWAY if payment is required
        // e.g. user buys single class / user buys new pass
        // Booking class after pass is bought will be done in redirection

        usersPass = getUserPurchasedPass(false);

        if (usersPass) {
          payload = {
            ...payload,
            payment_source: paymentSource.PASS,
            source_id: usersPass.pass_order_id,
          };
        } else {
          payload = {
            pass_id: selectedPass.id,
            price: selectedPass.price,
            currency: selectedPass.currency.toLowerCase(),
          };
        }
      }

      const { status, data } = selectedPass && !usersPass ? await buyPass(payload) : await bookClass(payload);

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          if (selectedPass && !usersPass) {
            initiatePaymentForOrder({ ...data, order_id: data.pass_order_id });
          } else {
            initiatePaymentForOrder(data);
          }
        } else {
          if (selectedPass) {
            if (!usersPass) {
              // If user (for some reason) buys a free pass (if any exists)
              // we then immediately followUp the Booking Process
              const followUpBooking = await bookClass({
                inventory_id: parseInt(match.params.inventory_id),
                user_timezone_offset: new Date().getTimezoneOffset(),
                user_timezone: getCurrentLongTimezone(),
                payment_source: paymentSource.PASS,
                source_id: data.pass_order_id,
              });

              if (isAPISuccess(followUpBooking.status)) {
                const orderDetails = await getAttendeeOrderDetails(followUpBooking.data.order_id);

                showBookingSuccessModal(userEmail, selectedPass, true, false, username, orderDetails);
                setIsLoading(false);
              }
            } else {
              const orderDetails = await getAttendeeOrderDetails(data.order_id);

              showBookingSuccessModal(userEmail, selectedPass, true, false, username, orderDetails);
              setIsLoading(false);
            }
          } else {
            const orderDetails = await getAttendeeOrderDetails(data.order_id);

            showBookingSuccessModal(userEmail, null, false, false, username, orderDetails);
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
      const username = window.location.hostname.split('.')[0];

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS, username);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS, username);
      }
    }
  };

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      setIncorrectPassword(false);
      // check if user is login

      // NOTE: Reason the check have getLocalUserDetails() and not currentUser
      // is because if user already existing and have to login then value will be
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
            setCreateFollowUpOrder(values.email);
          }
        } catch (error) {
          setIsLoading(false);

          if (error.response?.status === 403) {
            setIncorrectPassword(true);
            message.error(translate('INCORRECT_EMAIL_PASSWORD'));
          } else {
            message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
          }
        }
      } else if (!getLocalUserDetails()) {
        signupUser(values);
      } else {
        createOrder(values.email);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
    <Loader loading={isLoading} size="large" text={translate('LOADING_PROFILE')}>
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
          <Title level={5}>{translate('SESSION_INFORMATION')}</Title>
          {showDescription ? (
            <div className={styles.longTextExpanded}>{ReactHtmlParser(session?.description)}</div>
          ) : (
            <>
              <div className={styles.sessionDesc}>{ReactHtmlParser(session?.description)}</div>
              <div className={styles.readMoreText} onClick={() => setShowDescription(true)}>
                {translate('READ_MORE')}
              </div>
            </>
          )}
          {session?.prerequisites && (
            <>
              <Title level={5} className={styles.mt50}>
                {translate('SESSION_PREREQUISITE')}
              </Title>
              {showPrerequisite ? (
                <div className={styles.longTextExpanded}>{ReactHtmlParser(session?.prerequisites)}</div>
              ) : (
                <>
                  <div className={styles.sessionPrereq}>{ReactHtmlParser(session?.prerequisites)}</div>
                  <div className={styles.readMoreText} onClick={() => setShowPrerequisite(true)}>
                    {translate('READ_MORE')}
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
            ))}
        </Col>
      </Row>
    </Loader>
  );
};

export default InventoryDetails;
