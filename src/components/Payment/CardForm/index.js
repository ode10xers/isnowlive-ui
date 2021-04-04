import React, { useMemo, useState } from 'react';
import classNames from 'classnames';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Row, Col } from 'antd';

import { showErrorModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';

import styles from './styles.module.scss';

// Additional CardOptions Reference:
// https://stripe.com/docs/stripe-js/react#customization-and-styling
// https://codesandbox.io/s/react-stripe-js-card-detailed-omfb3?file=/src/App.js:410-877
const useOptions = () => {
  const options = useMemo(
    () => ({
      hidePostalCode: true,
      iconStyle: 'solid',
      classes: {
        base: styles.StripeCustomElement,
        invalid: styles.StripeCustomElementInvalid,
        focus: styles.StripeCustomElementFocus,
        complete: styles.StripeCustomElementComplete,
      },
      style: {
        // Our DodgerBlue in colors.scss
        // Also adjusted the font to match our website
        base: {
          iconColor: '#1890ff',
          fontWeight: 400,
          fontSize: '14px',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
        },
        // Ant Design's Red danger color
        invalid: {
          iconColor: '#ff4d4f',
          color: '#ff4d4f',
        },
        // Our KellyGreen in colors.scss
        complete: {
          iconColor: '#52c41a',
          color: '#52c41a',
        },
      },
    }),
    []
  );

  return options;
};

// NOTE: isFree is a flag sent from PaymentPopup in case the user does not need to pay
// It can be used to bypass button disable condition, hide the card form, etc
const CardForm = ({ btnProps, onBeforePayment, onAfterPayment, isFree }) => {
  const { text = 'PAY' } = btnProps;

  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const makePayment = async (secret, cardEl) => {
    try {
      const result = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardEl,
        },
        setup_future_usage: 'off_session',
      });

      if (result.error) {
        return false;
      } else {
        if (result.paymentIntent) {
          return true;
        }
      }
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      setIsSubmitting(false);
      return;
    }

    const cardEl = elements.getElement(CardElement);

    const orderResponse = await onBeforePayment();
    let verifyOrderRes = null;
    // The case below is when payment is required
    if (orderResponse && orderResponse.payment_required) {
      const paymentSessionRes = await createPaymentSessionForOrder({
        order_id: orderResponse.payment_order_id,
        order_type: orderResponse.payment_order_type,
      });

      if (paymentSessionRes) {
        const paymentRes = await makePayment(paymentSessionRes.payment_gateway_session_token, cardEl);

        if (paymentRes) {
          verifyOrderRes = await verifyPaymentForOrder({
            order_id: orderResponse.payment_order_id,
            transaction_id: paymentSessionRes.transaction_id,
            order_type: orderResponse.payment_order_type,
          });
        } else {
          showErrorModal('Something went wrong', 'Failed to confirm payment with card details');
        }
      } else {
        showErrorModal('Something went wrong', 'Failed to create payment session');
      }
    }

    onAfterPayment(orderResponse, verifyOrderRes);
    setIsSubmitting(false);
  };

  return (
    <Row gutter={[8, 16]} justify="center">
      {!isFree && (
        <Col xs={24} className={styles.inlineCardForm}>
          <CardElement
            options={options}
            onChange={(event) => {
              if (event.complete) {
                setIsButtonDisabled(false);
              } else {
                setIsButtonDisabled(true);
              }
            }}
          />
        </Col>
      )}

      <Col xs={8} lg={6}>
        <Button
          block
          size="middle"
          type="primary"
          disabled={!isFree && isButtonDisabled}
          onClick={handleSubmit}
          className={classNames(styles.buyButton, !isFree && isButtonDisabled ? styles.disabledBtn : undefined)}
          loading={isSubmitting}
        >
          {text}
        </Button>
      </Col>
    </Row>
  );
};

export default CardForm;
