import React, { useMemo, useState } from 'react';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Row, Col } from 'antd';

import apis from 'apis';

import {
  showCoursePurchaseSuccessModal,
  showBookSingleSessionSuccessModal,
  showErrorModal,
  showAlreadyBookedModal,
  showPurchasePassAndGetVideoSuccessModal,
  showPurchasePassSuccessModal,
} from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';
import { orderType, paymentSource, productType, isAPISuccess } from 'utils/helper';

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

    // TODO: Handle the case where payment is not required
    // if payment is not required, orderResponse will be null
    if (orderResponse) {
      const paymentSessionRes = await createPaymentSessionForOrder({
        order_id: orderResponse.payment_order_id,
        order_type: orderResponse.payment_order_type,
      });

      if (paymentSessionRes) {
        const paymentRes = await makePayment(paymentSessionRes.payment_gateway_session_token, cardEl);

        if (paymentRes) {
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

          // TODO: Need to move all this post verification stuff to other place

          if (verifyOrderRes === orderType.PASS) {
            /*
              In pass order, there can be follow up bookings
              If a follow up booking is required, orderResponse 
              will contain the required info in follow_up_booking_info
              The example below is for follow up purchasing video

              follow_up_booking_info: {
                productType: 'VIDEO',
                productId: video.external_id,
              }

              more details on other flows can be found in pages/PaymentVerification
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
              }
            } else {
              // If no followup booking info is attached, then it's only a simple pass purchase
              showPurchasePassSuccessModal(orderResponse.payment_order_id);
            }
          } else if (verifyOrderRes === orderType.COURSE) {
            showCoursePurchaseSuccessModal();
          } else if (verifyOrderRes === orderType.CLASS) {
            // Temporary logic for showing confirmation for Single Session Booking
            // inventory_id is attached for session orders
            showBookSingleSessionSuccessModal(orderResponse.inventory_id);
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
      <Row justify="center">
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

        <Col xs={4}>
          <Button
            block
            size="middle"
            type="primary"
            disabled={!isFree && isButtonDisabled}
            onClick={handleSubmit}
            className={classNames(styles.greenBtn, !isFree && isButtonDisabled ? styles.disabledBtn : undefined)}
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
