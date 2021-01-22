import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography, Button, Modal } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import Routes from 'routes';
import apis from 'apis';
import http from 'services/http';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import SessionRegistration from 'components/SessionRegistration';
import Loader from 'components/Loader';
import DefaultImage from 'components/Icons/DefaultImage/index';
import HostDetails from 'components/HostDetails';
import Share from 'components/Share';
import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername, isAPISuccess, generateUrl } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { useGlobalContext } from 'services/globalContext';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';
import dateUtil from 'utils/date';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const reservedDomainName = ['app', ...(process.env.NODE_ENV !== 'development' ? ['localhost'] : [])];
const { Title, Paragraph, Text } = Typography;
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
  const { logIn } = useGlobalContext();
  const [showDescription, setShowDescription] = useState(false);
  const [showPrerequisite, setShowPrerequisite] = useState(false);

  const getDetails = useCallback(
    async (username, inventory_id) => {
      try {
        const inventoryDetails = await apis.session.getPublicInventoryById(inventory_id);
        const userDetails = await apis.user.getProfileByUsername(username);
        setSession(inventoryDetails.data);
        setCreator(userDetails.data);
        setIsLoading(false);
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        history.push(Routes.root);
      }
    },
    [history]
  );

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
  }, [match.params.inventory_id, getDetails]);

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
      const { data, status } = await apis.payment.createPaymentSessionForOrder({
        order_id: orderDetails.order_id,
      });

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

  const createOrder = async (userEmail) => {
    try {
      const { status, data } = await apis.session.createOrderForUser({
        inventory_id: parseInt(match.params.inventory_id),
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone: getCurrentLongTimezone(),
      });

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          Modal.success({
            title: 'Registration Successful',
            content: (
              <>
                <Paragraph>
                  We have sent you a confirmation email on <Text strong>{userEmail}</Text>. Look out for an email from{' '}
                  <Text strong> friends@passion.do. </Text>
                </Paragraph>
                <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
              </>
            ),
            okText: 'Go To Dashboard',
            onOk: () => (window.location.href = generateUrl() + Routes.attendeeDashboard.rootPath),
          });
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        Modal.warning({
          title: 'Session Already Booked',
          content: 'It seems you have already booked this session, please check your dashboard',
          okText: 'Go To Dashboard',
          onOk: () => (window.location.href = generateUrl() + Routes.attendeeDashboard.rootPath),
        });
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
            createOrder(values.email);
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

  const sendNewPasswordEmail = async (email) => await apis.user.sendNewPasswordEmail({ email });

  const handleSendNewPasswordEmail = async (email) => {
    try {
      setIsLoading(true);
      const { status } = await sendNewPasswordEmail(email);
      if (isAPISuccess(status)) {
        setIsLoading(false);
        Modal.confirm({
          mask: true,
          center: true,
          closable: true,
          maskClosable: true,
          title: 'Set a new password',
          content: (
            <>
              <Paragraph>
                We have sent you a link to setup your new password on your email <Text strong>{email}</Text>.
              </Paragraph>
              <Paragraph>
                <Button className={styles.linkButton} type="link" onClick={() => sendNewPasswordEmail(email)}>
                  Didn't get it? Send again.
                </Button>
              </Paragraph>
            </>
          ),
          okText: 'Okay',
          cancelText: 'Talk to us',
          onCancel: () => openFreshChatWidget(),
        });
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
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
            <Paragraph type="secondary" className={styles.sessionDesc}>
              {' '}
              {ReactHtmlParser(session?.description)}
            </Paragraph>
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
                <Paragraph type="secondary" className={styles.sessionPrereq}>
                  {' '}
                  {ReactHtmlParser(session?.prerequisites)}
                </Paragraph>
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
        <Col xs={24} lg={15} className={styles.mt50}>
          {session?.end_time && getTimeDiff(session?.end_time, moment(), 'minutes') > 0 && (
            <SessionRegistration
              user={currentUser}
              showPasswordField={showPasswordField}
              onFinish={onFinish}
              onSetNewPassword={handleSendNewPasswordEmail}
            />
          )}
        </Col>
      </Row>
    </Loader>
  );
};

export default SessionDetails;
