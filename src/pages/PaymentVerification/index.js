import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import { message, Row } from 'antd';

import Loader from 'components/Loader';
import {
  showBookingSuccessModal,
  showErrorModal,
  showAlreadyBookedModal,
  showVideoPurchaseSuccessModal,
} from 'components/Modals/modals';

import apis from 'apis';

import dateUtil from 'utils/date';
import parseQueryString from 'utils/parseQueryString';
import { useGlobalContext } from 'services/globalContext';
import { isAPISuccess, paymentSource, orderType, productType } from 'utils/helper';

const {
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

const PaymentVerification = () => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const location = useLocation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const { order_id, transaction_id, order_type, inventory_id, video_id } = parseQueryString(location.search);

  useEffect(() => {
    if (order_id && transaction_id) {
      const verifyPayment = async () => {
        setIsLoading(true);
        const username = window.location.hostname.split('.')[0];

        try {
          const { status } = await apis.payment.verifyPaymentForOrder({
            order_id,
            transaction_id,
            order_type,
          });

          if (isAPISuccess(status)) {
            if (order_type === orderType.PASS) {
              let usersPass = null;
              const userPassResponse = await apis.passes.getAttendeePasses();
              if (isAPISuccess(userPassResponse.status)) {
                usersPass = userPassResponse.data.active.filter((userPass) => userPass.pass_order_id === order_id)[0];
              } else {
                showErrorModal('Something wrong happened', "Failed to fetch user's pass list");
              }

              if (inventory_id) {
                try {
                  //Continue to book the class after Pass Purchase is successful
                  const followUpBooking = await apis.session.createOrderForUser({
                    inventory_id: parseInt(inventory_id),
                    user_timezone_offset: new Date().getTimezoneOffset(),
                    user_timezone_location: getTimezoneLocation(),
                    user_timezone: getCurrentLongTimezone(),
                    payment_source: paymentSource.PASS,
                    source_id: order_id,
                  });

                  if (isAPISuccess(followUpBooking.status)) {
                    showBookingSuccessModal(
                      userDetails.email,
                      { ...usersPass, name: usersPass.pass_name },
                      true,
                      true,
                      username
                    );
                  }
                } catch (error) {
                  if (
                    error.response?.data?.message ===
                    'It seems you have already booked this session, please check your dashboard'
                  ) {
                    showAlreadyBookedModal(productType.CLASS, username);
                  } else {
                    showErrorModal('Something went wrong', error.response?.data?.message);
                  }
                }
              } else if (video_id) {
                try {
                  // Continue to book the video after Pass Purchase is successful
                  const followUpGetVideo = await apis.videos.createOrderForUser({
                    video_id: video_id,
                    payment_source: paymentSource.PASS,
                    source_id: order_id,
                  });

                  if (isAPISuccess(followUpGetVideo.status)) {
                    showVideoPurchaseSuccessModal(
                      userDetails.email,
                      followUpGetVideo.data,
                      { ...usersPass, name: usersPass.pass_name },
                      true,
                      true,
                      username
                    );
                  }
                } catch (error) {
                  if (error.response?.data?.message === 'user already has a confirmed order for this video') {
                    showAlreadyBookedModal(productType.VIDEO, username);
                  } else {
                    showErrorModal('Something went wrong', error.response?.data?.message);
                  }
                }
              } else {
                showBookingSuccessModal(
                  userDetails.email,
                  { ...usersPass, name: usersPass.pass_name },
                  false,
                  false,
                  username
                );
              }
            } else if (order_type === orderType.VIDEO) {
              const { data } = await apis.videos.getAttendeeVideos();

              if (data) {
                const purchasedVideo = data.active.find((video) => video.video_order_id === order_id);
                showVideoPurchaseSuccessModal(userDetails.email, purchasedVideo, null, false, true, username);
              }
            } else {
              showBookingSuccessModal(userDetails.email, null, false, false, username);
            }
          }
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          message.error(error.response?.data?.message || 'Something went wrong.');
        }
      };
      verifyPayment();
    } else {
      setIsLoading(false);
      showErrorModal('Something went wrong');
    }
  }, [order_id, transaction_id, order_type, inventory_id, video_id, history, userDetails]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Verifying order payment"></Loader>
    </Row>
  );
};

export default PaymentVerification;
