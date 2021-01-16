import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import { message, Row, Modal, Typography } from 'antd';
import Loader from 'components/Loader';
import apis from 'apis';
import Routes from 'routes';
import config from 'config';
import { isAPISuccess } from 'utils/helper';
import parseQueryString from 'utils/parseQueryString';
import { useGlobalContext } from 'services/globalContext';

const { Text, Paragraph } = Typography;

const PaymentVerification = () => {
  const {
    state: { userDetails },
  } = useGlobalContext();

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
            Modal.success({
              title: 'Registration Successful',
              content: (
                <>
                  <Paragraph>
                    We have sent you a confirmation email on <Text strong> {userDetails.email} </Text>. Look out for an
                    email from <Text strong> friends@passion.do. </Text>
                  </Paragraph>
                  <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
                </>
              ),
              okText: 'Go To Dashboard',
              onOk: () => window.open(config.client.platformBaseURL, '_self'),
            });
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
      message.error('Something went wrong.');
      history.push(Routes.attendeeDashboard.rootPath);
    }
  }, [order_id, transaction_id, history, userDetails]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Verifying order payment"></Loader>
    </Row>
  );
};

export default PaymentVerification;
