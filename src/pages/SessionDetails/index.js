import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography, Modal } from 'antd';
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
import dateUtil from 'utils/date';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const reservedDomainName = ['app', ...(process.env.NODE_ENV !== 'development' ? ['localhost'] : [])];
const { Title } = Typography;
const {
  formatDate: { getTimeDiff },
} = dateUtil;

const SessionDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { logIn } = useGlobalContext();

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
        createOrder();
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
      })

      if (isAPISuccess(status)) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...')
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }

  }


  const createOrder = async () => {
    try {

      const { status, data } = await apis.session.createOrderForUser({
        inventory_id: parseInt(match.params.inventory_id),
      });

      if (isAPISuccess(status)) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          Modal.success({
            content: 'Session is been booked successfully',
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
          content: 'It seems you have already booked this session, please check your dashboard',
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
            createOrder();
          }
        } catch (error) {
          setIsLoading(false);
          message.error(error.response?.data?.message || 'Something went wrong');
        }
      } else if (!getLocalUserDetails()) {
        signupUser(values);
      } else {
        createOrder();
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const sendNewPasswordEmail = async (email) => {
    try {
      setIsLoading(true);
      const { status } = await apis.user.sendNewPasswordEmail({ email });
      if (isAPISuccess(status)) {
        setIsLoading(false);
        message.success('Email sent successfully.');
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
            height={300}
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
          <Title type="secondary" level={5}>
            {ReactHtmlParser(session?.description)}
          </Title>
          <Title level={5} className={styles.mt50}>
            Session Prerequisite
          </Title>
          <Title type="secondary" level={5}>
            {ReactHtmlParser(session?.prerequisites)}
          </Title>
        </Col>
        <Col xs={24} lg={1}></Col>
        <Col xs={24} lg={9}>
          <HostDetails host={creator} />
        </Col>
        <Col xs={24} lg={15} className={styles.mt50}>
          {session?.start_time && getTimeDiff(session?.start_time, moment(), 'minutes') > 0 && (
            <SessionRegistration
              user={currentUser}
              showPasswordField={showPasswordField}
              onFinish={onFinish}
              onSetNewPassword={sendNewPasswordEmail}
            />
          )}
        </Col>
      </Row>
    </Loader>
  );
};

export default SessionDetails;
