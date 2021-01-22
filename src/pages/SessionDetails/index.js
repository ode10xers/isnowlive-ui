import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography } from 'antd';
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
import DefaultImage from 'components/Icons/DefaultImage/index';
import SessionRegistration from 'components/SessionRegistration';
import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername, isAPISuccess, paymentSource, orderType } from 'utils/helper';
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

const stripePromise = loadStripe(config.stripe.secretKey);

const reservedDomainName = ['app', ...(process.env.NODE_ENV !== 'development' ? ['localhost'] : [])];
const { Title, Paragraph } = Typography;
const {
  formatDate: { getTimeDiff },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const SessionDetails = ({ match, history }) => {
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

  const getDetails = useCallback(
    async (username, inventory_id) => {
      try {
        const inventoryDetails = await apis.session.getPublicInventoryById(inventory_id);
        const userDetails = await apis.user.getProfileByUsername(username);
        const passes = await apis.passes.getPassesBySessionId(inventoryDetails.data.session_id);
        setSession(inventoryDetails.data);
        setCreator(userDetails.data);
        setAvailablePasses(passes.data.map((pass) => ({ ...pass, user_usable: false })));
        setIsLoading(false);
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        history.push(Routes.root);
      }
    },
    [history]
  );

  const getUsablePassesForUser = async () => {
    try {
      const loggedInUserData = getLocalUserDetails();

      if (loggedInUserData) {
        const { data } = await apis.passes.getAttendeePassesForSession(session.session_id);
        setUserPasses(
          data.map((userPass) => ({
            ...userPass,
            id: userPass.pass_id,
            name: userPass.pass_name,
            sessions: userPass.session,
          }))
        );
        setSelectedPass(getUserPurchasedPass());
      }
    } catch (error) {
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  };

  const getUserPurchasedPass = () => {
    if (userPasses.length) {
      if (selectedPass) {
        return userPasses.filter((userPass) => userPass.pass_id === selectedPass.id)[0];
      } else {
        return userPasses[0];
      }
    }

    return null;
  };

  useEffect(() => {
    if (match.params.inventory_id) {
      const username = window.location.hostname.split('.')[0];
      if (username && !reservedDomainName.includes(username)) {
        getDetails(username, match.params.inventory_id);
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

  useEffect(() => {
    if (createFollowUpOrder) {
      createOrder(createFollowUpOrder);
    }

    //eslint-disable-next-line
  }, [createFollowUpOrder]);

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
        message.info('Enter password to register session');
      } else {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }
  };

  const initiatePaymentForOrder = async (orderDetails) => {
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
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const bookClass = async (payload) => await apis.session.createOrderForUser(payload);
  const buyPass = async (payload) => await apis.passes.createOrderForUser(payload);

  const createOrder = async (userEmail) => {
    setCreateFollowUpOrder(null);
    try {
      // Default payload if user book single class
      let payload = {
        inventory_id: parseInt(match.params.inventory_id),
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone: getCurrentLongTimezone(),
        payment_source: paymentSource.GATEWAY,
      };
      let usersPass = null;

      if (selectedPass) {
        // payment_source will be PAYMENT_GATEWAY if payment is required
        // e.g. user buys single class / user buys new pass
        // Booking class after pass is bought will be done in redirection

        usersPass = getUserPurchasedPass();

        if (usersPass) {
          payload = {
            ...payload,
            payment_source: paymentSource.CLASS_PASS,
            source_id: usersPass.pass_order_id,
          };
        } else {
          payload = {
            pass_id: selectedPass.id,
            price: selectedPass.price,
            currency: selectedPass.currency,
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
          if (selectedPass && !usersPass) {
            // If user (for some reason) buys a free pass (if any exists)
            // we then immediately followUp the Booking Process
            const followUpBooking = await bookClass({
              inventory_id: parseInt(match.params.inventory_id),
              user_timezone_offset: new Date().getTimezoneOffset(),
              user_timezone: getCurrentLongTimezone(),
              payment_source: paymentSource.CLASS_PASS,
              source_id: data.pass_order_id,
            });

            if (isAPISuccess(followUpBooking.status)) {
              showBookingSuccessModal(userEmail, usersPass);
            }
          } else {
            showBookingSuccessModal(userEmail, usersPass);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(false);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(true);
      }
    }
  };

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
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
            setCreateFollowUpOrder(values.email);
          }
        } catch (error) {
          setIsLoading(false);
          message.error(error.response?.data?.message || 'Something went wrong');
        }
      } else if (!getLocalUserDetails()) {
        signupUser(values);
      } else {
        createOrder(values.email);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
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

    const userDetails = getLocalUserDetails();

    setCurrentUser(userDetails);

    if (userDetails) getUsablePassesForUser();
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
        <Col xs={24} lg={13}>
          <Title level={isMobileDevice ? 2 : 1}>{session?.name}</Title>
        </Col>
        <Col xs={24} lg={11}>
          <SessionDate schedule={session} />
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} lg={12}>
          <SessionInfo session={session} />
        </Col>
        <Col xs={24} lg={9}></Col>
        {creator && (
          <Col xs={24} lg={3}>
            <Share
              label="Share"
              shareUrl={`${generateUrlFromUsername(creator?.username)}/e/${session.inventory_id}`}
              title={`${session?.name} - ${creator?.first_name} ${creator?.last_name}`}
            />
          </Col>
        )}
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} lg={14}>
          <Title level={5}>Session Information</Title>
          {showDescription ? (
            <Paragraph type="secondary"> {ReactHtmlParser(session?.description)}</Paragraph>
          ) : (
            <>
              <Paragraph type="secondary" className={styles.sessionDesc} ellipsis={{ rows: 5 }}>
                {ReactHtmlParser(session?.description)}
              </Paragraph>
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
                <Paragraph type="secondary"> {ReactHtmlParser(session?.prerequisites)}</Paragraph>
              ) : (
                <>
                  <Paragraph type="secondary" className={styles.sessionPrereq} ellipsis={{ rows: 5 }}>
                    {ReactHtmlParser(session?.prerequisites)}
                  </Paragraph>
                  <div className={styles.readMoreText} onClick={() => setShowPrerequisite(true)}>
                    Read More
                  </div>
                </>
              )}
            </>
          )}
        </Col>
        <Col xs={24} lg={1}></Col>
        <Col xs={24} lg={9}>
          <HostDetails host={creator} />
        </Col>
        <Col xs={24} lg={showSignInForm ? 14 : 18} className={styles.mt50}>
          {session?.end_time &&
            getTimeDiff(session?.end_time, moment(), 'minutes') > 0 &&
            (showSignInForm ? (
              <SignInForm user={currentUser} hideSignInForm={() => hideSignInForm()} />
            ) : (
              <SessionRegistration
                user={currentUser}
                showPasswordField={showPasswordField}
                onFinish={onFinish}
                onSetNewPassword={handleSendNewPasswordEmail}
                showSignInForm={() => setShowSignInForm(true)}
                availablePasses={availablePasses}
                userPasses={userPasses}
                setSelectedPass={setSelectedPass}
                selectedPass={selectedPass}
                classDetails={session}
                logOut={() => {
                  logOut(history, false);
                  setCurrentUser(null);
                  setShowSignInForm(true);
                }}
              />
            ))}
        </Col>
      </Row>
    </Loader>
  );
};

export default SessionDetails;
