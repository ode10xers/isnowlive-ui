import React, { useState } from 'react';

import { Button, Col, Row } from 'antd';

import Loader from 'components/Loader';

import styles from './styles.module.scss';

// NOTE: Currently unused
const RedirectToStripeCheckoutButton = ({ onBeforePayment, methodName, helperText, paymentMethods = [] }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckoutButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    alert(`
      1) FE hits create order followed by Create Payment Session API, while passing array of payment
         methods usable for this checkout session. For example, for ${methodName} FE will pass ${JSON.stringify(
      paymentMethods
    )}. Will need to discuss because those options 
         can have different criterias
      2) After Create Payment Session API is successfully hit and returns a Checkout Session ID, FE can
         use that ID to redirect to Stripe's Checkout Page via Stripe.js library.
      3) The rest should follow the old payment flow, however different payment methods might return 
         different query parameters so might need to take a look at it as well
    `);
    setIsLoading(false);
  };

  return (
    <Loader loading={isLoading} text="Processing payment request...">
      <Row gutter={[8, 8]} justify="center">
        <Col xs={24}>{helperText}</Col>
        {methodName && (
          <Col xs={24} md={18}>
            <Button
              block
              type="primary"
              size="large"
              onClick={handleCheckoutButtonClick}
              className={styles.greenBtn}
              disabled={paymentMethods.length === 0}
            >
              Select {methodName} option
            </Button>
          </Col>
        )}
      </Row>
    </Loader>
  );
};

export default RedirectToStripeCheckoutButton;
