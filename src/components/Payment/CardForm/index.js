import React, { useMemo, useState } from 'react';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Row, Col } from 'antd';

import apis from 'apis';

import {
  showCoursePurchaseSuccessModal,
  showBookSingleSessionSuccessModal,
  showPurchaseSingleVideoSuccessModal,
  showPurchasePassSuccessModal,
  showPurchasePassAndGetVideoSuccessModal,
  showPurchasePassAndBookSessionSuccessModal,
  showAlreadyBookedModal,
  showErrorModal,
} from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';
import { orderType, paymentSource, productType, isAPISuccess } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import classNames from 'classnames';

const {
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

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
const CardForm = ({ btnProps, onBeforePayment, onAfterPayment, isFree, form }) => {
  const { text = 'PAY' } = btnProps;

  const {
    state: { userDetails },
  } = useGlobalContext();

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

  const followUpGetVideo = async (payload) => {
    try {
      // Continue to book the video after Pass Purchase is successful
      const followUpGetVideo = await apis.videos.createOrderForUser(payload);

      if (isAPISuccess(followUpGetVideo.status)) {
        showPurchasePassAndGetVideoSuccessModal(payload.source_id);
      }
    } catch (error) {
      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
  };

  const followUpBookSession = async (payload) => {
    try {
      //Continue to book the class after Pass Purchase is successful
      const followUpBooking = await apis.session.createOrderForUser(payload);

      if (isAPISuccess(followUpBooking.status)) {
        showPurchasePassAndBookSessionSuccessModal(payload.source_id, payload.inventory_id);
      }
    } catch (error) {
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
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

    const orderResponse = form ? await onBeforePayment(form.getFieldsValue()) : await onBeforePayment();

    // The case below is when payment is required
    if (orderResponse && orderResponse.payment_required) {
      const paymentSessionRes = await createPaymentSessionForOrder({
        order_id: orderResponse.payment_order_id,
        order_type: orderResponse.payment_order_type,
      });

      if (paymentSessionRes) {
        const paymentRes = await makePayment(paymentSessionRes.payment_gateway_session_token, cardEl);

        if (paymentRes) {
          console.log('userDetails', userDetails);
          const verifyOrderRes = await verifyPaymentForOrder({
            order_id: orderResponse.payment_order_id,
            transaction_id: paymentSessionRes.transaction_id,
            order_type: orderResponse.payment_order_type,
          });

          // TODO: Need to move all this post verification stuff to other place

          if (verifyOrderRes === orderType.PASS) {
            /*
              In pass order, there can be follow up bookings
              If a follow up booking is required, orderResponse 
              will contain the required info in follow_up_booking_info
            */

            const followUpBookingInfo = orderResponse.follow_up_booking_info;

            if (followUpBookingInfo) {
              if (followUpBookingInfo.productType === 'VIDEO') {
                const payload = {
                  video_id: followUpBookingInfo.productId,
                  payment_source: paymentSource.PASS,
                  source_id: orderResponse.payment_order_id,
                };

                await followUpGetVideo(payload);
              } else if (followUpBookingInfo.productType === 'SESSION') {
                const payload = {
                  inventory_id: followUpBookingInfo.productId,
                  user_timezone_offset: new Date().getTimezoneOffset(),
                  user_timezone_location: getTimezoneLocation(),
                  user_timezone: getCurrentLongTimezone(),
                  payment_source: paymentSource.PASS,
                  source_id: orderResponse.payment_order_id,
                };

                await followUpBookSession(payload);
              }
            } else {
              // If no followup booking info is attached, then it's only a simple pass purchase
              showPurchasePassSuccessModal(orderResponse.payment_order_id);
            }
          } else if (verifyOrderRes === orderType.COURSE) {
            showCoursePurchaseSuccessModal();
          } else if (verifyOrderRes === orderType.CLASS) {
            // Showing confirmation for Single Session Booking
            // inventory_id is attached for session orders
            showBookSingleSessionSuccessModal(orderResponse.inventory_id);
          } else if (verifyOrderRes === orderType.VIDEO) {
            // Showing confirmation for Single Session Booking
            showPurchaseSingleVideoSuccessModal(orderResponse.payment_order_id);
          }
        } else {
          showErrorModal('Something went wrong', 'Failed to confirm payment with card details');
        }
      } else {
        showErrorModal('Something went wrong', 'Failed to create payment session');
      }
    }

    onAfterPayment();
    setIsSubmitting(false);
  };

  return (
    <Row gutter={8} justify="center">
      {!isFree && (
        <Col xs={20} className={styles.inlineCardForm}>
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

      <Col xs={!isFree ? 4 : 6}>
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
