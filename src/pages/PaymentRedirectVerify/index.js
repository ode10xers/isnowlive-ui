import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { Row, message } from 'antd';

import config from 'config';

import Loader from 'components/Loader';
import {
  showErrorModal,
  showPurchasePassSuccessModal,
  showBookSingleSessionSuccessModal,
  showPurchaseSingleVideoSuccessModal,
  showPurchaseSingleCourseSuccessModal,
  showPurchaseSubscriptionSuccessModal,
} from 'components/Modals/modals';

import dateUtil from 'utils/date';
import parseQueryString from 'utils/parseQueryString';
import { verifyPaymentForOrder } from 'utils/payment';
import { orderType, productType, paymentSource } from 'utils/constants';
import { followUpBookSession, followUpGetVideo } from 'utils/orderHelper';
import { getGiftReceiverData } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';

// Taken from the link below
// https://stripe.com/docs/payments/payment-intents/verifying-status#checking-status-retrieve
// or more detailed one https://stripe.com/docs/api/payment_intents/object#payment_intent_object-status
// const STRIPE_PAYMENT_STATUS = {
//   SUCCESS: 'succeeded',
//   CANCELLED: 'canceled',
//   PRODCESSING: 'processing',
//   REQUIRES_ACTION: 'requires_action',
//   REQUIRES_CAPTURE: 'requires_capture',
//   REQUIRES_CONFIRMATION: 'requires_confirmation',
//   REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
// };

const {
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

const PaymentRedirectVerify = () => {
  const stripe = useStripe();
  const location = useLocation();

  const { showGiftMessageModal } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);

  const {
    // payment_intent_client_secret: clientSecret,
    order_id,
    order_type,
    transaction_id,
    inventory_id,
    additional_product,
    additional_product_id,
    is_gift,
  } = parseQueryString(location.search);

  const handleError = useCallback((errorMessage, errorTitle = 'An error occurred') => {
    showErrorModal(errorTitle, errorMessage || 'Something went wrong.');
    setIsLoading(false);
  }, []);

  const showProductPurchaseSuccessModals = useCallback(
    async (transactionOrderType) => {
      switch (transactionOrderType) {
        case orderType.PASS:
          if (additional_product && additional_product_id) {
            if (additional_product === productType.CLASS) {
              const payload = {
                inventory_id: parseInt(additional_product_id),
                user_timezone_offset: new Date().getTimezoneOffset(),
                user_timezone_location: getTimezoneLocation(),
                user_timezone: getCurrentLongTimezone(),
                payment_source: paymentSource.PASS,
                source_id: order_id,
              };

              await followUpBookSession(payload);
            } else {
              const payload = {
                video_id: additional_product_id,
                payment_source: paymentSource.PASS,
                source_id: order_id,
                user_timezone_location: getTimezoneLocation(),
              };

              await followUpGetVideo(payload);
            }
          } else {
            showPurchasePassSuccessModal(order_id);
          }

          break;
        case orderType.CLASS:
          showBookSingleSessionSuccessModal(inventory_id);
          break;
        case orderType.VIDEO:
          showPurchaseSingleVideoSuccessModal(order_id);
          break;
        case orderType.COURSE:
          showPurchaseSingleCourseSuccessModal();
          break;
        case orderType.SUBSCRIPTION:
          showPurchaseSubscriptionSuccessModal();
          break;
        default:
          console.log('Unhandled product type');
          console.log(transactionOrderType);
          handleError('Something went wrong');
          break;
      }
    },
    [order_id, inventory_id, additional_product, additional_product_id, handleError]
  );

  const verifyOrderStatus = useCallback(async () => {
    setIsLoading(true);

    try {
      const verifyOrderRes = await verifyPaymentForOrder({
        order_id,
        order_type,
        transaction_id,
      });

      if (!verifyOrderRes) {
        handleError('Failed to verify payment for order');
      } else {
        if (is_gift) {
          const receiverData = getGiftReceiverData();

          if (receiverData) {
            showGiftMessageModal();
          } else {
            message.error('No Gift Receiver Data Found!');
          }
        } else {
          await showProductPurchaseSuccessModals(verifyOrderRes);
        }
      }
    } catch (error) {
      handleError(error?.response?.data?.message);
    }

    setIsLoading(false);
    // eslint-disable-next-line
  }, [order_id, order_type, transaction_id, is_gift, showProductPurchaseSuccessModals, handleError]);

  useEffect(() => {
    if (stripe) {
      verifyOrderStatus();
    }
  }, [stripe, verifyOrderStatus]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Confirming payment..."></Loader>
    </Row>
  );
};

const WrappedPaymentRedirectVerify = () => {
  // NOTE: We don't use indian key here since Indian creators can only receive card payments
  const stripePromise = loadStripe(config.stripe.secretKey);

  if (!stripePromise) {
    console.error('Failed to load Stripe');
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentRedirectVerify />
    </Elements>
  );
};

export default WrappedPaymentRedirectVerify;
