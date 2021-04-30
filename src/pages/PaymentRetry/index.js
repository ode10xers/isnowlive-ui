import React, { useState, useEffect, useCallback } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

import { Row } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showPurchaseSubscriptionSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, orderType, StripePaymentStatus } from 'utils/helper';
import { verifyPaymentForOrder } from 'utils/payment';

const PaymentRetry = ({ match }) => {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);

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
    console.log(window.location);
    console.log(match);
    if (match.params.retry_token) {
      const retryPayment = async () => {
        setIsLoading(true);

        try {
          const { status, data: paymentSessionData } = await apis.payment.retryPayment({
            token: match.params.retry_token,
          });

          if (isAPISuccess(status) && paymentSessionData) {
            // TODO: Confirm all the possible status
            if (paymentSessionData.status === StripePaymentStatus.AUTHORIZATION_REQUIRED) {
              const isPaymentSuccess = await makePayment(paymentSessionData.payment_gateway_session_token, {
                payment_method: paymentSessionData.payment_method_id,
              });

              if (isPaymentSuccess) {
                const verifyOrderResponse = await verifyPaymentForOrder({
                  order_id: paymentSessionData.order_id,
                  transaction_id: paymentSessionData.transaction_id,
                  order_type: orderType.SUBSCRIPTION, //TODO: Confirm that this flow will only be for subscriptions, since this is hard coded for now
                });

                if (isAPISuccess(verifyOrderResponse.status)) {
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
    } else {
      setIsLoading(false);
      showErrorModal('Something went wrong');
    }
  }, [match.params.retry_token, makePayment]);

  return (
    <Row justify="center">
      <Loader loading={isLoading} size="large" text="Verifying payment..."></Loader>
    </Row>
  );
};

export default PaymentRetry;
