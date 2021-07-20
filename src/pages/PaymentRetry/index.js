import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { Row } from 'antd';

import apis from 'apis';
import config from 'config';

import Loader from 'components/Loader';
import { showErrorModal, showPurchaseSubscriptionSuccessModal } from 'components/Modals/modals';

import { getLocalUserDetails } from 'utils/storage';
import { verifyPaymentForOrder } from 'utils/payment';
import {
  isAPISuccess,
  orderType,
  StripePaymentStatus,
  getUsernameFromUrl,
  reservedDomainName,
  isInCreatorDashboard,
} from 'utils/helper';

const PaymentRetry = () => {
  const location = useLocation();
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);

  const retry_token = location.pathname.replace('/payment/retry/', '');

  const makePayment = useCallback(
    async (secret, paymentPayload) => {
      try {
        const result = await stripe.confirmCardPayment(secret, paymentPayload);

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
    },
    [stripe]
  );

  useEffect(() => {
    if (retry_token) {
      const retryPayment = async () => {
        setIsLoading(true);

        try {
          const { status, data: paymentSessionData } = await apis.payment.retryPayment({
            token: retry_token,
          });

          if (isAPISuccess(status) && paymentSessionData) {
            if (paymentSessionData.status === StripePaymentStatus.AUTHORIZATION_REQUIRED) {
              const isPaymentSuccess = await makePayment(paymentSessionData.payment_gateway_session_token, {
                payment_method: paymentSessionData.payment_method_id,
              });

              if (isPaymentSuccess) {
                const successfulOrderType = await verifyPaymentForOrder({
                  order_id: paymentSessionData.order_id,
                  transaction_id: paymentSessionData.transaction_id,
                  order_type: orderType.SUBSCRIPTION,
                });

                if (successfulOrderType) {
                  showPurchaseSubscriptionSuccessModal();
                }
              }
            }
          }
        } catch (error) {
          showErrorModal('Something went wrong', error?.response?.data?.message || 'Something went wrong.');
        }

        setIsLoading(false);
      };
      retryPayment();
    }
  }, [retry_token, makePayment]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Verifying payment..."></Loader>
    </Row>
  );
};

const WrappedPaymentRetry = () => {
  const [stripeObj, setStripeObj] = useState(null);

  const fetchCreatorDetailsForPayment = useCallback(async () => {
    let creatorUsername = 'app';

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      if (localUserDetails.is_creator) {
        creatorUsername = localUserDetails.username;
      }
    } else {
      creatorUsername = getUsernameFromUrl();
    }

    if (reservedDomainName.includes(creatorUsername)) {
      return;
    }

    try {
      const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

      if (isAPISuccess(status) && data) {
        if (data.profile?.connect_account_id) {
          let stripeKey = config.stripe.secretKey;
          const creatorCountry = data.profile?.country;

          if (creatorCountry && creatorCountry === 'IN') {
            stripeKey = config.stripe.indianSecretKey;
          }

          setStripeObj(
            await loadStripe(config.stripe.secretKey, {
              stripeAccount: data.profile?.connect_account_id,
            })
          );
        } else {
          showErrorModal('Creator Stripe account ID missing!');
          setStripeObj(null);
        }
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed fetching creator details for payment',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }
  }, []);

  useEffect(() => {
    fetchCreatorDetailsForPayment();
  }, [fetchCreatorDetailsForPayment]);

  if (!stripeObj) {
    return null;
  }

  return (
    <Elements stripe={stripeObj}>
      <PaymentRetry />
    </Elements>
  );
};

export default WrappedPaymentRetry;
