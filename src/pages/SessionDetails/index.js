import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography, Tabs } from 'antd';
import classNames from 'classnames';
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
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import VideoCard from 'components/VideoCard';
import PurchasePassModal from 'components/PurchasePassModal';
import SessionRegistration from 'components/SessionRegistration';
import SessionInventorySelect from 'components/SessionInventorySelect';
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
const { Title } = Typography;
const {
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
  timeCalculation: { isBeforeDate },
} = dateUtil;

const SessionDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const {
    state: { userDetails },
    logIn,
    logOut,
  } = useGlobalContext();
  const [showDescription, setShowDescription] = useState(false);
  const [showPrerequisite, setShowPrerequisite] = useState(false);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [availablePasses, setAvailablePasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [userPasses, setUserPasses] = useState([]);
  const [createFollowUpOrder, setCreateFollowUpOrder] = useState(null);
  const [shouldSetDefaultPass, setShouldSetDefaultPass] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [sessionVideos, setSessionVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);

  const getDetails = useCallback(
    async (username, session_id) => {
      try {
        const sessionDetails = await apis.session.getSessionDetails(session_id);
        const userDetails = await apis.user.getProfileByUsername(username);
        const passes = await apis.passes.getPassesBySessionId(session_id);
        setSession({
          ...sessionDetails.data,
          inventory: sessionDetails.data.inventory.filter(
            (inventory) => inventory.num_participants < sessionDetails.data.max_participants
          ),
        });
        setCreator(userDetails.data);
        setAvailablePasses(passes.data);
        setIsLoading(false);
        const latestInventories = sessionDetails.data.inventory
          .filter((inventory) => isBeforeDate(inventory.end_time))
          .filter((inventory) => inventory.num_participants < sessionDetails.data.max_participants)
          .sort((a, b) => (a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0));
        setSelectedInventory(latestInventories.length > 0 ? latestInventories[0] : null);

        // Using dummy data
        setSessionVideos([
          {
            title: 'Test Video 1',
            description:
              '\u003cp\u003e\u003cspan style="color: rgb(0,0,0);background-color: rgb(255,255,255);font-size: 14px;font-family: Open Sans", Arial, sans-serif;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. Cras molestie diam id varius tristique. In felis nisi, lacinia ac urna vitae, pulvinar dapibus mauris. Integer consectetur ultricies arcu, nec elementum leo bibendum a. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ultricies arcu ex, vulputate congue ante tempor ut. Phasellus ut risus eu justo egestas lobortis nec at lectus. Pellentesque at orci purus. Nam eleifend lectus ante, vel vulputate enim lobortis id. Morbi ut libero vitae risus porta interdum eu eget nulla. Nam porta efficitur magna, quis elementum elit viverra id. Donec sagittis dapibus felis eu imperdiet. Donec ut urna egestas, venenatis ex vitae, pretium diam. Aenean rutrum justo sit amet commodo scelerisque.\u003c/span\u003e\u003c/p\u003e\n',
            validity: 24,
            price: 10,
            currency: 'SGD',
            thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/mbzyHe0nLTcCMArD_difpsf3i2n68p22m_op.jpg',
            sessions: [
              {
                session_id: 62,
                price: 0,
                currency: '',
                max_participants: 2,
                group: true,
                name: 'test sesison',
                description: 'some session details',
                session_image_url:
                  'https://dkfqbuenrrvge.cloudfront.net/image/cudRIEOMNoFVnyWD_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
                category: '',
                sub_category: '',
                duration: 0,
                document_url: '',
                beginning: '0001-01-01 00:00:00 +0000 +0000',
                expiry: '0001-01-01 00:00:00 +0000 +0000',
                prerequisites: '',
                pay_what_you_want: false,
                recurring: false,
                is_active: true,
                is_refundable: false,
                refund_before_hours: 0,
                color_code: '',
              },
              {
                session_id: 72,
                price: 10,
                currency: 'SGD',
                max_participants: 2,
                group: true,
                name: 'New session',
                description:
                  '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
                session_image_url:
                  'https://dkfqbuenrrvge.cloudfront.net/image/55eQ4KNcglY5ipnc_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
                category: '',
                sub_category: '',
                duration: 0,
                document_url: 'https://dkfqbuenrrvge.cloudfront.net/document/lc1nnjFflOFV4fW4_test.pdf',
                beginning: '2020-12-01 00:00:00 +0000 +0000',
                expiry: '2020-12-31 00:00:00 +0000 +0000',
                prerequisites:
                  '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
                pay_what_you_want: false,
                recurring: true,
                is_active: true,
                is_refundable: false,
                refund_before_hours: 24,
                color_code: '',
              },
            ],
            external_id: '7a4a977f-4504-4ac6-b22e-be4571c23ce0',
            is_published: true,
            video_url: '',
            video_uid: '',
            duration: 0,
            status: '',
          },
          {
            title: 'Test Video 1',
            description:
              '\u003cp\u003e\u003cspan style="color: rgb(0,0,0);background-color: rgb(255,255,255);font-size: 14px;font-family: Open Sans", Arial, sans-serif;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. Cras molestie diam id varius tristique. In felis nisi, lacinia ac urna vitae, pulvinar dapibus mauris. Integer consectetur ultricies arcu, nec elementum leo bibendum a. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ultricies arcu ex, vulputate congue ante tempor ut. Phasellus ut risus eu justo egestas lobortis nec at lectus. Pellentesque at orci purus. Nam eleifend lectus ante, vel vulputate enim lobortis id. Morbi ut libero vitae risus porta interdum eu eget nulla. Nam porta efficitur magna, quis elementum elit viverra id. Donec sagittis dapibus felis eu imperdiet. Donec ut urna egestas, venenatis ex vitae, pretium diam. Aenean rutrum justo sit amet commodo scelerisque.\u003c/span\u003e\u003c/p\u003e\n',
            validity: 24,
            price: 10,
            currency: 'SGD',
            thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/mbzyHe0nLTcCMArD_difpsf3i2n68p22m_op.jpg',
            sessions: [
              {
                session_id: 62,
                price: 0,
                currency: '',
                max_participants: 2,
                group: true,
                name: 'test sesison',
                description: 'some session details',
                session_image_url:
                  'https://dkfqbuenrrvge.cloudfront.net/image/cudRIEOMNoFVnyWD_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
                category: '',
                sub_category: '',
                duration: 0,
                document_url: '',
                beginning: '0001-01-01 00:00:00 +0000 +0000',
                expiry: '0001-01-01 00:00:00 +0000 +0000',
                prerequisites: '',
                pay_what_you_want: false,
                recurring: false,
                is_active: true,
                is_refundable: false,
                refund_before_hours: 0,
                color_code: '',
              },
              {
                session_id: 73,
                price: 10,
                currency: 'SGD',
                max_participants: 2,
                group: true,
                name: 'New session',
                description:
                  '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
                session_image_url:
                  'https://dkfqbuenrrvge.cloudfront.net/image/55eQ4KNcglY5ipnc_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
                category: '',
                sub_category: '',
                duration: 0,
                document_url: 'https://dkfqbuenrrvge.cloudfront.net/document/lc1nnjFflOFV4fW4_test.pdf',
                beginning: '2020-12-01 00:00:00 +0000 +0000',
                expiry: '2020-12-31 00:00:00 +0000 +0000',
                prerequisites:
                  '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
                pay_what_you_want: false,
                recurring: true,
                is_active: true,
                is_refundable: false,
                refund_before_hours: 24,
                color_code: '',
              },
            ],
            external_id: '7a4a977f-4504-4ac6-b22e-be4571c23ce0',
            is_published: true,
            video_url: '',
            video_uid: '',
            duration: 0,
            status: '',
          },
        ]);
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
      showErrorModal('Something went wrong', error.response?.data?.message);
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
    if (match.params.session_id) {
      const username = window.location.hostname.split('.')[0];
      if (username && !reservedDomainName.includes(username)) {
        getDetails(username, match.params.session_id);
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
    setIsLoading(true);
    try {
      let payload = {
        order_id: orderDetails.order_id,
        order_type: selectedPass ? orderType.PASS : orderType.CLASS,
      };

      if (selectedPass) {
        payload = {
          ...payload,
          inventory_id: parseInt(selectedInventory.inventory_id),
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
    setIsLoading(false);
  };

  const bookClass = async (payload) => await apis.session.createOrderForUser(payload);
  const buyPass = async (payload) => await apis.passes.createOrderForUser(payload);

  const createOrder = async (userEmail) => {
    setCreateFollowUpOrder(null);
    try {
      // Default payload if user book single class
      let payload = {
        inventory_id: parseInt(selectedInventory.inventory_id),
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
          const username = window.location.hostname.split('.')[0];

          if (selectedPass) {
            if (!usersPass) {
              // If user (for some reason) buys a free pass (if any exists)
              // we then immediately followUp the Booking Process
              const followUpBooking = await bookClass({
                inventory_id: parseInt(selectedInventory.inventory_id),
                user_timezone_offset: new Date().getTimezoneOffset(),
                user_timezone: getCurrentLongTimezone(),
                payment_source: paymentSource.CLASS_PASS,
                source_id: data.pass_order_id,
              });

              if (isAPISuccess(followUpBooking.status)) {
                showBookingSuccessModal(userEmail, selectedPass, true, false, username);
                setIsLoading(false);
              }
            } else {
              showBookingSuccessModal(userEmail, selectedPass, true, false, username);
              setIsLoading(false);
            }
          } else {
            showBookingSuccessModal(userEmail, null, false, false, username);
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      const username = window.location.hostname.split('.')[0];

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(false, username);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(true, username);
      }
    }
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
            setCreateFollowUpOrder(values.email);
          }
        } catch (error) {
          setIsLoading(false);

          if (error.response?.status === 403) {
            setIncorrectPassword(true);
            message.error('Incorrect email or password');
          } else {
            message.error(error.response?.data?.message || 'Something went wrong');
          }
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
    setShowPasswordField(false);
    setIncorrectPassword(false);

    const userDetails = getLocalUserDetails();

    setCurrentUser(userDetails);

    if (userDetails) {
      getUsablePassesForUser();
      setShouldSetDefaultPass(true);
    }
  };

  const redirectToVideoPreview = (video) => {
    if (video.username) {
      const baseUrl = generateUrlFromUsername(video.username || 'app');
      window.open(`${baseUrl}/v/${video.id}`);
    }
  };

  //TODO: Need to implement showing the modal properly
  const showPurchaseModal = (video) => {
    setSelectedVideo(video);
    setShowPurchaseVideoModal(true);
  };

  const closePurchaseModal = () => {
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
        <Col xs={24} lg={13}>
          <Title level={isMobileDevice ? 2 : 1}>{session?.name}</Title>
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={12}>
          <SessionInfo session={session} />
        </Col>
        {creator && (
          <Col xs={{ span: 5, offset: 4 }} lg={{ span: 3, offset: 9 }}>
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
          <HostDetails host={creator} />
        </Col>
      </Row>
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
      {sessionVideos.length > 0 && (
        <>
          <PurchasePassModal visible={showPurchaseVideoModal} video={selectedVideo} closeModal={closePurchaseModal} />
          <Row justify="space-between" className={styles.mt20}>
            <Col xs={24}>
              <div className={styles.box}>
                <Tabs size="large" defaultActiveKey="Buy" activeKey="Buy">
                  <Tabs.TabPane key="Buy" tab="Buy Recorded Videos" className={styles.videoListContainer}>
                    <Row gutter={[8, 20]}>
                      {sessionVideos.length > 0 &&
                        sessionVideos.map((videoDetails) => (
                          <div key={videoDetails.id}>
                            <Col xs={24}>
                              <VideoCard
                                video={videoDetails}
                                buyable={true}
                                onCardClick={redirectToVideoPreview}
                                showPurchaseModal={showPurchaseModal}
                              />
                            </Col>
                          </div>
                        ))}
                    </Row>
                  </Tabs.TabPane>
                </Tabs>
              </div>
            </Col>
          </Row>
        </>
      )}
    </Loader>
  );
};

export default SessionDetails;
