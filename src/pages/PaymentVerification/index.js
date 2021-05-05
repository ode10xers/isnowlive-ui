import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import { message, Row } from 'antd';

import Loader from 'components/Loader';
import {
  showBookSingleSessionSuccessModal,
  showPurchasePassSuccessModal,
  showPurchasePassAndBookSessionSuccessModal,
  showErrorModal,
  showAlreadyBookedModal,
  showPurchaseSingleVideoSuccessModal,
  showPurchaseSingleCourseSuccessModal,
  showPurchasePassAndGetVideoSuccessModal,
} from 'components/Modals/modals';

import apis from 'apis';

import dateUtil from 'utils/date';
import parseQueryString from 'utils/parseQueryString';
import { isAPISuccess, paymentSource, orderType, productType } from 'utils/helper';

const {
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

// TODO: This page is no longer used, since in page payment is implemented
const PaymentVerification = () => {
  const location = useLocation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const { order_id, transaction_id, order_type, inventory_id, video_id } = parseQueryString(location.search);

  useEffect(() => {
    if (order_id && transaction_id) {
      const verifyPayment = async () => {
        setIsLoading(true);

        try {
          const { status } = await apis.payment.verifyPaymentForOrder({
            order_id,
            transaction_id,
            order_type,
          });

          if (isAPISuccess(status)) {
            if (order_type === orderType.PASS) {
              // It's a pass purchase, but there are several possibilites after this

              if (inventory_id) {
                // if inventory_id is present in query params
                // it is the BUY PASS AND BOOK CLASS flow
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
                    showPurchasePassAndBookSessionSuccessModal(order_id, inventory_id);
                  }
                } catch (error) {
                  if (
                    error.response?.data?.message ===
                    'It seems you have already booked this session, please check your dashboard'
                  ) {
                    showAlreadyBookedModal(productType.CLASS);
                  } else {
                    showErrorModal('Something went wrong', error.response?.data?.message);
                  }
                }
              } else if (video_id) {
                // if video_id is present in query params
                // it is the BUY PASS AND GET VIDEO flow
                try {
                  // Continue to book the video after Pass Purchase is successful
                  const followUpGetVideo = await apis.videos.createOrderForUser({
                    video_id: video_id,
                    payment_source: paymentSource.PASS,
                    source_id: order_id,
                    user_timezone_location: getTimezoneLocation(),
                  });

                  if (isAPISuccess(followUpGetVideo.status)) {
                    showPurchasePassAndGetVideoSuccessModal(order_id);
                  }
                } catch (error) {
                  if (error.response?.data?.message === 'user already has a confirmed order for this video') {
                    showAlreadyBookedModal(productType.VIDEO);
                  } else {
                    showErrorModal('Something went wrong', error.response?.data?.message);
                  }
                }
              } else {
                // if both inventory_id and video_id is not present
                // it is just a BUY PASS flow
                showPurchasePassSuccessModal(order_id);
              }
            } else if (order_type === orderType.VIDEO) {
              // it is a video purchase
              showPurchaseSingleVideoSuccessModal(order_id);
            } else if (order_type === orderType.COURSE) {
              // it is a course purchase
              showPurchaseSingleCourseSuccessModal();
            } else {
              // it is a session purchase
              // We actually need the inventory_id here, but this page will
              // not be used anymore so I'm leaving this here
              showBookSingleSessionSuccessModal();
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
  }, [order_id, transaction_id, order_type, inventory_id, video_id, history]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Verifying order payment"></Loader>
    </Row>
  );
};

export default PaymentVerification;
