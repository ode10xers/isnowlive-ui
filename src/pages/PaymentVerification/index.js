import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import { message, Row } from 'antd';
import Loader from 'components/Loader';
import apis from 'apis';
import Routes from 'routes';
import { isAPISuccess } from 'utils/helper';
import parseQueryString from 'utils/parseQueryString';

const PaymentVerification = () => {
  const location = useLocation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);

  const { order_id, transaction_id } = parseQueryString(location.search);

  useEffect(() => {
    if (order_id && transaction_id) {
      const verifyPayment = async () => {
        setIsLoading(true);
        try {
          const { status } = await apis.payment.verifyPaymentForOrder({
            order_id,
            transaction_id,
          });

          if (isAPISuccess(status)) {
            message.success('Order booked successfully.')
            history.push(Routes.attendeeDashboard.rootPath);
          }
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          message.error(error.response?.data?.message || 'Something went wrong.');
        }
      }
      verifyPayment();
    } else {
      setIsLoading(false);
      message.error('Something went wrong.');
      history.push(Routes.attendeeDashboard.rootPath);
    }
  }, [order_id, transaction_id, history]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Verifying order payment"></Loader>
    </Row>
  )
}

export default PaymentVerification;