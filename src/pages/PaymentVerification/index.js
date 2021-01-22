import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import { message, Row } from 'antd';

import Loader from 'components/Loader';
import { showBookingSuccessModal, showErrorModal, showAlreadyBookedModal } from 'components/Modals/modals';

import apis from 'apis';
// import Routes from 'routes';

import dateUtil from 'utils/date';
import parseQueryString from 'utils/parseQueryString';
import { useGlobalContext } from 'services/globalContext';
import { isAPISuccess, paymentSource, orderType } from 'utils/helper';

const {
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const PaymentVerification = () => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const location = useLocation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const { order_id, transaction_id, order_type, inventory_id } = parseQueryString(location.search);

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
              let usersPass = null;
              const userPassResponse = await apis.passes.getAttendeePasses();
              if (isAPISuccess(userPassResponse.status)) {
                usersPass = userPassResponse.data.filter((userPass) => userPass.pass_order_id === order_id)[0];
              } else {
                showErrorModal('Something wrong happened', "Failed to fetch user's pass list");
              }

              if (inventory_id) {
                try {
                  //Continue to book the class after Pass Purchase is successful
                  const followUpBooking = await apis.session.createOrderForUser({
                    inventory_id: parseInt(inventory_id),
                    user_timezone_offset: new Date().getTimezoneOffset(),
                    user_timezone: getCurrentLongTimezone(),
                    payment_source: paymentSource.CLASS_PASS,
                    source_id: order_id,
                  });

                  if (isAPISuccess(followUpBooking.status)) {
                    showBookingSuccessModal(userDetails.email, usersPass, true, true);
                  }
                } catch (error) {
                  if (
                    error.response?.data?.message ===
                    'It seems you have already booked this session, please check your dashboard'
                  ) {
                    showAlreadyBookedModal(false);
                  }
                }
              } else {
                showBookingSuccessModal(userDetails.email, usersPass, false, false);
              }
            } else {
              showBookingSuccessModal(userDetails.email, null, false, false);
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
      // history.push(Routes.attendeeDashboard.rootPath);
    }
  }, [order_id, transaction_id, order_type, inventory_id, history, userDetails]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Verifying order payment"></Loader>
    </Row>
  );
};

export default PaymentVerification;
