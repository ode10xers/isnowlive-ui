import React, { useMemo, useState } from 'react';

import { useHistory } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Row, Col, message } from 'antd';

import apis from 'apis';

import { showCourseBookingSuccessModal, showBookingSuccessModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';
import { orderType, isAPISuccess } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import classNames from 'classnames';

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

const CardForm = ({ btnProps, onBeforePayment, onAfterPayment, form }) => {
  const { text = 'PAY' } = btnProps;

  const {
    state: { userDetails },
  } = useGlobalContext();

  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();
  const history = useHistory();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('history', history);

  const makePayment = async (secret, cardEl) => {
    try {
      const result = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardEl,
        },
        setup_future_usage: 'off_session',
      });

      console.log('SavedCardCheckout', result);
      if (result.error) {
        console.log('SavedCardCheckout Error', result.error.message);
        return false;
      } else {
        if (result.paymentIntent) {
          console.log('SavedCardCheckout Success', result.paymentIntent);
          return true;
        }
      }
    } catch (e) {
      console.log('SavedCardCheckout Error', e);
      return false;
    }
  };

  const getAttendeeOrderDetails = async (orderId) => {
    try {
      const { status, data } = await apis.session.getAttendeeUpcomingSession();

      if (isAPISuccess(status) && data) {
        return data.find((orderDetails) => orderDetails.order_id === orderId);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch attendee order details');
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    console.log('history', history);

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      setIsSubmitting(false);
      return;
    }

    const cardEl = elements.getElement(CardElement);

    const orderResponse = form ? await onBeforePayment(form.getFieldsValue()) : await onBeforePayment();

    // TODO: Handle payment_required = false here
    if (orderResponse) {
      const paymentSessionRes = await createPaymentSessionForOrder({
        order_id: orderResponse.payment_order_id,
        order_type: orderResponse.payment_order_type,
      });

      if (paymentSessionRes) {
        const paymentRes = await makePayment(paymentSessionRes.payment_gateway_session_token, cardEl);

        if (paymentRes) {
          console.log('history', history);

          // const windowHost = window.location.host;
          // const urlToRedirect = `${windowHost}/stripe/payment/success?order_id=${orderResponse.payment_order_id}&transaction_id=${
          //   paymentSessionRes.transaction_id
          //   }&order_type=${orderResponse.payment_order_type}`;

          //   if (history) {
          //     history.push(`/stripe/payment/success?order_id=${orderResponse.payment_order_id}&transaction_id=${
          //       paymentSessionRes.transaction_id
          //       }&order_type=${orderResponse.payment_order_type}`
          //     );
          //   } else {
          //     window.location = urlToRedirect;
          //   }

          console.log('userDetails', userDetails);
          const verifyOrderRes = await verifyPaymentForOrder({
            order_id: orderResponse.payment_order_id,
            transaction_id: paymentSessionRes.transaction_id,
            order_type: orderResponse.payment_order_type,
          });

          const username = window.location.hostname.split('.')[0];
          // TODO: Need to move all this post verification stuff to other place
          if (verifyOrderRes === orderType.COURSE) {
            showCourseBookingSuccessModal(userDetails.email, username);
          } else {
            // Temporary logic for showing confirmation for Single Session Booking
            const orderDetails = await getAttendeeOrderDetails(orderResponse.payment_order_id);
            showBookingSuccessModal(userDetails.email, null, false, false, username, orderDetails);
          }

          onAfterPayment();
        } else {
          alert('error in payment');
        }
      }
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Row>
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
      </Row>
      <Row justify="center" className={styles.mt30}>
        <Col xs={24} md={12} lg={8}>
          <Button
            block
            size="middle"
            type="primary"
            disabled={isButtonDisabled}
            onClick={handleSubmit}
            className={classNames(styles.greenBtn, isButtonDisabled ? styles.disabledBtn : undefined)}
            loading={isSubmitting}
          >
            {text}
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default CardForm;
